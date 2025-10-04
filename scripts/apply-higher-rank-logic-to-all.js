const { PrismaClient } = require('@prisma/client');
const { updateUserRank } = require('../src/lib/rankUtils.js');

const prisma = new PrismaClient();

async function applyHigherRankLogicToAll() {
  try {
    console.log('🚀 APPLYING HIGHER RANK LOGIC TO ALL USERS');
    console.log('==========================================\n');

    // Get all users who might benefit from higher rank logic
    const usersToUpdate = await prisma.user.findMany({
      where: {
        points: { gte: 24000 }, // Users with Sapphire Diamond+ points
        OR: [
          { rank: { title: 'Sapphire Diamond' } }, // Currently at Sapphire Diamond
          { rank: null } // No rank assigned
        ]
      },
      select: {
        id: true,
        username: true,
        points: true,
        rank: {
          select: { title: true }
        }
      },
      orderBy: { points: 'desc' }
    });

    console.log(`📊 Found ${usersToUpdate.length} users who might benefit from higher rank logic`);
    console.log('');

    if (usersToUpdate.length === 0) {
      console.log('✅ No users need rank updates');
      return;
    }

    let updatedCount = 0;
    let unchangedCount = 0;

    console.log('🔄 Processing users...\n');

    for (let i = 0; i < usersToUpdate.length; i++) {
      const user = usersToUpdate[i];
      const progress = `[${i + 1}/${usersToUpdate.length}]`;
      
      console.log(`${progress} Processing ${user.username} (${user.points.toLocaleString()} points, current: ${user.rank?.title || 'No Rank'})`);

      try {
        const oldRank = user.rank?.title || 'No Rank';
        const newRank = await updateUserRank(user.id);
        
        if (newRank && newRank !== oldRank) {
          console.log(`   ✅ Updated: ${oldRank} → ${newRank}`);
          updatedCount++;
        } else {
          console.log(`   ℹ️ No change: ${oldRank}`);
          unchangedCount++;
        }
        
        // Small delay to prevent overwhelming the database
        if (i % 10 === 0 && i > 0) {
          console.log(`   ⏸️ Pausing briefly...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`   ❌ Error updating ${user.username}:`, error.message);
        unchangedCount++;
      }
      
      console.log('');
    }

    console.log('🎉 RANK UPDATE COMPLETED!');
    console.log('=========================');
    console.log(`📊 Summary:`);
    console.log(`   - Total users processed: ${usersToUpdate.length}`);
    console.log(`   - Ranks updated: ${updatedCount}`);
    console.log(`   - Ranks unchanged: ${unchangedCount}`);
    console.log('');

    // Show final statistics
    console.log('📈 Final rank distribution:');
    const finalStats = await prisma.rank.findMany({
      select: {
        title: true,
        required_points: true,
        _count: {
          select: { users: true }
        }
      },
      orderBy: { required_points: 'desc' }
    });

    finalStats.forEach(rank => {
      console.log(`   ${rank.title}: ${rank._count.users} users (${rank.required_points.toLocaleString()} points)`);
    });

    console.log('\n✅ Higher rank logic successfully applied to all users!');

  } catch (error) {
    console.error('❌ Error applying higher rank logic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

applyHigherRankLogicToAll();

