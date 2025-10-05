const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEarningsWithPackageIds() {
  try {
    console.log('🔍 CHECKING EARNINGS WITH PACKAGE REQUEST IDS');
    console.log('=============================================\n');

    // Check earnings that have packageRequestId set
    const earningsWithPackageIds = await prisma.earnings.findMany({
      where: {
        packageRequestId: { not: null }
      },
      include: {
        user: { select: { username: true } },
        packageRequest: {
          include: {
            user: { select: { username: true } },
            package: { select: { package_name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log(`📊 Earnings with package request IDs: ${earningsWithPackageIds.length}`);
    console.log('');

    if (earningsWithPackageIds.length > 0) {
      console.log('✅ EARNINGS WITH PACKAGE REQUEST IDS:');
      console.log('=====================================');
      earningsWithPackageIds.forEach((earning, index) => {
        console.log(`${index + 1}. ${earning.user.username}: ${earning.amount} (${earning.type})`);
        console.log(`   Package Request ID: ${earning.packageRequestId}`);
        console.log(`   Package Buyer: ${earning.packageRequest?.user?.username || 'N/A'}`);
        console.log(`   Package: ${earning.packageRequest?.package?.package_name || 'N/A'}`);
        console.log(`   Description: ${earning.description}`);
        console.log(`   Date: ${earning.createdAt}`);
        console.log('');
      });
    } else {
      console.log('❌ No earnings found with package request IDs');
    }

    // Check earnings without package request IDs
    const earningsWithoutPackageIds = await prisma.earnings.findMany({
      where: {
        packageRequestId: null
      },
      include: {
        user: { select: { username: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log(`📊 Earnings without package request IDs: ${earningsWithoutPackageIds.length}`);
    console.log('');

    if (earningsWithoutPackageIds.length > 0) {
      console.log('❌ EARNINGS WITHOUT PACKAGE REQUEST IDS:');
      console.log('========================================');
      earningsWithoutPackageIds.forEach((earning, index) => {
        console.log(`${index + 1}. ${earning.user.username}: ${earning.amount} (${earning.type})`);
        console.log(`   Description: ${earning.description}`);
        console.log(`   Date: ${earning.createdAt}`);
        console.log('');
      });
    }

    // Check specifically for package request 2349
    console.log('🔍 CHECKING EARNINGS FOR PACKAGE REQUEST 2349:');
    console.log('==============================================');
    
    const earningsForRequest2349 = await prisma.earnings.findMany({
      where: {
        packageRequestId: 2349
      },
      include: {
        user: { select: { username: true } },
        packageRequest: {
          include: {
            user: { select: { username: true } },
            package: { select: { package_name: true } }
          }
        }
      }
    });

    if (earningsForRequest2349.length > 0) {
      console.log(`✅ Found ${earningsForRequest2349.length} earnings for package request 2349:`);
      earningsForRequest2349.forEach((earning, index) => {
        console.log(`${index + 1}. ${earning.user.username}: ${earning.amount} (${earning.type})`);
        console.log(`   Package Buyer: ${earning.packageRequest?.user?.username || 'N/A'}`);
        console.log(`   Package: ${earning.packageRequest?.package?.package_name || 'N/A'}`);
        console.log(`   Description: ${earning.description}`);
        console.log(`   Date: ${earning.createdAt}`);
      });
    } else {
      console.log('❌ No earnings found for package request 2349');
    }

    // Check recent package requests and their associated earnings
    console.log('\n🔍 RECENT PACKAGE REQUESTS AND EARNINGS:');
    console.log('=========================================');
    
    const recentPackageRequests = await prisma.packageRequest.findMany({
      where: { status: 'approved' },
      include: {
        user: { select: { username: true } },
        package: { select: { package_name: true } },
        earnings: {
          include: {
            user: { select: { username: true } }
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    recentPackageRequests.forEach((request, index) => {
      console.log(`${index + 1}. Package Request ${request.id}:`);
      console.log(`   Buyer: ${request.user.username}`);
      console.log(`   Package: ${request.package.package_name}`);
      console.log(`   Approved: ${request.updatedAt}`);
      console.log(`   Earnings Records: ${request.earnings.length}`);
      
      if (request.earnings.length > 0) {
        request.earnings.forEach(earning => {
          console.log(`     - ${earning.user.username}: ${earning.amount} (${earning.type})`);
        });
      } else {
        console.log('     - No earnings records found');
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error checking earnings with package IDs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEarningsWithPackageIds();
