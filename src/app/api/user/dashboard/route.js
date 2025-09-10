import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

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
    
    console.log('Dashboard API - User ID from token:', userId);

    // Fetch user data with rank information
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        fullname: true,
        username: true,
        balance: true,
        points: true,
        totalEarnings: true,
        referralCount: true,
        currentPackageId: true,
        packageExpiryDate: true,
        createdAt: true,
        rank: {
          select: {
            id: true,
            rank_name: true,
            rank_level: true
          }
        }
      }
    });

    console.log('Dashboard API - User found:', user);

    if (!user) {
      console.log('Dashboard API - User not found for ID:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Count user's orders
    const ordersCount = await prisma.order.count({
      where: { userId: parseInt(userId) }
    });

    // Calculate direct earnings total
    const directEarnings = await prisma.earnings.aggregate({
      where: {
        userId: parseInt(userId),
        type: 'direct_commission'
      },
      _sum: {
        amount: true
      }
    });

    // Calculate indirect earnings total
    const indirectEarnings = await prisma.earnings.aggregate({
      where: {
        userId: parseInt(userId),
        type: 'indirect_commission'
      },
      _sum: {
        amount: true
      }
    });

    // Get recent orders (last 5)
    const recentOrders = await prisma.order.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        orderItems: {
          select: {
            product: {
              select: {
                title: true
              }
            },
            quantity: true
          }
        }
      }
    });

    // Get recent package requests (last 3)
    const recentPackageRequests = await prisma.packageRequest.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        status: true,
        createdAt: true,
        package: {
          select: {
            package_name: true,
            package_amount: true
          }
        }
      }
    });

    // Get recent withdrawal requests (last 3)
    const recentWithdrawals = await prisma.withdrawalRequest.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        amount: true,
        netAmount: true,
        status: true,
        createdAt: true
      }
    });

    // Get referrals (last 5)
    const referrals = await prisma.user.findMany({
      where: { referredBy: user.username },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        fullname: true,
        username: true,
        createdAt: true
      }
    });

    // Combine and format recent activity
    const recentActivity = [
      ...recentOrders.map(order => ({
        id: `order-${order.id}`,
        type: 'order',
        title: `Order #${order.id} - ${order.orderItems[0]?.product?.title || 'Products'}`,
        description: `${order.orderItems.length} item(s) - ${order.status}`,
        amount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
        icon: 'order'
      })),
      ...recentPackageRequests.map(request => ({
        id: `package-${request.id}`,
        type: 'package',
        title: `Package Request - ${request.package.package_name}`,
        description: `Status: ${request.status}`,
        amount: request.package.package_amount,
        status: request.status,
        createdAt: request.createdAt,
        icon: 'package'
      })),
      ...recentWithdrawals.map(withdrawal => ({
        id: `withdrawal-${withdrawal.id}`,
        type: 'withdrawal',
        title: `Withdrawal Request`,
        description: `Net Amount: PKR ${withdrawal.netAmount} - ${withdrawal.status}`,
        amount: withdrawal.amount,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt,
        icon: 'withdrawal'
      })),
      ...referrals.map(referral => ({
        id: `referral-${referral.id}`,
        type: 'referral',
        title: `New Referral - ${referral.fullname}`,
        description: `Username: ${referral.username}`,
        amount: null,
        status: 'completed',
        createdAt: referral.createdAt,
        icon: 'referral'
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

    // Calculate package status
    const hasActivePackage = user.currentPackageId && 
      user.packageExpiryDate && 
      new Date(user.packageExpiryDate) > new Date();

    // Get inactive package members count and potential revenue
    const inactiveMembers = await prisma.user.findMany({
      where: {
        referredBy: user.username,
        OR: [
          { currentPackageId: null },
          { 
            AND: [
              { packageExpiryDate: { not: null } },
              { packageExpiryDate: { lt: new Date() } }
            ]
          }
        ]
      },
      select: {
        id: true,
        currentPackage: {
          select: {
            package_amount: true
          }
        }
      }
    });

    const inactiveMembersCount = inactiveMembers.length;
    const potentialRevenue = inactiveMembers.reduce((sum, member) => {
      return sum + parseFloat(member.currentPackage?.package_amount || 0);
    }, 0);

    const dashboardData = {
      user: {
        id: user.id,
        fullname: user.fullname,
        username: user.username,
        balance: parseFloat(user.balance || 0),
        points: user.points || 0,
        totalEarnings: parseFloat(user.totalEarnings || 0),
        referralCount: user.referralCount || 0,
        ordersCount: ordersCount,
        hasActivePackage,
        currentPackageId: user.currentPackageId,
        packageExpiryDate: user.packageExpiryDate,
        memberSince: user.createdAt,
        rank: user.rank
      },
      recentActivity,
      stats: {
        balance: parseFloat(user.balance || 0),
        points: user.points || 0,
        totalEarnings: parseFloat(user.totalEarnings || 0),
        directEarnings: parseFloat(directEarnings._sum.amount || 0),
        indirectEarnings: parseFloat(indirectEarnings._sum.amount || 0),
        referralCount: user.referralCount || 0,
        ordersCount: ordersCount,
        rank: user.rank
      },
      inactiveMembersCount,
      potentialRevenue
    };

    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({
      error: 'Failed to fetch dashboard data'
    }, { status: 500 });
  }
}
