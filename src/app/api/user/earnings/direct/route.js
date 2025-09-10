import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { verifyToken } from '../../../../../lib/auth';

export async function GET(request) {
  try {
    console.log('🔍 Direct Earnings API called');
    
    // Verify user authentication
    const token = request.cookies.get('auth-token')?.value;
    console.log('🔑 Token found:', !!token);
    
    if (!token) {
      console.log('❌ No token found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    console.log('🔓 Token decoded:', !!decoded, decoded ? `User ID: ${decoded.userId}` : 'Invalid');
    
    if (!decoded) {
      console.log('❌ Invalid token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;
    console.log('👤 User ID:', userId);

    // Get user's direct commission earnings
    const directEarnings = await prisma.earnings.findMany({
      where: {
        userId: userId,
        type: 'direct_commission'
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
    const formattedEarnings = directEarnings.map(earning => ({
      id: earning.id,
      amount: parseFloat(earning.amount),
      type: 'Direct Commission',
      description: earning.description || `Direct commission from package approval`,
      status: 'Completed',
      createdAt: earning.createdAt,
      fromUser: earning.packageRequest?.user?.fullname || 'Unknown User',
      packageName: earning.packageRequest?.package?.package_name || 'Unknown Package',
      packageAmount: earning.packageRequest?.package?.package_amount || 0
    }));

    console.log('✅ Returning earnings:', formattedEarnings.length, 'records');
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
