const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function getAmbassadorUsernames() {
  try {
    console.log('🔍 Searching for users with Ambassador rank...\n');

    // First, get the Ambassador rank ID
    const ambassadorRank = await prisma.rank.findFirst({
      where: {
        title: 'Ambassador'
      },
      select: {
        id: true,
        title: true,
        required_points: true
      }
    });

    if (!ambassadorRank) {
      console.log('❌ Ambassador rank not found in database');
      return;
    }

    console.log(`📊 Ambassador Rank Details:`);
    console.log(`   ID: ${ambassadorRank.id}`);
    console.log(`   Title: ${ambassadorRank.title}`);
    console.log(`   Required Points: ${ambassadorRank.required_points}\n`);

    // Get all users with Ambassador rank
    const ambassadorUsers = await prisma.user.findMany({
      where: {
        rankId: ambassadorRank.id
      },
      select: {
        id: true,
        username: true,
        fullname: true,
        points: true,
        referralCount: true,
        createdAt: true,
        rank: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        points: 'desc'
      }
    });

    console.log(`🎯 Found ${ambassadorUsers.length} users with Ambassador rank:\n`);

    if (ambassadorUsers.length === 0) {
      console.log('❌ No users currently have Ambassador rank');
      return;
    }

    // Display results in a formatted table
    console.log('┌──────┬─────────────────────┬─────────────────────┬──────────┬─────────────┬─────────────────────┐');
    console.log('│  ID  │      Username       │        Name         │  Points  │ Referrals   │    Created Date     │');
    console.log('├──────┼─────────────────────┼─────────────────────┼──────────┼─────────────┼─────────────────────┤');

    ambassadorUsers.forEach((user, index) => {
      const name = user.fullname || 'N/A';
      const createdDate = user.createdAt ? user.createdAt.toLocaleDateString() : 'N/A';
      
      console.log(`│ ${String(user.id).padStart(4)} │ ${user.username.padEnd(19)} │ ${name.padEnd(19)} │ ${String(user.points).padStart(8)} │ ${String(user.referralCount).padStart(11)} │ ${createdDate.padEnd(19)} │`);
    });

    console.log('└──────┴─────────────────────┴─────────────────────┴──────────┴─────────────┴─────────────────────┘\n');

    // Summary statistics
    const totalPoints = ambassadorUsers.reduce((sum, user) => sum + user.points, 0);
    const totalReferrals = ambassadorUsers.reduce((sum, user) => sum + user.referralCount, 0);
    const avgPoints = Math.round(totalPoints / ambassadorUsers.length);
    const avgReferrals = Math.round(totalReferrals / ambassadorUsers.length);

    console.log('📈 Ambassador Rank Summary:');
    console.log(`   Total Ambassadors: ${ambassadorUsers.length}`);
    console.log(`   Total Points: ${totalPoints.toLocaleString()}`);
    console.log(`   Total Referrals: ${totalReferrals.toLocaleString()}`);
    console.log(`   Average Points: ${avgPoints.toLocaleString()}`);
    console.log(`   Average Referrals: ${avgReferrals.toLocaleString()}\n`);

    // List just the usernames for easy copy
    console.log('📝 Ambassador Usernames (for easy copy):');
    console.log('─────────────────────────────────────────');
    ambassadorUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username}`);
    });

    // Also check for users who might qualify for Ambassador but don't have the rank assigned
    console.log('\n🔍 Checking for users who might qualify for Ambassador rank but aren\'t assigned...\n');
    
    const potentialAmbassadors = await prisma.user.findMany({
      where: {
        points: {
          gte: ambassadorRank.required_points
        },
        OR: [
          { rankId: null },
          { 
            rank: {
              title: {
                not: 'Ambassador'
              }
            }
          }
        ]
      },
      select: {
        username: true,
        points: true,
        rank: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        points: 'desc'
      }
    });

    if (potentialAmbassadors.length > 0) {
      console.log(`⚠️  Found ${potentialAmbassadors.length} users with ${ambassadorRank.required_points}+ points who don't have Ambassador rank:`);
      potentialAmbassadors.slice(0, 10).forEach((user, index) => {
        const currentRank = user.rank?.title || 'No Rank';
        console.log(`   ${index + 1}. ${user.username} - ${user.points.toLocaleString()} points (Current: ${currentRank})`);
      });
      
      if (potentialAmbassadors.length > 10) {
        console.log(`   ... and ${potentialAmbassadors.length - 10} more`);
      }
      
      console.log('\n💡 These users might need rank updates or may not meet the new downline requirements.');
    } else {
      console.log('✅ All users with sufficient points have appropriate ranks assigned.');
    }

  } catch (error) {
    console.error('❌ Error fetching Ambassador usernames:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getAmbassadorUsernames();
