const { PrismaClient } = require('@prisma/client');
const { updateUserRank } = require('../src/lib/rankUtils.js');

const prisma = new PrismaClient();

async function fixUserRanks() {
  try {
    console.log('🔧 Fixing user ranks based on database rank conditions...\n');
    
    // Get all ranks from database
    const ranks = await prisma.rank.findMany({
      orderBy: { required_points: 'desc' }
    });
    
    console.log('📊 Available ranks in database:');
    ranks.forEach(rank => {
      console.log(`  - ${rank.title}: ${rank.required_points} points`);
    });
    console.log('');
    
    // Get all users with their current points and ranks
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        points: true,
        rank: {
          select: {
            title: true,
            required_points: true
          }
        }
      },
      orderBy: {
        points: 'desc'
      }
    });
    
    console.log(`🔍 Checking ${users.length} users for rank corrections...\n`);
    
    let correctedCount = 0;
    let totalChecked = 0;
    
    for (const user of users) {
      totalChecked++;
      
      // Determine expected rank based on points and database conditions
      let expectedRankTitle = 'Consultant';
      let expectedRankId = null;
      
      for (const rank of ranks) {
        if (user.points >= rank.required_points) {
          expectedRankTitle = rank.title;
          expectedRankId = rank.id;
          break;
        }
      }
      
      // If no rank found, use the lowest rank
      if (!expectedRankId) {
        const lowestRank = ranks[ranks.length - 1];
        expectedRankTitle = lowestRank.title;
        expectedRankId = lowestRank.id;
      }
      
      const currentRankTitle = user.rank?.title || 'No Rank';
      const needsCorrection = currentRankTitle !== expectedRankTitle;
      
      if (needsCorrection) {
        console.log(`❌ ${user.username}: ${user.points} points`);
        console.log(`   Current: ${currentRankTitle} → Expected: ${expectedRankTitle}`);
        
        try {
          // Update the user's rank directly
          await prisma.user.update({
            where: { id: user.id },
            data: { rankId: expectedRankId }
          });
          
          console.log(`   ✅ Fixed: Updated to ${expectedRankTitle}`);
          correctedCount++;
        } catch (error) {
          console.log(`   ❌ Error updating rank: ${error.message}`);
        }
        console.log('');
      }
      
      // Show progress every 100 users
      if (totalChecked % 100 === 0) {
        console.log(`📊 Progress: Checked ${totalChecked}/${users.length} users, corrected ${correctedCount} so far...`);
      }
    }
    
    console.log(`\n🎉 Rank correction completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Total users checked: ${totalChecked}`);
    console.log(`   - Ranks corrected: ${correctedCount}`);
    console.log(`   - Ranks already correct: ${totalChecked - correctedCount}`);
    
    if (correctedCount > 0) {
      console.log(`\n✅ Successfully corrected ${correctedCount} users with incorrect ranks!`);
    } else {
      console.log(`\n✅ All ranks were already correct!`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing user ranks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserRanks();

