const { PrismaClient } = require('@prisma/client');
const { calculateMLMCommissionsInTransaction } = require('../src/lib/commissionSystem.js');

const prisma = new PrismaClient();

async function testActualCommissionDistribution() {
  try {
    console.log('🧪 TESTING ACTUAL COMMISSION DISTRIBUTION');
    console.log('=========================================\n');

    // Find a user with a proper referral chain
    const testUser = await prisma.user.findFirst({
      where: {
        referredBy: { not: null },
        // Find a user whose referrer has a referrer
        user: {
          some: {
            referredBy: { not: null }
          }
        }
      },
      include: {
        rank: true
      }
    });

    if (!testUser) {
      console.log('❌ No suitable test user found');
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

    // Create a test package request
    const packageRequest = await prisma.packageRequest.create({
      data: {
        userId: testUser.id,
        packageId: testPackage.id,
        status: 'pending',
        amount: testPackage.package_amount
      }
    });

    console.log(`✅ Created test package request (ID: ${packageRequest.id})`);

    // Get initial balances and points
    const initialData = await getInitialData(testUser.username);
    console.log('\n📊 INITIAL DATA:');
    console.log('================');
    initialData.forEach(user => {
      console.log(`${user.username}:`);
      console.log(`  Balance: ${user.balance.toLocaleString()}`);
      console.log(`  Points: ${user.points.toLocaleString()}`);
      console.log(`  Rank: ${user.rank?.title || 'No Rank'}`);
    });

    // Execute the commission calculation
    console.log('\n🚀 EXECUTING COMMISSION CALCULATION...');
    console.log('=====================================');

    await prisma.$transaction(async (tx) => {
      await calculateMLMCommissionsInTransaction(packageRequest.id, tx);
    });

    console.log('✅ Commission calculation completed!');

    // Get final balances and points
    const finalData = await getFinalData(testUser.username);
    console.log('\n📊 FINAL DATA:');
    console.log('==============');
    finalData.forEach(user => {
      console.log(`${user.username}:`);
      console.log(`  Balance: ${user.balance.toLocaleString()}`);
      console.log(`  Points: ${user.points.toLocaleString()}`);
      console.log(`  Rank: ${user.rank?.title || 'No Rank'}`);
    });

    // Calculate differences
    console.log('\n💰 COMMISSION DISTRIBUTION RESULTS:');
    console.log('===================================');
    
    const differences = calculateDifferences(initialData, finalData);
    differences.forEach(diff => {
      if (diff.balanceDiff !== 0 || diff.pointsDiff !== 0 || diff.rankChanged) {
        console.log(`${diff.username}:`);
        if (diff.balanceDiff !== 0) {
          console.log(`  💰 Balance: ${diff.balanceDiff > 0 ? '+' : ''}${diff.balanceDiff.toLocaleString()}`);
        }
        if (diff.pointsDiff !== 0) {
          console.log(`  ⭐ Points: ${diff.pointsDiff > 0 ? '+' : ''}${diff.pointsDiff}`);
        }
        if (diff.rankChanged) {
          console.log(`  🏆 Rank: ${diff.initialRank} → ${diff.finalRank}`);
        }
      }
    });

    // Check earnings records
    console.log('\n📝 EARNINGS RECORDS CREATED:');
    console.log('============================');
    const earnings = await prisma.earnings.findMany({
      where: {
        packageRequestId: packageRequest.id
      },
      include: {
        user: {
          select: {
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    earnings.forEach(earning => {
      console.log(`${earning.user.username}: ${earning.amount.toLocaleString()} (${earning.type})`);
      console.log(`  Description: ${earning.description}`);
    });

    // Clean up
    await prisma.earnings.deleteMany({
      where: {
        packageRequestId: packageRequest.id
      }
    });

    await prisma.packageRequest.delete({
      where: { id: packageRequest.id }
    });

    console.log('\n🧹 Cleaned up test data');

  } catch (error) {
    console.error('❌ Error testing commission distribution:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function getInitialData(username) {
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
        balance: true,
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

  return users;
}

async function getFinalData(username) {
  // Get all users in the tree again to see updated values
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
        balance: true,
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

  return users;
}

function calculateDifferences(initial, final) {
  const differences = [];

  // Create maps for easier lookup
  const initialMap = new Map();
  const finalMap = new Map();

  initial.forEach(user => initialMap.set(user.username, user));
  final.forEach(user => finalMap.set(user.username, user));

  // Get all unique usernames
  const allUsernames = new Set([...initialMap.keys(), ...finalMap.keys()]);

  allUsernames.forEach(username => {
    const initialUser = initialMap.get(username);
    const finalUser = finalMap.get(username);

    if (initialUser && finalUser) {
      const balanceDiff = finalUser.balance - initialUser.balance;
      const pointsDiff = finalUser.points - initialUser.points;
      const rankChanged = initialUser.rank?.title !== finalUser.rank?.title;

      differences.push({
        username,
        balanceDiff,
        pointsDiff,
        rankChanged,
        initialRank: initialUser.rank?.title || 'No Rank',
        finalRank: finalUser.rank?.title || 'No Rank'
      });
    }
  });

  return differences;
}

testActualCommissionDistribution();
