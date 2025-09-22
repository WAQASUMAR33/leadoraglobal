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

    // Get user's indirect commission earnings
    const indirectEarnings = await prisma.earnings.findMany({
      where: {
        userId: userId,
        type: 'indirect_commission'
      },
      orderBy: { createdAt: 'desc' },
      include: {
        packageRequest: {
          include: {
            user: {
          select: {
            id: true,
            fullname: true,
            username: true
              }
            },
            package: {
              select: {
                id: true,
                package_name: true,
                package_amount: true
              }
            }
          }
        }
      }
    });

    // Format the earnings data
    const formattedEarnings = indirectEarnings.map(earning => ({
      id: earning.id,
      amount: parseFloat(earning.amount),
      type: 'Indirect Commission',
      description: earning.description || `Indirect commission from package approval`,
      status: 'Completed',
      createdAt: earning.createdAt,
      fromUser: earning.packageRequest?.user?.fullname || 'Unknown User',
      packageName: earning.packageRequest?.package?.package_name || 'Unknown Package',
      packageAmount: earning.packageRequest?.package?.package_amount || 0
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
