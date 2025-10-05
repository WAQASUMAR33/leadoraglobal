const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugEarningsTable() {
  try {
    console.log('🔍 DEBUGGING EARNINGS TABLE');
    console.log('===========================\n');

    // Check total earnings records
    const totalEarnings = await prisma.earnings.count();
    console.log(`📊 Total earnings records: ${totalEarnings}`);

    if (totalEarnings === 0) {
      console.log('❌ No earnings records found at all!');
      console.log('💡 This suggests the commission system is not working');
      return;
    }

    // Check earnings by type
    console.log('\n📊 EARNINGS BY TYPE:');
    console.log('====================');
    
    const earningsByType = await prisma.earnings.groupBy({
      by: ['type'],
      _count: {
        type: true
      },
      _sum: {
        amount: true
      }
    });

    earningsByType.forEach(earning => {
      console.log(`${earning.type}: ${earning._count.type} records, Total: ${earning._sum.amount || 0}`);
    });

    // Check recent earnings
    console.log('\n📊 RECENT EARNINGS (Last 10):');
    console.log('==============================');
    
    const recentEarnings = await prisma.earnings.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { username: true } }
      }
    });

    recentEarnings.forEach((earning, index) => {
      console.log(`${index + 1}. ${earning.user.username}: ${earning.amount} (${earning.type})`);
      console.log(`   Date: ${earning.createdAt}`);
      console.log(`   Description: ${earning.description}`);
      console.log('');
    });

    // Check earnings for package request 2349 specifically
    console.log('🔍 CHECKING EARNINGS FOR PACKAGE REQUEST 2349:');
    console.log('===============================================');
    
    const earningsForRequest = await prisma.earnings.findMany({
      where: {
        description: { contains: '2349' }
      },
      include: {
        user: { select: { username: true } }
      }
    });

    if (earningsForRequest.length > 0) {
      console.log(`✅ Found ${earningsForRequest.length} earnings records for package request 2349:`);
      earningsForRequest.forEach(earning => {
        console.log(`   ${earning.user.username}: ${earning.amount} (${earning.type})`);
        console.log(`   Description: ${earning.description}`);
        console.log(`   Date: ${earning.createdAt}`);
      });
    } else {
      console.log('❌ No earnings records found for package request 2349');
    }

    // Check if there are any earnings with package request IDs in description
    console.log('\n🔍 CHECKING EARNINGS WITH PACKAGE REQUEST IDS:');
    console.log('===============================================');
    
    const earningsWithPackageIds = await prisma.earnings.findMany({
      where: {
        description: { contains: 'package' }
      },
      include: {
        user: { select: { username: true } }
      },
      take: 5
    });

    if (earningsWithPackageIds.length > 0) {
      console.log(`✅ Found ${earningsWithPackageIds.length} earnings with package-related descriptions:`);
      earningsWithPackageIds.forEach(earning => {
        console.log(`   ${earning.user.username}: ${earning.amount} (${earning.type})`);
        console.log(`   Description: ${earning.description}`);
      });
    } else {
      console.log('❌ No earnings with package-related descriptions found');
    }

    // Check the schema of earnings table
    console.log('\n🔍 EARNINGS TABLE SCHEMA:');
    console.log('=========================');
    
    // Get a sample record to see the structure
    const sampleEarning = await prisma.earnings.findFirst();
    if (sampleEarning) {
      console.log('Sample earnings record structure:');
      console.log(`   ID: ${sampleEarning.id}`);
      console.log(`   User ID: ${sampleEarning.userId}`);
      console.log(`   Amount: ${sampleEarning.amount}`);
      console.log(`   Type: ${sampleEarning.type}`);
      console.log(`   Description: ${sampleEarning.description}`);
      console.log(`   Created At: ${sampleEarning.createdAt}`);
      console.log(`   Updated At: ${sampleEarning.updatedAt}`);
    }

  } catch (error) {
    console.error('❌ Error debugging earnings table:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugEarningsTable();
