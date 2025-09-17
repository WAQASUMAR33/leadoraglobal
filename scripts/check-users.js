const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Checking users in database...');
    
    const userCount = await prisma.user.count();
    console.log(`Total users in database: ${userCount}`);
    
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          fullname: true,
          username: true,
          email: true,
          role: true,
          status: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      });
      
      console.log('\nRecent users:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.fullname} (${user.username}) - ${user.role} - ${user.status}`);
      });
    } else {
      console.log('No users found in database.');
    }
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
