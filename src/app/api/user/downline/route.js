import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

// Optimized function to get all downline members using single query
async function getAllDownlineMembers(username) {
  try {
    // Get all users in a single query - much faster than recursive queries
    const allUsers = await prisma.user.findMany({
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
      },
      orderBy: { createdAt: 'asc' }
    });

    // Build the tree structure in memory
    const userMap = new Map();
    allUsers.forEach(user => {
      userMap.set(user.username, {
        ...user,
        children: []
      });
    });

    // Build parent-child relationships
    allUsers.forEach(user => {
      if (user.referredBy && userMap.has(user.referredBy)) {
        userMap.get(user.referredBy).children.push(user.username);
      }
    });

    // Calculate levels for all users in the tree starting from the given username
    const levels = new Map();
    const visited = new Set();

    function calculateLevels(currentUsername, currentLevel) {
      if (visited.has(currentUsername) || currentLevel > 10) return;
      
      visited.add(currentUsername);
      levels.set(currentUsername, currentLevel);
      
      const user = userMap.get(currentUsername);
      if (user) {
        user.children.forEach(childUsername => {
          calculateLevels(childUsername, currentLevel + 1);
        });
      }
    }

    calculateLevels(username, 1);

    // Filter and format downline members
    const downlineMembers = [];
    allUsers.forEach(user => {
      const level = levels.get(user.username);
      if (level && level > 1) { // Exclude the root user (level 1)
        downlineMembers.push({
          id: user.id,
          fullname: user.fullname,
          username: user.username,
          email: user.email,
          phoneNumber: user.phoneNumber,
          status: user.status,
          balance: parseFloat(user.balance) || 0,
          points: user.points || 0,
          totalEarnings: parseFloat(user.totalEarnings) || 0,
          createdAt: user.createdAt,
          package: user.currentPackage?.package_name || 'No Package',
          rank: user.rank?.title || 'No Rank',
          level: level
        });
      }
    });

    return downlineMembers;

  } catch (error) {
    console.error('Error getting downline members:', error);
    return [];
  }
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
