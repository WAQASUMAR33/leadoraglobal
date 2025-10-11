import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    console.log('Database URL from env:', process.env.DATABASE_URL ? 'Set ✅' : 'NOT SET ❌');
    
    // Try to connect
    await prisma.$connect();
    console.log('✅ Database connected successfully!');
    
    // Try a simple query
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database`);
    
    // Test if we can query
    const testUser = await prisma.user.findFirst();
    console.log('✅ Sample user:', testUser ? testUser.username : 'No users');
    
    console.log('\n🎉 DATABASE CONNECTION IS WORKING!');
    
  } catch (error) {
    console.error('❌ DATABASE CONNECTION FAILED:');
    console.error('Error Name:', error.name);
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    
    if (error.message.includes("Can't reach database server")) {
      console.error('\n🔴 DIAGNOSIS: Database server is not reachable');
      console.error('Possible fixes:');
      console.error('1. Check if MySQL server is running at 148.222.53.5:3306');
      console.error('2. Verify firewall/network settings');
      console.error('3. Check if IP is whitelisted');
      console.error('4. Verify DATABASE_URL in .env file');
      console.error('5. Check hosting provider status');
    }
    
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

