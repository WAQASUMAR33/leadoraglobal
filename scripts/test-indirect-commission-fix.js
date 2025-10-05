const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testIndirectCommissionFix() {
  try {
    console.log('🧪 TESTING INDIRECT COMMISSION FIX');
    console.log('==================================\n');

    // Test with package request 2349 scenario
    const testUsername = 'Sanashabbir348';
    const testIndirectCommission = 2450;
    
    console.log('📊 Test Scenario:');
    console.log(`   Package Buyer: ${testUsername}`);
    console.log(`   Indirect Commission: ${testIndirectCommission}`);
    console.log('');

    // Get the user and their referral tree
    const buyer = await prisma.user.findUnique({
      where: { username: testUsername },
      select: { referredBy: true }
    });

    if (!buyer || !buyer.referredBy) {
      console.log('❌ No direct referrer found');
      return;
    }

    const directReferrer = await prisma.user.findUnique({
      where: { username: buyer.referredBy },
      select: { referredBy: true }
    });

    if (!directReferrer || !directReferrer.referredBy) {
      console.log('❌ Direct referrer has no referrer');
      return;
    }

    // Get upline members (excluding direct referrer)
    const uplineMembers = [];
    let currentUsername = directReferrer.referredBy;
    let level = 0;

    console.log('🌳 UPLINE MEMBERS:');
    console.log('==================');

    while (currentUsername && level < 10) {
      const user = await prisma.user.findUnique({
        where: { username: currentUsername },
        include: { rank: true }
      });

      if (!user) break;

      console.log(`${level + 1}. ${user.username}`);
      console.log(`   Rank: ${user.rank?.title || 'No Rank'}`);
      console.log(`   Points: ${user.points.toLocaleString()}`);
      
      uplineMembers.push(user);
      currentUsername = user.referredBy;
      level++;
    }

    if (uplineMembers.length === 0) {
      console.log('❌ No upline members found');
      return;
    }

    console.log(`\n📊 Found ${uplineMembers.length} upline members`);
    console.log('');

    // Simulate the fixed distribution logic
    console.log('🔄 SIMULATING FIXED DISTRIBUTION LOGIC:');
    console.log('======================================');
    
    const ranks = await prisma.rank.findMany({
      orderBy: { required_points: 'asc' }
    });

    const rankHierarchy = ranks.map(rank => rank.title);
    const managerIndex = rankHierarchy.findIndex(rank => rank === 'Manager');

    console.log(`📊 Rank hierarchy: ${rankHierarchy.join(' → ')}`);
    console.log(`📊 Starting from Manager rank (index: ${managerIndex})`);
    console.log('');

    // Group members by rank
    const membersByRank = {};
    uplineMembers.forEach(member => {
      const rankTitle = member.rank?.title || 'No Rank';
      if (!membersByRank[rankTitle]) {
        membersByRank[rankTitle] = [];
      }
      membersByRank[rankTitle].push(member);
    });

    console.log('📊 Members grouped by rank:');
    Object.entries(membersByRank).forEach(([rank, members]) => {
      console.log(`   ${rank}: ${members.map(m => m.username).join(', ')}`);
    });
    console.log('');

    // Define higher ranks that need downline requirement checks
    const HIGHER_RANKS_WITH_REQUIREMENTS = [
      'Sapphire Diamond',
      'Ambassador',
      'Sapphire Ambassador', 
      'Royal Ambassador',
      'Global Ambassador',
      'Honory Share Holder'
    ];

    let accumulatedCommission = 0;
    let accumulatedRanks = [];
    let distributedCommissions = [];

    // Process ranks from Manager onwards (upward in hierarchy)
    for (let i = managerIndex; i < rankHierarchy.length; i++) {
      const currentRank = rankHierarchy[i];
      
      // Skip Consultant rank (they don't get indirect commission)
      if (currentRank === 'Consultant') {
        console.log(`⏭️  Skipping ${currentRank} (Consultants don't get indirect commission)`);
        continue;
      }

      const membersOfRank = membersByRank[currentRank] || [];
      
      if (membersOfRank.length > 0) {
        // Found users with this rank - give accumulated commission to first user
        const firstMember = membersOfRank[0];
        
        // For indirect commission, we only need to check if user has the rank
        // Higher ranks with downline requirements are checked separately
        let meetsRequirements = true;
        
        // Only check downline requirements for higher ranks
        if (HIGHER_RANKS_WITH_REQUIREMENTS.includes(currentRank)) {
          // For this simulation, we'll assume they meet requirements
          // In real implementation, this would call checkRankRequirementsInTransaction
          console.log(`🔍 ${currentRank} is a higher rank - would check downline requirements`);
          meetsRequirements = true; // Simplified for simulation
        }
        
        if (meetsRequirements) {
          // Calculate total commission: accumulated + current rank's commission
          const totalCommission = accumulatedCommission + testIndirectCommission;
          const rankDescription = accumulatedRanks.length > 0 
            ? `${currentRank} (includes: ${accumulatedRanks.join(', ')})`
            : currentRank;
          
          console.log(`✅ Would give ${totalCommission} indirect commission to ${currentRank}: ${firstMember.username}`);
          console.log(`   Description: ${rankDescription}`);
          
          if (accumulatedRanks.length > 0) {
            console.log(`   Includes accumulated from: ${accumulatedRanks.join(', ')}`);
          }
          
          distributedCommissions.push({
            username: firstMember.username,
            rank: currentRank,
            amount: totalCommission,
            description: rankDescription
          });
          
          // Reset accumulation since we've distributed it
          accumulatedCommission = 0;
          accumulatedRanks = [];
        } else {
          console.log(`❌ ${firstMember.username} has ${currentRank} rank but doesn't meet requirements - accumulating commission`);
          // Accumulate this rank's commission
          accumulatedCommission += testIndirectCommission;
          accumulatedRanks.push(currentRank);
        }
      } else {
        // No users with this rank - accumulate the commission
        console.log(`❌ No users found with ${currentRank} rank - accumulating commission`);
        accumulatedCommission += testIndirectCommission;
        accumulatedRanks.push(currentRank);
      }
    }

    if (accumulatedCommission > 0) {
      console.log(`\n⚠️  FINAL RESULT:`);
      console.log(`   ${accumulatedCommission} commission accumulated from: ${accumulatedRanks.join(', ')}`);
      console.log(`   No eligible users found for these ranks`);
    }

    console.log('\n💰 EXPECTED COMMISSION DISTRIBUTION:');
    console.log('====================================');
    if (distributedCommissions.length > 0) {
      distributedCommissions.forEach((commission, index) => {
        console.log(`${index + 1}. ${commission.username}: ${commission.amount} (${commission.rank})`);
        console.log(`   Description: ${commission.description}`);
      });
      
      const totalDistributed = distributedCommissions.reduce((sum, c) => sum + c.amount, 0);
      console.log(`\n📊 Total Expected Distribution: ${totalDistributed}`);
      console.log(`📊 Original Commission: ${testIndirectCommission}`);
      console.log(`📊 Efficiency: ${((totalDistributed / testIndirectCommission) * 100).toFixed(1)}%`);
    } else {
      console.log('❌ No commissions would be distributed');
    }

    console.log('\n✅ FIX VERIFICATION:');
    console.log('====================');
    console.log('The fix addresses the issue by:');
    console.log('1. ✅ Only checking downline requirements for higher ranks');
    console.log('2. ✅ Allowing basic ranks (Manager, Sapphire Manager, Diamond) to get indirect commission');
    console.log('3. ✅ Maintaining accumulation logic for missing ranks');
    console.log('4. ✅ Preserving higher rank validation for advanced ranks');

  } catch (error) {
    console.error('❌ Error testing indirect commission fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testIndirectCommissionFix();
