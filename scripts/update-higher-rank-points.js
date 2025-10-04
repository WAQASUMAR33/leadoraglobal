const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Define proper point requirements for higher ranks
const HIGHER_RANK_POINTS = {
  'Sapphire Diamond': 24000, // Already correct
  'Ambassador': 50000,
  'Sapphire Ambassador': 100000,
  'Royal Ambassador': 200000,
  'Global Ambassador': 500000,
  'Honory Share Holder': 1000000
};

async function updateHigherRankPoints() {
  try {
    console.log('🔧 UPDATING HIGHER RANK POINT REQUIREMENTS');
    console.log('===========================================\n');

    // First, show current requirements
    console.log('📊 Current rank point requirements:');
    const currentRanks = await prisma.rank.findMany({
      orderBy: { required_points: 'desc' }
    });
    
    currentRanks.forEach(rank => {
      console.log(`  ${rank.title}: ${rank.required_points.toLocaleString()} points`);
    });
    console.log('');

    // Update higher ranks with proper point requirements
    console.log('🚀 Updating higher rank point requirements...\n');
    
    for (const [rankTitle, requiredPoints] of Object.entries(HIGHER_RANK_POINTS)) {
      const existingRank = await prisma.rank.findFirst({
        where: { title: rankTitle }
      });

      if (existingRank) {
        if (existingRank.required_points !== requiredPoints) {
          await prisma.rank.update({
            where: { id: existingRank.id },
            data: { required_points: requiredPoints }
          });
          console.log(`✅ Updated ${rankTitle}: ${existingRank.required_points.toLocaleString()} → ${requiredPoints.toLocaleString()} points`);
        } else {
          console.log(`ℹ️ ${rankTitle}: ${requiredPoints.toLocaleString()} points (already correct)`);
        }
      } else {
        console.log(`❌ Rank "${rankTitle}" not found in database`);
      }
    }
    console.log('');

    // Show updated requirements
    console.log('📊 Updated rank point requirements:');
    const updatedRanks = await prisma.rank.findMany({
      orderBy: { required_points: 'desc' }
    });
    
    updatedRanks.forEach(rank => {
      console.log(`  ${rank.title}: ${rank.required_points.toLocaleString()} points`);
    });
    console.log('');

    // Show users who might qualify for higher ranks now
    console.log('👥 Users who might qualify for higher ranks:');
    console.log('===========================================');
    
    for (const [rankTitle, requiredPoints] of Object.entries(HIGHER_RANK_POINTS)) {
      if (requiredPoints > 24000) { // Higher than Sapphire Diamond
        const qualifyingUsers = await prisma.user.findMany({
          where: {
            points: { gte: requiredPoints },
            rank: { title: 'Sapphire Diamond' } // Currently stuck at Sapphire Diamond
          },
          select: {
            username: true,
            points: true
          },
          orderBy: { points: 'desc' },
          take: 5
        });

        if (qualifyingUsers.length > 0) {
          console.log(`\n🏆 ${rankTitle} (${requiredPoints.toLocaleString()} points):`);
          qualifyingUsers.forEach(user => {
            console.log(`  ✅ ${user.username}: ${user.points.toLocaleString()} points`);
          });
        }
      }
    }

    console.log('\n🎉 Higher rank point requirements updated successfully!');
    console.log('\n💡 Next steps:');
    console.log('  1. Run rank updates to apply new logic');
    console.log('  2. Users with high points can now potentially upgrade');
    console.log('  3. Downline requirements will be checked automatically');

  } catch (error) {
    console.error('❌ Error updating higher rank points:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateHigherRankPoints();

