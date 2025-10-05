const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCompletePackageApproval() {
  try {
    console.log('🧪 COMPREHENSIVE PACKAGE APPROVAL TEST');
    console.log('=====================================\n');

    // Find a pending package request to test with
    const pendingRequest = await prisma.packageRequest.findFirst({
      where: { status: 'pending' },
      include: {
        user: {
          include: {
            rank: true
          }
        },
        package: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!pendingRequest) {
      console.log('❌ No pending package requests found');
      console.log('💡 Let me check recent approved requests to analyze what happened...\n');
      
      // Analyze the most recent approved request
      const recentApproved = await prisma.packageRequest.findFirst({
        where: { status: 'approved' },
        include: {
          user: {
            include: {
              rank: true
            }
          },
          package: true,
          earnings: {
            include: {
              user: { select: { username: true } }
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      if (!recentApproved) {
        console.log('❌ No package requests found at all');
        return;
      }

      console.log('📦 ANALYZING RECENT APPROVED PACKAGE REQUEST:');
      console.log('============================================');
      await analyzePackageRequest(recentApproved);
      return;
    }

    console.log('📦 FOUND PENDING PACKAGE REQUEST:');
    console.log('=================================');
    console.log(`ID: ${pendingRequest.id}`);
    console.log(`User: ${pendingRequest.user.username}`);
    console.log(`Package: ${pendingRequest.package.package_name}`);
    console.log(`Amount: ${pendingRequest.package.package_amount}`);
    console.log(`Direct Commission: ${pendingRequest.package.package_direct_commission}`);
    console.log(`Indirect Commission: ${pendingRequest.package.package_indirect_commission}`);
    console.log(`Points: ${pendingRequest.package.package_points}`);
    console.log('');

    // Show referral tree and current ranks before approval
    console.log('🌳 REFERRAL TREE BEFORE APPROVAL:');
    console.log('=================================');
    await showReferralTreeWithRanks(pendingRequest.user.username);
    console.log('');

    // Import the approval function
    const { approvePackageRequest } = await import('../src/lib/packageApproval.js');
    
    console.log('🚀 APPROVING PACKAGE REQUEST...');
    console.log('===============================');
    
    const approvalResult = await approvePackageRequest(pendingRequest.id);
    
    console.log('\n📊 APPROVAL RESULT:');
    console.log('===================');
    console.log(`Success: ${approvalResult.success}`);
    console.log(`Message: ${approvalResult.message}`);
    console.log(`User: ${approvalResult.user}`);
    console.log(`Package: ${approvalResult.package}`);
    console.log(`Amount: ${approvalResult.packageAmount}`);
    console.log('');

    // Wait a moment for database to update
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Analyze the results
    console.log('🔍 ANALYZING RESULTS AFTER APPROVAL:');
    console.log('====================================');
    await analyzePackageRequestAfterApproval(pendingRequest.id, pendingRequest.user.username);

  } catch (error) {
    console.error('❌ Error testing complete package approval:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function analyzePackageRequest(packageRequest) {
  console.log(`📦 Package Request ID: ${packageRequest.id}`);
  console.log(`📦 User: ${packageRequest.user.username}`);
  console.log(`📦 Package: ${packageRequest.package.package_name}`);
  console.log(`📦 Amount: ${packageRequest.package.package_amount}`);
  console.log(`📦 Direct Commission: ${packageRequest.package.package_direct_commission}`);
  console.log(`📦 Indirect Commission: ${packageRequest.package.package_indirect_commission}`);
  console.log(`📦 Points: ${packageRequest.package.package_points}`);
  console.log(`📦 Approved At: ${packageRequest.updatedAt}`);
  console.log('');

  // Show referral tree and ranks
  console.log('🌳 REFERRAL TREE:');
  console.log('=================');
  await showReferralTreeWithRanks(packageRequest.user.username);
  console.log('');

  // Check commissions
  console.log('💰 COMMISSION DISTRIBUTION:');
  console.log('===========================');
  
  if (packageRequest.earnings && packageRequest.earnings.length > 0) {
    console.log(`✅ Found ${packageRequest.earnings.length} commission records:`);
    packageRequest.earnings.forEach((earning, index) => {
      console.log(`   ${index + 1}. ${earning.user.username}: ${earning.amount} (${earning.type})`);
      console.log(`      Description: ${earning.description}`);
      console.log(`      Date: ${earning.createdAt}`);
    });
  } else {
    console.log('❌ No commission records found');
  }
  console.log('');

  // Check rank updates
  console.log('🏆 RANK UPDATES:');
  console.log('================');
  await checkRankUpdates(packageRequest.user.username);
}

async function analyzePackageRequestAfterApproval(packageRequestId, buyerUsername) {
  // Get updated package request with earnings
  const updatedRequest = await prisma.packageRequest.findUnique({
    where: { id: packageRequestId },
    include: {
      user: {
        include: {
          rank: true
        }
      },
      package: true,
      earnings: {
        include: {
          user: { select: { username: true } }
        }
      }
    }
  });

  if (!updatedRequest) {
    console.log('❌ Package request not found after approval');
    return;
  }

  console.log(`📦 Package Request Status: ${updatedRequest.status}`);
  console.log(`📦 Approved At: ${updatedRequest.updatedAt}`);
  console.log('');

  // Check commission distribution
  console.log('💰 COMMISSION DISTRIBUTION RESULTS:');
  console.log('===================================');
  
  if (updatedRequest.earnings && updatedRequest.earnings.length > 0) {
    console.log(`✅ Found ${updatedRequest.earnings.length} commission records:`);
    
    const directCommissions = updatedRequest.earnings.filter(e => e.type === 'direct_commission');
    const indirectCommissions = updatedRequest.earnings.filter(e => e.type === 'indirect_commission');
    const pointsRecords = updatedRequest.earnings.filter(e => e.type === 'points');

    if (directCommissions.length > 0) {
      console.log(`\n📊 Direct Commissions (${directCommissions.length}):`);
      directCommissions.forEach((earning, index) => {
        console.log(`   ${index + 1}. ${earning.user.username}: ${earning.amount}`);
        console.log(`      Description: ${earning.description}`);
      });
    } else {
      console.log('\n❌ No Direct Commissions Found');
    }

    if (indirectCommissions.length > 0) {
      console.log(`\n📊 Indirect Commissions (${indirectCommissions.length}):`);
      indirectCommissions.forEach((earning, index) => {
        console.log(`   ${index + 1}. ${earning.user.username}: ${earning.amount}`);
        console.log(`      Description: ${earning.description}`);
      });
    } else {
      console.log('\n❌ No Indirect Commissions Found');
      console.log('💡 This could mean:');
      console.log('   - No eligible upline members with Manager+ rank');
      console.log('   - Commission accumulated but not distributed');
      console.log('   - Direct referrer has no upline members');
    }

    if (pointsRecords.length > 0) {
      console.log(`\n📊 Points Distribution (${pointsRecords.length}):`);
      pointsRecords.forEach((earning, index) => {
        console.log(`   ${index + 1}. ${earning.user.username}: ${earning.amount} points`);
      });
    } else {
      console.log('\n❌ No Points Distribution Records Found');
    }
  } else {
    console.log('❌ No commission records found');
  }
  console.log('');

  // Check rank updates
  console.log('🏆 RANK UPDATES RESULTS:');
  console.log('========================');
  await checkRankUpdates(buyerUsername);
  console.log('');

  // Check upline rank updates
  console.log('👆 UPLINE RANK UPDATES:');
  console.log('========================');
  await checkUplineRankUpdates(buyerUsername);
}

async function showReferralTreeWithRanks(username) {
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
    const rankStatus = user.rank?.title ? `✅ ${user.rank.title}` : '❌ No Rank';
    console.log(`${indent}${arrow} ${user.username}`);
    console.log(`${indent}   Points: ${user.points.toLocaleString()}`);
    console.log(`${indent}   Rank: ${rankStatus}`);
    console.log(`${indent}   Referred By: ${user.referredBy || 'Root User'}`);
  });
}

async function checkRankUpdates(username) {
  const user = await prisma.user.findUnique({
    where: { username: username },
    include: {
      rank: true
    }
  });

  if (!user) {
    console.log(`❌ User ${username} not found`);
    return;
  }

  console.log(`📊 User: ${user.username}`);
  console.log(`📊 Points: ${user.points.toLocaleString()}`);
  console.log(`📊 Current Rank: ${user.rank?.title || 'No Rank'}`);
  
  // Check if rank matches points
  const ranks = await prisma.rank.findMany({
    orderBy: { required_points: 'desc' }
  });

  let expectedRank = 'Consultant';
  for (const rank of ranks) {
    if (user.points >= rank.required_points) {
      expectedRank = rank.title;
      break;
    }
  }

  if (user.rank?.title === expectedRank) {
    console.log(`✅ Rank is correct: ${expectedRank}`);
  } else {
    console.log(`❌ Rank mismatch! Current: ${user.rank?.title || 'No Rank'}, Expected: ${expectedRank}`);
  }
}

async function checkUplineRankUpdates(buyerUsername) {
  const buyer = await prisma.user.findUnique({
    where: { username: buyerUsername },
    select: { referredBy: true }
  });

  if (!buyer || !buyer.referredBy) {
    console.log('❌ No direct referrer - no upline to check');
    return;
  }

  // Get upline members (excluding direct referrer)
  const directReferrer = await prisma.user.findUnique({
    where: { username: buyer.referredBy },
    select: { referredBy: true }
  });

  if (!directReferrer || !directReferrer.referredBy) {
    console.log('❌ Direct referrer has no referrer - no upline to check');
    return;
  }

  const uplineMembers = [];
  let currentUsername = directReferrer.referredBy;
  let level = 0;

  while (currentUsername && level < 10) {
    const user = await prisma.user.findUnique({
      where: { username: currentUsername },
      include: { rank: true }
    });

    if (!user) break;

    uplineMembers.push(user);
    currentUsername = user.referredBy;
    level++;
  }

  if (uplineMembers.length === 0) {
    console.log('❌ No upline members found');
    return;
  }

  console.log(`📊 Found ${uplineMembers.length} upline members:`);
  uplineMembers.forEach((user, index) => {
    const rankStatus = user.rank?.title ? `✅ ${user.rank.title}` : '❌ No Rank';
    console.log(`   ${index + 1}. ${user.username}: ${user.points.toLocaleString()} points, ${rankStatus}`);
  });

  // Check if any upline members had rank updates
  const ranks = await prisma.rank.findMany({
    orderBy: { required_points: 'desc' }
  });

  console.log('\n🔍 Checking for rank mismatches in upline:');
  uplineMembers.forEach((user, index) => {
    let expectedRank = 'Consultant';
    for (const rank of ranks) {
      if (user.points >= rank.required_points) {
        expectedRank = rank.title;
        break;
      }
    }

    if (user.rank?.title === expectedRank) {
      console.log(`   ✅ ${user.username}: Rank correct (${expectedRank})`);
    } else {
      console.log(`   ❌ ${user.username}: Rank mismatch! Current: ${user.rank?.title || 'No Rank'}, Expected: ${expectedRank}`);
    }
  });
}

testCompletePackageApproval();
