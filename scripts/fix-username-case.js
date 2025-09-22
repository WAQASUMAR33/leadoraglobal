const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUsernameCase() {
  try {
    console.log('Fixing username case sensitivity...');
    
    // Update Abubakar786 to abubakar786
    const result = await prisma.user.update({
      where: { username: 'Abubakar786' },
      data: { username: 'abubakar786' }
    });
    
    console.log('✅ Username updated successfully:', result.username);
    
    // Verify the change
    const updatedUser = await prisma.user.findUnique({
      where: { username: 'abubakar786' },
      select: {
        id: true,
        username: true,
        fullname: true,
        status: true
      }
    });
    
    console.log('✅ Verification - User found:', updatedUser);
    
  } catch (error) {
    console.error('Error fixing username case:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUsernameCase();
