const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetUserPassword() {
  try {
    console.log('Resetting password for abubakar786...');
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash('786ninja', 12);
    
    // Update the user's password
    const result = await prisma.user.update({
      where: { username: 'abubakar786' },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Password updated successfully for user:', result.username);
    
    // Verify the password works
    const user = await prisma.user.findUnique({
      where: { username: 'abubakar786' },
      select: { password: true }
    });
    
    const passwordValid = await bcrypt.compare('786ninja', user.password);
    console.log('✅ Password verification:', passwordValid ? 'SUCCESS' : 'FAILED');
    
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetUserPassword();
