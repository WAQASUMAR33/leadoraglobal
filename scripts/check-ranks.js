const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRanks() {
  try {
    console.log('🔍 Checking ranks in database...\n');
    
    const ranks = await prisma.rank.findMany({
      select: {
        id: true,
        title: true,
        required_points: true
      },
      orderBy: {
        required_points: 'asc'
      }
    });
    
    if (ranks.length === 0) {
      console.log('❌ No ranks found in database.');
      return;
    }
    
    console.log('📊 Current ranks in database:');
    console.log('================================');
    ranks.forEach(rank => {
      console.log(`${rank.id}: ${rank.title} - ${rank.required_points} points`);
    });
    
    console.log('\n🔍 Checking some users with high points...\n');
    
    // Check users with various point ranges
    const usersToCheck = await prisma.user.findMany({
      where: {
        points: {
          gte: 0
        }
      },
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
      },
      take: 50
    });
    
    console.log('👥 Users and their ranks (checking for mismatches):');
    console.log('==================================================');
    
    let incorrectCount = 0;
    let totalCount = 0;
    
    usersToCheck.forEach(user => {
      const expectedRank = getExpectedRank(user.points);
      const isCorrect = user.rank?.title === expectedRank;
      totalCount++;
      
      if (!isCorrect) {
        incorrectCount++;
        console.log(`${user.username}: ${user.points} points`);
        console.log(`  Current Rank: ${user.rank?.title || 'No Rank'} (requires ${user.rank?.required_points || 0} points)`);
        console.log(`  Expected Rank: ${expectedRank}`);
        console.log(`  Status: ❌ Incorrect`);
        console.log('');
      }
    });
    
    console.log(`📊 Summary: ${incorrectCount} incorrect ranks out of ${totalCount} users checked`);
    
    if (incorrectCount === 0) {
      console.log('✅ All ranks appear to be correct!');
    } else {
      console.log(`❌ Found ${incorrectCount} users with incorrect ranks that need to be fixed.`);
    }
    
  } catch (error) {
    console.error('❌ Error checking ranks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function getExpectedRank(points) {
  if (points >= 24000) return 'Sapphire Diamond';
  else if (points >= 8000) return 'Diamond';
  else if (points >= 2000) return 'Sapphire Manager';
  else if (points >= 1000) return 'Manager';
  else return 'Consultant';
}

checkRanks();