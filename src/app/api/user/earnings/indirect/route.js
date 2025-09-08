import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { verifyToken } from '../../../../../lib/auth';

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

    // Get user's indirect earnings from transfers where they are the recipient from other users
    const indirectEarnings = await prisma.transfer.findMany({
      where: {
        toUserId: userId,
        transferType: 'user_to_user'
      },
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: {
          select: {
            id: true,
            fullname: true,
            username: true
          }
        }
      }
    });

    // Format the earnings data
    const formattedEarnings = indirectEarnings.map(transfer => ({
      id: transfer.id,
      amount: parseFloat(transfer.amount),
      type: 'Indirect Transfer',
      description: transfer.description || `Transfer from ${transfer.fromUser?.fullname || 'User'}`,
      status: transfer.status,
      createdAt: transfer.createdAt,
      referralName: transfer.fromUser?.fullname || 'Unknown User',
      fromUser: transfer.fromUser?.username || 'unknown'
    }));

    return NextResponse.json({
      success: true,
      earnings: formattedEarnings,
      totalAmount: formattedEarnings.reduce((sum, earning) => sum + earning.amount, 0),
      totalCount: formattedEarnings.length
    });

  } catch (error) {
    console.error('Error fetching indirect earnings:', error);
    return NextResponse.json({
      error: 'Failed to fetch indirect earnings'
    }, { status: 500 });
  }
}
