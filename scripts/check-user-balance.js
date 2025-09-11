const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserBalance() {
  try {
    console.log('🔍 Checking user balance...\n');

    // Check by user ID 1
    const userById = await prisma.user.findUnique({
      where: { id: 1 },
      select: {
        id: true,
        username: true,
        fullname: true,
        balance: true,
        totalEarnings: true,
        points: true
      }
    });

    if (userById) {
      console.log('👤 User by ID 1:');
      console.log(`   ID: ${userById.id}`);
      console.log(`   Username: ${userById.username}`);
      console.log(`   Full Name: ${userById.fullname}`);
      console.log(`   Balance: ${userById.balance}`);
      console.log(`   Total Earnings: ${userById.totalEarnings}`);
      console.log(`   Points: ${userById.points}`);
      console.log('');
    } else {
      console.log('❌ No user found with ID 1\n');
    }

    // Check by username "waqasumar33"
    const userByUsername = await prisma.user.findUnique({
      where: { username: 'waqasumar33' },
      select: {
        id: true,
        username: true,
        fullname: true,
        balance: true,
        totalEarnings: true,
        points: true
      }
    });

    if (userByUsername) {
      console.log('👤 User by username "waqasumar33":');
      console.log(`   ID: ${userByUsername.id}`);
      console.log(`   Username: ${userByUsername.username}`);
      console.log(`   Full Name: ${userByUsername.fullname}`);
      console.log(`   Balance: ${userByUsername.balance}`);
      console.log(`   Total Earnings: ${userByUsername.totalEarnings}`);
      console.log(`   Points: ${userByUsername.points}`);
      console.log('');
    } else {
      console.log('❌ No user found with username "waqasumar33"\n');
    }

    // Get all users to see what's available
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullname: true,
        balance: true
      },
      orderBy: { id: 'asc' },
      take: 10
    });

    console.log('📋 First 10 users in database:');
    allUsers.forEach(user => {
      console.log(`   ID: ${user.id}, Username: ${user.username}, Balance: ${user.balance}`);
    });

  } catch (error) {
    console.error('❌ Error checking user balance:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserBalance();
