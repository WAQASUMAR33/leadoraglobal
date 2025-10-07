const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function testPackageApproval() {
  try {
    console.log('🧪 Testing package approval function with pending requests...\n');

    // Get the most recent pending request
    const pendingRequest = await prisma.packageRequest.findFirst({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        packageId: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            username: true,
            fullname: true,
            points: true,
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
            package_points: true,
            package_direct_commission: true,
            package_indirect_commission: true
          }
        }
      }
    });

    if (!pendingRequest) {
      console.log('❌ No pending requests found to test');
      return;
    }

    console.log('📋 Testing with Pending Request:');
    console.log('─'.repeat(60));
    console.log(`Request ID: ${pendingRequest.id}`);
    console.log(`User: ${pendingRequest.user?.username} (${pendingRequest.user?.fullname})`);
    console.log(`Current Rank: ${pendingRequest.user?.rank?.title || 'No Rank'}`);
    console.log(`Current Points: ${pendingRequest.user?.points || 0}`);
    console.log(`Package: ${pendingRequest.package?.package_name}`);
    console.log(`Package Amount: $${pendingRequest.package?.package_amount || 0}`);
    console.log(`Package Points: ${pendingRequest.package?.package_points || 0}`);
    console.log(`Created: ${pendingRequest.createdAt}`);

    // Import and test the approval function
    console.log('\n🔧 Importing package approval function...');
    const { approvePackageRequest } = await import('../src/lib/packageApproval.js');
    console.log('✅ Package approval function imported successfully');

    // Test the approval
    console.log(`\n🚀 Attempting to approve request ${pendingRequest.id}...`);
    
    try {
      const result = await approvePackageRequest(pendingRequest.id);
      console.log('✅ Package approval completed successfully!');
      console.log('📊 Result:', result);
      
      // Check the updated request status
      const updatedRequest = await prisma.packageRequest.findUnique({
        where: { id: pendingRequest.id },
        select: {
          id: true,
          status: true,
          updatedAt: true
        }
      });
      
      console.log(`\n📋 Updated Request Status:`);
      console.log(`   Status: ${updatedRequest?.status}`);
      console.log(`   Updated: ${updatedRequest?.updatedAt}`);
      
      // Check if earnings were created
      const earnings = await prisma.earnings.findMany({
        where: { packageRequestId: pendingRequest.id },
        select: {
          userId: true,
          amount: true,
          type: true,
          description: true,
          user: {
            select: {
              username: true
            }
          }
        }
      });
      
      console.log(`\n💰 Earnings Created: ${earnings.length} records`);
      earnings.forEach((earning, index) => {
        console.log(`   ${index + 1}. ${earning.user?.username} - $${earning.amount} - ${earning.type}`);
      });
      
    } catch (approvalError) {
      console.error('❌ Package approval failed:', approvalError.message);
      console.error('Full error:', approvalError);
    }

  } catch (error) {
    console.error('❌ Error testing package approval:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPackageApproval();

