const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeFailedRequest2355() {
  try {
    console.log('🔍 ANALYZING FAILED PACKAGE REQUEST 2355');
    console.log('========================================\n');

    // Get detailed information about the failed request
    const failedRequest = await prisma.packageRequest.findUnique({
      where: { id: 2355 },
      include: {
        user: {
          include: {
            rank: true,
            currentPackage: true
          }
        },
        package: true
      }
    });

    if (!failedRequest) {
      console.log('❌ Package request 2355 not found.');
      return;
    }

    console.log('📦 FAILED PACKAGE REQUEST DETAILS:');
    console.log('==================================');
    console.log(`ID: ${failedRequest.id}`);
    console.log(`Status: ${failedRequest.status}`);
    console.log(`Created At: ${failedRequest.createdAt}`);
    console.log(`Updated At: ${failedRequest.updatedAt}`);
    console.log('');

    console.log('👤 USER DETAILS:');
    console.log('================');
    console.log(`Username: ${failedRequest.user.username}`);
    console.log(`Full Name: ${failedRequest.user.fullname}`);
    console.log(`Email: ${failedRequest.user.email || 'Not provided'}`);
    console.log(`Status: ${failedRequest.user.status}`);
    console.log(`Balance: $${parseFloat(failedRequest.user.balance).toFixed(2)}`);
    console.log(`Points: ${failedRequest.user.points.toLocaleString()}`);
    console.log(`Current Rank: ${failedRequest.user.rank?.title || 'No Rank'}`);
    console.log(`Current Package: ${failedRequest.user.currentPackage?.package_name || 'No Package'}`);
    console.log(`Referred By: ${failedRequest.user.referredBy || 'No referrer'}`);
    console.log('');

    console.log('📦 REQUESTED PACKAGE DETAILS:');
    console.log('=============================');
    console.log(`Package Name: ${failedRequest.package.package_name}`);
    console.log(`Package Amount: $${failedRequest.package.package_amount}`);
    console.log(`Package Status: ${failedRequest.package.status}`);
    console.log(`Direct Commission: $${failedRequest.package.package_direct_commission}`);
    console.log(`Indirect Commission: $${failedRequest.package.package_indirect_commission}`);
    console.log(`Package Points: ${failedRequest.package.package_points}`);
    console.log('');

    // Check if there are any earnings records for this request
    console.log('💰 COMMISSION RECORDS:');
    console.log('======================');
    const earnings = await prisma.earnings.findMany({
      where: {
        packageRequestId: 2355
      },
      include: {
        user: { select: { username: true } }
      }
    });

    if (earnings.length > 0) {
      console.log(`✅ Found ${earnings.length} commission records:`);
      earnings.forEach((earning, index) => {
        console.log(`${index + 1}. ${earning.user.username}: $${earning.amount} (${earning.type})`);
        console.log(`   Description: ${earning.description}`);
        console.log(`   Date: ${earning.createdAt}`);
      });
    } else {
      console.log('❌ No commission records found for this request.');
      console.log('💡 This suggests the approval process failed before commission distribution.');
    }
    console.log('');

    // Check for potential issues
    console.log('🔍 POTENTIAL ISSUES ANALYSIS:');
    console.log('=============================');

    const issues = [];

    // Check user status
    if (failedRequest.user.status !== 'active') {
      issues.push(`❌ User status is "${failedRequest.user.status}" (should be "active")`);
    } else {
      console.log('✅ User status is active');
    }

    // Check package status
    if (failedRequest.package.status !== 'active') {
      issues.push(`❌ Package status is "${failedRequest.package.status}" (should be "active")`);
    } else {
      console.log('✅ Package status is active');
    }

    // Check if user has existing package
    if (failedRequest.user.currentPackageId) {
      console.log(`ℹ️ User already has a package: ${failedRequest.user.currentPackage?.package_name}`);
    } else {
      console.log('✅ User has no existing package');
    }

    // Check user's referral chain
    if (!failedRequest.user.referredBy) {
      issues.push('❌ User has no referrer (may cause commission distribution issues)');
    } else {
      console.log(`✅ User has referrer: ${failedRequest.user.referredBy}`);
    }

    if (issues.length > 0) {
      console.log('\n🚨 IDENTIFIED ISSUES:');
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    } else {
      console.log('\n✅ No obvious issues found with user or package.');
      console.log('💡 The failure might be due to:');
      console.log('   - Payment verification issues');
      console.log('   - Admin rejection');
      console.log('   - System error during approval process');
      console.log('   - Database transaction failure');
    }

    // Check if we can manually approve this request
    console.log('\n🔧 MANUAL APPROVAL TEST:');
    console.log('=========================');
    console.log('Attempting to manually approve this request...');

    try {
      // Import the approval function
      const { approvePackageRequest } = await import('../src/lib/packageApproval.js');
      
      console.log('🚀 Running package approval...');
      const result = await approvePackageRequest(2355);
      
      console.log('\n📊 APPROVAL RESULT:');
      console.log(`Success: ${result.success}`);
      console.log(`Message: ${result.message}`);
      
      if (result.success) {
        console.log('✅ Package request successfully approved!');
      } else {
        console.log('❌ Package approval failed again.');
      }
      
    } catch (approvalError) {
      console.log('❌ Error during manual approval:');
      console.log(`   ${approvalError.message}`);
    }

  } catch (error) {
    console.error('❌ Error analyzing failed request 2355:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeFailedRequest2355();
