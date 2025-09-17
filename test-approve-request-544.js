// Test approving request 544 through the API
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testApproveRequest544() {
  try {
    console.log('🧪 Testing approval of request 544 through API simulation...\n');

    const requestId = 544;

    // First, let's clean up the existing earnings to start fresh
    console.log('1️⃣ Cleaning up existing earnings...');
    const deletedEarnings = await prisma.earnings.deleteMany({
      where: { packageRequestId: requestId }
    });
    console.log(`Deleted ${deletedEarnings.count} existing earnings`);

    // Reset the request status to pending
    await prisma.packageRequest.update({
      where: { id: requestId },
      data: { status: 'pending' }
    });
    console.log('Reset request status to pending');

    // Now let's simulate the approval process step by step
    console.log('\n2️⃣ Starting approval process...');

    // Step 1: Get the package request
    const packageRequest = await prisma.packageRequest.findUnique({
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
            balance: true,
            status: true
          }
        },
        package: {
          select: {
            id: true,
            package_name: true,
            package_amount: true,
            package_direct_commission: true,
            package_indirect_commission: true,
            package_points: true,
            status: true
          }
        }
      }
    });

    if (!packageRequest) {
      throw new Error('Package request not found');
    }

    console.log('Package request found:', {
      id: packageRequest.id,
      status: packageRequest.status,
      user: packageRequest.user.username,
      package: packageRequest.package.package_name
    });

    // Step 2: Validate conditions
    if (packageRequest.status !== 'pending') {
      throw new Error(`Package request is not pending (current status: ${packageRequest.status})`);
    }

    if (packageRequest.user.status !== 'active') {
      throw new Error(`User is not active (current status: ${packageRequest.user.status})`);
    }

    if (packageRequest.package.status !== 'active') {
      throw new Error(`Package is not active (current status: ${packageRequest.package.status})`);
    }

    console.log('✅ All validation checks passed');

    // Step 3: Update user's package and rank
    console.log('\n3️⃣ Updating user package and rank...');
    
    const packageExpiryDate = new Date();
    packageExpiryDate.setFullYear(packageExpiryDate.getFullYear() + 1);

    await prisma.user.update({
      where: { id: packageRequest.user.id },
      data: {
        currentPackageId: packageRequest.package.id,
        packageExpiryDate: packageExpiryDate,
        packageId: packageRequest.package.id
      }
    });

    console.log('✅ User package updated');

    // Step 4: Create earnings (simplified version)
    console.log('\n4️⃣ Creating earnings...');
    
    // Check if user has a referrer
    const userWithReferrer = await prisma.user.findUnique({
      where: { id: packageRequest.user.id },
      select: { referredBy: true }
    });

    if (userWithReferrer.referredBy) {
      // Find the referrer
      const referrer = await prisma.user.findUnique({
        where: { username: userWithReferrer.referredBy },
        select: { id: true, username: true }
      });

      if (referrer) {
        // Create direct commission for referrer
        await prisma.earnings.create({
          data: {
            userId: referrer.id,
            packageRequestId: requestId,
            type: 'direct_commission',
            amount: packageRequest.package.package_direct_commission,
            status: 'pending'
          }
        });
        console.log(`✅ Created direct commission for referrer: ${referrer.username}`);
      }
    }

    // Step 5: Update package request status
    console.log('\n5️⃣ Updating package request status...');
    
    await prisma.packageRequest.update({
      where: { id: requestId },
      data: {
        status: 'approved',
        updatedAt: new Date()
      }
    });

    console.log('✅ Package request status updated to approved');

    // Step 6: Verify the final state
    console.log('\n6️⃣ Verifying final state...');
    
    const finalState = await prisma.packageRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            username: true,
            currentPackageId: true,
            packageId: true
          }
        },
        package: {
          select: {
            package_name: true
          }
        },
        earnings: {
          select: {
            id: true,
            type: true,
            amount: true,
            status: true
          }
        }
      }
    });

    console.log('Final state:', {
      requestStatus: finalState.status,
      userPackage: finalState.user.currentPackageId,
      earningsCount: finalState.earnings.length,
      earnings: finalState.earnings.map(e => ({
        type: e.type,
        amount: e.amount,
        status: e.status
      }))
    });

    console.log('\n🎉 Approval process completed successfully!');

  } catch (error) {
    console.error('❌ Error during approval:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testApproveRequest544();





