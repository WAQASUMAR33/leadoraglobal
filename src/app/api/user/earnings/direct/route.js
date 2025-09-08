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

    // Get user's direct earnings from transfers where they are the recipient
    const directEarnings = await prisma.transfer.findMany({
      where: {
        toUserId: userId,
        transferType: 'admin_to_user'
      },
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: {
          select: {
            id: true,
            fullname: true,
            username: true
          }
        },
        admin: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        }
      }
    });

    // Format the earnings data
    const formattedEarnings = directEarnings.map(transfer => ({
      id: transfer.id,
      amount: parseFloat(transfer.amount),
      type: 'Direct Transfer',
      description: transfer.description || `Direct transfer from admin`,
      status: transfer.status,
      createdAt: transfer.createdAt,
      fromAdmin: transfer.admin?.fullName || 'System Admin'
    }));

    return NextResponse.json({
      success: true,
      earnings: formattedEarnings,
      totalAmount: formattedEarnings.reduce((sum, earning) => sum + earning.amount, 0),
      totalCount: formattedEarnings.length
    });

  } catch (error) {
    console.error('Error fetching direct earnings:', error);
    return NextResponse.json({
      error: 'Failed to fetch direct earnings'
    }, { status: 500 });
  }
}
