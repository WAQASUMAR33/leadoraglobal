import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

// Recursive function to get all downline members
async function getAllDownlineMembers(username, level = 1, maxLevel = 10) {
  if (level > maxLevel) return [];

  // Get all users referred by this username
  const referrals = await prisma.user.findMany({
    where: { referredBy: username },
    select: {
      id: true,
      fullname: true,
      username: true,
      email: true,
      phoneNumber: true,
      status: true,
      balance: true,
      points: true,
      totalEarnings: true,
      createdAt: true,
      currentPackage: {
        select: {
          package_name: true
        }
      },
      rank: {
        select: {
          title: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  const allMembers = [];

  for (const referral of referrals) {
    const memberData = {
      id: referral.id,
      fullname: referral.fullname,
      username: referral.username,
      email: referral.email,
      phoneNumber: referral.phoneNumber,
      status: referral.status,
      balance: parseFloat(referral.balance) || 0,
      points: referral.points || 0,
      totalEarnings: parseFloat(referral.totalEarnings) || 0,
      createdAt: referral.createdAt,
      package: referral.currentPackage?.package_name || 'No Package',
      rank: referral.rank?.title || 'No Rank',
      level: level
    };

    allMembers.push(memberData);

    // Recursively get children
    const children = await getAllDownlineMembers(referral.username, level + 1, maxLevel);
    allMembers.push(...children);
  }

  return allMembers;
}

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

    // Get user's basic info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullname: true,
        username: true,
        email: true,
        status: true,
        balance: true,
        points: true,
        createdAt: true,
        referralCount: true,
        totalEarnings: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all downline members
    const downlineMembers = await getAllDownlineMembers(user.username);

    // Calculate statistics
    const stats = {
      totalMembers: downlineMembers.length,
      activeMembers: downlineMembers.filter(m => m.status === 'active').length,
      totalEarnings: downlineMembers.reduce((sum, member) => sum + member.totalEarnings, 0),
      level1Members: downlineMembers.filter(m => m.level === 1).length,
      level2Members: downlineMembers.filter(m => m.level === 2).length,
      level3Members: downlineMembers.filter(m => m.level === 3).length
    };

    return NextResponse.json({
      success: true,
      members: downlineMembers,
      stats,
      user: {
        id: user.id,
        fullname: user.fullname,
        username: user.username,
        email: user.email,
        status: user.status,
        balance: parseFloat(user.balance) || 0,
        points: user.points || 0,
        createdAt: user.createdAt,
        referralCount: user.referralCount,
        totalEarnings: parseFloat(user.totalEarnings) || 0
      }
    });

  } catch (error) {
    console.error('Error fetching downline members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
