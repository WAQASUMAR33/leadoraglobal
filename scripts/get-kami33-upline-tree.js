const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getKami33UplineTree() {
  try {
    console.log('🌳 KAMI33 FULL UPLINE TREE');
    console.log('==========================\n');

    const targetUsername = 'kami33';

    // First, check if the user exists
    const targetUser = await prisma.user.findUnique({
      where: { username: targetUsername },
      select: {
        id: true,
        username: true,
        fullname: true,
        email: true,
        status: true,
        balance: true,
        points: true,
        referralCount: true,
        totalEarnings: true,
        referredBy: true,
        createdAt: true,
        currentPackage: {
          select: {
            package_name: true
          }
        },
        rank: {
          select: {
            title: true,
            required_points: true
          }
        }
      }
    });

    if (!targetUser) {
      console.log(`❌ User "${targetUsername}" not found in the database.`);
      return;
    }

    console.log('🎯 TARGET USER:');
    console.log('===============');
    console.log(`├─ Username: ${targetUser.username}`);
    console.log(`├─ Full Name: ${targetUser.fullname}`);
    console.log(`├─ Email: ${targetUser.email || 'Not provided'}`);
    console.log(`├─ Status: ${targetUser.status}`);
    console.log(`├─ Balance: $${parseFloat(targetUser.balance).toFixed(2)}`);
    console.log(`├─ Points: ${targetUser.points.toLocaleString()}`);
    console.log(`├─ Referral Count: ${targetUser.referralCount}`);
    console.log(`├─ Total Earnings: $${parseFloat(targetUser.totalEarnings).toFixed(2)}`);
    console.log(`├─ Package: ${targetUser.currentPackage?.package_name || 'No Package'}`);
    console.log(`├─ Rank: ${targetUser.rank?.title || 'No Rank'} (requires ${targetUser.rank?.required_points?.toLocaleString() || '0'} points)`);
    console.log(`├─ Referred By: ${targetUser.referredBy || 'Root User (No referrer)'}`);
    console.log(`└─ Joined: ${targetUser.createdAt.toISOString().split('T')[0]}`);
    console.log('');

    if (!targetUser.referredBy) {
      console.log('📊 UPLINE TREE:');
      console.log('===============');
      console.log('🎯 kami33 (Root User - No upline)');
      console.log('');
      console.log('✅ This user has no referrer, so there is no upline tree.');
      return;
    }

    // Build the complete upline tree
    console.log('📊 FULL UPLINE TREE:');
    console.log('====================');
    
    const uplineTree = [];
    let currentUsername = targetUser.referredBy;
    let level = 1;
    const maxLevels = 20; // Prevent infinite loops
    const processedUsers = new Set();

    // Add the target user first
    uplineTree.push({
      ...targetUser,
      level: 0,
      isTarget: true
    });

    while (currentUsername && level <= maxLevels) {
      // Prevent infinite loops
      if (processedUsers.has(currentUsername)) {
        console.log(`⚠️ Circular reference detected: ${currentUsername}`);
        break;
      }
      processedUsers.add(currentUsername);

      const uplineUser = await prisma.user.findUnique({
        where: { username: currentUsername },
        select: {
          id: true,
          username: true,
          fullname: true,
          email: true,
          status: true,
          balance: true,
          points: true,
          referralCount: true,
          totalEarnings: true,
          referredBy: true,
          createdAt: true,
          currentPackage: {
            select: {
              package_name: true
            }
          },
          rank: {
            select: {
              title: true,
              required_points: true
            }
          }
        }
      });

      if (!uplineUser) {
        console.log(`❌ User "${currentUsername}" not found in the database.`);
        break;
      }

      uplineTree.push({
        ...uplineUser,
        level: level,
        isTarget: false
      });

      currentUsername = uplineUser.referredBy;
      level++;
    }

    // Display the tree
    console.log(`📊 Found ${uplineTree.length} users in the upline tree:\n`);

    uplineTree.forEach((user, index) => {
      const indent = '  '.repeat(user.level);
      const arrow = user.isTarget ? '🎯' : '👆';
      const levelText = user.isTarget ? 'TARGET' : `LEVEL ${user.level}`;
      
      console.log(`${indent}${arrow} ${user.username} (${levelText})`);
      console.log(`${indent}   ├─ Full Name: ${user.fullname}`);
      console.log(`${indent}   ├─ Status: ${user.status}`);
      console.log(`${indent}   ├─ Balance: $${parseFloat(user.balance).toFixed(2)}`);
      console.log(`${indent}   ├─ Points: ${user.points.toLocaleString()}`);
      console.log(`${indent}   ├─ Referral Count: ${user.referralCount}`);
      console.log(`${indent}   ├─ Total Earnings: $${parseFloat(user.totalEarnings).toFixed(2)}`);
      console.log(`${indent}   ├─ Package: ${user.currentPackage?.package_name || 'No Package'}`);
      console.log(`${indent}   ├─ Rank: ${user.rank?.title || 'No Rank'} (requires ${user.rank?.required_points?.toLocaleString() || '0'} points)`);
      console.log(`${indent}   ├─ Referred By: ${user.referredBy || 'Root User'}`);
      console.log(`${indent}   └─ Joined: ${user.createdAt.toISOString().split('T')[0]}`);
      console.log('');
    });

    // Summary statistics
    console.log('📈 UPLINE TREE SUMMARY:');
    console.log('=======================');
    console.log(`├─ Total Users in Tree: ${uplineTree.length}`);
    console.log(`├─ Tree Depth: ${Math.max(...uplineTree.map(u => u.level))} levels`);
    console.log(`├─ Total Points in Tree: ${uplineTree.reduce((sum, u) => sum + u.points, 0).toLocaleString()}`);
    console.log(`├─ Total Balance in Tree: $${uplineTree.reduce((sum, u) => sum + parseFloat(u.balance), 0).toFixed(2)}`);
    console.log(`├─ Total Earnings in Tree: $${uplineTree.reduce((sum, u) => sum + parseFloat(u.totalEarnings), 0).toFixed(2)}`);
    console.log(`└─ Total Referrals in Tree: ${uplineTree.reduce((sum, u) => sum + u.referralCount, 0)}`);
    console.log('');

    // Rank distribution
    console.log('🏆 RANK DISTRIBUTION IN TREE:');
    console.log('=============================');
    const rankCounts = {};
    uplineTree.forEach(user => {
      const rank = user.rank?.title || 'No Rank';
      rankCounts[rank] = (rankCounts[rank] || 0) + 1;
    });

    Object.entries(rankCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([rank, count]) => {
        console.log(`├─ ${rank}: ${count} user(s)`);
      });
    console.log('');

    // Top earners in the tree
    console.log('💰 TOP EARNERS IN TREE:');
    console.log('========================');
    uplineTree
      .sort((a, b) => parseFloat(b.totalEarnings) - parseFloat(a.totalEarnings))
      .slice(0, 5)
      .forEach((user, index) => {
        console.log(`${index + 1}. ${user.username}: $${parseFloat(user.totalEarnings).toFixed(2)} (${user.rank?.title || 'No Rank'})`);
      });
    console.log('');

    // Highest point holders
    console.log('⭐ HIGHEST POINT HOLDERS IN TREE:');
    console.log('=================================');
    uplineTree
      .sort((a, b) => b.points - a.points)
      .slice(0, 5)
      .forEach((user, index) => {
        console.log(`${index + 1}. ${user.username}: ${user.points.toLocaleString()} points (${user.rank?.title || 'No Rank'})`);
      });

  } catch (error) {
    console.error('❌ Error getting kami33 upline tree:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getKami33UplineTree();
