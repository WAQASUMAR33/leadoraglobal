const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testActualApproval() {
  console.log('🧪 Testing Actual Package Approval Process...\n');

  try {
    // Get the first pending request
    const pendingRequest = await prisma.packageRequest.findFirst({
      where: { status: 'pending' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullname: true,
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
            id: true,
            package_name: true,
            package_amount: true,
            package_direct_commission: true,
            package_indirect_commission: true,
            package_points: true
          }
        }
      }
    });

    if (!pendingRequest) {
      console.log('❌ No pending package requests found.');
      return;
    }

    console.log(`🎯 Testing approval for Request ID: ${pendingRequest.id}`);
    console.log(`   User: ${pendingRequest.user.username}`);
    console.log(`   Package: ${pendingRequest.package.package_name}`);
    console.log(`   Amount: ₨${pendingRequest.package.package_amount}\n`);

    // Record initial state
    console.log('📊 Initial State:');
    console.log(`   User Points: ${pendingRequest.user.points}`);
    console.log(`   User Balance: ₨${pendingRequest.user.balance}`);
    console.log(`   User Rank: ${pendingRequest.user.rank?.title || 'No rank'}`);
    console.log(`   User Current Package: ${pendingRequest.user.currentPackageId ? 'Yes' : 'No'}\n`);

    // Get referrer's initial state
    if (pendingRequest.user.referredBy) {
      const referrer = await prisma.user.findUnique({
        where: { username: pendingRequest.user.referredBy },
        select: {
          id: true,
          username: true,
          points: true,
          balance: true,
          rank: {
            select: {
              title: true
            }
          }
        }
      });

      if (referrer) {
        console.log('📊 Referrer Initial State:');
        console.log(`   Referrer: ${referrer.username}`);
        console.log(`   Points: ${referrer.points}`);
        console.log(`   Balance: ₨${referrer.balance}`);
        console.log(`   Rank: ${referrer.rank?.title || 'No rank'}\n`);
      }
    }

    // Test the approval API endpoint
    console.log('🚀 Testing API endpoint...');
    const response = await fetch(`http://localhost:3000/api/package-requests/${pendingRequest.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'approved',
        adminNotes: 'Test approval'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log(`❌ API Error: ${response.status} - ${errorData.message}`);
      return;
    }

    const result = await response.json();
    console.log('✅ API Response:', result.message);

    // Check final state
    console.log('\n📊 Final State After Approval:');
    
    // Get updated user data
    const updatedUser = await prisma.user.findUnique({
      where: { id: pendingRequest.user.id },
      select: {
        id: true,
        username: true,
        points: true,
        balance: true,
        currentPackageId: true,
        packageExpiryDate: true,
        rank: {
          select: {
            title: true
          }
        }
      }
    });

    console.log(`   User Points: ${updatedUser.points} (was ${pendingRequest.user.points})`);
    console.log(`   User Balance: ₨${updatedUser.balance} (was ₨${pendingRequest.user.balance})`);
    console.log(`   User Rank: ${updatedUser.rank?.title || 'No rank'} (was ${pendingRequest.user.rank?.title || 'No rank'})`);
    console.log(`   User Current Package: ${updatedUser.currentPackageId ? 'Yes' : 'No'} (was ${pendingRequest.user.currentPackageId ? 'Yes' : 'No'})`);
    console.log(`   Package Expiry: ${updatedUser.packageExpiryDate ? new Date(updatedUser.packageExpiryDate).toLocaleDateString() : 'N/A'}`);

    // Check referrer's final state
    if (pendingRequest.user.referredBy) {
      const updatedReferrer = await prisma.user.findUnique({
        where: { username: pendingRequest.user.referredBy },
        select: {
          id: true,
          username: true,
          points: true,
          balance: true,
          rank: {
            select: {
              title: true
            }
          }
        }
      });

      if (updatedReferrer) {
        console.log('\n📊 Referrer Final State:');
        console.log(`   Referrer: ${updatedReferrer.username}`);
        console.log(`   Points: ${updatedReferrer.points} (was ${pendingRequest.user.referredBy ? (await prisma.user.findUnique({ where: { username: pendingRequest.user.referredBy }, select: { points: true } }))?.points || 0 : 0})`);
        console.log(`   Balance: ₨${updatedReferrer.balance} (was ${pendingRequest.user.referredBy ? (await prisma.user.findUnique({ where: { username: pendingRequest.user.referredBy }, select: { balance: true } }))?.balance || 0 : 0})`);
        console.log(`   Rank: ${updatedReferrer.rank?.title || 'No rank'}`);
      }
    }

    // Check package request status
    const updatedRequest = await prisma.packageRequest.findUnique({
      where: { id: pendingRequest.id },
      select: {
        status: true,
        updatedAt: true
      }
    });

    console.log('\n📊 Package Request Status:');
    console.log(`   Status: ${updatedRequest.status} (was pending)`);
    console.log(`   Updated At: ${new Date(updatedRequest.updatedAt).toLocaleString()}`);

    // Check earnings records
    const earnings = await prisma.earnings.findMany({
      where: {
        packageRequestId: pendingRequest.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('\n💰 Earnings Records Created:');
    if (earnings.length === 0) {
      console.log('   ❌ No earnings records found');
    } else {
      earnings.forEach((earning, index) => {
        console.log(`   ${index + 1}. ${earning.type}: ₨${earning.amount} - ${earning.description}`);
      });
    }

    console.log('\n✅ Package approval test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing package approval:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testActualApproval();















