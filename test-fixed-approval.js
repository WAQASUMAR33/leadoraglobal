const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFixedApprovalSystem() {
  console.log('🧪 Testing Fixed Package Approval System...\n');

  try {
    // 1. Check if there are any pending package requests
    const pendingRequests = await prisma.packageRequest.findMany({
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

    console.log(`📋 Found ${pendingRequests.length} pending package requests:`);
    pendingRequests.forEach((request, index) => {
      console.log(`  ${index + 1}. Request ID: ${request.id}`);
      console.log(`     User: ${request.user.username} (${request.user.fullname})`);
      console.log(`     Package: ${request.package.package_name} - ₨${request.package.package_amount}`);
      console.log(`     Direct Commission: ₨${request.package.package_direct_commission}`);
      console.log(`     Indirect Commission: ₨${request.package.package_indirect_commission}`);
      console.log(`     Points: ${request.package.package_points}`);
      console.log(`     Referred By: ${request.user.referredBy || 'No referrer'}`);
      console.log(`     Current Points: ${request.user.points}`);
      console.log(`     Current Balance: ₨${request.user.balance}`);
      console.log(`     Current Rank: ${request.user.rank?.title || 'No rank'}`);
      console.log('');
    });

    if (pendingRequests.length === 0) {
      console.log('❌ No pending package requests found. Cannot test approval logic.');
      return;
    }

    // 2. Test the approval logic for the first pending request
    const testRequest = pendingRequests[0];
    console.log(`🎯 Testing FIXED approval logic for Request ID: ${testRequest.id}`);
    console.log(`   User: ${testRequest.user.username}`);
    console.log(`   Package: ${testRequest.package.package_name}\n`);

    // Record initial state
    console.log('📊 Initial State:');
    console.log(`   User Points: ${testRequest.user.points}`);
    console.log(`   User Balance: ₨${testRequest.user.balance}`);
    console.log(`   User Rank: ${testRequest.user.rank?.title || 'No rank'}`);
    console.log(`   User Current Package: ${testRequest.user.currentPackageId ? 'Yes' : 'No'}\n`);

    // Get referrer's initial state
    if (testRequest.user.referredBy) {
      const referrer = await prisma.user.findUnique({
        where: { username: testRequest.user.referredBy },
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
    console.log('🚀 Testing FIXED API endpoint...');
    const response = await fetch(`http://localhost:3000/api/package-requests/${testRequest.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'approved',
        adminNotes: 'Test approval with fixed system'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log(`❌ API Error: ${response.status} - ${errorData.message}`);
      console.log(`   Error details: ${JSON.stringify(errorData, null, 2)}`);
      return;
    }

    const result = await response.json();
    console.log('✅ API Response:', result.message);
    console.log(`   Approval Result: ${JSON.stringify(result.approvalResult, null, 2)}\n`);

    // Check final state
    console.log('📊 Final State After FIXED Approval:');
    
    // Get updated user data
    const updatedUser = await prisma.user.findUnique({
      where: { id: testRequest.user.id },
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

    console.log(`   User Points: ${updatedUser.points} (was ${testRequest.user.points})`);
    console.log(`   User Balance: ₨${updatedUser.balance} (was ₨${testRequest.user.balance})`);
    console.log(`   User Rank: ${updatedUser.rank?.title || 'No rank'} (was ${testRequest.user.rank?.title || 'No rank'})`);
    console.log(`   User Current Package: ${updatedUser.currentPackageId ? 'Yes' : 'No'} (was ${testRequest.user.currentPackageId ? 'Yes' : 'No'})`);
    console.log(`   Package Expiry: ${updatedUser.packageExpiryDate ? new Date(updatedUser.packageExpiryDate).toLocaleDateString() : 'N/A'}`);

    // Check referrer's final state
    if (testRequest.user.referredBy) {
      const updatedReferrer = await prisma.user.findUnique({
        where: { username: testRequest.user.referredBy },
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
        console.log(`   Points: ${updatedReferrer.points} (was ${testRequest.user.referredBy ? (await prisma.user.findUnique({ where: { username: testRequest.user.referredBy }, select: { points: true } }))?.points || 0 : 0})`);
        console.log(`   Balance: ₨${updatedReferrer.balance} (was ${testRequest.user.referredBy ? (await prisma.user.findUnique({ where: { username: testRequest.user.referredBy }, select: { balance: true } }))?.balance || 0 : 0})`);
        console.log(`   Rank: ${updatedReferrer.rank?.title || 'No rank'}`);
      }
    }

    // Check package request status
    const updatedRequest = await prisma.packageRequest.findUnique({
      where: { id: testRequest.id },
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
        packageRequestId: testRequest.id
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

    // Verify the fixes
    console.log('\n🔍 Verification of Fixes:');
    
    // Check 1: Package request status updated
    if (updatedRequest.status === 'approved') {
      console.log('   ✅ Package request status properly updated to approved');
    } else {
      console.log('   ❌ Package request status not updated correctly');
    }

    // Check 2: User package assigned
    if (updatedUser.currentPackageId === testRequest.package.id) {
      console.log('   ✅ User package properly assigned');
    } else {
      console.log('   ❌ User package not assigned correctly');
    }

    // Check 3: Points distributed
    if (updatedUser.points >= testRequest.user.points + testRequest.package.package_points) {
      console.log('   ✅ Points properly distributed to user');
    } else {
      console.log('   ❌ Points not distributed correctly to user');
    }

    // Check 4: Commission distributed (if referrer exists)
    if (testRequest.user.referredBy) {
      const referrerInitialBalance = testRequest.user.referredBy ? (await prisma.user.findUnique({ where: { username: testRequest.user.referredBy }, select: { balance: true } }))?.balance || 0 : 0;
      const referrerFinalBalance = updatedReferrer?.balance || 0;
      if (referrerFinalBalance >= referrerInitialBalance + testRequest.package.package_direct_commission) {
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

    console.log('\n🎉 Fixed package approval system test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing fixed package approval:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testFixedApprovalSystem();
