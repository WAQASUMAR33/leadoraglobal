const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkFailedPackageRequests() {
  try {
    console.log('🔍 CHECKING FAILED PACKAGE REQUESTS');
    console.log('===================================\n');

    // Check all package requests with their status
    const allPackageRequests = await prisma.packageRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullname: true,
            status: true
          }
        },
        package: {
          select: {
            id: true,
            package_name: true,
            package_amount: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    console.log('📊 RECENT PACKAGE REQUESTS (Last 20):');
    console.log('=====================================');
    
    if (allPackageRequests.length === 0) {
      console.log('❌ No package requests found in the database.');
      return;
    }

    // Group by status
    const requestsByStatus = {};
    allPackageRequests.forEach(request => {
      const status = request.status;
      if (!requestsByStatus[status]) {
        requestsByStatus[status] = [];
      }
      requestsByStatus[status].push(request);
    });

    console.log('📈 PACKAGE REQUEST STATUS SUMMARY:');
    console.log('==================================');
    Object.entries(requestsByStatus).forEach(([status, requests]) => {
      console.log(`${status}: ${requests.length} request(s)`);
    });
    console.log('');

    // Show failed requests specifically
    const failedRequests = allPackageRequests.filter(req => req.status === 'failed' || req.status === 'rejected');
    
    if (failedRequests.length > 0) {
      console.log('❌ FAILED/REJECTED PACKAGE REQUESTS:');
      console.log('====================================');
      failedRequests.forEach((request, index) => {
        console.log(`${index + 1}. Request ID: ${request.id}`);
        console.log(`   User: ${request.user.username} (${request.user.fullname})`);
        console.log(`   Package: ${request.package.package_name}`);
        console.log(`   Amount: ${request.package.package_amount}`);
        console.log(`   Status: ${request.status}`);
        console.log(`   Created: ${request.createdAt.toISOString().split('T')[0]}`);
        console.log(`   Updated: ${request.updatedAt.toISOString().split('T')[0]}`);
        console.log('');
      });
    } else {
      console.log('✅ No failed/rejected package requests found.');
    }

    // Show pending requests
    const pendingRequests = allPackageRequests.filter(req => req.status === 'pending');
    
    if (pendingRequests.length > 0) {
      console.log('⏳ PENDING PACKAGE REQUESTS:');
      console.log('============================');
      pendingRequests.forEach((request, index) => {
        console.log(`${index + 1}. Request ID: ${request.id}`);
        console.log(`   User: ${request.user.username} (${request.user.fullname})`);
        console.log(`   Package: ${request.package.package_name}`);
        console.log(`   Amount: ${request.package.package_amount}`);
        console.log(`   Status: ${request.status}`);
        console.log(`   Created: ${request.createdAt.toISOString().split('T')[0]}`);
        console.log('');
      });
    }

    // Check for any specific issues
    console.log('🔍 CHECKING FOR COMMON ISSUES:');
    console.log('==============================');

    // Check for users with inactive status
    const inactiveUserRequests = allPackageRequests.filter(req => req.user.status !== 'active');
    if (inactiveUserRequests.length > 0) {
      console.log(`❌ ${inactiveUserRequests.length} requests from inactive users:`);
      inactiveUserRequests.forEach(req => {
        console.log(`   - ${req.user.username}: ${req.user.status} (Request ID: ${req.id})`);
      });
    }

    // Check for inactive packages
    const inactivePackageRequests = allPackageRequests.filter(req => req.package.status !== 'active');
    if (inactivePackageRequests.length > 0) {
      console.log(`❌ ${inactivePackageRequests.length} requests for inactive packages:`);
      inactivePackageRequests.forEach(req => {
        console.log(`   - ${req.user.username}: ${req.package.package_name} (${req.package.status}) (Request ID: ${req.id})`);
      });
    }

    // Check recent approved requests
    const recentApproved = allPackageRequests.filter(req => req.status === 'approved');
    if (recentApproved.length > 0) {
      console.log(`\n✅ RECENT APPROVED REQUESTS (${recentApproved.length}):`);
      console.log('==============================================');
      recentApproved.slice(0, 5).forEach((request, index) => {
        console.log(`${index + 1}. Request ID: ${request.id} - ${request.user.username} (${request.package.package_name})`);
        console.log(`   Approved: ${request.updatedAt.toISOString().split('T')[0]}`);
      });
    }

    // Check if there are any error logs or issues
    console.log('\n💡 TROUBLESHOOTING TIPS:');
    console.log('=========================');
    console.log('1. Check user status - must be "active"');
    console.log('2. Check package status - must be "active"');
    console.log('3. Check payment proof if required');
    console.log('4. Check admin approval workflow');
    console.log('5. Check for database connection issues');
    console.log('6. Check package approval logic');

  } catch (error) {
    console.error('❌ Error checking failed package requests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFailedPackageRequests();
