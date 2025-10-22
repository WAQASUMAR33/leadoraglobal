import { PrismaClient } from '@prisma/client';
import { approvePackageRequest } from '../src/lib/packageApproval.js';

const prisma = new PrismaClient();

async function testCompleteLogic() {
  try {
    console.log('🧪 Testing Complete Package Approval Logic...\n');

    // Test 1: Package ID 7 (Master Package) → Sapphire Manager
    console.log('📦 TEST 1: Package ID 7 (Master Package) → Sapphire Manager');
    await testPackageApproval(7, 'Sapphire Manager', 3);

    // Test 2: Package ID 8 (Combo Package) → Diamond  
    console.log('\n📦 TEST 2: Package ID 8 (Combo Package) → Diamond');
    await testPackageApproval(8, 'Diamond', 4);

    // Test 3: Package ID 2 (Distributer Package) → Normal Logic
    console.log('\n📦 TEST 3: Package ID 2 (Distributer Package) → Normal Logic');
    await testPackageApproval(2, 'Normal Logic', null);

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testPackageApproval(packageId, expectedRank, expectedRankId) {
  try {
    // Find or create a test user
    let testUser = await prisma.user.findFirst({
      where: { username: `testuser_${packageId}` }
    });

    if (!testUser) {
      const bcrypt = await import('bcryptjs');
      testUser = await prisma.user.create({
        data: {
          username: `testuser_${packageId}`,
          fullname: `Test User ${packageId}`,
          email: `testuser${packageId}@test.com`,
          password: await bcrypt.default.hash('test123', 10),
          status: 'active',
          points: 1000,
          balance: 100000,
          rankId: 1, // Consultant
          referredBy: null
        }
      });
      console.log(`✅ Created test user: ${testUser.username}`);
    }

    // Create package request
    const packageRequest = await prisma.packageRequest.create({
      data: {
        userId: testUser.id,
        packageId: packageId,
        transactionId: `TEST_${packageId}_${Date.now()}`,
        transactionReceipt: `Test receipt for Package ID ${packageId}`,
        notes: `Test request for Package ID ${packageId}`,
        status: 'pending'
      }
    });

    console.log(`📋 Created request ID ${packageRequest.id} for ${testUser.username}`);

    // Get package info
    const packageInfo = await prisma.package.findUnique({
      where: { id: packageId },
      select: { package_name: true }
    });

    console.log(`📦 Package: ${packageInfo.package_name} (ID: ${packageId})`);
    console.log(`🎯 Expected: ${expectedRank}${expectedRankId ? ` (Rank ID: ${expectedRankId})` : ' (Normal Logic)'}`);

    // Approve the request
    console.log(`🚀 Approving request...`);
    const result = await approvePackageRequest(packageRequest.id);

    // Check the result
    const updatedUser = await prisma.user.findUnique({
      where: { id: testUser.id },
      select: {
        username: true,
        rank: { select: { title: true } },
        rankId: true,
        currentPackage: { select: { package_name: true } }
      }
    });

    console.log(`📊 Result:`);
    console.log(`   User: ${updatedUser.username}`);
    console.log(`   Package: ${updatedUser.currentPackage?.package_name}`);
    console.log(`   Rank: ${updatedUser.rank?.title} (ID: ${updatedUser.rankId})`);

    // Verify the result
    if (expectedRankId) {
      // Package-specific rank assignment
      if (updatedUser.rankId === expectedRankId && updatedUser.rank?.title === expectedRank) {
        console.log(`✅ SUCCESS: Got correct ${expectedRank} rank (ID: ${expectedRankId})`);
      } else {
        console.log(`❌ FAILED: Expected ${expectedRank} (ID: ${expectedRankId}), got ${updatedUser.rank?.title} (ID: ${updatedUser.rankId})`);
      }
    } else {
      // Normal logic - just verify it worked
      if (updatedUser.rank?.title && updatedUser.rankId) {
        console.log(`✅ SUCCESS: Normal rank logic applied - got ${updatedUser.rank.title} (ID: ${updatedUser.rankId})`);
      } else {
        console.log(`❌ FAILED: Normal rank logic failed`);
      }
    }

    return {
      success: expectedRankId ? 
        (updatedUser.rankId === expectedRankId && updatedUser.rank?.title === expectedRank) :
        (updatedUser.rank?.title && updatedUser.rankId),
      user: updatedUser,
      expected: expectedRank,
      actual: updatedUser.rank?.title
    };

  } catch (error) {
    console.error(`❌ Error testing Package ID ${packageId}:`, error);
    return { success: false, error: error.message };
  }
}

// Run the tests
testCompleteLogic();

