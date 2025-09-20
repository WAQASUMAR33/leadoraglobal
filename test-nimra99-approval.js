// Test the approval process for nimra99's package request
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNimra99Approval() {
  try {
    console.log('🧪 Testing nimra99 package request approval...\n');

    const requestId = 544; // nimra99's pending request

    // First, let's check the current state
    console.log('1️⃣ Current state before approval:');
    const beforeState = await prisma.packageRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            currentPackageId: true,
            packageId: true,
            rankId: true,
            points: true,
            balance: true
          }
        },
        package: {
          select: {
            id: true,
            package_name: true,
            package_amount: true,
            package_points: true
          }
        }
      }
    });

    if (!beforeState) {
      console.log('❌ Package request not found!');
      return;
    }

    console.log('User:', {
      username: beforeState.user.username,
      currentPackageId: beforeState.user.currentPackageId,
      packageId: beforeState.user.packageId,
      rankId: beforeState.user.rankId,
      points: beforeState.user.points,
      balance: beforeState.user.balance
    });

    console.log('Package Request:', {
      id: beforeState.id,
      status: beforeState.status,
      packageId: beforeState.packageId,
      packageName: beforeState.package.package_name,
      packageAmount: beforeState.package.package_amount,
      packagePoints: beforeState.package.package_points
    });

    // Check if this is a renewal
    const isRenewal = beforeState.user.currentPackageId === beforeState.packageId;
    console.log(`\n🔄 Is this a renewal? ${isRenewal}`);

    // Now let's try to approve the request
    console.log('\n2️⃣ Attempting to approve the request...');
    
    // Import the approval function (we'll simulate it)
    console.log('Simulating approval process...');
    
    // Check if there are any existing earnings for this request
    const existingEarnings = await prisma.earnings.findMany({
      where: { packageRequestId: requestId }
    });
    
    console.log(`Found ${existingEarnings.length} existing earnings for this request`);
    if (existingEarnings.length > 0) {
      console.log('Existing earnings:', existingEarnings.map(e => ({
        id: e.id,
        type: e.type,
        amount: e.amount,
        status: e.status
      })));
    }

    // Check if the user has a referrer
    const userWithReferrer = await prisma.user.findUnique({
      where: { id: beforeState.user.id },
      select: {
        referredBy: true,
        username: true
      }
    });

    console.log(`User referred by: ${userWithReferrer.referredBy || 'None'}`);

    // Check if there are any issues that might prevent approval
    console.log('\n3️⃣ Checking for potential issues:');
    
    // Check if package is active
    const packageStatus = await prisma.package.findUnique({
      where: { id: beforeState.packageId },
      select: { status: true }
    });
    console.log(`Package status: ${packageStatus.status}`);

    // Check if user is active
    const userStatus = await prisma.user.findUnique({
      where: { id: beforeState.user.id },
      select: { status: true }
    });
    console.log(`User status: ${userStatus.status}`);

    console.log('\n✅ All checks completed. The request should be approvable.');

  } catch (error) {
    console.error('❌ Error testing approval:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testNimra99Approval();









