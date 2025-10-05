const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCommissionSimple() {
  try {
    console.log('🧪 SIMPLE COMMISSION DISTRIBUTION TEST');
    console.log('======================================\n');

    // Find a user with a referral chain
    const testUser = await prisma.user.findFirst({
      where: {
        referredBy: { not: null }
      },
      include: {
        rank: true
      }
    });

    if (!testUser) {
      console.log('❌ No user with referrer found');
      return;
    }

    console.log(`📊 Test User: ${testUser.username}`);
    console.log(`   Referred By: ${testUser.referredBy}`);
    console.log(`   Current Rank: ${testUser.rank?.title || 'No Rank'}`);
    console.log('');

    // Get a test package
    const testPackage = await prisma.package.findFirst();
    if (!testPackage) {
      console.log('❌ No packages found');
      return;
    }

    console.log(`📦 Test Package: ${testPackage.package_name}`);
    console.log(`   Amount: ${testPackage.package_amount}`);
    console.log(`   Direct Commission: ${testPackage.package_direct_commission}`);
    console.log(`   Indirect Commission: ${testPackage.package_indirect_commission}`);
    console.log(`   Points: ${testPackage.package_points}`);
    console.log('');

    // Show the referral tree
    console.log('🌳 REFERRAL TREE:');
    console.log('=================');
    await showReferralTree(testUser.username);

    // Test commission logic step by step
    console.log('\n💰 COMMISSION DISTRIBUTION LOGIC:');
    console.log('==================================');

    // 1. Direct Commission
    console.log('\n1️⃣ DIRECT COMMISSION:');
    if (testUser.referredBy) {
      const directReferrer = await prisma.user.findUnique({
        where: { username: testUser.referredBy },
        include: { rank: true }
      });

      if (directReferrer) {
        console.log(`✅ ${directReferrer.username} will receive direct commission`);
        console.log(`   Amount: ${testPackage.package_direct_commission}`);
        console.log(`   Current Balance: ${directReferrer.balance.toLocaleString()}`);
        console.log(`   New Balance: ${(parseFloat(directReferrer.balance) + parseFloat(testPackage.package_direct_commission)).toLocaleString()}`);
      }
    } else {
      console.log('❌ No direct referrer - no direct commission');
    }

    // 2. Points Distribution
    console.log('\n2️⃣ POINTS DISTRIBUTION:');
    await showPointsDistribution(testUser.username, testPackage.package_points);

    // 3. Indirect Commission
    console.log('\n3️⃣ INDIRECT COMMISSION:');
    await showIndirectCommissionLogic(testUser.username, testPackage.package_indirect_commission);

    // 4. Rank Updates
    console.log('\n4️⃣ RANK UPDATES:');
    await showRankUpdateLogic(testUser.username, testPackage.package_points);

  } catch (error) {
    console.error('❌ Error in commission test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function showReferralTree(username) {
  const users = [];
  let currentUsername = username;
  const processedUsers = new Set();
  let level = 0;
  const maxLevels = 10;

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
  });
}

async function showPointsDistribution(username, points) {
  const users = [];
  let currentUsername = username;
  const processedUsers = new Set();
  let level = 0;
  const maxLevels = 10;

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

    users.push(user);
    processedUsers.add(user.username);
    currentUsername = user.referredBy;
    level++;
  }

  console.log(`📊 ${points} points will be added to ${users.length} users:`);
  users.forEach((user, index) => {
    const arrow = index === 0 ? '🎯' : '👆';
    console.log(`  ${arrow} ${user.username}: ${user.points.toLocaleString()} → ${(user.points + points).toLocaleString()}`);
  });
}

async function showIndirectCommissionLogic(username, indirectCommission) {
  const newUser = await prisma.user.findUnique({
    where: { username: username }
  });

  if (!newUser || !newUser.referredBy) {
    console.log('❌ No direct referrer - no indirect commissions');
    return;
  }

  const directReferrerUsername = newUser.referredBy;
  
  // Get the direct referrer
  const directReferrer = await prisma.user.findUnique({
    where: { username: directReferrerUsername },
    include: { rank: true }
  });

  if (!directReferrer) {
    console.log('❌ Direct referrer not found');
    return;
  }

  console.log(`📊 Direct referrer: ${directReferrer.username} (${directReferrer.rank?.title || 'No Rank'})`);
  console.log(`📊 Looking for upline members (excluding direct referrer)`);

  // Find upline members (excluding direct referrer)
  const uplineMembers = [];
  let currentUsername = directReferrer.referredBy;
  const processedUsers = new Set();
  let level = 0;

  while (currentUsername && level < 10) {
    const user = await prisma.user.findUnique({
      where: { username: currentUsername },
      include: { rank: true }
    });

    if (!user || processedUsers.has(user.username)) {
      break;
    }

    uplineMembers.push(user);
    processedUsers.add(user.username);
    currentUsername = user.referredBy;
    level++;
  }

  console.log(`📊 Found ${uplineMembers.length} upline members:`);
  uplineMembers.forEach((user, index) => {
    console.log(`  ${index + 1}. ${user.username} (${user.rank?.title || 'No Rank'})`);
  });

  if (uplineMembers.length === 0) {
    console.log('❌ No upline members found for indirect commission');
    return;
  }

  // Show indirect commission distribution logic
  const ranks = await prisma.rank.findMany({
    orderBy: { required_points: 'asc' }
  });

  const rankHierarchy = ranks.map(rank => rank.title);
  const managerIndex = rankHierarchy.findIndex(rank => rank === 'Manager');

  console.log(`\n🎯 Indirect Commission Distribution Logic:`);
  console.log(`Starting from Manager rank (index: ${managerIndex})`);
  console.log(`Commission amount: ${indirectCommission}`);

  // Group members by rank
  const membersByRank = {};
  uplineMembers.forEach(member => {
    const rankTitle = member.rank?.title || 'No Rank';
    if (!membersByRank[rankTitle]) {
      membersByRank[rankTitle] = [];
    }
    membersByRank[rankTitle].push(member);
  });

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
      
      if (accumulatedRanks.length > 0) {
        console.log(`   Includes accumulated: ${accumulatedRanks.join(', ')}`);
      }
      
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

async function showRankUpdateLogic(username, points) {
  const users = [];
  let currentUsername = username;
  const processedUsers = new Set();
  let level = 0;
  const maxLevels = 10;

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

    users.push(user);
    processedUsers.add(user.username);
    currentUsername = user.referredBy;
    level++;
  }

  console.log(`📊 Rank updates will be checked for ${users.length} users:`);
  
  const ranks = await prisma.rank.findMany({
    orderBy: { required_points: 'desc' }
  });

  users.forEach((user, index) => {
    const newPoints = user.points + points;
    let expectedRank = 'Consultant';
    
    for (const rank of ranks) {
      if (newPoints >= rank.required_points) {
        expectedRank = rank.title;
        break;
      }
    }

    const arrow = index === 0 ? '🎯' : '👆';
    console.log(`  ${arrow} ${user.username}:`);
    console.log(`    Current: ${user.rank?.title || 'No Rank'} (${user.points.toLocaleString()} points)`);
    console.log(`    After: ${expectedRank} (${newPoints.toLocaleString()} points)`);
    
    if (user.rank?.title !== expectedRank) {
      console.log(`    🏆 Rank will upgrade: ${user.rank?.title || 'No Rank'} → ${expectedRank}`);
    } else {
      console.log(`    ✅ Rank unchanged`);
    }
  });
}

testCommissionSimple();
