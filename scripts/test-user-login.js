const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testUserLogin() {
  try {
    console.log('Testing user login for accounts: abubakar33 and abubakar786');
    
    // Check if users exist
    const user1 = await prisma.user.findUnique({
      where: { username: 'abubakar33' },
      select: {
        id: true,
        username: true,
        fullname: true,
        status: true,
        createdAt: true
      }
    });
    
    const user2 = await prisma.user.findUnique({
      where: { username: 'abubakar786' },
      select: {
        id: true,
        username: true,
        fullname: true,
        status: true,
        createdAt: true
      }
    });
    
    console.log('\nUser 1 (abubakar33):', user1);
    console.log('User 2 (abubakar786):', user2);
    
    if (!user1) {
      console.log('\n❌ User abubakar33 not found in database');
    } else {
      console.log('✅ User abubakar33 exists');
    }
    
    if (!user2) {
      console.log('❌ User abubakar786 not found in database');
    } else {
      console.log('✅ User abubakar786 exists');
    }
    
    // Test password verification for existing users
    if (user1) {
      const fullUser1 = await prisma.user.findUnique({
        where: { username: 'abubakar33' },
        select: { password: true }
      });
      
      const passwordValid = await bcrypt.compare('786ninja', fullUser1.password);
      console.log('Password for abubakar33 is valid:', passwordValid);
    }
    
    if (user2) {
      const fullUser2 = await prisma.user.findUnique({
        where: { username: 'abubakar786' },
        select: { password: true }
      });
      
      const passwordValid = await bcrypt.compare('786ninja', fullUser2.password);
      console.log('Password for abubakar786 is valid:', passwordValid);
    }
    
  } catch (error) {
    console.error('Error testing user login:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUserLogin();
