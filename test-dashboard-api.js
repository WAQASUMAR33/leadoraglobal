const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDashboardAPI() {
  try {
    console.log('Testing Dashboard API logic...');
    
    // Test with a known user ID (from the earnings test)
    const userId = 1;
    console.log('Testing with user ID:', userId);
    
    // Test user fetch
    console.log('1. Testing user fetch...');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullname: true,
        username: true,
        balance: true,
        points: true,
        totalEarnings: true,
        referralCount: true,
        currentPackageId: true,
        packageExpiryDate: true,
        createdAt: true,
        rank: {
          select: {
            id: true,
            rank_name: true,
            rank_level: true
          }
        }
      }
    });
    console.log('User found:', user ? 'Yes' : 'No');
    
    // Test direct earnings
    console.log('2. Testing direct earnings...');
    const directEarnings = await prisma.earnings.aggregate({
      where: {
        userId: userId,
        type: 'direct_commission'
      },
      _sum: {
        amount: true
      }
    });
    console.log('Direct earnings result:', directEarnings);
    
    // Test indirect earnings
    console.log('3. Testing indirect earnings...');
    const indirectEarnings = await prisma.earnings.aggregate({
      where: {
        userId: userId,
        type: 'indirect_commission'
      },
      _sum: {
        amount: true
      }
    });
    console.log('Indirect earnings result:', indirectEarnings);
    
    // Test orders count
    console.log('4. Testing orders count...');
    const ordersCount = await prisma.order.count({
      where: { userId: userId }
    });
    console.log('Orders count:', ordersCount);
    
    console.log('All tests passed!');
    
  } catch (error) {
    console.error('Error in dashboard API test:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboardAPI();
