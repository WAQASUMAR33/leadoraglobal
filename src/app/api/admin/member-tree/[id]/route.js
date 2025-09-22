import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import jwt from 'jsonwebtoken';

// Recursive function to build referral tree
async function buildReferralTree(username, level = 1, maxLevel = 10) {
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
      referralCount: true,
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

  const tree = [];

  for (const referral of referrals) {
    const referralData = {
      id: referral.id,
      name: referral.fullname,
      username: referral.username,
      email: referral.email,
      phoneNumber: referral.phoneNumber,
      status: referral.status,
      balance: parseFloat(referral.balance) || 0,
      points: referral.points || 0,
      totalEarnings: parseFloat(referral.totalEarnings) || 0,
      referralCount: referral.referralCount || 0,
      joinedDate: referral.createdAt,
      package: referral.currentPackage?.package_name || 'No Package',
      rank: referral.rank?.title || 'No Rank',
      level: level,
      children: []
    };

    // Recursively get children
    const children = await buildReferralTree(referral.username, level + 1, maxLevel);
    referralData.children = children;

    tree.push(referralData);
  }

  return tree;
}

export async function GET(request, { params }) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false,
        message: 'Authorization token required' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

    // Verify admin token
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (error) {
      return NextResponse.json({ 
        success: false,
        message: 'Invalid token' 
      }, { status: 401 });
    }

    // Check if it's an admin token
    if (!decoded.adminId) {
      return NextResponse.json({ 
        success: false,
        message: 'Admin access required' 
      }, { status: 403 });
    }

    const { id } = params;
    const userId = parseInt(id);

    if (!userId) {
      return NextResponse.json({ 
        success: false,
        message: 'Invalid user ID' 
      }, { status: 400 });
    }

    // Get user's basic info
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        referralCount: true,
        createdAt: true,
        referredBy: true,
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
      }
    });

    if (!user) {
      return NextResponse.json({ 
        success: false,
        message: 'User not found' 
      }, { status: 404 });
    }

    // Build the complete referral tree
    const referralTree = await buildReferralTree(user.username);

    // Calculate tree statistics
    const calculateTreeStats = (tree) => {
      let totalMembers = 0;
      let activeMembers = 0;
      let totalEarnings = 0;
      let maxLevel = 0;

      const traverse = (nodes, level = 1) => {
        maxLevel = Math.max(maxLevel, level);
        
        for (const node of nodes) {
          totalMembers++;
          if (node.status === 'active') activeMembers++;
          totalEarnings += node.totalEarnings;
          
          if (node.children && node.children.length > 0) {
            traverse(node.children, level + 1);
          }
        }
      };

      traverse(tree);
      return { totalMembers, activeMembers, totalEarnings, maxLevel };
    };

    const treeStats = calculateTreeStats(referralTree);

    // Get referrer info if exists
    let referrerInfo = null;
    if (user.referredBy) {
      referrerInfo = await prisma.user.findUnique({
        where: { username: user.referredBy },
        select: {
          id: true,
          fullname: true,
          username: true,
          email: true
        }
      });
    }

    // Format user data
    const userData = {
      id: user.id,
      name: user.fullname,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      status: user.status,
      balance: parseFloat(user.balance) || 0,
      points: user.points || 0,
      totalEarnings: parseFloat(user.totalEarnings) || 0,
      referralCount: user.referralCount || 0,
      joinedDate: user.createdAt,
      package: user.currentPackage?.package_name || 'No Package',
      rank: user.rank?.title || 'No Rank',
      level: 0, // Root level
      referredBy: user.referredBy,
      referrerInfo,
      children: referralTree
    };

    return NextResponse.json({
      success: true,
      user: userData,
      treeStats,
      referralTree
    });

  } catch (error) {
    console.error('Error fetching member tree:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
