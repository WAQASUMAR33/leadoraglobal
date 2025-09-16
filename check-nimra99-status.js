// Check the status of nimra99 package request
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkNimra99Status() {
  try {
    console.log('🔍 Checking nimra99 package request status...\n');

    // Find the user first
    const user = await prisma.user.findUnique({
      where: { username: 'nimra99' },
      select: {
        id: true,
        username: true,
        fullname: true,
        status: true,
        currentPackageId: true,
        rankId: true,
        balance: true
      }
    });

    if (!user) {
      console.log('❌ User nimra99 not found!');
      return;
    }

    console.log('👤 User found:', {
      id: user.id,
      username: user.username,
      fullname: user.fullname,
      status: user.status,
      currentPackageId: user.currentPackageId,
      rankId: user.rankId,
      balance: user.balance
    });

    // Find package requests for this user
    const packageRequests = await prisma.packageRequest.findMany({
      where: { userId: user.id },
      include: {
        package: {
          select: {
            id: true,
            package_name: true,
            package_amount: true,
            status: true
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            fullname: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n📦 Found ${packageRequests.length} package requests:`);
    packageRequests.forEach((request, index) => {
      console.log(`\n${index + 1}. Request ID: ${request.id}`);
      console.log(`   Status: ${request.status}`);
      console.log(`   Package: ${request.package.package_name} (ID: ${request.package.id})`);
      console.log(`   Package Price: ${request.package.package_amount}`);
      console.log(`   Package Status: ${request.package.status}`);
      console.log(`   User Status: ${request.user.status}`);
      console.log(`   Created: ${request.createdAt}`);
      console.log(`   Updated: ${request.updatedAt}`);
      console.log(`   Admin Notes: ${request.adminNotes || 'None'}`);
    });

    // Check for any earnings related to these requests
    const earnings = await prisma.earnings.findMany({
      where: {
        userId: user.id
      },
      include: {
        packageRequest: {
          select: {
            id: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n💰 Found ${earnings.length} earnings records:`);
    earnings.forEach((earning, index) => {
      console.log(`\n${index + 1}. Earning ID: ${earning.id}`);
      console.log(`   Type: ${earning.type}`);
      console.log(`   Amount: ${earning.amount}`);
      console.log(`   Status: ${earning.status}`);
      console.log(`   Package Request ID: ${earning.packageRequestId}`);
      console.log(`   Package Request Status: ${earning.packageRequest?.status}`);
      console.log(`   Created: ${earning.createdAt}`);
    });

    // Check if there are any pending requests that should be approved
    const pendingRequests = packageRequests.filter(req => req.status === 'pending');
    if (pendingRequests.length > 0) {
      console.log(`\n⚠️  Found ${pendingRequests.length} pending requests that might need approval:`);
      pendingRequests.forEach((request, index) => {
        console.log(`\n${index + 1}. Request ID: ${request.id}`);
        console.log(`   Package: ${request.package.package_name}`);
        console.log(`   Package Status: ${request.package.status}`);
        console.log(`   User Status: ${request.user.status}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking nimra99 status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkNimra99Status();
