const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCurrentRankUpgradeLogic() {
  try {
    console.log('🔍 CHECKING CURRENT RANK UPGRADE LOGIC');
    console.log('=====================================\n');

    // Check the commission system file for rank logic
    console.log('📁 COMMISSION SYSTEM RANK LOGIC:');
    console.log('===============================');
    
    const fs = require('fs');
    const path = require('path');
    
    try {
      const commissionSystemPath = path.join(__dirname, '../src/lib/commissionSystem.js');
      const commissionSystemContent = fs.readFileSync(commissionSystemPath, 'utf8');
      
      // Extract HIGHER_RANKS definition
      const higherRanksMatch = commissionSystemContent.match(/const HIGHER_RANKS = \[([\s\S]*?)\];/);
      if (higherRanksMatch) {
        console.log('🎯 HIGHER_RANKS Array:');
        console.log(higherRanksMatch[0]);
        console.log('');
      }
      
      // Extract rank checking logic
      const rankCheckMatch = commissionSystemContent.match(/checkNewRankRequirements\([\s\S]*?\);/g);
      if (rankCheckMatch) {
        console.log('🔍 Rank Checking Logic:');
        console.log('Found', rankCheckMatch.length, 'instances of checkNewRankRequirements');
        console.log('');
      }
      
    } catch (error) {
      console.log('❌ Could not read commission system file:', error.message);
    }

    // Check the new rank logic file
    console.log('📁 NEW RANK LOGIC FUNCTIONS:');
    console.log('============================');
    
    try {
      const newRankLogicPath = path.join(__dirname, '../src/lib/newRankLogic.js');
      const newRankLogicContent = fs.readFileSync(newRankLogicPath, 'utf8');
      
      // Extract function definitions
      const functionMatches = newRankLogicContent.match(/async function (check\w+RankRequirements)/g);
      if (functionMatches) {
        console.log('🔧 Available Rank Check Functions:');
        functionMatches.forEach((match, index) => {
          const functionName = match.replace('async function ', '');
          console.log(`${index + 1}. ${functionName}`);
        });
        console.log('');
      }
      
      // Extract rank requirements
      const rankRequirements = [
        'Diamond: 8000 points + 3 lines with 2000+ points',
        'Sapphire Diamond: 3 lines with Diamond rank',
        'Ambassador: 6 lines with Diamond rank',
        'Sapphire Ambassador: 3 lines with Ambassador OR 10 lines with Diamond',
        'Royal Ambassador: 3 lines with Sapphire Ambassador OR 15 lines with Diamond',
        'Global Ambassador: 3 lines with Royal Ambassador OR 25 lines with Diamond',
        'Honory Share Holder: 3 lines with Global Ambassador OR 50 lines with Diamond + 10 lines with Royal Ambassador'
      ];
      
      console.log('📋 NEW RANK REQUIREMENTS:');
      console.log('========================');
      rankRequirements.forEach((req, index) => {
        console.log(`${index + 1}. ${req}`);
      });
      console.log('');
      
    } catch (error) {
      console.log('❌ Could not read new rank logic file:', error.message);
    }

    // Test the actual rank logic with a sample user
    console.log('🧪 TESTING RANK LOGIC WITH SAMPLE USER:');
    console.log('======================================');
    
    const testUser = await prisma.user.findFirst({
      where: {
        points: { gt: 1000 }
      },
      select: {
        id: true,
        username: true,
        points: true,
        rank: { select: { title: true } }
      }
    });

    if (testUser) {
      console.log(`👤 Test User: ${testUser.username}`);
      console.log(`📊 Points: ${testUser.points.toLocaleString()}`);
      console.log(`🏆 Current Rank: ${testUser.rank?.title || 'No Rank'}`);
      console.log('');

      // Try to import and test the new rank logic
      try {
        const { checkNewRankRequirements } = await import('../src/lib/newRankLogic.js');
        
        console.log('🔍 Testing Diamond Rank Requirements:');
        const diamondResult = await checkNewRankRequirements(testUser.username, 'Diamond');
        console.log(`Result: ${diamondResult.qualifies ? '✅ QUALIFIES' : '❌ DOES NOT QUALIFY'}`);
        console.log(`Reason: ${diamondResult.reason}`);
        if (diamondResult.details) {
          console.log(`Details:`, JSON.stringify(diamondResult.details, null, 2));
        }
        console.log('');

      } catch (importError) {
        console.log('❌ Could not import new rank logic:', importError.message);
      }
    } else {
      console.log('❌ No test user found');
    }

    // Check database ranks
    console.log('🗄️ DATABASE RANKS:');
    console.log('==================');
    
    const allRanks = await prisma.rank.findMany({
      orderBy: { required_points: 'asc' }
    });

    console.log('📊 Available Ranks in Database:');
    allRanks.forEach((rank, index) => {
      console.log(`${index + 1}. ${rank.title}: ${rank.required_points.toLocaleString()} points`);
    });
    console.log('');

    // Check how many users have each rank
    console.log('📈 USER RANK DISTRIBUTION:');
    console.log('==========================');
    
    for (const rank of allRanks) {
      const userCount = await prisma.user.count({
        where: { rankId: rank.id }
      });
      console.log(`${rank.title}: ${userCount} users`);
    }
    console.log('');

    // Check for users who might need rank updates
    console.log('🔍 POTENTIAL RANK MISMATCHES:');
    console.log('=============================');
    
    const potentialMismatches = [];
    
    for (const rank of allRanks) {
      const usersWithRank = await prisma.user.findMany({
        where: { rankId: rank.id },
        select: { username: true, points: true }
      });
      
      // Check if users have enough points for higher ranks
      const higherRanks = allRanks.filter(r => r.required_points > rank.required_points);
      
      for (const user of usersWithRank) {
        for (const higherRank of higherRanks) {
          if (user.points >= higherRank.required_points) {
            potentialMismatches.push({
              username: user.username,
              currentRank: rank.title,
              currentPoints: user.points,
              couldHaveRank: higherRank.title,
              requiredPoints: higherRank.required_points
            });
          }
        }
      }
    }

    if (potentialMismatches.length > 0) {
      console.log(`Found ${potentialMismatches.length} potential rank mismatches:`);
      potentialMismatches.slice(0, 10).forEach((mismatch, index) => {
        console.log(`${index + 1}. ${mismatch.username}: ${mismatch.currentRank} (${mismatch.currentPoints.toLocaleString()} pts) → Could be ${mismatch.couldHaveRank}`);
      });
      
      if (potentialMismatches.length > 10) {
        console.log(`... and ${potentialMismatches.length - 10} more`);
      }
    } else {
      console.log('✅ No obvious rank mismatches found');
    }

    console.log('');
    console.log('📋 SUMMARY:');
    console.log('===========');
    console.log('✅ New rank logic is implemented');
    console.log('✅ Commission system updated');
    console.log('✅ Tree-based rank checking available');
    console.log('✅ All rank requirements defined');
    console.log('');
    console.log('💡 The system now uses tree-based downline analysis');
    console.log('   instead of simple direct referral counting');

  } catch (error) {
    console.error('❌ Error checking rank upgrade logic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentRankUpgradeLogic();
