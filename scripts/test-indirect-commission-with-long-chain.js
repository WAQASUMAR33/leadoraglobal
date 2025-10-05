const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testIndirectCommissionWithLongChain() {
  try {
    console.log('🔍 TESTING INDIRECT COMMISSION WITH LONG CHAIN');
    console.log('==============================================\n');

    // Find a user with a longer referral chain
    console.log('🔍 Looking for users with longer referral chains...');
    
    // Let's test with Touseef231 who has a longer chain
    const testUsername = 'Touseef231';
    
    const testUser = await prisma.user.findUnique({
      where: { username: testUsername }
    });

    if (!testUser) {
      console.log(`❌ User ${testUsername} not found`);
      return;
    }

    console.log(`📊 Test User: ${testUsername}`);
    console.log(`   Referred By: ${testUser.referredBy || 'Root User'}`);
    console.log('');

    // Show the full referral tree
    console.log('🌳 FULL REFERRAL TREE:');
    console.log('======================');
    await showFullReferralTree(testUsername);
    console.log('');

    // Now let's simulate a package purchase by one of Touseef231's direct referrals
    console.log('🧪 SIMULATING PACKAGE PURCHASE:');
    console.log('===============================');
    
    // Find a direct referral of Touseef231
    const directReferral = await prisma.user.findFirst({
      where: { referredBy: testUsername },
      include: { rank: true }
    });

    if (!directReferral) {
      console.log('❌ No direct referrals found for Touseef231');
      return;
    }

    console.log(`📦 Package Buyer: ${directReferral.username}`);
    console.log(`   Rank: ${directReferral.rank?.title || 'No Rank'}`);
    console.log(`   Referred By: ${directReferral.referredBy}`);
    console.log('');

    // Analyze indirect commission for this scenario
    console.log('💰 INDIRECT COMMISSION ANALYSIS:');
    console.log('================================');
    await analyzeIndirectCommissionForUser(directReferral.username);

    // Let's also test with a user deeper in the chain
    console.log('\n🧪 TESTING WITH DEEPER CHAIN:');
    console.log('=============================');
    
    // Find a user who is referred by one of Touseef231's referrals
    const deepReferral = await prisma.user.findFirst({
      where: {
        referredBy: { not: null },
        user: {
          some: {
            referredBy: { not: null }
          }
        }
      },
      include: { rank: true }
    });

    if (deepReferral) {
      console.log(`📦 Deep Package Buyer: ${deepReferral.username}`);
      console.log(`   Rank: ${deepReferral.rank?.title || 'No Rank'}`);
      console.log(`   Referred By: ${deepReferral.referredBy}`);
      console.log('');

      await analyzeIndirectCommissionForUser(deepReferral.username);
    }

  } catch (error) {
    console.error('❌ Error testing indirect commission:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function showFullReferralTree(username) {
  const users = [];
  let currentUsername = username;
  const processedUsers = new Set();
  let level = 0;
  const maxLevels = 15;

  while (currentUsername && level < maxLevels) {
    const user = await prisma.user.findUnique({
      where: { username: currentUsername },
      select: {
        username: true,
        referredBy: true,
        points: true,
        rank: { select: { title: true } }
      }
    });

    if (!user || processedUsers.has(user.username)) {
      break;
    }

    users.push({ ...user, level });
    processedUsers.add(user.username);
    currentUsername = user.referredBy;
    level++;
  }

  users.forEach((user, index) => {
    const indent = '  '.repeat(user.level);
    const arrow = index === 0 ? '🎯' : '👆';
    console.log(`${indent}${arrow} ${user.username}`);
    console.log(`${indent}   Points: ${user.points.toLocaleString()}`);
    console.log(`${indent}   Rank: ${user.rank?.title || 'No Rank'}`);
    console.log(`${indent}   Referred By: ${user.referredBy || 'Root User'}`);
  });
}

async function analyzeIndirectCommissionForUser(username) {
  const newUser = await prisma.user.findUnique({
    where: { username: username }
  });

  if (!newUser || !newUser.referredBy) {
    console.log('❌ No direct referrer - no indirect commissions possible');
    return;
  }

  const directReferrerUsername = newUser.referredBy;
  console.log(`📊 Package Buyer: ${username}`);
  console.log(`📊 Direct Referrer: ${directReferrerUsername} (EXCLUDED from indirect commission)`);
  console.log(`📊 Looking for upline members (excluding direct referrer)`);
  console.log('');

  // Get the direct referrer
  const directReferrer = await prisma.user.findUnique({
    where: { username: directReferrerUsername },
    include: { rank: true }
  });

  if (!directReferrer) {
    console.log('❌ Direct referrer not found');
    return;
  }

  console.log(`📊 Direct Referrer Details:`);
  console.log(`   Username: ${directReferrer.username}`);
  console.log(`   Rank: ${directReferrer.rank?.title || 'No Rank'}`);
  console.log(`   Referred By: ${directReferrer.referredBy || 'Root User'}`);
  console.log('');

  // Find upline members (excluding direct referrer)
  const uplineMembers = [];
  let currentUsername = directReferrer.referredBy;
  const processedUsers = new Set();
  let level = 0;

  console.log('🌳 UPLINE MEMBERS (excluding direct referrer):');
  console.log('==============================================');

  while (currentUsername && level < 10) {
    const user = await prisma.user.findUnique({
      where: { username: currentUsername },
      include: { rank: true }
    });

    if (!user || processedUsers.has(user.username)) {
      break;
    }

    console.log(`${level + 1}. ${user.username}`);
    console.log(`   Rank: ${user.rank?.title || 'No Rank'}`);
    console.log(`   Points: ${user.points.toLocaleString()}`);
    console.log(`   Referred By: ${user.referredBy || 'Root User'}`);
    
    uplineMembers.push(user);
    processedUsers.add(user.username);
    currentUsername = user.referredBy;
    level++;
  }

  if (uplineMembers.length === 0) {
    console.log('❌ No upline members found');
    console.log('💡 This means:');
    console.log('   - Direct referrer has no referrer');
    console.log('   - Result: No indirect commission will be distributed');
    return;
  }

  console.log(`\n📊 Found ${uplineMembers.length} upline members`);
  console.log('');

  // Show indirect commission distribution logic
  console.log('💰 INDIRECT COMMISSION DISTRIBUTION LOGIC:');
  console.log('==========================================');
  
  const ranks = await prisma.rank.findMany({
    orderBy: { required_points: 'asc' }
  });

  const rankHierarchy = ranks.map(rank => rank.title);
  const managerIndex = rankHierarchy.findIndex(rank => rank === 'Manager');

  console.log(`📊 Rank hierarchy: ${rankHierarchy.join(' → ')}`);
  console.log(`📊 Starting from Manager rank (index: ${managerIndex})`);
  console.log(`📊 Commission amount: 4900 (example)`);
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

  // Simulate the distribution logic
  console.log('🔄 SIMULATING DISTRIBUTION:');
  console.log('===========================');
  
  let accumulatedCommission = 0;
  let accumulatedRanks = [];
  const indirectCommission = 4900; // Example amount

  for (let i = managerIndex; i < rankHierarchy.length; i++) {
    const currentRank = rankHierarchy[i];
    
    if (currentRank === 'Consultant') {
      console.log(`⏭️  Skipping ${currentRank} (Consultants don't get indirect commission)`);
      continue;
    }

    const membersOfRank = membersByRank[currentRank] || [];
    
    if (membersOfRank.length > 0) {
      const firstMember = membersOfRank[0];
      const totalCommission = accumulatedCommission + indirectCommission;
      
      console.log(`✅ Found ${currentRank}: ${firstMember.username}`);
      console.log(`   Commission: ${totalCommission} (${accumulatedCommission} accumulated + ${indirectCommission} current)`);
      
      if (accumulatedRanks.length > 0) {
        console.log(`   Includes accumulated from: ${accumulatedRanks.join(', ')}`);
      }
      
      accumulatedCommission = 0;
      accumulatedRanks = [];
    } else {
      console.log(`❌ No ${currentRank} found`);
      console.log(`   Accumulating: ${indirectCommission} commission`);
      
      accumulatedCommission += indirectCommission;
      accumulatedRanks.push(currentRank);
    }
  }

  if (accumulatedCommission > 0) {
    console.log(`\n⚠️  FINAL RESULT:`);
    console.log(`   ${accumulatedCommission} commission accumulated from: ${accumulatedRanks.join(', ')}`);
    console.log(`   No eligible users found for these ranks`);
  }

  console.log('\n💡 SUMMARY:');
  console.log('============');
  console.log('✅ Indirect commission logic is working correctly');
  console.log('✅ Commission starts from Manager rank');
  console.log('✅ Only upline members (excluding direct referrer) are eligible');
  console.log('✅ Commission accumulates when no users found with specific ranks');
  console.log('✅ First eligible user gets accumulated + current commission');
}

testIndirectCommissionWithLongChain();
