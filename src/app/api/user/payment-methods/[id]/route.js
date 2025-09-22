import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { verifyToken } from '../../../../../lib/auth';

// PUT /api/user/payment-methods/[id] - Update payment method
export async function PUT(request, { params }) {
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

    const { id } = params;
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

    // Check if payment method exists and belongs to user
    const existingPaymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        id: parseInt(id),
        userId: parseInt(userId)
      }
    });

    if (!existingPaymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

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
          isDefault: true,
          id: { not: parseInt(id) }
        },
        data: {
          isDefault: false
        }
      });
    }

    const paymentMethod = await prisma.paymentMethod.update({
      where: {
        id: parseInt(id)
      },
      data: {
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
      message: 'Payment method updated successfully',
      paymentMethod
    });

  } catch (error) {
    console.error('Error updating payment method:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/payment-methods/[id] - Delete payment method
export async function DELETE(request, { params }) {
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

    const { id } = params;

    // Check if payment method exists and belongs to user
    const existingPaymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        id: parseInt(id),
        userId: parseInt(userId)
      }
    });

    if (!existingPaymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting status to inactive
    await prisma.paymentMethod.update({
      where: {
        id: parseInt(id)
      },
      data: {
        status: 'inactive'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Payment method deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}