const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsernames() {
  try {
    console.log('🔍 CHECKING USERNAME CASE SENSITIVITY');
    console.log('=====================================\n');

    // Check users with kalsoom in username
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: 'kalsoom' } },
          { username: { contains: 'Kalsoom' } }
        ]
      },
      select: {
        username: true,
        referredBy: true
      }
    });

    console.log('Users with kalsoom in username:');
    users.forEach(u => console.log(`${u.username} -> ${u.referredBy}`));
    console.log('');

    // Check the specific referral chain
    const testUser = await prisma.user.findUnique({
      where: { username: 'ghulammurtaza' },
      select: { username: true, referredBy: true }
    });

    if (testUser) {
      console.log(`Test user: ${testUser.username} -> ${testUser.referredBy}`);
      
      const directReferrer = await prisma.user.findUnique({
        where: { username: testUser.referredBy },
        select: { username: true, referredBy: true }
      });

      if (directReferrer) {
        console.log(`Direct referrer: ${directReferrer.username} -> ${directReferrer.referredBy}`);
        
        const uplineUser = await prisma.user.findUnique({
          where: { username: directReferrer.referredBy },
          select: { username: true, referredBy: true }
        });

        if (uplineUser) {
          console.log(`Upline user: ${uplineUser.username} -> ${uplineUser.referredBy}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error checking usernames:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsernames();
