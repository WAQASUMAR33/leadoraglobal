import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAdminToken } from '../../../../../lib/adminAuth';

const prisma = new PrismaClient();

// GET - Fetch single withdrawal request by ID
export async function GET(request, { params }) {
  try {
    const admin = verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullname: true,
            email: true,
            balance: true
          }
        }
      }
    });

    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      withdrawal
    });

  } catch (error) {
    console.error('Error fetching withdrawal request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update withdrawal request status
export async function PUT(request, { params }) {
  try {
    const admin = verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { status, adminNotes } = body;

    // Validate status if provided
    const validStatuses = ['pending', 'approved', 'rejected', 'processing'];

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Check if withdrawal request exists
    const existingWithdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            balance: true
          }
        }
      }
    });

    if (!existingWithdrawal) {
      return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData = {
      updatedAt: new Date()
    };

    if (status) {
      updateData.status = status;
      
      // If status is approved, deduct amount and apply 10% fee
      if (status === 'approved' && existingWithdrawal.status !== 'approved') {
        const totalAmount = parseFloat(existingWithdrawal.amount); // This is the total amount user wants to withdraw
        const feeAmount = totalAmount * 0.1; // 10% fee
        const netAmount = totalAmount - feeAmount; // 90% net amount to user
        
        // Check if user has enough balance for the total withdrawal amount
        if (totalAmount > parseFloat(existingWithdrawal.user.balance)) {
          return NextResponse.json(
            { error: 'Insufficient user balance for withdrawal' },
            { status: 400 }
          );
        }

        // Update user balance (deduct the total amount)
        const newBalance = parseFloat(existingWithdrawal.user.balance) - totalAmount;
        
        await prisma.user.update({
          where: { id: existingWithdrawal.userId },
          data: { balance: newBalance }
        });

        // Update withdrawal request with fee details
        updateData.feeAmount = feeAmount;
        updateData.netAmount = netAmount;
      }
      
      // If status is rejected and was previously approved, refund the total amount
      if (status === 'rejected' && existingWithdrawal.status === 'approved') {
        const refundAmount = parseFloat(existingWithdrawal.amount); // Refund the total amount that was deducted
        const newBalance = parseFloat(existingWithdrawal.user.balance) + refundAmount;
        
        await prisma.user.update({
          where: { id: existingWithdrawal.userId },
          data: { balance: newBalance }
        });
      }
    }

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    if (status === 'approved' || status === 'rejected') {
      updateData.processedAt = new Date();
    }

    // Update the withdrawal request
    const updatedWithdrawal = await prisma.withdrawalRequest.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullname: true,
            email: true,
            balance: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request updated successfully',
      withdrawal: updatedWithdrawal
    });

  } catch (error) {
    console.error('Error updating withdrawal request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel withdrawal request (soft delete by setting status to rejected)
export async function DELETE(request, { params }) {
  try {
    const admin = verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if withdrawal request exists
    const existingWithdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            balance: true
          }
        }
      }
    });

    if (!existingWithdrawal) {
      return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 });
    }

    // If withdrawal was approved, refund the total amount
    if (existingWithdrawal.status === 'approved') {
      const refundAmount = parseFloat(existingWithdrawal.amount); // Refund the total amount that was deducted
      const newBalance = parseFloat(existingWithdrawal.user.balance) + refundAmount;
      
      await prisma.user.update({
        where: { id: existingWithdrawal.userId },
        data: { balance: newBalance }
      });
    }

    // Soft delete by setting status to rejected
    const updatedWithdrawal = await prisma.withdrawalRequest.update({
      where: { id: parseInt(id) },
      data: {
        status: 'rejected',
        adminNotes: 'Withdrawal request cancelled by admin',
        processedAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request cancelled successfully',
      withdrawal: updatedWithdrawal
    });

  } catch (error) {
    console.error('Error cancelling withdrawal request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
