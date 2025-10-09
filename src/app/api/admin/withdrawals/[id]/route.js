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
      
      // If status is approved, calculate 10% fee and 90% net payout
      // Note: Balance was already deducted when user submitted the request
      if (status === 'approved' && existingWithdrawal.status !== 'approved') {
        const totalAmount = parseFloat(existingWithdrawal.amount); // Total amount user requested
        const feeAmount = totalAmount * 0.1; // 10% fee
        const netAmount = totalAmount - feeAmount; // 90% net amount to be paid to user
        
        // Update withdrawal request with fee details
        updateData.feeAmount = feeAmount;
        updateData.netAmount = netAmount;
        
        console.log(`✅ Withdrawal Approved: Amount: ${totalAmount}, Fee (10%): ${feeAmount}, Net Payout (90%): ${netAmount}`);
      }
      
      // If status is rejected, refund the full amount back to user's balance
      // This applies regardless of previous status (pending or any other status)
      if (status === 'rejected' && existingWithdrawal.status !== 'rejected') {
        const refundAmount = parseFloat(existingWithdrawal.amount); // Refund the full amount
        const newBalance = parseFloat(existingWithdrawal.user.balance) + refundAmount;
        
        await prisma.user.update({
          where: { id: existingWithdrawal.userId },
          data: { balance: newBalance }
        });
        
        console.log(`💰 Withdrawal Rejected - Refunded: User ${existingWithdrawal.userId}, Amount: ${refundAmount}, New Balance: ${newBalance}`);
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

    // If withdrawal is not yet rejected or approved, refund the amount
    // (Balance was deducted when user submitted, so we need to refund)
    if (existingWithdrawal.status !== 'rejected' && existingWithdrawal.status !== 'approved') {
      const refundAmount = parseFloat(existingWithdrawal.amount); // Refund the full amount
      const newBalance = parseFloat(existingWithdrawal.user.balance) + refundAmount;
      
      await prisma.user.update({
        where: { id: existingWithdrawal.userId },
        data: { balance: newBalance }
      });
      
      console.log(`💰 Withdrawal Cancelled - Refunded: User ${existingWithdrawal.userId}, Amount: ${refundAmount}, New Balance: ${newBalance}`);
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
