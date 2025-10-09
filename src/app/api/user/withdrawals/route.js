import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Helper function to verify JWT token
const verifyToken = (request) => {
  try {
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('auth-token')?.value;
    
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : cookieToken;
    
    if (!token) {
      return null;
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    return decoded;
  } catch (error) {
    return null;
  }
};

// GET - Fetch user's withdrawal requests
export async function GET(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: {
        userId: decoded.userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      withdrawals
    });

  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new withdrawal request
export async function POST(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, paymentMethodId, notes } = body;

    // Validate required fields
    if (!amount || !paymentMethodId) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Validate amount
    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      return NextResponse.json({
        error: 'Invalid withdrawal amount'
      }, { status: 400 });
    }

    if (withdrawalAmount < 1000) {
      return NextResponse.json({
        error: 'Minimum withdrawal amount is PKR 1,000'
      }, { status: 400 });
    }

    // Get user's current balance
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { balance: true }
    });

    if (!user) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 });
    }

    // Check minimum balance requirement (1000 PKR)
    if (user.balance < 1000) {
      return NextResponse.json({
        error: 'Minimum balance required is PKR 1,000 to make withdrawal requests'
      }, { status: 400 });
    }

    // Check if user has enough balance for the withdrawal amount
    if (withdrawalAmount > user.balance) {
      return NextResponse.json({
        error: 'Insufficient balance for withdrawal'
      }, { status: 400 });
    }

    // Get payment method details
    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        id: parseInt(paymentMethodId),
        userId: decoded.userId,
        status: 'active'
      }
    });

    if (!paymentMethod) {
      return NextResponse.json({
        error: 'Payment method not found or inactive'
      }, { status: 400 });
    }

    // Allow multiple pending withdrawal requests
    // (Removed restriction - users can now submit multiple requests)

    // Generate unique withdrawal reference
    const withdrawalRef = `WD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Deduct 100% of withdrawal amount from user's balance immediately
    // Fee will be calculated when admin approves (10% fee, 90% net payout)
    const feeAmount = 0; // Fee calculated on approval
    const netAmount = withdrawalAmount; // Full amount initially

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Deduct the full withdrawal amount from user's balance
      const updatedUser = await tx.user.update({
        where: { id: decoded.userId },
        data: {
          balance: {
            decrement: withdrawalAmount
          }
        }
      });

      // Create withdrawal request
      const withdrawal = await tx.withdrawalRequest.create({
        data: {
          userId: decoded.userId,
          amount: withdrawalAmount,
          feeAmount: feeAmount,
          netAmount: netAmount,
          paymentMethod: paymentMethod.type,
          accountDetails: JSON.stringify({
            type: paymentMethod.type,
            accountName: paymentMethod.accountName,
            bankName: paymentMethod.bankName,
            accountNumber: paymentMethod.accountNumber,
            ibanNumber: paymentMethod.ibanNumber,
            mobileNumber: paymentMethod.mobileNumber,
            email: paymentMethod.email
          }),
          notes: notes || null,
          status: 'pending',
          withdrawalRef
        }
      });

      return { withdrawal, updatedUser };
    });

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully. Amount has been deducted from your balance.',
      withdrawal: {
        id: result.withdrawal.id,
        amount: result.withdrawal.amount,
        paymentMethod: result.withdrawal.paymentMethod,
        status: result.withdrawal.status,
        withdrawalRef: result.withdrawal.withdrawalRef,
        createdAt: result.withdrawal.createdAt
      },
      newBalance: result.updatedUser.balance
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating withdrawal request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
