const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixFailedPackageRequest2355() {
  try {
    console.log('🔧 FIXING FAILED PACKAGE REQUEST 2355');
    console.log('====================================\n');

    // First, let's check the current status
    const request = await prisma.packageRequest.findUnique({
      where: { id: 2355 },
      include: {
        user: {
          select: {
            username: true,
            fullname: true,
            currentPackage: {
              select: {
                package_name: true
              }
            }
          }
        },
        package: {
          select: {
            package_name: true
          }
        }
      }
    });

    if (!request) {
      console.log('❌ Package request 2355 not found.');
      return;
    }

    console.log('📊 CURRENT STATUS:');
    console.log('==================');
    console.log(`Request ID: ${request.id}`);
    console.log(`Status: ${request.status}`);
    console.log(`User: ${request.user.username} (${request.user.fullname})`);
    console.log(`Package: ${request.package.package_name}`);
    console.log(`User's Current Package: ${request.user.currentPackage?.package_name || 'No Package'}`);
    console.log('');

    // Check if commissions were distributed
    const earnings = await prisma.earnings.findMany({
      where: {
        packageRequestId: 2355
      },
      include: {
        user: { select: { username: true } }
      }
    });

    console.log('💰 COMMISSION STATUS:');
    console.log('=====================');
    if (earnings.length > 0) {
      console.log(`✅ ${earnings.length} commissions were successfully distributed:`);
      earnings.forEach((earning, index) => {
        console.log(`   ${index + 1}. ${earning.user.username}: $${earning.amount} (${earning.type})`);
      });
      
      const totalCommissions = earnings.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      console.log(`   Total: $${totalCommissions.toFixed(2)}`);
    } else {
      console.log('❌ No commissions found for this request.');
    }
    console.log('');

    // The issue is that commissions were distributed but the request status is still "failed"
    // We need to update the status to "approved" since the process actually succeeded
    console.log('🔧 APPLYING FIX:');
    console.log('=================');
    
    if (earnings.length > 0) {
      console.log('✅ Commissions were distributed successfully');
      console.log('✅ This means the package approval process actually worked');
      console.log('🔧 Updating request status from "failed" to "approved"...');
      
      try {
        await prisma.packageRequest.update({
          where: { id: 2355 },
          data: {
            status: 'approved',
            adminNotes: 'Fixed: Commissions were successfully distributed, status updated to approved',
            updatedAt: new Date()
          }
        });
        
        console.log('✅ Successfully updated request status to "approved"');
        console.log('');
        
        // Verify the fix
        const updatedRequest = await prisma.packageRequest.findUnique({
          where: { id: 2355 },
          select: {
            status: true,
            admin_notes: true,
            updatedAt: true
          }
        });
        
        console.log('🔍 VERIFICATION:');
        console.log('================');
        console.log(`✅ New Status: ${updatedRequest.status}`);
        console.log(`✅ Admin Notes: ${updatedRequest.adminNotes}`);
        console.log(`✅ Updated At: ${updatedRequest.updatedAt}`);
        console.log('');
        
        console.log('🎉 PACKAGE REQUEST 2355 FIXED!');
        console.log('===============================');
        console.log('✅ Status: failed → approved');
        console.log('✅ Commissions: Already distributed correctly');
        console.log('✅ User: Should have received package benefits');
        console.log('✅ System: Now shows correct status');
        
      } catch (updateError) {
        console.log('❌ Error updating request status:');
        console.log(`   ${updateError.message}`);
      }
      
    } else {
      console.log('❌ No commissions found - this request may have actually failed');
      console.log('💡 Manual investigation required');
    }

    // Also check if there are other similar issues
    console.log('\n🔍 CHECKING FOR OTHER SIMILAR ISSUES:');
    console.log('=====================================');
    
    const failedRequests = await prisma.packageRequest.findMany({
      where: {
        status: 'failed'
      },
      include: {
        user: { select: { username: true } },
        package: { select: { package_name: true } }
      }
    });

    console.log(`📊 Found ${failedRequests.length} failed requests:`);
    
    for (const failedReq of failedRequests) {
      const reqEarnings = await prisma.earnings.findMany({
        where: {
          packageRequestId: failedReq.id
        }
      });
      
      if (reqEarnings.length > 0) {
        console.log(`⚠️  Request ${failedReq.id} (${failedReq.user.username}): FAILED but has ${reqEarnings.length} commission records`);
        console.log(`   This may need the same fix as request 2355`);
      } else {
        console.log(`✅ Request ${failedReq.id} (${failedReq.user.username}): Legitimately failed (no commissions)`);
      }
    }

  } catch (error) {
    console.error('❌ Error fixing failed package request 2355:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixFailedPackageRequest2355();
