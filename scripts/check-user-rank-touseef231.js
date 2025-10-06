const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserRankTouseef231() {
  try {
    console.log('🔍 CHECKING RANK FOR USER: touseef231');
    console.log('====================================\n');

    const user = await prisma.user.findUnique({
      where: { username: 'touseef231' },
      include: {
        rank: true,
        currentPackage: true
      }
    });

    if (!user) {
      console.log('❌ User "touseef231" not found in the database.');
      return;
    }

    console.log('👤 USER DETAILS:');
    console.log('================');
    console.log(`Username: ${user.username}`);
    console.log(`Full Name: ${user.fullname}`);
    console.log(`Email: ${user.email || 'Not provided'}`);
    console.log(`Status: ${user.status}`);
    console.log(`Balance: $${parseFloat(user.balance).toFixed(2)}`);
    console.log(`Points: ${user.points.toLocaleString()}`);
    console.log(`Referral Count: ${user.referralCount}`);
    console.log(`Total Earnings: $${parseFloat(user.totalEarnings).toFixed(2)}`);
    console.log(`Referred By: ${user.referredBy || 'No referrer'}`);
    console.log(`Joined: ${user.createdAt.toISOString().split('T')[0]}`);
    console.log('');

    console.log('📦 PACKAGE INFORMATION:');
    console.log('=======================');
    console.log(`Current Package: ${user.currentPackage?.package_name || 'No Package'}`);
    console.log(`Package Amount: $${user.currentPackage?.package_amount || '0'}`);
    console.log('');

    console.log('🏆 RANK INFORMATION:');
    console.log('====================');
    if (user.rank) {
      console.log(`Current Rank: ${user.rank.title}`);
      console.log(`Required Points: ${user.rank.required_points?.toLocaleString() || '0'}`);
      console.log(`Rank Details: ${user.rank.details || 'No additional details'}`);
      console.log('');
      
      // Check if user qualifies for higher rank
      const allRanks = await prisma.rank.findMany({
        orderBy: { required_points: 'asc' }
      });
      
      console.log('📈 RANK PROGRESSION ANALYSIS:');
      console.log('==============================');
      console.log(`Current Points: ${user.points.toLocaleString()}`);
      console.log(`Current Rank: ${user.rank.title} (requires ${user.rank.required_points?.toLocaleString() || 0} points)`);
      
      // Find next possible ranks
      const higherRanks = allRanks.filter(rank => 
        rank.required_points > user.points && 
        rank.required_points > (user.rank.required_points || 0)
      );
      
      if (higherRanks.length > 0) {
        console.log('\n🎯 NEXT AVAILABLE RANKS:');
        higherRanks.slice(0, 3).forEach((rank, index) => {
          const pointsNeeded = rank.required_points - user.points;
          console.log(`${index + 1}. ${rank.title}: ${rank.required_points.toLocaleString()} points (need ${pointsNeeded.toLocaleString()} more)`);
        });
      } else {
        console.log('\n🎉 CONGRATULATIONS! You have the highest rank possible based on your points!');
      }
      
      // Check if user should have a higher rank
      const shouldHaveRank = allRanks
        .filter(rank => rank.required_points <= user.points)
        .sort((a, b) => b.required_points - a.required_points)[0];
      
      if (shouldHaveRank && shouldHaveRank.title !== user.rank.title) {
        console.log(`\n⚠️  RANK MISMATCH DETECTED:`);
        console.log(`Current Rank: ${user.rank.title}`);
        console.log(`Should Have: ${shouldHaveRank.title} (based on ${user.points.toLocaleString()} points)`);
        console.log(`💡 This user may need a rank update.`);
      }
      
    } else {
      console.log('❌ No rank assigned to this user.');
      console.log('💡 This user may need a rank assignment.');
    }

    console.log('\n📊 REFERRAL STATISTICS:');
    console.log('========================');
    
    // Get direct referrals
    const directReferrals = await prisma.user.findMany({
      where: { referredBy: 'touseef231' },
      select: {
        username: true,
        fullname: true,
        points: true,
        rank: { select: { title: true } }
      }
    });
    
    console.log(`Direct Referrals: ${directReferrals.length}`);
    if (directReferrals.length > 0) {
      console.log('\n👥 DIRECT REFERRALS:');
      directReferrals.forEach((ref, index) => {
        console.log(`${index + 1}. ${ref.username} (${ref.fullname})`);
        console.log(`   Points: ${ref.points.toLocaleString()}`);
        console.log(`   Rank: ${ref.rank?.title || 'No Rank'}`);
      });
    }

    // Get total downline count
    const totalDownline = await prisma.user.count({
      where: {
        referredBy: {
          not: null
        }
      }
    });

    console.log(`\n📈 TOTAL DOWNLINE: ${totalDownline} users in system`);

  } catch (error) {
    console.error('❌ Error checking user rank:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRankTouseef231();
