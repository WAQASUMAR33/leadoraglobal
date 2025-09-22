import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

// Recursive function to build MLM tree with inactive package members
async function buildInactivePackageTree(username, level = 1, maxLevel = 10) {
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

  const tree = [];
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
      createdAt: referral.createdAt,
      package: referral.currentPackage?.package_name || 'No Package',
      packageAmount: parseFloat(referral.currentPackage?.package_amount) || 0,
      packageStatus: packageStatus,
      packageExpiryDate: referral.packageExpiryDate,
      rank: referral.rank?.title || 'No Rank',
      level: level,
      isPackageInactive: isPackageInactive,
      children: []
    };

    // Recursively get children
    const children = await buildInactivePackageTree(referral.username, level + 1, maxLevel);
    referralData.children = children;
    
    // Only include this member if they have inactive package OR if any of their children have inactive packages
    const hasInactiveChildren = children.some(child => child.isPackageInactive || child.hasInactiveChildren);
    referralData.hasInactiveChildren = hasInactiveChildren;
    
    if (isPackageInactive || hasInactiveChildren) {
      tree.push(referralData);
    }
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
        currentPackageId: true,
        packageExpiryDate: true,
        currentPackage: {
          select: {
            package_name: true,
            package_amount: true
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

    // Build the MLM tree with inactive package members
    const inactivePackageTree = await buildInactivePackageTree(user.username);

    // Calculate statistics
    const calculateTreeStats = (tree) => {
      let totalMembers = 0;
      let inactivePackageMembers = 0;
      let totalPotentialRevenue = 0;
      let maxLevel = 0;

      const traverse = (nodes, level = 1) => {
        maxLevel = Math.max(maxLevel, level);
        for (const node of nodes) {
          totalMembers++;
          if (node.isPackageInactive) {
            inactivePackageMembers++;
            totalPotentialRevenue += node.packageAmount;
          }
          if (node.children && node.children.length > 0) {
            traverse(node.children, level + 1);
          }
        }
      };
      traverse(inactivePackageTree);
      return { totalMembers, inactivePackageMembers, totalPotentialRevenue, maxLevel };
    };

    const treeStats = calculateTreeStats(inactivePackageTree);

    // Format user data for the root of the tree
    const userData = {
      id: user.id,
      name: user.fullname,
      username: user.username,
      email: user.email,
      status: user.status,
      balance: parseFloat(user.balance) || 0,
      points: user.points || 0,
      createdAt: user.createdAt,
      package: user.currentPackage?.package_name || 'No Package',
      packageAmount: parseFloat(user.currentPackage?.package_amount) || 0,
      rank: user.rank?.title || 'No Rank',
      level: 0,
      referralCount: user.referralCount,
      totalEarnings: parseFloat(user.totalEarnings) || 0,
    };

    // Flatten the tree for easy access
    const flattenTree = (nodes, level = 1, acc = []) => {
      for (const node of nodes) {
        acc.push({ ...node, level });
        if (node.children && node.children.length > 0) {
          flattenTree(node.children, level + 1, acc);
        }
      }
      return acc;
    };
    const allMembers = flattenTree(inactivePackageTree);

    return NextResponse.json({
      success: true,
      user: userData,
      treeStats,
      inactivePackageTree, // The actual hierarchical tree
      allMembers, // Flattened list of all members with inactive packages
      accounts: allMembers // For backward compatibility with the frontend
    });

  } catch (error) {
    console.error('Error fetching inactive package tree:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

