import prisma from '../src/lib/prisma.js';
import { approvePackageRequest } from '../src/lib/packageApproval.js';

async function testAdminApproval() {
  try {
    console.log('🧪 Testing admin package approval...');
    
    // Get a pending package request
    const pendingRequest = await prisma.packageRequest.findFirst({
      where: { status: 'pending' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullname: true
          }
        },
        package: {
          select: {
            id: true,
            package_name: true,
            package_amount: true
          }
        }
      }
    });
    
    if (!pendingRequest) {
      console.log('❌ No pending package requests found');
      return;
    }
    
    console.log('\n📋 Found Pending Request:');
    console.log(`   Request ID: ${pendingRequest.id}`);
    console.log(`   User: ${pendingRequest.user.username} (${pendingRequest.user.fullname})`);
    console.log(`   Package: ${pendingRequest.package.package_name}`);
    console.log(`   Amount: $${pendingRequest.package.package_amount}`);
    
    console.log('\n🚀 Attempting to approve via admin function...');
    
    const result = await approvePackageRequest(pendingRequest.id);
    
    console.log('\n✅ Approval Result:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('\n❌ Error during admin approval test:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminApproval();

