const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testActualPackageApproval() {
  try {
    console.log('🧪 TESTING ACTUAL PACKAGE APPROVAL PROCESS');
    console.log('==========================================\n');

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
      console.log('💡 Let me check recent approved requests instead...\n');
      
      // Check the most recent approved request
      const recentApproved = await prisma.packageRequest.findFirst({
        where: { status: 'approved' },
        include: {
          user: {
            include: {
              rank: true
            }
          },
          package: true
        },
        orderBy: { updatedAt: 'desc' }
      });

      if (!recentApproved) {
        console.log('❌ No package requests found at all');
        return;
      }

      console.log('📦 RECENT APPROVED PACKAGE REQUEST:');
      console.log('===================================');
      console.log(`ID: ${recentApproved.id}`);
      console.log(`User: ${recentApproved.user.username}`);
      console.log(`Package: ${recentApproved.package.package_name}`);
      console.log(`Amount: ${recentApproved.package.package_amount}`);
      console.log(`Direct Commission: ${recentApproved.package.package_direct_commission}`);
      console.log(`Indirect Commission: ${recentApproved.package.package_indirect_commission}`);
      console.log(`Points: ${recentApproved.package.package_points}`);
      console.log(`Approved At: ${recentApproved.updatedAt}`);
      console.log('');

      // Check what commissions were actually distributed
      await checkCommissionDistribution(recentApproved.id, recentApproved.user.username);
      return;
    }

    console.log('📦 PENDING PACKAGE REQUEST FOUND:');
    console.log('=================================');
    console.log(`ID: ${pendingRequest.id}`);
    console.log(`User: ${pendingRequest.user.username}`);
    console.log(`Package: ${pendingRequest.package.package_name}`);
    console.log(`Amount: ${pendingRequest.package.package_amount}`);
    console.log(`Direct Commission: ${pendingRequest.package.package_direct_commission}`);
    console.log(`Indirect Commission: ${pendingRequest.package.package_indirect_commission}`);
    console.log(`Points: ${pendingRequest.package.package_points}`);
    console.log('');

    // Show the referral tree before approval
    console.log('🌳 REFERRAL TREE BEFORE APPROVAL:');
    console.log('=================================');
    await showReferralTree(pendingRequest.user.username);
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

    // Check what commissions were actually distributed
    await checkCommissionDistribution(pendingRequest.id, pendingRequest.user.username);

  } catch (error) {
    console.error('❌ Error testing package approval:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function checkCommissionDistribution(packageRequestId, buyerUsername) {
  console.log('💰 CHECKING COMMISSION DISTRIBUTION:');
  console.log('====================================');
  
  const buyer = await prisma.user.findUnique({
    where: { username: buyerUsername },
    select: {
      username: true,
      referredBy: true
    }
  });

  if (!buyer) {
    console.log('❌ Buyer not found');
    return;
  }

  console.log(`📊 Package Buyer: ${buyer.username}`);
  console.log(`📊 Direct Referrer: ${buyer.referredBy || 'None'}`);
  console.log('');

  // Check direct commission
  if (buyer.referredBy) {
    const directReferrerUser = await prisma.user.findUnique({
      where: { username: buyer.referredBy },
      select: { id: true, username: true }
    });

    if (directReferrerUser) {
      const directCommission = await prisma.earnings.findFirst({
        where: {
          userId: directReferrerUser.id,
          type: 'direct_commission',
          description: { contains: packageRequestId.toString() }
        },
        include: {
          user: { select: { username: true } }
        }
      });

      if (directCommission) {
        console.log('✅ Direct Commission Found:');
        console.log(`   Recipient: ${directCommission.user.username}`);
        console.log(`   Amount: ${directCommission.amount}`);
        console.log(`   Date: ${directCommission.createdAt}`);
      } else {
        console.log('❌ No Direct Commission Found');
      }
    }
  } else {
    console.log('❌ No Direct Referrer - No Direct Commission');
  }
  console.log('');

  // Check indirect commission
  const indirectCommissions = await prisma.earnings.findMany({
    where: {
      type: 'indirect_commission',
      description: { contains: packageRequestId.toString() }
    },
    include: {
      user: { select: { username: true } }
    }
  });

  if (indirectCommissions.length > 0) {
    console.log('✅ Indirect Commissions Found:');
    indirectCommissions.forEach((commission, index) => {
      console.log(`   ${index + 1}. ${commission.user.username}: ${commission.amount}`);
      console.log(`      Date: ${commission.createdAt}`);
      console.log(`      Description: ${commission.description}`);
    });
  } else {
    console.log('❌ No Indirect Commissions Found');
    console.log('💡 This indicates the indirect commission logic may not be working');
  }
  console.log('');

  // Check points distribution
  const pointsDistribution = await prisma.earnings.findMany({
    where: {
      type: 'points',
      description: { contains: packageRequestId.toString() }
    },
    include: {
      user: { select: { username: true } }
    }
  });

  if (pointsDistribution.length > 0) {
    console.log('✅ Points Distribution Found:');
    pointsDistribution.forEach((point, index) => {
      console.log(`   ${index + 1}. ${point.user.username}: ${point.amount} points`);
      console.log(`      Date: ${point.createdAt}`);
    });
  } else {
    console.log('❌ No Points Distribution Found');
  }
}

async function showReferralTree(username) {
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

testActualPackageApproval();
