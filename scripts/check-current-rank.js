const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCurrentRank() {
  try {
    console.log('🔍 Checking current rank for Touseef231...\n');

    const user = await prisma.user.findUnique({
      where: { username: 'Touseef231' },
      select: {
        id: true,
        username: true,
        points: true,
        rank: {
          select: {
            id: true,
            title: true,
            required_points: true
          }
        }
      }
    });

    if (!user) {
      console.log('❌ User Touseef231 not found');
      return;
    }

    console.log('📊 Current User Data:');
    console.log(`  Username: ${user.username}`);
    console.log(`  Points: ${user.points.toLocaleString()}`);
    console.log(`  Current Rank: ${user.rank?.title || 'No Rank'}`);
    console.log(`  Rank ID: ${user.rank?.id || 'No ID'}`);
    console.log(`  Rank Required Points: ${user.rank?.required_points?.toLocaleString() || 'N/A'}`);
    console.log('');

    // Check if the rank is correct based on our logic
    console.log('🔍 Verifying rank logic...');
    
    // Get all ranks to check what rank they should have
    const ranks = await prisma.rank.findMany({
      orderBy: { required_points: 'desc' }
    });

    let expectedRank = 'Consultant';
    let expectedRankId = null;

    for (const rank of ranks) {
      if (user.points >= rank.required_points) {
        expectedRank = rank.title;
        expectedRankId = rank.id;
        break;
      }
    }

    console.log(`  Expected Rank: ${expectedRank} (ID: ${expectedRankId})`);
    console.log(`  Current Rank: ${user.rank?.title || 'No Rank'} (ID: ${user.rank?.id || 'No ID'})`);
    
    if (user.rank?.title === expectedRank) {
      console.log('  ✅ Rank is correct!');
    } else {
      console.log('  ❌ Rank is incorrect!');
      console.log(`  🔧 Should be: ${expectedRank}`);
    }

  } catch (error) {
    console.error('❌ Error checking current rank:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentRank();
