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

    // Get user's referral statistics
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        referralCount: true,
        totalEarnings: true,
        points: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all users referred by this user
    const referrals = await prisma.user.findMany({
      where: { referredBy: user.username },
      select: {
        id: true,
        fullname: true,
        username: true,
        email: true,
        status: true,
        balance: true,
        points: true,
        createdAt: true,
        currentPackage: {
          select: {
            package_name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate referral statistics
    const totalReferrals = referrals.length;
    const activeReferrals = referrals.filter(ref => ref.status === 'active').length;
    const totalEarnings = parseFloat(user.totalEarnings) || 0;
    
    // Calculate this month's earnings (mock calculation for now)
    const thisMonthEarnings = totalEarnings * 0.3; // 30% of total earnings as this month

    const referralStats = {
      totalReferrals,
      activeReferrals,
      totalEarnings,
      thisMonthEarnings
    };

    // Format referrals data
    const formattedReferrals = referrals.map(referral => ({
      id: referral.id,
      name: referral.fullname,
      username: referral.username,
      email: referral.email,
      joinedDate: referral.createdAt,
      status: referral.status,
      earnings: parseFloat(referral.balance) || 0,
      package: referral.currentPackage?.package_name || 'No Package',
      points: referral.points
    }));

    return NextResponse.json({
      success: true,
      user: {
        username: user.username,
        referralCount: user.referralCount,
        totalEarnings: user.totalEarnings,
        points: user.points
      },
      referralStats,
      referrals: formattedReferrals
    });

  } catch (error) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
