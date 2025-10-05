const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugIndirectCommission() {
  try {
    console.log('🔍 DEBUGGING INDIRECT COMMISSION LOGIC');
    console.log('=====================================\n');

    const testUsername = 'ghulammurtaza';
    
    // Get the test user
    const newUser = await prisma.user.findUnique({
      where: { username: testUsername }
    });

    if (!newUser) {
      console.log(`❌ User ${testUsername} not found`);
      return;
    }

    console.log('📊 Test User Details:');
    console.log(`  Username: ${newUser.username}`);
    console.log(`  Referred By: ${newUser.referredBy}`);
    console.log('');

    if (!newUser.referredBy) {
      console.log('❌ No direct referrer - no indirect commissions possible');
      return;
    }

    const directReferrerUsername = newUser.referredBy;
    console.log(`📊 Direct Referrer: ${directReferrerUsername}`);
    
    // Get the direct referrer
    const directReferrer = await prisma.user.findUnique({
      where: { username: directReferrerUsername }
    });

    if (!directReferrer) {
      console.log('❌ Direct referrer not found');
      return;
    }

    console.log(`📊 Direct Referrer Details:`);
    console.log(`  Username: ${directReferrer.username}`);
    console.log(`  Referred By: ${directReferrer.referredBy}`);
    console.log('');

    // Now find the upline (excluding direct referrer)
    console.log('🌳 BUILDING UPLINE TREE (excluding direct referrer):');
    console.log('===================================================');
    
    const members = [];
    const processedUsers = new Set();
    let currentUsername = directReferrer.referredBy; // Start from direct referrer's referrer
    let level = 0;
    const maxLevels = 10;

    console.log(`Starting from: ${currentUsername || 'None'}`);

    while (currentUsername && level < maxLevels) {
      console.log(`\nLevel ${level}: Looking for ${currentUsername}`);
      
      const user = await prisma.user.findUnique({
        where: { username: currentUsername },
        include: { rank: true }
      });

      if (!user) {
        console.log(`❌ User ${currentUsername} not found`);
        break;
      }

      if (processedUsers.has(user.username)) {
        console.log(`⚠️ Circular reference detected for ${user.username}`);
        break;
      }

      console.log(`✅ Found: ${user.username}`);
      console.log(`   Referred By: ${user.referredBy}`);
      console.log(`   Rank: ${user.rank?.title || 'No Rank'}`);
      console.log(`   Points: ${user.points.toLocaleString()}`);
      
      members.push(user);
      processedUsers.add(user.username);
      currentUsername = user.referredBy;
      level++;
    }

    console.log(`\n📊 UPLINE MEMBERS FOUND: ${members.length}`);
    console.log('=====================================');
    
    if (members.length === 0) {
      console.log('❌ No upline members found');
      console.log('🔍 This means:');
      console.log('   - Direct referrer has no referrer');
      console.log('   - OR there\'s an issue with the tree building logic');
    } else {
      members.forEach((member, index) => {
        console.log(`${index + 1}. ${member.username}`);
        console.log(`   Rank: ${member.rank?.title || 'No Rank'}`);
        console.log(`   Points: ${member.points.toLocaleString()}`);
        console.log(`   Referred By: ${member.referredBy || 'Root User'}`);
      });
    }

    // Test the actual function from commissionSystem.js
    console.log('\n🧪 TESTING ACTUAL FUNCTION:');
    console.log('===========================');
    
    // Simulate the getTreeMembersExcludingDirectReferrerInTransaction function
    const allUsers = await prisma.user.findMany({
      include: { rank: true }
    });

    const userMap = new Map();
    allUsers.forEach(user => {
      userMap.set(user.username, user);
    });

    console.log(`📊 Total users in database: ${allUsers.length}`);

    const functionMembers = [];
    const functionProcessedUsers = new Set();
    let functionCurrentUsername = userMap.get(directReferrerUsername)?.referredBy;
    let functionLevel = 0;

    console.log(`🔍 Function starting from: ${functionCurrentUsername || 'None'}`);

    while (functionCurrentUsername && functionLevel < 10) {
      const user = userMap.get(functionCurrentUsername);
      if (!user || functionProcessedUsers.has(user.username)) {
        break;
      }
      
      console.log(`✅ Function found: ${user.username}`);
      functionMembers.push(user);
      functionProcessedUsers.add(user.username);
      functionCurrentUsername = user.referredBy;
      functionLevel++;
    }

    console.log(`📊 Function found ${functionMembers.length} members`);

    // Now test indirect commission distribution
    if (functionMembers.length > 0) {
      console.log('\n💰 INDIRECT COMMISSION DISTRIBUTION TEST:');
      console.log('=========================================');
      
      const ranks = await prisma.rank.findMany({
        orderBy: { required_points: 'asc' }
      });

      const rankHierarchy = ranks.map(rank => rank.title);
      const managerIndex = rankHierarchy.findIndex(rank => rank === 'Manager');

      console.log(`Rank hierarchy: ${rankHierarchy.join(' → ')}`);
      console.log(`Manager index: ${managerIndex}`);

      // Group members by rank
      const membersByRank = {};
      functionMembers.forEach(member => {
        const rankTitle = member.rank?.title || 'No Rank';
        if (!membersByRank[rankTitle]) {
          membersByRank[rankTitle] = [];
        }
        membersByRank[rankTitle].push(member);
      });

      console.log('\n📊 Members by rank:');
      Object.entries(membersByRank).forEach(([rank, members]) => {
        console.log(`  ${rank}: ${members.map(m => m.username).join(', ')}`);
      });

      const indirectCommission = 4900;
      console.log(`\n💰 Testing with ${indirectCommission} indirect commission:`);

      let accumulatedCommission = 0;
      let accumulatedRanks = [];

      for (let i = managerIndex; i < rankHierarchy.length; i++) {
        const currentRank = rankHierarchy[i];
        
        if (currentRank === 'Consultant') {
          continue;
        }

        const membersOfRank = membersByRank[currentRank] || [];
        
        if (membersOfRank.length > 0) {
          const firstMember = membersOfRank[0];
          const totalCommission = accumulatedCommission + indirectCommission;
          
          console.log(`✅ ${firstMember.username} (${currentRank}) → ${totalCommission} commission`);
          
          accumulatedCommission = 0;
          accumulatedRanks = [];
        } else {
          console.log(`❌ No ${currentRank} found → accumulating ${indirectCommission} commission`);
          accumulatedCommission += indirectCommission;
          accumulatedRanks.push(currentRank);
        }
      }

      if (accumulatedCommission > 0) {
        console.log(`⚠️  ${accumulatedCommission} commission accumulated from: ${accumulatedRanks.join(', ')}`);
      }
    }

  } catch (error) {
    console.error('❌ Error debugging indirect commission:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugIndirectCommission();
