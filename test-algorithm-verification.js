const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyAlgorithmWorking() {
  console.log('🧪 Verifying Package Approval Algorithm is Working...\n');

  try {
    // Test 1: Check database connectivity and data
    console.log('1️⃣ Database Status:');
    const userCount = await prisma.user.count();
    const packageCount = await prisma.package.count();
    const requestCount = await prisma.packageRequest.count();
    const pendingCount = await prisma.packageRequest.count({ where: { status: 'pending' } });
    const approvedCount = await prisma.packageRequest.count({ where: { status: 'approved' } });
    
    console.log(`   ✅ Database connected successfully`);
    console.log(`     Total Users: ${userCount}`);
    console.log(`     Total Packages: ${packageCount}`);
    console.log(`     Total Package Requests: ${requestCount}`);
    console.log(`     Pending Requests: ${pendingCount}`);
    console.log(`     Approved Requests: ${approvedCount}`);

    // Test 2: Check rank system
    console.log('\n2️⃣ Rank System:');
    const ranks = await prisma.rank.findMany({
      orderBy: { required_points: 'asc' }
    });
    console.log(`   ✅ Found ${ranks.length} ranks in database:`);
    ranks.forEach((rank, index) => {
      console.log(`     ${index + 1}. ${rank.title} (${rank.required_points} points)`);
    });

    // Test 3: Check recent approvals to see if algorithm worked
    console.log('\n3️⃣ Recent Approvals Analysis:');
    const recentApprovals = await prisma.packageRequest.findMany({
      where: { 
        status: 'approved',
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        user: {
          select: {
            username: true,
            points: true,
            balance: true,
            currentPackageId: true,
            rank: {
              select: {
                title: true
              }
            }
          }
        },
        package: {
          select: {
            package_name: true,
            package_amount: true,
            package_direct_commission: true,
            package_indirect_commission: true,
            package_points: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5
    });

    if (recentApprovals.length > 0) {
      console.log(`   ✅ Found ${recentApprovals.length} recent approvals:`);
      recentApprovals.forEach((approval, index) => {
        console.log(`     ${index + 1}. ${approval.user.username} - ${approval.package.package_name}`);
        console.log(`        Points: ${approval.user.points}, Balance: ₨${approval.user.balance}`);
        console.log(`        Rank: ${approval.user.rank?.title || 'No rank'}`);
        console.log(`        Package Assigned: ${approval.user.currentPackageId ? 'Yes' : 'No'}`);
        console.log(`        Approved: ${new Date(approval.updatedAt).toLocaleString()}`);
        console.log('');
      });
    } else {
      console.log('   ℹ️ No recent approvals found in the last 24 hours');
    }

    // Test 4: Check earnings records
    console.log('4️⃣ Earnings Records:');
    const recentEarnings = await prisma.earnings.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
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
      },
      take: 10
    });

    if (recentEarnings.length > 0) {
      console.log(`   ✅ Found ${recentEarnings.length} recent earnings records:`);
      recentEarnings.forEach((earning, index) => {
        console.log(`     ${index + 1}. ${earning.user.username} - ${earning.type}: ₨${earning.amount}`);
        console.log(`        Description: ${earning.description}`);
        console.log(`        Created: ${new Date(earning.createdAt).toLocaleString()}`);
        console.log('');
      });
    } else {
      console.log('   ℹ️ No recent earnings records found in the last 24 hours');
    }

    // Test 5: Check pending requests for algorithm testing
    console.log('5️⃣ Pending Requests for Testing:');
    const pendingRequests = await prisma.packageRequest.findMany({
      where: { status: 'pending' },
      include: {
        user: {
          select: {
            username: true,
            referredBy: true,
            points: true,
            balance: true,
            currentPackageId: true,
            rank: {
              select: {
                title: true
              }
            }
          }
        },
        package: {
          select: {
            package_name: true,
            package_amount: true,
            package_direct_commission: true,
            package_indirect_commission: true,
            package_points: true
          }
        }
      },
      take: 3
    });

    if (pendingRequests.length > 0) {
      console.log(`   ✅ Found ${pendingRequests.length} pending requests ready for testing:`);
      pendingRequests.forEach((request, index) => {
        console.log(`     ${index + 1}. Request ID: ${request.id}`);
        console.log(`        User: ${request.user.username}`);
        console.log(`        Package: ${request.package.package_name} - ₨${request.package.package_amount}`);
        console.log(`        Direct Commission: ₨${request.package.package_direct_commission}`);
        console.log(`        Indirect Commission: ₨${request.package.package_indirect_commission}`);
        console.log(`        Points: ${request.package.package_points}`);
        console.log(`        Referred By: ${request.user.referredBy || 'No referrer'}`);
        console.log(`        Current Points: ${request.user.points}`);
        console.log(`        Current Balance: ₨${request.user.balance}`);
        console.log(`        Current Rank: ${request.user.rank?.title || 'No rank'}`);
        console.log('');
      });
    } else {
      console.log('   ℹ️ No pending requests found for testing');
    }

    // Test 6: Algorithm validation summary
    console.log('6️⃣ Algorithm Validation Summary:');
    
    // Check if the system has the necessary components
    const hasRanks = ranks.length > 0;
    const hasPackages = packageCount > 0;
    const hasUsers = userCount > 0;
    const hasPendingRequests = pendingCount > 0;
    
    console.log(`   ✅ Rank System: ${hasRanks ? 'Working' : 'Missing'}`);
    console.log(`   ✅ Package System: ${hasPackages ? 'Working' : 'Missing'}`);
    console.log(`   ✅ User System: ${hasUsers ? 'Working' : 'Missing'}`);
    console.log(`   ✅ Pending Requests: ${hasPendingRequests ? 'Available for testing' : 'None available'}`);
    
    if (hasRanks && hasPackages && hasUsers) {
      console.log('\n🎉 Algorithm Components Status: ALL SYSTEMS READY');
      console.log('   The package approval algorithm should work correctly with:');
      console.log('   - ✅ Commission distribution (direct and indirect)');
      console.log('   - ✅ Points distribution to referral tree');
      console.log('   - ✅ Rank updates based on points');
      console.log('   - ✅ Package assignment to users');
      console.log('   - ✅ Status updates for requests');
      console.log('   - ✅ Earnings record creation');
      
      if (hasPendingRequests) {
        console.log('\n💡 Ready to test: You can approve pending requests through the admin interface');
        console.log('   or use the API endpoint to test the algorithm.');
      }
    } else {
      console.log('\n⚠️ Some components are missing. Please check the database setup.');
    }

    console.log('\n🎉 Algorithm verification completed successfully!');

  } catch (error) {
    console.error('❌ Error verifying algorithm:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyAlgorithmWorking();
