import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecentRequests() {
  try {
    const requests = await prisma.packageRequest.findMany({
      where: {
        status: 'approved',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        user: { select: { username: true, fullname: true } },
        package: { select: { package_name: true, id: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log('Recent approved package requests (last 24 hours):');
    if (requests.length === 0) {
      console.log('No recent approved requests found.');
    } else {
      requests.forEach((req, index) => {
        console.log(`\n${index + 1}. Request ID: ${req.id}`);
        console.log(`   User: ${req.user.username} (${req.user.fullname})`);
        console.log(`   Package: ${req.package.package_name} (ID: ${req.package.id})`);
        console.log(`   Status: ${req.status}`);
        console.log(`   Approved: ${req.updatedAt.toLocaleString()}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking recent requests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentRequests();

