import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestRequest() {
  try {
    // Find a user who doesn't have Package ID 8
    const testUser = await prisma.user.findFirst({
      where: {
        status: 'active',
        currentPackageId: { not: 8 }  // Not already having Package ID 8
      },
      select: { id: true, username: true, fullname: true }
    });

    if (!testUser) {
      console.log('❌ No suitable test user found.');
      return;
    }

    console.log(`\n👤 Creating test request for user: ${testUser.username} (${testUser.fullname})`);

    // Create a test package request for Package ID 8
    const testRequest = await prisma.packageRequest.create({
      data: {
        userId: testUser.id,
        packageId: 8,  // Combo Package
        transactionId: 'TEST_' + Date.now(),
        transactionReceipt: 'Test receipt for Package ID 8 approval',
        notes: 'Test request to verify Diamond rank assignment',
        status: 'pending'
      }
    });

    console.log(`✅ Created test package request:`);
    console.log(`   Request ID: ${testRequest.id}`);
    console.log(`   User: ${testUser.username}`);
    console.log(`   Package ID: 8 (Combo Package)`);
    console.log(`   Status: ${testRequest.status}`);

    return testRequest.id;

  } catch (error) {
    console.error('❌ Error creating test request:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

createTestRequest();

