import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

// Recursive function to build referral tree
async function buildReferralTree(username, level = 1, maxLevel = 10, visited = new Set()) {
  if (level > maxLevel) return [];
  
  // Prevent infinite loops by tracking visited usernames
  if (visited.has(username)) {
    console.warn(`⚠️ Circular reference detected in referral tree: ${username}`);
    return [];
  }
  visited.add(username);

  // Get all users referred by this username
  const referrals = await prisma.user.findMany({
    where: { referredBy: username },
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
      status: referral.status,
      balance: parseFloat(referral.balance) || 0,
      points: referral.points || 0,
      joinedDate: referral.createdAt,
      package: referral.currentPackage?.package_name || 'No Package',
      rank: referral.rank?.title || 'No Rank',
      level: level,
      children: []
    };

    // Recursively get children
    const children = await buildReferralTree(referral.username, level + 1, maxLevel, visited);
    referralData.children = children;

    tree.push(referralData);
  }

  return tree;
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
        totalEarnings: true,
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
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
          totalEarnings += node.balance;
          
          if (node.children && node.children.length > 0) {
            traverse(node.children, level + 1);
          }
        }
      };

      traverse(tree);
      return { totalMembers, activeMembers, totalEarnings, maxLevel };
    };

    const treeStats = calculateTreeStats(referralTree);

    // Format user data
    const userData = {
      id: user.id,
      name: user.fullname,
      username: user.username,
      email: user.email,
      status: user.status,
      balance: parseFloat(user.balance) || 0,
      points: user.points || 0,
      joinedDate: user.createdAt,
      package: user.currentPackage?.package_name || 'No Package',
      rank: user.rank?.title || 'No Rank',
      level: 0, // Root level
      referralCount: user.referralCount,
      totalEarnings: parseFloat(user.totalEarnings) || 0,
      children: referralTree
    };

    return NextResponse.json({
      success: true,
      user: userData,
      treeStats,
      referralTree
    });

  } catch (error) {
    console.error('Error fetching referral tree:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
