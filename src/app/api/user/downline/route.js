import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

// Helper function to detect circular references
function wouldCreateCircularReference(childUsername, parentUsername, userMap) {
  // Check if adding this relationship would create a circular reference
  // by traversing up the tree from the parent
  const visited = new Set();
  let currentUsername = parentUsername;
  
  while (currentUsername && !visited.has(currentUsername)) {
    visited.add(currentUsername);
    
    // If we encounter the child username while traversing up, it's a circular reference
    if (currentUsername === childUsername) {
      return true;
    }
    
    // Get the parent of current user
    const currentUser = userMap.get(currentUsername.toLowerCase());
    if (currentUser && currentUser.referredBy) {
      currentUsername = currentUser.referredBy;
    } else {
      break;
    }
  }
  
  return false;
}

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

    // Build the tree structure in memory with case-insensitive lookup
    const userMap = new Map();
    const usernameToActualUsername = new Map(); // Map lowercase to actual case
    
    allUsers.forEach(user => {
      const lowerUsername = user.username.toLowerCase();
      userMap.set(lowerUsername, {
        ...user,
        children: []
      });
      usernameToActualUsername.set(lowerUsername, user.username);
    });

    // Build parent-child relationships with case-insensitive lookup
    // and prevent circular references
    allUsers.forEach(user => {
      if (user.referredBy) {
        const lowerReferredBy = user.referredBy.toLowerCase();
        if (userMap.has(lowerReferredBy)) {
          const parentUser = userMap.get(lowerReferredBy);
          
          // Prevent circular references:
          // 1. User cannot refer themselves
          // 2. User cannot refer their own referrer (creates circular reference)
          // 3. Check if this would create a circular reference in the tree
          const isCircularReference = user.username === parentUser.username || 
                                    user.username === parentUser.referredBy ||
                                    wouldCreateCircularReference(user.username, parentUser.username, userMap);
          
          if (!isCircularReference) {
            userMap.get(lowerReferredBy).children.push(user.username);
          } else {
            console.warn(`⚠️ Preventing circular reference: ${user.username} -> ${parentUser.username}`);
          }
        }
      }
    });

    // Calculate levels for all users in the tree starting from the given username
    const levels = new Map();
    const visited = new Set();

    function calculateLevels(currentUsername, currentLevel) {
      const lowerUsername = currentUsername.toLowerCase();
      if (visited.has(lowerUsername) || currentLevel > 10) return;
      
      visited.add(lowerUsername);
      levels.set(currentUsername, currentLevel);
      
      const user = userMap.get(lowerUsername);
      if (user) {
        user.children.forEach(childUsername => {
          calculateLevels(childUsername, currentLevel + 1);
        });
      }
    }

    // Start from level 0 for the root user, so direct referrals are level 1
    calculateLevels(username, 0);

    // Filter and format ONLY downline members with active packages (exclude root user)
    const downlineMembers = [];
    allUsers.forEach(user => {
      const level = levels.get(user.username);
      // Only include users with level > 0 (downline) AND have an active package
      if (level && level > 0 && user.currentPackage?.package_name) {
        downlineMembers.push({
          id: user.id,
          username: user.username,
          level: level,
          status: user.status,
          package: user.currentPackage.package_name,
          rank: user.rank?.title || 'No Rank',
          createdAt: user.createdAt
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

    // Calculate statistics for all levels
    const stats = {
      totalMembers: downlineMembers.length,
      activeMembers: downlineMembers.filter(m => m.status === 'active').length,
      totalEarnings: downlineMembers.reduce((sum, member) => sum + member.totalEarnings, 0),
      level1Members: downlineMembers.filter(m => m.level === 1).length,
      level2Members: downlineMembers.filter(m => m.level === 2).length,
      level3Members: downlineMembers.filter(m => m.level === 3).length,
      level4Members: downlineMembers.filter(m => m.level === 4).length,
      level5Members: downlineMembers.filter(m => m.level === 5).length,
      level6Members: downlineMembers.filter(m => m.level === 6).length,
      level7Members: downlineMembers.filter(m => m.level === 7).length,
      level8Members: downlineMembers.filter(m => m.level === 8).length,
      level9Members: downlineMembers.filter(m => m.level === 9).length,
      level10Members: downlineMembers.filter(m => m.level === 10).length,
      maxLevel: downlineMembers.length > 0 ? Math.max(...downlineMembers.map(m => m.level)) : 0
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
