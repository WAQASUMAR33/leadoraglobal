const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeAllRankCriteria() {
  try {
    console.log('🏆 COMPLETE RANK UPGRADE CRITERIA ANALYSIS');
    console.log('==========================================\n');

    // Get all ranks from database
    const allRanks = await prisma.rank.findMany({
      orderBy: { required_points: 'asc' }
    });

    console.log('📊 ALL RANKS IN SYSTEM:');
    console.log('========================');
    allRanks.forEach((rank, index) => {
      console.log(`${index + 1}. ${rank.title}`);
      console.log(`   Required Points: ${rank.required_points.toLocaleString()}`);
      console.log(`   Details: ${rank.details || 'No additional details'}`);
      console.log('');
    });

    // Define the higher rank logic from the system
    console.log('🎯 HIGHER RANK LOGIC (Points + Downline Requirements):');
    console.log('=====================================================');

    const HIGHER_RANKS = [
      'Sapphire Diamond',
      'Ambassador', 
      'Sapphire Ambassador',
      'Royal Ambassador',
      'Global Ambassador',
      'Honory Share Holder'
    ];

    const RANK_REQUIREMENTS = {
      'Sapphire Diamond': { 
        requiredDirectDiamonds: 2, 
        requiredDirectSapphireManagers: 1 
      },
      'Ambassador': { 
        requiredDirectDiamonds: 3, 
        requiredDirectSapphireDiamonds: 1 
      },
      'Sapphire Ambassador': { 
        requiredDirectDiamonds: 5, 
        requiredDirectSapphireDiamonds: 2 
      },
      'Royal Ambassador': { 
        requiredDirectDiamonds: 8, 
        requiredDirectSapphireDiamonds: 3 
      },
      'Global Ambassador': { 
        requiredDirectDiamonds: 12, 
        requiredDirectSapphireDiamonds: 5 
      },
      'Honory Share Holder': { 
        requiredDirectDiamonds: 20, 
        requiredDirectSapphireDiamonds: 8 
      }
    };

    console.log('📋 RANK UPGRADE CRITERIA BREAKDOWN:');
    console.log('===================================\n');

    allRanks.forEach((rank, index) => {
      console.log(`${index + 1}. ${rank.title.toUpperCase()}`);
      console.log('─'.repeat(50));
      
      // Basic requirement (points)
      console.log(`📈 POINTS REQUIREMENT:`);
      console.log(`   Minimum Points: ${rank.required_points.toLocaleString()}`);
      
      // Check if this is a higher rank with downline requirements
      if (HIGHER_RANKS.includes(rank.title)) {
        const requirements = RANK_REQUIREMENTS[rank.title];
        console.log(`\n👥 DOWNLINE REQUIREMENTS:`);
        
        if (requirements.requiredDirectDiamonds) {
          console.log(`   Direct Diamond Referrals: ${requirements.requiredDirectDiamonds} or more`);
        }
        if (requirements.requiredDirectSapphireManagers) {
          console.log(`   Direct Sapphire Manager Referrals: ${requirements.requiredDirectSapphireManagers} or more`);
        }
        if (requirements.requiredDirectSapphireDiamonds) {
          console.log(`   Direct Sapphire Diamond Referrals: ${requirements.requiredDirectSapphireDiamonds} or more`);
        }
        
        console.log(`\n✅ UPGRADE CONDITIONS:`);
        console.log(`   ✓ Must have ${rank.required_points.toLocaleString()} points`);
        console.log(`   ✓ Must meet ALL downline requirements above`);
        console.log(`   ✓ Both conditions must be satisfied simultaneously`);
      } else {
        console.log(`\n✅ UPGRADE CONDITIONS:`);
        console.log(`   ✓ Must have ${rank.required_points.toLocaleString()} points`);
        console.log(`   ✓ No downline requirements (basic rank)`);
      }
      
      console.log('');
    });

    // Analyze specific user (touseef231) against all criteria
    console.log('🔍 ANALYZING TOUSEEF231 AGAINST ALL RANK CRITERIA:');
    console.log('================================================\n');

    const user = await prisma.user.findUnique({
      where: { username: 'touseef231' },
      include: {
        rank: true
      }
    });

    if (user) {
      console.log(`👤 USER: ${user.username} (${user.fullname})`);
      console.log(`📊 Current Points: ${user.points.toLocaleString()}`);
      console.log(`🏆 Current Rank: ${user.rank?.title || 'No Rank'}`);
      console.log(`👥 Direct Referrals: Checking...`);
      console.log('');

      // Get direct referrals with their ranks
      const directReferrals = await prisma.user.findMany({
        where: { referredBy: 'touseef231' },
        include: { rank: true }
      });

      // Count direct referrals by rank
      const rankCounts = {};
      directReferrals.forEach(ref => {
        const rankTitle = ref.rank?.title || 'No Rank';
        rankCounts[rankTitle] = (rankCounts[rankTitle] || 0) + 1;
      });

      console.log('📊 DIRECT REFERRAL BREAKDOWN:');
      console.log('=============================');
      Object.entries(rankCounts).forEach(([rank, count]) => {
        console.log(`${rank}: ${count} referral(s)`);
      });
      console.log('');

      // Check qualification for each rank
      console.log('🎯 RANK QUALIFICATION ANALYSIS:');
      console.log('===============================');

      allRanks.forEach((rank, index) => {
        const hasRequiredPoints = user.points >= rank.required_points;
        let meetsDownlineRequirements = true;
        let downlineDetails = '';

        if (HIGHER_RANKS.includes(rank.title)) {
          const requirements = RANK_REQUIREMENTS[rank.title];
          const directDiamonds = rankCounts['Diamond'] || 0;
          const directSapphireManagers = rankCounts['Sapphire Manager'] || 0;
          const directSapphireDiamonds = rankCounts['Sapphire Diamond'] || 0;

          const meetsDiamonds = directDiamonds >= (requirements.requiredDirectDiamonds || 0);
          const meetsSapphireManagers = directSapphireManagers >= (requirements.requiredDirectSapphireManagers || 0);
          const meetsSapphireDiamonds = directSapphireDiamonds >= (requirements.requiredDirectSapphireDiamonds || 0);

          meetsDownlineRequirements = meetsDiamonds && meetsSapphireManagers && meetsSapphireDiamonds;
          
          downlineDetails = `Diamonds: ${directDiamonds}/${requirements.requiredDirectDiamonds || 0}, ` +
                          `Sapphire Managers: ${directSapphireManagers}/${requirements.requiredDirectSapphireManagers || 0}, ` +
                          `Sapphire Diamonds: ${directSapphireDiamonds}/${requirements.requiredDirectSapphireDiamonds || 0}`;
        }

        const qualifies = hasRequiredPoints && meetsDownlineRequirements;
        const status = qualifies ? '✅ QUALIFIES' : '❌ DOES NOT QUALIFY';
        const currentRank = user.rank?.title === rank.title ? ' (CURRENT)' : '';

        console.log(`${index + 1}. ${rank.title}${currentRank}`);
        console.log(`   Status: ${status}`);
        console.log(`   Points: ${user.points.toLocaleString()}/${rank.required_points.toLocaleString()} ${hasRequiredPoints ? '✅' : '❌'}`);
        
        if (HIGHER_RANKS.includes(rank.title)) {
          console.log(`   Downline: ${downlineDetails} ${meetsDownlineRequirements ? '✅' : '❌'}`);
        }
        
        console.log('');
      });

      // Find the highest rank this user qualifies for
      const qualifyingRanks = allRanks.filter(rank => {
        const hasRequiredPoints = user.points >= rank.required_points;
        let meetsDownlineRequirements = true;

        if (HIGHER_RANKS.includes(rank.title)) {
          const requirements = RANK_REQUIREMENTS[rank.title];
          const directDiamonds = rankCounts['Diamond'] || 0;
          const directSapphireManagers = rankCounts['Sapphire Manager'] || 0;
          const directSapphireDiamonds = rankCounts['Sapphire Diamond'] || 0;

          const meetsDiamonds = directDiamonds >= (requirements.requiredDirectDiamonds || 0);
          const meetsSapphireManagers = directSapphireManagers >= (requirements.requiredDirectSapphireManagers || 0);
          const meetsSapphireDiamonds = directSapphireDiamonds >= (requirements.requiredDirectSapphireDiamonds || 0);

          meetsDownlineRequirements = meetsDiamonds && meetsSapphireManagers && meetsSapphireDiamonds;
        }

        return hasRequiredPoints && meetsDownlineRequirements;
      });

      const highestQualifyingRank = qualifyingRanks[qualifyingRanks.length - 1];

      console.log('🎯 FINAL RECOMMENDATION:');
      console.log('========================');
      console.log(`Current Rank: ${user.rank?.title || 'No Rank'}`);
      console.log(`Highest Qualifying Rank: ${highestQualifyingRank?.title || 'None'}`);
      
      if (highestQualifyingRank && highestQualifyingRank.title !== user.rank?.title) {
        console.log(`💡 ACTION NEEDED: Upgrade to ${highestQualifyingRank.title}`);
      } else {
        console.log(`✅ User already has the correct rank`);
      }

    } else {
      console.log('❌ User touseef231 not found');
    }

    // Summary of all criteria
    console.log('\n📋 SUMMARY OF RANK UPGRADE LOGIC:');
    console.log('==================================');
    console.log('1. BASIC RANKS (Consultant, Manager, Sapphire Manager, Diamond):');
    console.log('   ✓ Only require minimum points');
    console.log('   ✓ No downline requirements');
    console.log('');
    console.log('2. HIGHER RANKS (Sapphire Diamond and above):');
    console.log('   ✓ Must have minimum points');
    console.log('   ✓ Must meet specific downline requirements');
    console.log('   ✓ Both conditions must be satisfied');
    console.log('');
    console.log('3. RANK HIERARCHY (Lowest to Highest):');
    allRanks.forEach((rank, index) => {
      console.log(`   ${index + 1}. ${rank.title} (${rank.required_points.toLocaleString()} points)`);
    });

  } catch (error) {
    console.error('❌ Error analyzing rank criteria:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeAllRankCriteria();
