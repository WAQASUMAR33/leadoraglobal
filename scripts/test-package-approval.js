import { PrismaClient } from '@prisma/client';
import { approvePackageRequest } from '../src/lib/packageApproval.js';

const prisma = new PrismaClient();

async function testPackageApproval() {
  try {
    // Find a pending package request with Package ID 8
    const pendingRequest = await prisma.packageRequest.findFirst({
      where: {
        status: 'pending',
        packageId: 8  // Combo Package
      },
      include: {
        user: { select: { username: true, fullname: true, rank: { select: { title: true } } } },
        package: { select: { package_name: true, id: true } }
      }
    });

    if (!pendingRequest) {
      console.log('❌ No pending Package ID 8 requests found.');
      
      // Let's check if there are any pending requests at all
      const anyPending = await prisma.packageRequest.findFirst({
        where: { status: 'pending' },
        include: {
          user: { select: { username: true } },
          package: { select: { package_name: true, id: true } }
        }
      });
      
      if (anyPending) {
        console.log(`Found pending request for Package ID ${anyPending.packageId}: ${anyPending.package.package_name}`);
      } else {
        console.log('No pending requests found at all.');
      }
      return;
    }

    console.log(`\n🧪 Testing package approval for:`);
    console.log(`   User: ${pendingRequest.user.username} (${pendingRequest.user.fullname})`);
    console.log(`   Current Rank: ${pendingRequest.user.rank?.title || 'No Rank'}`);
    console.log(`   Package: ${pendingRequest.package.package_name} (ID: ${pendingRequest.package.id})`);
    console.log(`   Request ID: ${pendingRequest.id}`);

    // Approve the package request
    console.log(`\n🚀 Approving package request...`);
    const result = await approvePackageRequest(pendingRequest.id);
    
    console.log(`\n✅ Approval result:`, result);

    // Check the user's rank after approval
    const updatedUser = await prisma.user.findUnique({
      where: { username: pendingRequest.user.username },
      select: {
        username: true,
        rank: { select: { title: true } },
        currentPackage: { select: { package_name: true } }
      }
    });

    console.log(`\n📊 User after approval:`);
    console.log(`   Username: ${updatedUser.username}`);
    console.log(`   New Rank: ${updatedUser.rank?.title || 'No Rank'}`);
    console.log(`   Current Package: ${updatedUser.currentPackage?.package_name || 'No Package'}`);

    if (updatedUser.rank?.title === 'Diamond') {
      console.log(`\n🎉 SUCCESS: User got Diamond rank as expected!`);
    } else {
      console.log(`\n❌ ISSUE: User got ${updatedUser.rank?.title} instead of Diamond rank!`);
    }

  } catch (error) {
    console.error('❌ Error testing package approval:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPackageApproval();

