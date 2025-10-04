const { PrismaClient } = require('@prisma/client');
const { updateUserRank } = require('../src/lib/rankUtils.js');

const prisma = new PrismaClient();

async function testHigherRankLogic() {
  try {
    console.log('🧪 TESTING HIGHER RANK LOGIC');
    console.log('============================\n');

    // Test with Touseef231 (highest points user)
    const testUsername = 'Touseef231';
    
    console.log(`🎯 Testing with user: ${testUsername}\n`);

    // Get user details before update
    const userBefore = await prisma.user.findUnique({
      where: { username: testUsername },
      select: {
        id: true,
        username: true,
        points: true,
        rank: {
          select: { title: true }
        }
      }
    });

    if (!userBefore) {
      console.log(`❌ User ${testUsername} not found`);
      return;
    }

    console.log('📊 User details BEFORE rank update:');
    console.log(`  Username: ${userBefore.username}`);
    console.log(`  Points: ${userBefore.points.toLocaleString()}`);
    console.log(`  Current Rank: ${userBefore.rank?.title || 'No Rank'}`);
    console.log('');

    // Get direct referrals to show downline structure
    const directReferrals = await prisma.user.findMany({
      where: { referredBy: testUsername },
      select: {
        username: true,
        points: true,
        rank: {
          select: { title: true }
        }
      },
      orderBy: { points: 'desc' }
    });

    console.log('👥 Direct referrals structure:');
    if (directReferrals.length > 0) {
      directReferrals.forEach((referral, index) => {
        console.log(`  ${index + 1}. ${referral.username}`);
        console.log(`     Points: ${referral.points.toLocaleString()}`);
        console.log(`     Rank: ${referral.rank?.title || 'No Rank'}`);
      });
    } else {
      console.log('  No direct referrals found');
    }
    console.log('');

    // Count direct referrals by rank
    let directDiamonds = 0;
    let directSapphireManagers = 0;
    let directSapphireDiamonds = 0;

    directReferrals.forEach(referral => {
      if (referral.rank?.title === 'Diamond') {
        directDiamonds++;
      } else if (referral.rank?.title === 'Sapphire Manager') {
        directSapphireManagers++;
      } else if (referral.rank?.title === 'Sapphire Diamond') {
        directSapphireDiamonds++;
      }
    });

    console.log('📈 Direct referral rank counts:');
    console.log(`  Diamonds: ${directDiamonds}`);
    console.log(`  Sapphire Managers: ${directSapphireManagers}`);
    console.log(`  Sapphire Diamonds: ${directSapphireDiamonds}`);
    console.log('');

    // Test rank requirements for each higher rank
    console.log('🔍 Testing rank requirements:');
    console.log('=============================');
    
    const rankRequirements = {
      'Sapphire Diamond': { requiredDirectDiamonds: 2, requiredDirectSapphireManagers: 1 },
      'Ambassador': { requiredDirectDiamonds: 3, requiredDirectSapphireDiamonds: 1 },
      'Sapphire Ambassador': { requiredDirectDiamonds: 5, requiredDirectSapphireDiamonds: 2 },
      'Royal Ambassador': { requiredDirectDiamonds: 8, requiredDirectSapphireDiamonds: 3 },
      'Global Ambassador': { requiredDirectDiamonds: 12, requiredDirectSapphireDiamonds: 5 },
      'Honory Share Holder': { requiredDirectDiamonds: 20, requiredDirectSapphireDiamonds: 8 }
    };

    for (const [rankTitle, requirements] of Object.entries(rankRequirements)) {
      const hasPoints = userBefore.points >= getRequiredPoints(rankTitle);
      const meetsDiamondReq = directDiamonds >= requirements.requiredDirectDiamonds;
      const meetsSapphireManagerReq = directSapphireManagers >= (requirements.requiredDirectSapphireManagers || 0);
      const meetsSapphireDiamondReq = directSapphireDiamonds >= (requirements.requiredDirectSapphireDiamonds || 0);
      
      const qualifies = hasPoints && meetsDiamondReq && meetsSapphireManagerReq && meetsSapphireDiamondReq;
      
      console.log(`\n${rankTitle}:`);
      console.log(`  ✅ Points: ${userBefore.points.toLocaleString()} >= ${getRequiredPoints(rankTitle).toLocaleString()} (${hasPoints ? 'YES' : 'NO'})`);
      console.log(`  ✅ Diamonds: ${directDiamonds}/${requirements.requiredDirectDiamonds} (${meetsDiamondReq ? 'YES' : 'NO'})`);
      if (requirements.requiredDirectSapphireManagers) {
        console.log(`  ✅ Sapphire Managers: ${directSapphireManagers}/${requirements.requiredDirectSapphireManagers} (${meetsSapphireManagerReq ? 'YES' : 'NO'})`);
      }
      if (requirements.requiredDirectSapphireDiamonds) {
        console.log(`  ✅ Sapphire Diamonds: ${directSapphireDiamonds}/${requirements.requiredDirectSapphireDiamonds} (${meetsSapphireDiamondReq ? 'YES' : 'NO'})`);
      }
      console.log(`  🎯 Qualifies: ${qualifies ? 'YES' : 'NO'}`);
    }
    console.log('');

    // Now test the actual rank update function
    console.log('🚀 Running rank update function...');
    console.log('===================================');
    
    const newRank = await updateUserRank(userBefore.id);
    
    console.log(`\n📊 Result: ${newRank}`);
    console.log('');

    // Get user details after update
    const userAfter = await prisma.user.findUnique({
      where: { username: testUsername },
      select: {
        id: true,
        username: true,
        points: true,
        rank: {
          select: { title: true }
        }
      }
    });

    console.log('📊 User details AFTER rank update:');
    console.log(`  Username: ${userAfter.username}`);
    console.log(`  Points: ${userAfter.points.toLocaleString()}`);
    console.log(`  Current Rank: ${userAfter.rank?.title || 'No Rank'}`);
    
    if (userBefore.rank?.title !== userAfter.rank?.title) {
      console.log(`\n🎉 Rank changed: ${userBefore.rank?.title || 'No Rank'} → ${userAfter.rank?.title || 'No Rank'}`);
    } else {
      console.log(`\nℹ️ Rank unchanged: ${userAfter.rank?.title || 'No Rank'}`);
    }

  } catch (error) {
    console.error('❌ Error testing higher rank logic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function getRequiredPoints(rankTitle) {
  const pointRequirements = {
    'Sapphire Diamond': 24000,
    'Ambassador': 50000,
    'Sapphire Ambassador': 100000,
    'Royal Ambassador': 200000,
    'Global Ambassador': 500000,
    'Honory Share Holder': 1000000
  };
  return pointRequirements[rankTitle] || 0;
}

testHigherRankLogic();

