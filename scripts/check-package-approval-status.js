const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function checkPackageApprovalStatus() {
  try {
    console.log('🔍 Checking package approval function status...\n');

    // Check recent package requests
    const recentRequests = await prisma.packageRequest.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        packageId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            username: true,
            fullname: true
          }
        },
        package: {
          select: {
            package_name: true,
            package_amount: true
          }
        }
      }
    });

    console.log('📊 Recent Package Requests (Last 10):');
    console.log('═'.repeat(100));
    console.log('│  ID  │ Username        │ Package              │ Status    │ Created Date        │ Updated Date        │');
    console.log('├──────┼─────────────────┼──────────────────────┼───────────┼─────────────────────┼─────────────────────┤');

    recentRequests.forEach(request => {
      const createdDate = request.createdAt ? request.createdAt.toLocaleString() : 'N/A';
      const updatedDate = request.updatedAt ? request.updatedAt.toLocaleString() : 'N/A';
      const status = request.status || 'pending';
      
      console.log(`│ ${String(request.id).padStart(4)} │ ${(request.user?.username || 'N/A').padEnd(15)} │ ${(request.package?.package_name || 'N/A').padEnd(20)} │ ${status.padEnd(9)} │ ${createdDate.padEnd(19)} │ ${updatedDate.padEnd(19)} │`);
    });

    console.log('└──────┴─────────────────┴──────────────────────┴───────────┴─────────────────────┴─────────────────────┘\n');

    // Check status distribution
    const statusCounts = await prisma.packageRequest.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    console.log('📈 Package Request Status Distribution:');
    console.log('─'.repeat(40));
    statusCounts.forEach(status => {
      console.log(`${status.status || 'NULL'}: ${status._count.id} requests`);
    });

    // Check for pending requests
    const pendingRequests = await prisma.packageRequest.findMany({
      where: { status: 'pending' },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            username: true,
            fullname: true
          }
        },
        package: {
          select: {
            package_name: true
          }
        },
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log('\n⏳ Recent Pending Requests (Last 5):');
    console.log('─'.repeat(60));
    if (pendingRequests.length === 0) {
      console.log('✅ No pending requests found');
    } else {
      pendingRequests.forEach((request, index) => {
        const createdDate = request.createdAt ? request.createdAt.toLocaleString() : 'N/A';
        console.log(`${index + 1}. ID: ${request.id} - ${request.user?.username || 'N/A'} - ${request.package?.package_name || 'N/A'} - Created: ${createdDate}`);
      });
    }

    // Check for failed requests
    const failedRequests = await prisma.packageRequest.findMany({
      where: { status: 'failed' },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            username: true,
            fullname: true
          }
        },
        package: {
          select: {
            package_name: true
          }
        },
        createdAt: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    console.log('\n❌ Recent Failed Requests (Last 5):');
    console.log('─'.repeat(60));
    if (failedRequests.length === 0) {
      console.log('✅ No failed requests found');
    } else {
      failedRequests.forEach((request, index) => {
        const createdDate = request.createdAt ? request.createdAt.toLocaleString() : 'N/A';
        const updatedDate = request.updatedAt ? request.updatedAt.toLocaleString() : 'N/A';
        console.log(`${index + 1}. ID: ${request.id} - ${request.user?.username || 'N/A'} - ${request.package?.package_name || 'N/A'} - Created: ${createdDate} - Updated: ${updatedDate}`);
      });
    }

    // Check for approved requests with earnings
    const recentApproved = await prisma.packageRequest.findMany({
      where: { status: 'approved' },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            username: true,
            fullname: true
          }
        },
        package: {
          select: {
            package_name: true
          }
        },
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    console.log('\n✅ Recent Approved Requests (Last 5):');
    console.log('─'.repeat(60));
    if (recentApproved.length === 0) {
      console.log('❌ No approved requests found');
    } else {
      recentApproved.forEach((request, index) => {
        const updatedDate = request.updatedAt ? request.updatedAt.toLocaleString() : 'N/A';
        console.log(`${index + 1}. ID: ${request.id} - ${request.user?.username || 'N/A'} - ${request.package?.package_name || 'N/A'} - Approved: ${updatedDate}`);
      });
    }

    // Check if there are any earnings records for recent requests
    const recentEarnings = await prisma.earnings.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        amount: true,
        type: true,
        description: true,
        packageRequestId: true,
        createdAt: true,
        user: {
          select: {
            username: true
          }
        }
      }
    });

    console.log('\n💰 Recent Earnings Records (Last 10):');
    console.log('─'.repeat(80));
    if (recentEarnings.length === 0) {
      console.log('❌ No earnings records found');
    } else {
      recentEarnings.forEach((earning, index) => {
        const createdDate = earning.createdAt ? earning.createdAt.toLocaleString() : 'N/A';
        console.log(`${index + 1}. ${earning.user?.username || 'N/A'} - $${earning.amount} - ${earning.type} - Package: ${earning.packageRequestId || 'N/A'} - ${createdDate}`);
      });
    }

    // Summary
    console.log('\n📋 SUMMARY:');
    console.log('─'.repeat(50));
    console.log(`Total recent requests: ${recentRequests.length}`);
    console.log(`Pending requests: ${pendingRequests.length}`);
    console.log(`Failed requests: ${failedRequests.length}`);
    console.log(`Approved requests: ${recentApproved.length}`);
    console.log(`Recent earnings: ${recentEarnings.length}`);

    // Check if package approval function exists
    console.log('\n🔧 Checking package approval function...');
    try {
      const { approvePackageRequest } = await import('../src/lib/packageApproval.js');
      console.log('✅ Package approval function exists and can be imported');
    } catch (error) {
      console.log('❌ Error importing package approval function:', error.message);
    }

  } catch (error) {
    console.error('❌ Error checking package approval status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPackageApprovalStatus();
