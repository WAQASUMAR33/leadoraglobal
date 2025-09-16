const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Import the approval functions directly
const { approvePackageRequest } = require('./src/lib/packageApproval');

async function testDirectApproval() {
  console.log('🧪 Testing Direct Package Approval Algorithm...\n');

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

    console.log(`🎯 Testing direct approval for Request ID: ${pendingRequest.id}`);
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
    let referrerInitialState = null;
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
        referrerInitialState = referrer;
        console.log('📊 Referrer Initial State:');
        console.log(`   Referrer: ${referrer.username}`);
        console.log(`   Points: ${referrer.points}`);
        console.log(`   Balance: ₨${referrer.balance}`);
        console.log(`   Rank: ${referrer.rank?.title || 'No rank'}\n`);
      }
    }

    // Test the direct approval function
    console.log('🚀 Testing direct approval function...');
    try {
      const result = await approvePackageRequest(pendingRequest.id);
      console.log('✅ Direct approval successful!');
      console.log(`   Result: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      console.log(`❌ Direct approval failed: ${error.message}`);
      console.log(`   Error details: ${error.stack}`);
      return;
    }

    // Check final state
    console.log('\n📊 Final State After Direct Approval:');
    
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
    if (referrerInitialState) {
      const updatedReferrer = await prisma.user.findUnique({
        where: { username: referrerInitialState.username },
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
        console.log(`   Points: ${updatedReferrer.points} (was ${referrerInitialState.points})`);
        console.log(`   Balance: ₨${updatedReferrer.balance} (was ₨${referrerInitialState.balance})`);
        console.log(`   Rank: ${updatedReferrer.rank?.title || 'No rank'} (was ${referrerInitialState.rank?.title || 'No rank'})`);
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

    // Verify the algorithm worked correctly
    console.log('\n🔍 Algorithm Verification:');
    
    // Check 1: Package request status updated
    if (updatedRequest.status === 'approved') {
      console.log('   ✅ Package request status properly updated to approved');
    } else {
      console.log('   ❌ Package request status not updated correctly');
    }

    // Check 2: User package assigned
    if (updatedUser.currentPackageId === pendingRequest.package.id) {
      console.log('   ✅ User package properly assigned');
    } else {
      console.log('   ❌ User package not assigned correctly');
    }

    // Check 3: Points distributed
    const expectedPoints = pendingRequest.user.points + pendingRequest.package.package_points;
    if (updatedUser.points >= expectedPoints) {
      console.log('   ✅ Points properly distributed to user');
    } else {
      console.log('   ❌ Points not distributed correctly to user');
    }

    // Check 4: Commission distributed (if referrer exists)
    if (referrerInitialState) {
      const expectedBalance = referrerInitialState.balance + pendingRequest.package.package_direct_commission;
      if (updatedReferrer.balance >= expectedBalance) {
        console.log('   ✅ Direct commission properly distributed to referrer');
      } else {
        console.log('   ❌ Direct commission not distributed correctly to referrer');
      }
    } else {
      console.log('   ℹ️ No referrer - direct commission not applicable');
    }

    // Check 5: Earnings records created
    if (earnings.length > 0) {
      console.log('   ✅ Earnings records properly created');
    } else {
      console.log('   ❌ No earnings records created');
    }

    // Check 6: Rank updates
    if (updatedUser.rank && updatedUser.rank.title !== pendingRequest.user.rank?.title) {
      console.log('   ✅ User rank properly updated');
    } else if (updatedUser.points >= expectedPoints) {
      console.log('   ℹ️ User rank may need update based on new points');
    }

    console.log('\n🎉 Direct package approval test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing direct approval:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDirectApproval();
