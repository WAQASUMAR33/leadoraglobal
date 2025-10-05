const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeIndirectCommissionLogic() {
  try {
    console.log('🔍 ANALYZING INDIRECT COMMISSION LOGIC');
    console.log('=====================================\n');

    // 1. Show the current indirect commission logic
    console.log('📋 CURRENT INDIRECT COMMISSION LOGIC:');
    console.log('====================================');
    console.log('1. Get all ranks from database (ordered by required_points ASC)');
    console.log('2. Find Manager rank index (starting point)');
    console.log('3. Get tree members (excluding direct referrer)');
    console.log('4. Group members by rank');
    console.log('5. Process ranks from Manager onwards:');
    console.log('   - If users found with rank: give commission to first user');
    console.log('   - If no users with rank: accumulate commission');
    console.log('   - Check rank requirements for higher ranks');
    console.log('6. Continue until all ranks processed');
    console.log('');

    // 2. Show the rank hierarchy
    console.log('🏆 RANK HIERARCHY (from database):');
    console.log('=================================');
    const ranks = await prisma.rank.findMany({
      orderBy: { required_points: 'asc' }
    });

    ranks.forEach((rank, index) => {
      const marker = rank.title === 'Manager' ? '🎯' : '  ';
      console.log(`${marker}${index}. ${rank.title} (${rank.required_points.toLocaleString()} points)`);
    });

    const managerIndex = ranks.findIndex(rank => rank.title === 'Manager');
    console.log(`\n✅ Manager rank index: ${managerIndex}`);
    console.log('');

    // 3. Test with a real scenario
    console.log('🧪 TESTING WITH REAL SCENARIO:');
    console.log('==============================');
    
    // Find a user with a longer referral chain
    const testUser = await prisma.user.findFirst({
      where: {
        referredBy: { not: null }
      }
    });

    if (!testUser) {
      console.log('❌ No test user found');
      return;
    }

    console.log(`📊 Test User: ${testUser.username}`);
    console.log(`   Referred By: ${testUser.referredBy}`);
    console.log('');

    // Show the full referral tree
    console.log('🌳 FULL REFERRAL TREE:');
    console.log('======================');
    await showFullReferralTree(testUser.username);
    console.log('');

    // Show who gets indirect commission
    console.log('💰 INDIRECT COMMISSION ANALYSIS:');
    console.log('================================');
    await analyzeIndirectCommissionForUser(testUser.username);

  } catch (error) {
    console.error('❌ Error analyzing indirect commission logic:', error);
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
    console.log('   - OR there\'s an issue with the tree building logic');
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

  console.log('\n💡 KEY INSIGHTS:');
  console.log('================');
  console.log('1. Indirect commission starts from Manager rank');
  console.log('2. Only upline members (excluding direct referrer) are eligible');
  console.log('3. Commission goes to first user found with each rank');
  console.log('4. If no users with a rank, commission accumulates');
  console.log('5. Higher ranks get accumulated + current commission');
  console.log('6. Consultant rank is skipped (no indirect commission)');
}

analyzeIndirectCommissionLogic();
