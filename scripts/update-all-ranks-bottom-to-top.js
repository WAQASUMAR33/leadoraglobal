import { PrismaClient } from '@prisma/client';
import { updateUserRank } from '../src/lib/rankUtils.js';

const prisma = new PrismaClient();

// Get all users ordered by their position in the tree (bottom to top)
async function getAllUsersBottomToTop() {
  // Get all users
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      referredBy: true,
      points: true,
      rank: {
        select: {
          title: true
        }
      }
    }
  });

  // Build a map of users by username
  const userMap = new Map();
  allUsers.forEach(user => {
    userMap.set(user.username, user);
  });

  // Calculate depth for each user (distance from root)
  function getDepth(username, visited = new Set()) {
    if (visited.has(username)) return 0; // Prevent infinite loops
    visited.add(username);

    const user = userMap.get(username);
    if (!user || !user.referredBy) return 0; // Root user

    return 1 + getDepth(user.referredBy, visited);
  }

  // Add depth to each user
  const usersWithDepth = allUsers.map(user => ({
    ...user,
    depth: getDepth(user.username)
  }));

  // Sort by depth (descending) - deepest users first (bottom to top)
  return usersWithDepth.sort((a, b) => b.depth - a.depth);
}

async function updateAllRanks() {
  try {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║       UPDATE ALL RANKS (BOTTOM TO TOP - NEW CRITERIA)        ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    console.log('🔍 Fetching all users...\n');
    
    const users = await getAllUsersBottomToTop();
    
    console.log(`✅ Found ${users.length} users\n`);
    console.log('📊 Processing order: Bottom to Top (deepest users first)\n');
    console.log('This ensures downline ranks are updated before upline ranks are checked.\n');
    console.log('─────────────────────────────────────────────────────────────\n');

    let updatedCount = 0;
    let unchangedCount = 0;
    let errorCount = 0;
    const upgrades = [];
    const downgrades = [];

    console.log('🔄 Starting rank updates...\n');

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const progress = ((i + 1) / users.length * 100).toFixed(1);
      
      try {
        const oldRank = user.rank?.title || 'No Rank';
        
        // Update rank
        const newRank = await updateUserRank(user.id);
        
        if (newRank && newRank !== oldRank) {
          updatedCount++;
          const change = {
            username: user.username,
            oldRank,
            newRank,
            points: user.points,
            depth: user.depth
          };
          
          // Determine if upgrade or downgrade
          const rankOrder = [
            'Consultant', 'Manager', 'Sapphire Manager', 'Diamond',
            'Sapphire Diamond', 'Ambassador', 'Sapphire Ambassador',
            'Royal Ambassador', 'Global Ambassador', 'Honory Share Holder'
          ];
          const oldIndex = rankOrder.indexOf(oldRank);
          const newIndex = rankOrder.indexOf(newRank);
          
          if (newIndex > oldIndex) {
            upgrades.push(change);
            console.log(`✅ [${progress}%] ${user.username.padEnd(20)} | ${oldRank.padEnd(20)} → ${newRank.padEnd(20)} ⬆️ UPGRADE`);
          } else {
            downgrades.push(change);
            console.log(`⬇️ [${progress}%] ${user.username.padEnd(20)} | ${oldRank.padEnd(20)} → ${newRank.padEnd(20)} ⬇️ DOWNGRADE`);
          }
        } else {
          unchangedCount++;
          if ((i + 1) % 100 === 0) {
            console.log(`ℹ️ [${progress}%] Processed ${i + 1}/${users.length} users...`);
          }
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ [${progress}%] Error updating ${user.username}: ${error.message}`);
      }
    }

    console.log('\n═════════════════════════════════════════════════════════════════\n');
    console.log('🎉 RANK UPDATE COMPLETE!\n');
    console.log('─────────────────────────────────────────────────────────────\n');
    
    console.log('📊 Summary:');
    console.log(`   Total Users: ${users.length}`);
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ⬆️ Upgrades: ${upgrades.length}`);
    console.log(`   ⬇️ Downgrades: ${downgrades.length}`);
    console.log(`   ➖ Unchanged: ${unchangedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    if (upgrades.length > 0) {
      console.log('\n🎉 UPGRADES (Users who ranked up):');
      console.log('─────────────────────────────────────────────────────────────');
      upgrades.forEach((upgrade, index) => {
        console.log(`${(index + 1).toString().padStart(3)}. ${upgrade.username.padEnd(20)} | ${upgrade.oldRank.padEnd(20)} → ${upgrade.newRank}`);
        console.log(`     Points: ${upgrade.points.toLocaleString()} | Depth: Level ${upgrade.depth}`);
      });
    }

    if (downgrades.length > 0) {
      console.log('\n⚠️ DOWNGRADES (Users who ranked down):');
      console.log('─────────────────────────────────────────────────────────────');
      downgrades.forEach((downgrade, index) => {
        console.log(`${(index + 1).toString().padStart(3)}. ${downgrade.username.padEnd(20)} | ${downgrade.oldRank.padEnd(20)} → ${downgrade.newRank}`);
        console.log(`     Points: ${downgrade.points.toLocaleString()} | Depth: Level ${downgrade.depth}`);
      });
    }

    // Show rank distribution after update
    console.log('\n🏆 Final Rank Distribution:');
    console.log('─────────────────────────────────────────────────────────────');
    
    const finalRankCounts = await prisma.user.groupBy({
      by: ['rankId'],
      _count: {
        rankId: true
      }
    });

    for (const rankCount of finalRankCounts) {
      if (rankCount.rankId) {
        const rank = await prisma.rank.findUnique({
          where: { id: rankCount.rankId },
          select: { title: true }
        });
        console.log(`   ${rank.title.padEnd(25)}: ${rankCount._count.rankId}`);
      }
    }

    console.log('\n═════════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Fatal Error:', error);
    console.error('Error message:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

updateAllRanks();

