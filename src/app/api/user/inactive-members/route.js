import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

// Recursive function to get all downline members with inactive packages
async function getInactivePackageMembers(username, level = 1, maxLevel = 10) {
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
      currentPackageId: true,
      packageExpiryDate: true,
      currentPackage: {
        select: {
          id: true,
          package_name: true,
          package_amount: true
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

  const inactiveMembers = [];

  for (const referral of referrals) {
    // Check if package is inactive
    let isPackageInactive = false;
    let packageStatus = 'No Package';
    
    if (referral.currentPackageId && referral.packageExpiryDate) {
      const now = new Date();
      const expiryDate = new Date(referral.packageExpiryDate);
      if (now > expiryDate) {
        isPackageInactive = true;
        packageStatus = 'Expired';
      } else {
        packageStatus = 'Active';
      }
    } else if (!referral.currentPackageId) {
      isPackageInactive = true;
      packageStatus = 'No Package';
    }

    // If package is inactive, add to list
    if (isPackageInactive) {
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
        packageAmount: parseFloat(referral.currentPackage?.package_amount) || 0,
        packageStatus: packageStatus,
        packageExpiryDate: referral.packageExpiryDate,
        rank: referral.rank?.title || 'No Rank',
        level: level
      };

      inactiveMembers.push(memberData);
    }

    // Recursively get children
    const children = await getInactivePackageMembers(referral.username, level + 1, maxLevel);
    inactiveMembers.push(...children);
  }

  return inactiveMembers;
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

    // Get all inactive package members
    const inactiveMembers = await getInactivePackageMembers(user.username);

    // Calculate statistics
    const stats = {
      totalInactiveMembers: inactiveMembers.length,
      noPackageMembers: inactiveMembers.filter(m => m.packageStatus === 'No Package').length,
      expiredPackageMembers: inactiveMembers.filter(m => m.packageStatus === 'Expired').length,
      level1Inactive: inactiveMembers.filter(m => m.level === 1).length,
      level2Inactive: inactiveMembers.filter(m => m.level === 2).length,
      level3Inactive: inactiveMembers.filter(m => m.level === 3).length,
      totalPotentialRevenue: inactiveMembers.reduce((sum, member) => sum + member.packageAmount, 0)
    };

    // Group by level for better organization
    const membersByLevel = {};
    inactiveMembers.forEach(member => {
      if (!membersByLevel[member.level]) {
        membersByLevel[member.level] = [];
      }
      membersByLevel[member.level].push(member);
    });

    return NextResponse.json({
      success: true,
      members: inactiveMembers,
      membersByLevel,
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
    console.error('Error fetching inactive members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
