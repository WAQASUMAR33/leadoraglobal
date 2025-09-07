import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { userId, amount, bankAccountId, withdrawalReason } = await request.json();

    if (!userId || !amount || !bankAccountId) {
      return NextResponse.json({ error: 'User ID, amount, and bank account ID are required' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has sufficient balance
    if (parseFloat(existingUser.balance) < parseFloat(amount)) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // For now, we'll just update the user balance
    // In a real application, you would create a withdrawal request record
    // and integrate with a payment processor
    
    // Create a simple withdrawal record (you can expand this later)
    const withdrawal = {
      id: Date.now(), // Temporary ID
      userId: parseInt(userId),
      amount: parseFloat(amount),
      bankAccountId: parseInt(bankAccountId),
      reason: withdrawalReason || 'User withdrawal request',
      status: 'pending',
      createdAt: new Date()
    };

    // Update user balance
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        balance: parseFloat(existingUser.balance) - parseFloat(amount),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      message: 'Withdrawal request submitted successfully',
      withdrawal 
    });
  } catch (error) {
    console.error('Error creating withdrawal request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // For now, return empty array since we don't have a withdrawal request model
    // In a real application, you would query the withdrawal request table
    const withdrawals = [];

    return NextResponse.json({ withdrawals });
  } catch (error) {
    console.error('Error fetching withdrawal history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
