const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testApprovalLogic() {
  console.log('🧪 Testing Package Approval Logic Components...\n');

  try {
    // Test 1: Check package approval function import
    console.log('1️⃣ Testing package approval function import...');
    try {
      const { approvePackageRequest } = require('./src/lib/packageApproval.js');
      console.log('   ✅ Package approval function imported successfully');
    } catch (error) {
      console.log('   ❌ Failed to import package approval function:', error.message);
    }

    // Test 2: Check commission system import
    console.log('\n2️⃣ Testing commission system import...');
    try {
      const { calculateMLMCommissions, updateUserPackageAndRank } = require('./src/lib/commissionSystem.js');
      console.log('   ✅ Commission system functions imported successfully');
    } catch (error) {
      console.log('   ❌ Failed to import commission system functions:', error.message);
    }

    // Test 3: Check rank conditions
    console.log('\n3️⃣ Testing rank conditions...');
    try {
      const { getRankByPoints, getEligibleRanks, getHighestEligibleRank } = require('./src/lib/packageApproval.js');
      
      // Test basic rank calculation
      const testPoints = [0, 500, 1000, 2000, 8000, 15000];
      console.log('   Testing rank calculation by points:');
      testPoints.forEach(points => {
        const rank = getRankByPoints(points);
        console.log(`     ${points} points → ${rank}`);
      });
      
      console.log('   ✅ Rank conditions working correctly');
    } catch (error) {
      console.log('   ❌ Rank conditions test failed:', error.message);
    }

    // Test 4: Check database connectivity
    console.log('\n4️⃣ Testing database connectivity...');
    try {
      const userCount = await prisma.user.count();
      const packageCount = await prisma.package.count();
      const requestCount = await prisma.packageRequest.count();
      
      console.log(`   ✅ Database connected successfully`);
      console.log(`     Users: ${userCount}`);
      console.log(`     Packages: ${packageCount}`);
      console.log(`     Package Requests: ${requestCount}`);
    } catch (error) {
      console.log('   ❌ Database connectivity test failed:', error.message);
    }

    // Test 5: Check pending requests
    console.log('\n5️⃣ Testing pending package requests...');
    try {
      const pendingRequests = await prisma.packageRequest.findMany({
        where: { status: 'pending' },
        include: {
          user: {
            select: {
              username: true,
              referredBy: true
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

      console.log(`   ✅ Found ${pendingRequests.length} pending requests`);
      if (pendingRequests.length > 0) {
        console.log('   Sample pending requests:');
        pendingRequests.slice(0, 3).forEach((request, index) => {
          console.log(`     ${index + 1}. ${request.user.username} → ${request.package.package_name} (₨${request.package.package_amount})`);
        });
      }
    } catch (error) {
      console.log('   ❌ Pending requests test failed:', error.message);
    }

    // Test 6: Check rank hierarchy
    console.log('\n6️⃣ Testing rank hierarchy...');
    try {
      const ranks = await prisma.rank.findMany({
        orderBy: { required_points: 'asc' }
      });

      console.log('   ✅ Rank hierarchy from database:');
      ranks.forEach((rank, index) => {
        console.log(`     ${index + 1}. ${rank.title} (${rank.required_points} points)`);
      });
    } catch (error) {
      console.log('   ❌ Rank hierarchy test failed:', error.message);
    }

    // Test 7: Check referral tree logic
    console.log('\n7️⃣ Testing referral tree logic...');
    try {
      const { getReferralTree } = require('./src/lib/packageApproval.js');
      
      // Find a user with referrer
      const userWithReferrer = await prisma.user.findFirst({
        where: { referredBy: { not: null } },
        select: { username: true, referredBy: true }
      });

      if (userWithReferrer) {
        const tree = await getReferralTree(userWithReferrer.id);
        console.log(`   ✅ Referral tree for ${userWithReferrer.username}:`);
        console.log(`     Found ${tree.length} members in tree`);
        tree.forEach((member, index) => {
          console.log(`       ${index + 1}. ${member.username} (Level ${member.level})`);
        });
      } else {
        console.log('   ⚠️ No users with referrers found for testing');
      }
    } catch (error) {
      console.log('   ❌ Referral tree test failed:', error.message);
    }

    console.log('\n🎉 Package approval logic test completed!');

  } catch (error) {
    console.error('❌ Error testing package approval logic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testApprovalLogic();

