const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNewRankLogic() {
  try {
    console.log('🧪 TESTING NEW RANK LOGIC');
    console.log('=========================\n');

    // Import the new rank logic functions
    const { 
      checkNewRankRequirements,
      getUserHighestQualifyingRank,
      getAllDownlineLines,
      checkDiamondRankRequirements,
      checkSapphireDiamondRankRequirements,
      checkAmbassadorRankRequirements,
      checkSapphireAmbassadorRankRequirements,
      checkRoyalAmbassadorRankRequirements,
      checkGlobalAmbassadorRankRequirements,
      checkHonoryShareHolderRankRequirements
    } = await import('../src/lib/newRankLogic.js');

    // Test with touseef231
    const testUsername = 'touseef231';
    console.log(`🎯 Testing with user: ${testUsername}\n`);

    // Get user details
    const user = await prisma.user.findUnique({
      where: { username: testUsername },
      include: { rank: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 USER DETAILS:');
    console.log('================');
    console.log(`Username: ${user.username}`);
    console.log(`Points: ${user.points.toLocaleString()}`);
    console.log(`Current Rank: ${user.rank?.title || 'No Rank'}`);
    console.log('');

    // Test Diamond rank requirements
    console.log('💎 TESTING DIAMOND RANK REQUIREMENTS:');
    console.log('====================================');
    const diamondResult = await checkDiamondRankRequirements(testUsername);
    console.log(`Qualifies: ${diamondResult.qualifies ? '✅ YES' : '❌ NO'}`);
    console.log(`Reason: ${diamondResult.reason}`);
    if (diamondResult.details) {
      console.log(`Details:`, diamondResult.details);
    }
    console.log('');

    // Test Sapphire Diamond rank requirements
    console.log('💎 TESTING SAPPHIRE DIAMOND RANK REQUIREMENTS:');
    console.log('============================================');
    const sapphireDiamondResult = await checkSapphireDiamondRankRequirements(testUsername);
    console.log(`Qualifies: ${sapphireDiamondResult.qualifies ? '✅ YES' : '❌ NO'}`);
    console.log(`Reason: ${sapphireDiamondResult.reason}`);
    if (sapphireDiamondResult.details) {
      console.log(`Details:`, sapphireDiamondResult.details);
    }
    console.log('');

    // Test Ambassador rank requirements
    console.log('🎖️ TESTING AMBASSADOR RANK REQUIREMENTS:');
    console.log('======================================');
    const ambassadorResult = await checkAmbassadorRankRequirements(testUsername);
    console.log(`Qualifies: ${ambassadorResult.qualifies ? '✅ YES' : '❌ NO'}`);
    console.log(`Reason: ${ambassadorResult.reason}`);
    if (ambassadorResult.details) {
      console.log(`Details:`, ambassadorResult.details);
    }
    console.log('');

    // Test Sapphire Ambassador rank requirements
    console.log('🎖️ TESTING SAPPHIRE AMBASSADOR RANK REQUIREMENTS:');
    console.log('===============================================');
    const sapphireAmbassadorResult = await checkSapphireAmbassadorRankRequirements(testUsername);
    console.log(`Qualifies: ${sapphireAmbassadorResult.qualifies ? '✅ YES' : '❌ NO'}`);
    console.log(`Reason: ${sapphireAmbassadorResult.reason}`);
    if (sapphireAmbassadorResult.details) {
      console.log(`Details:`, sapphireAmbassadorResult.details);
    }
    console.log('');

    // Test Royal Ambassador rank requirements
    console.log('👑 TESTING ROYAL AMBASSADOR RANK REQUIREMENTS:');
    console.log('============================================');
    const royalAmbassadorResult = await checkRoyalAmbassadorRankRequirements(testUsername);
    console.log(`Qualifies: ${royalAmbassadorResult.qualifies ? '✅ YES' : '❌ NO'}`);
    console.log(`Reason: ${royalAmbassadorResult.reason}`);
    if (royalAmbassadorResult.details) {
      console.log(`Details:`, royalAmbassadorResult.details);
    }
    console.log('');

    // Test Global Ambassador rank requirements
    console.log('🌍 TESTING GLOBAL AMBASSADOR RANK REQUIREMENTS:');
    console.log('=============================================');
    const globalAmbassadorResult = await checkGlobalAmbassadorRankRequirements(testUsername);
    console.log(`Qualifies: ${globalAmbassadorResult.qualifies ? '✅ YES' : '❌ NO'}`);
    console.log(`Reason: ${globalAmbassadorResult.reason}`);
    if (globalAmbassadorResult.details) {
      console.log(`Details:`, globalAmbassadorResult.details);
    }
    console.log('');

    // Test Honory Share Holder rank requirements
    console.log('💎 TESTING HONORY SHARE HOLDER RANK REQUIREMENTS:');
    console.log('================================================');
    const honoryShareHolderResult = await checkHonoryShareHolderRankRequirements(testUsername);
    console.log(`Qualifies: ${honoryShareHolderResult.qualifies ? '✅ YES' : '❌ NO'}`);
    console.log(`Reason: ${honoryShareHolderResult.reason}`);
    if (honoryShareHolderResult.details) {
      console.log(`Details:`, honoryShareHolderResult.details);
    }
    console.log('');

    // Test the main function to get highest qualifying rank
    console.log('🎯 TESTING HIGHEST QUALIFYING RANK:');
    console.log('==================================');
    const highestRankResult = await getUserHighestQualifyingRank(testUsername);
    console.log(`Highest Qualifying Rank: ${highestRankResult.rank || 'None'}`);
    console.log(`Reason: ${highestRankResult.reason}`);
    if (highestRankResult.details) {
      console.log(`Details:`, highestRankResult.details);
    }
    console.log('');

    // Test downline lines analysis
    console.log('🌳 TESTING DOWNLINE LINES ANALYSIS:');
    console.log('==================================');
    const lines = await getAllDownlineLines(testUsername);
    console.log(`Total Downline Lines: ${lines.length}`);
    
    if (lines.length > 0) {
      console.log(`\n📊 LINE ANALYSIS (first 5 lines):`);
      lines.slice(0, 5).forEach((line, index) => {
        console.log(`Line ${index + 1}: ${line.length} users`);
        const lineSummary = line.map(user => `${user.username}(${user.rank?.title || 'No Rank'})`).join(' -> ');
        console.log(`   ${lineSummary}`);
      });
      
      if (lines.length > 5) {
        console.log(`   ... and ${lines.length - 5} more lines`);
      }
    }
    console.log('');

    // Summary
    console.log('📋 SUMMARY:');
    console.log('===========');
    console.log(`Current Rank: ${user.rank?.title || 'No Rank'}`);
    console.log(`Highest Qualifying Rank: ${highestRankResult.rank || 'None'}`);
    
    if (highestRankResult.rank !== user.rank?.title) {
      console.log(`💡 ACTION NEEDED: User should be upgraded to ${highestRankResult.rank}`);
    } else {
      console.log(`✅ User has the correct rank`);
    }

  } catch (error) {
    console.error('❌ Error testing new rank logic:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
  } finally {
    await prisma.$disconnect();
  }
}

testNewRankLogic();
