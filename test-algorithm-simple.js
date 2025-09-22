const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAlgorithmLogic() {
  console.log('🧪 Testing Package Approval Algorithm Logic...\n');

  try {
    // Test 1: Check database connectivity
    console.log('1️⃣ Testing database connectivity...');
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
      return;
    }

    // Test 2: Check rank hierarchy
    console.log('\n2️⃣ Testing rank hierarchy...');
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

    // Test 3: Check pending requests
    console.log('\n3️⃣ Testing pending package requests...');
    try {
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
        },
        take: 3 // Limit to 3 for testing
      });

      console.log(`   ✅ Found ${pendingRequests.length} pending requests (showing first 3):`);
      pendingRequests.forEach((request, index) => {
        console.log(`     ${index + 1}. Request ID: ${request.id}`);
        console.log(`        User: ${request.user.username} (${request.user.fullname})`);
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
    } catch (error) {
      console.log('   ❌ Pending requests test failed:', error.message);
    }

    // Test 4: Check referral tree structure
    console.log('\n4️⃣ Testing referral tree structure...');
    try {
      // Find a user with referrer
      const userWithReferrer = await prisma.user.findFirst({
        where: { referredBy: { not: null } },
        select: { 
          id: true,
          username: true, 
          referredBy: true,
          points: true,
          balance: true,
          rank: {
            select: {
              title: true
            }
          }
        }
      });

      if (userWithReferrer) {
        console.log(`   ✅ Found user with referrer: ${userWithReferrer.username}`);
        console.log(`     Referred by: ${userWithReferrer.referredBy}`);
        console.log(`     Points: ${userWithReferrer.points}`);
        console.log(`     Balance: ₨${userWithReferrer.balance}`);
        console.log(`     Rank: ${userWithReferrer.rank?.title || 'No rank'}`);

        // Check if referrer exists
        const referrer = await prisma.user.findUnique({
          where: { username: userWithReferrer.referredBy },
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
          console.log(`     Referrer details:`);
          console.log(`       Username: ${referrer.username}`);
          console.log(`       Points: ${referrer.points}`);
          console.log(`       Balance: ₨${referrer.balance}`);
          console.log(`       Rank: ${referrer.rank?.title || 'No rank'}`);
        } else {
          console.log(`     ❌ Referrer not found in database`);
        }
      } else {
        console.log('   ⚠️ No users with referrers found for testing');
      }
    } catch (error) {
      console.log('   ❌ Referral tree test failed:', error.message);
    }

    // Test 5: Check package data
    console.log('\n5️⃣ Testing package data...');
    try {
      const packages = await prisma.package.findMany({
        where: { status: 'active' },
        select: {
          id: true,
          package_name: true,
          package_amount: true,
          package_direct_commission: true,
          package_indirect_commission: true,
          package_points: true
        },
        take: 3
      });

      console.log(`   ✅ Found ${packages.length} active packages (showing first 3):`);
      packages.forEach((pkg, index) => {
        console.log(`     ${index + 1}. ${pkg.package_name}`);
        console.log(`        Amount: ₨${pkg.package_amount}`);
        console.log(`        Direct Commission: ₨${pkg.package_direct_commission}`);
        console.log(`        Indirect Commission: ₨${pkg.package_indirect_commission}`);
        console.log(`        Points: ${pkg.package_points}`);
        console.log('');
      });
    } catch (error) {
      console.log('   ❌ Package data test failed:', error.message);
    }

    // Test 6: Algorithm validation
    console.log('\n6️⃣ Testing algorithm validation...');
    try {
      const pendingRequest = await prisma.packageRequest.findFirst({
        where: { status: 'pending' },
        include: {
          user: {
            select: {
              id: true,
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

      if (pendingRequest) {
        console.log(`   ✅ Testing algorithm with Request ID: ${pendingRequest.id}`);
        console.log(`     User: ${pendingRequest.user.username}`);
        console.log(`     Package: ${pendingRequest.package.package_name}`);
        
        // Validate algorithm requirements
        const issues = [];
        
        // Check if user has referrer
        if (!pendingRequest.user.referredBy) {
          issues.push('User has no referrer - no direct commission will be distributed');
        }

        // Check if package has valid commission values
        if (pendingRequest.package.package_direct_commission <= 0) {
          issues.push('Package has zero or negative direct commission');
        }

        if (pendingRequest.package.package_indirect_commission <= 0) {
          issues.push('Package has zero or negative indirect commission');
        }

        // Check if package has points
        if (!pendingRequest.package.package_points || pendingRequest.package.package_points <= 0) {
          issues.push('Package has no points assigned');
        }

        // Check if user already has a package
        if (pendingRequest.user.currentPackageId) {
          issues.push('User already has an active package - this will replace it');
        }

        if (issues.length === 0) {
          console.log('     ✅ No issues found. Package approval should work correctly.');
        } else {
          console.log('     ⚠️ Issues found:');
          issues.forEach((issue, index) => {
            console.log(`       ${index + 1}. ${issue}`);
          });
        }

        // Test commission calculation
        console.log(`     💰 Commission calculation test:`);
        console.log(`       Direct commission (₨${pendingRequest.package.package_direct_commission}) would go to: ${pendingRequest.user.referredBy || 'No one (no referrer)'}`);
        console.log(`       Indirect commission (₨${pendingRequest.package.package_indirect_commission}) would be distributed to higher ranks in tree`);
        console.log(`       Points (${pendingRequest.package.package_points}) would be added to all users in referral tree`);

      } else {
        console.log('   ⚠️ No pending requests found for algorithm testing');
      }
    } catch (error) {
      console.log('   ❌ Algorithm validation test failed:', error.message);
    }

    console.log('\n🎉 Algorithm logic test completed!');

  } catch (error) {
    console.error('❌ Error testing algorithm logic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAlgorithmLogic();
