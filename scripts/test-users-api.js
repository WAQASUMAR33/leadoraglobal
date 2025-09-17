const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUsersAPI() {
  try {
    console.log('Testing users API...');
    
    // Test the same query that the API uses
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullname: true,
        username: true,
        email: true,
        phoneNumber: true,
        status: true,
        balance: true,
        points: true,
        referredBy: true,
        referralCount: true,
        totalEarnings: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    
    console.log(`Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.fullname} (${user.username}) - ${user.status} - Balance: ${user.balance}`);
    });
    
  } catch (error) {
    console.error('Error testing users API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUsersAPI();
