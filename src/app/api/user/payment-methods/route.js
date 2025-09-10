import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

// GET /api/user/payment-methods - Get user's payment methods
export async function GET(request) {
  try {
    // Verify user authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;

    const paymentMethods = await prisma.paymentMethod.findMany({
      where: {
        userId: parseInt(userId),
        status: 'active'
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      paymentMethods
    });

  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/user/payment-methods - Create new payment method
export async function POST(request) {
  try {
    // Verify user authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;

    const body = await request.json();
    const {
      type,
      accountName,
      accountNumber,
      bankName,
      ibanNumber,
      branchCode,
      mobileNumber,
      email,
      isDefault = false
    } = body;

    // Validate required fields
    if (!type) {
      return NextResponse.json(
        { error: 'Payment method type is required' },
        { status: 400 }
      );
    }

    // Validate type-specific fields
    if (type === 'bank_transfer') {
      if (!bankName || !accountName || !accountNumber || !ibanNumber) {
        return NextResponse.json(
          { error: 'Missing required fields: bank title, account title, account number, iban number' },
          { status: 400 }
        );
      }
    } else if (type === 'easypaisa' || type === 'jazzcash') {
      if (!accountName) {
        return NextResponse.json(
          { error: 'Account holder name is required' },
          { status: 400 }
        );
      }
      if (!mobileNumber) {
        return NextResponse.json(
          { error: 'Mobile number is required for mobile payment methods' },
          { status: 400 }
        );
      }
    } else if (type === 'paypal') {
      if (!email) {
        return NextResponse.json(
          { error: 'Email is required for PayPal' },
          { status: 400 }
        );
      }
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.paymentMethod.updateMany({
        where: {
          userId: parseInt(userId),
          isDefault: true
        },
        data: {
          isDefault: false
        }
      });
    }

    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        userId: parseInt(userId),
        type,
        accountName,
        accountNumber,
        bankName,
        ibanNumber,
        branchCode,
        mobileNumber,
        email,
        isDefault
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Payment method created successfully',
      paymentMethod
    });

  } catch (error) {
    console.error('Error creating payment method:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
