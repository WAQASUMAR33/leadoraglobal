import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

// Function to calculate business volume (sum of all tree balances) - ULTRA OPTIMIZED
async function calculateBusinessVolume(username) {
  try {
    // Get all users in a single query - this is much faster than recursive queries
    const allUsers = await prisma.user.findMany({
      select: {
        username: true,
        referredBy: true,
        balance: true
      }
    });

    // Build the tree structure in memory
    const userMap = new Map();
    allUsers.forEach(user => {
      userMap.set(user.username, {
        balance: parseFloat(user.balance || 0),
        referredBy: user.referredBy,
        children: []
      });
    });

    // Build parent-child relationships
    allUsers.forEach(user => {
      if (user.referredBy && userMap.has(user.referredBy)) {
        userMap.get(user.referredBy).children.push(user.username);
      }
    });

    // Calculate total balance for the tree starting from the given username
    function calculateTreeBalance(currentUsername) {
      const user = userMap.get(currentUsername);
      if (!user) return 0;

      let totalBalance = user.balance;
      
      // Add balances from all children recursively
      for (const childUsername of user.children) {
        totalBalance += calculateTreeBalance(childUsername);
      }

      return totalBalance;
    }

    const totalBalance = calculateTreeBalance(username);
    return totalBalance;

  } catch (error) {
    console.error('Error calculating business volume:', error);
    return 0;
  }
}

export async function GET(request) {
  try {
    console.log('Dashboard API - Starting request');
    
    // Verify user authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      console.log('Dashboard API - No token found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('Dashboard API - Invalid token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;
    
    console.log('Dashboard API - User ID from token:', userId);
    console.log('Dashboard API - User ID type:', typeof userId);
    console.log('Dashboard API - Parsed User ID:', parseInt(userId));
    
    // Validate userId
    if (!userId || isNaN(parseInt(userId))) {
      console.log('Dashboard API - Invalid userId:', userId);
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Fetch user data with rank information
    console.log('Dashboard API - Fetching user data for ID:', parseInt(userId));
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
            title: true,
            required_points: true
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
    console.log('Dashboard API - Calculating direct earnings for user:', parseInt(userId));
    const directEarnings = await prisma.earnings.aggregate({
      where: {
        userId: parseInt(userId),
        type: 'direct_commission'
      },
      _sum: {
        amount: true
      }
    }).catch(error => {
      console.error('Error calculating direct earnings:', error);
      return { _sum: { amount: null } };
    });
    console.log('Dashboard API - Direct earnings result:', directEarnings);

    // Calculate indirect earnings total
    console.log('Dashboard API - Calculating indirect earnings for user:', parseInt(userId));
    const indirectEarnings = await prisma.earnings.aggregate({
      where: {
        userId: parseInt(userId),
        type: 'indirect_commission'
      },
      _sum: {
        amount: true
      }
    }).catch(error => {
      console.error('Error calculating indirect earnings:', error);
      return { _sum: { amount: null } };
    });
    console.log('Dashboard API - Indirect earnings result:', indirectEarnings);

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

    // Get current package details
    const currentPackage = user.currentPackageId ? await prisma.package.findUnique({
      where: { id: user.currentPackageId },
      select: {
        package_name: true,
        package_amount: true,
        package_points: true
      }
    }) : null;

    // Calculate business volume (sum of all tree balances)
    console.log('Dashboard API - Starting business volume calculation...');
    const businessVolumeStart = Date.now();
    const businessVolume = await calculateBusinessVolume(user.username);
    const businessVolumeTime = Date.now() - businessVolumeStart;
    console.log(`Dashboard API - Business volume calculation completed in ${businessVolumeTime}ms`);

    // Get pending withdrawal amount
    const pendingWithdrawals = await prisma.withdrawalRequest.aggregate({
      where: {
        userId: parseInt(userId),
        status: 'pending'
      },
      _sum: {
        amount: true
      }
    });

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
        packageId: user.currentPackageId, // Add packageId field for frontend compatibility
        packageExpiryDate: user.packageExpiryDate,
        memberSince: user.createdAt,
        rank: user.rank,
        currentPackage: currentPackage
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
        rank: user.rank,
        businessVolume: businessVolume,
        pendingWithdrawals: parseFloat(pendingWithdrawals._sum.amount || 0)
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
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check if it's a Prisma validation error
    if (error.name === 'PrismaClientValidationError') {
      console.error('Prisma validation error details:', error.message);
      return NextResponse.json({
        error: 'Database validation error',
        details: error.message
      }, { status: 400 });
    }
    
    return NextResponse.json({
      error: 'Failed to fetch dashboard data',
      details: error.message
    }, { status: 500 });
  }
}
