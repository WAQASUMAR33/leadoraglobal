const { PrismaClient } = require('@prisma/client');
const { calculateMLMCommissionsInTransaction } = require('../src/lib/commissionSystem.js');

const prisma = new PrismaClient();

async function testCommissionDistribution() {
  try {
    console.log('🧪 TESTING COMMISSION DISTRIBUTION LOGIC');
    console.log('=========================================\n');

    // 1. Find a recent package request to test with
    console.log('📦 Finding a recent package request...');
    
    const recentPackageRequest = await prisma.packageRequest.findFirst({
      where: {
        status: 'pending' // Find a pending request to test with
      },
      include: {
        user: {
          include: {
            rank: true
          }
        },
        package: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!recentPackageRequest) {
      console.log('❌ No pending package requests found');
      console.log('📦 Creating a test package request...');
      
      // Create a test package request
      const testUser = await prisma.user.findFirst({
        where: {
          referredBy: { not: null } // User with a referrer
        }
      });

      if (!testUser) {
        console.log('❌ No users with referrers found for testing');
        return;
      }

      const testPackage = await prisma.package.findFirst();
      
      if (!testPackage) {
        console.log('❌ No packages found for testing');
        return;
      }

      const testPackageRequest = await prisma.packageRequest.create({
        data: {
          userId: testUser.id,
          packageId: testPackage.id,
          status: 'pending',
          amount: testPackage.package_amount
        },
        include: {
          user: {
            include: {
              rank: true
            }
          },
          package: true
        }
      });

      console.log(`✅ Created test package request for ${testUser.username}`);
      console.log(`   Package: ${testPackage.package_name}`);
      console.log(`   Amount: ${testPackage.package_amount}`);
      console.log(`   Direct Commission: ${testPackage.package_direct_commission}`);
      console.log(`   Indirect Commission: ${testPackage.package_indirect_commission}`);
      console.log(`   Points: ${testPackage.package_points}`);
      console.log('');

      await testCommissionLogic(testPackageRequest);
      
      // Clean up test request
      await prisma.packageRequest.delete({
        where: { id: testPackageRequest.id }
      });
      console.log('🧹 Cleaned up test package request');
      
    } else {
      console.log(`✅ Found package request for ${recentPackageRequest.user.username}`);
      console.log(`   Package: ${recentPackageRequest.package.package_name}`);
      console.log(`   Amount: ${recentPackageRequest.package.package_amount}`);
      console.log(`   Direct Commission: ${recentPackageRequest.package.package_direct_commission}`);
      console.log(`   Indirect Commission: ${recentPackageRequest.package.package_indirect_commission}`);
      console.log(`   Points: ${recentPackageRequest.package.package_points}`);
      console.log('');
      
      await testCommissionLogic(recentPackageRequest);
    }

  } catch (error) {
    console.error('❌ Error testing commission distribution:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testCommissionLogic(packageRequest) {
  try {
    const { user, package: packageData } = packageRequest;
    
    console.log('🔍 ANALYZING COMMISSION DISTRIBUTION LOGIC');
    console.log('==========================================');
    console.log(`Package Buyer: ${user.username}`);
    console.log(`Direct Referrer: ${user.referredBy || 'None'}`);
    console.log(`Package Amount: ${packageData.package_amount}`);
    console.log(`Direct Commission: ${packageData.package_direct_commission}`);
    console.log(`Indirect Commission: ${packageData.package_indirect_commission}`);
    console.log(`Points: ${packageData.package_points}`);
    console.log('');

    // 1. Show the referral tree structure
    console.log('🌳 REFERRAL TREE STRUCTURE:');
    console.log('===========================');
    await showReferralTree(user.username);
    console.log('');

    // 2. Show who will get direct commission
    console.log('💰 DIRECT COMMISSION DISTRIBUTION:');
    console.log('==================================');
    if (user.referredBy) {
      const directReferrer = await prisma.user.findUnique({
        where: { username: user.referredBy },
        include: { rank: true }
      });
      
      if (directReferrer) {
        console.log(`✅ ${directReferrer.username} will receive direct commission`);
        console.log(`   Amount: ${packageData.package_direct_commission}`);
        console.log(`   Current Balance: ${directReferrer.balance}`);
        console.log(`   Current Rank: ${directReferrer.rank?.title || 'No Rank'}`);
      }
    } else {
      console.log('❌ No direct referrer - no direct commission will be given');
    }
    console.log('');

    // 3. Show who will get indirect commissions
    console.log('🔄 INDIRECT COMMISSION DISTRIBUTION:');
    console.log('====================================');
    await showIndirectCommissionDistribution(user.username, packageData.package_indirect_commission);
    console.log('');

    // 4. Show points distribution
    console.log('⭐ POINTS DISTRIBUTION:');
    console.log('======================');
    await showPointsDistribution(user.username, packageData.package_points);
    console.log('');

    // 5. Simulate the actual commission calculation (without executing)
    console.log('🧪 SIMULATION: Commission Calculation Process');
    console.log('=============================================');
    console.log('1. ✅ Points distributed to all upline users');
    console.log('2. ✅ Direct commission given to direct referrer');
    console.log('3. ✅ Indirect commissions distributed by rank hierarchy');
    console.log('4. ✅ All users\' ranks updated based on new points');
    console.log('5. ✅ Earnings records created for all transactions');
    console.log('');

  } catch (error) {
    console.error('❌ Error in commission logic test:', error);
  }
}

async function showReferralTree(username) {
  const usersToShow = [];
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

    usersToShow.push({ ...user, level });
    processedUsers.add(user.username);
    currentUsername = user.referredBy;
    level++;
  }

  usersToShow.forEach((user, index) => {
    const indent = '  '.repeat(user.level);
    const arrow = index === 0 ? '🎯' : '👆';
    console.log(`${indent}${arrow} ${user.username}`);
    console.log(`${indent}   Points: ${user.points.toLocaleString()}`);
    console.log(`${indent}   Rank: ${user.rank?.title || 'No Rank'}`);
    console.log(`${indent}   Referred By: ${user.referredBy || 'Root User'}`);
  });
}

async function showIndirectCommissionDistribution(username, indirectCommission) {
  // Get the new user to find their direct referrer
  const newUser = await prisma.user.findUnique({
    where: { username: username }
  });

  if (!newUser || !newUser.referredBy) {
    console.log('❌ No direct referrer - no indirect commissions will be given');
    return;
  }

  const directReferrerUsername = newUser.referredBy;
  
  // Get all ranks from database
  const ranks = await prisma.rank.findMany({
    orderBy: { required_points: 'asc' }
  });

  const rankHierarchy = ranks.map(rank => rank.title);
  const managerIndex = rankHierarchy.findIndex(rank => rank === 'Manager');

  if (managerIndex === -1) {
    console.log('❌ Manager rank not found');
    return;
  }

  // Get tree members excluding direct referrer
  const allUsers = await prisma.user.findMany({
    include: { rank: true }
  });

  const userMap = new Map();
  allUsers.forEach(user => {
    userMap.set(user.username, user);
  });

  const members = [];
  const processedUsers = new Set();
  let currentUsername = userMap.get(directReferrerUsername)?.referredBy;
  let level = 0;

  while (currentUsername && level < 10) {
    const user = userMap.get(currentUsername);
    if (!user || processedUsers.has(user.username)) {
      break;
    }
    members.push(user);
    processedUsers.add(user.username);
    currentUsername = user.referredBy;
    level++;
  }

  console.log(`📊 Found ${members.length} members in upline (excluding direct referrer)`);
  
  if (members.length === 0) {
    console.log('❌ No upline members found for indirect commission');
    return;
  }

  // Group by rank
  const membersByRank = {};
  members.forEach(member => {
    const rankTitle = member.rank?.title || 'No Rank';
    if (!membersByRank[rankTitle]) {
      membersByRank[rankTitle] = [];
    }
    membersByRank[rankTitle].push(member);
  });

  console.log('\n🎯 Indirect Commission Distribution Logic:');
  console.log('==========================================');
  
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
      const rankDescription = accumulatedRanks.length > 0 
        ? `${currentRank} (includes: ${accumulatedRanks.join(', ')})`
        : currentRank;
      
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

async function showPointsDistribution(username, points) {
  const usersToUpdate = [];
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

    usersToUpdate.push(user);
    processedUsers.add(user.username);
    currentUsername = user.referredBy;
    level++;
  }

  console.log(`📊 ${points} points will be distributed to ${usersToUpdate.length} users:`);
  
  usersToUpdate.forEach((user, index) => {
    const arrow = index === 0 ? '🎯' : '👆';
    console.log(`  ${arrow} ${user.username}: ${user.points.toLocaleString()} → ${(user.points + points).toLocaleString()} points`);
    console.log(`     Current Rank: ${user.rank?.title || 'No Rank'}`);
  });
}

testCommissionDistribution();
