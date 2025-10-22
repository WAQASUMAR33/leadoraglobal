import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('🧪 Creating test data for package approval testing...');

    // 1. Create test users
    console.log('\n👥 Creating test users...');
    
    const testUsers = [
      {
        username: 'testuser1',
        fullname: 'Test User 1',
        email: 'testuser1@test.com',
        password: await bcrypt.hash('test123', 10),
        status: 'active',
        points: 5000,
        balance: 100000,
        rankId: 2, // Manager
        referredBy: null // Root user
      },
      {
        username: 'testuser2',
        fullname: 'Test User 2', 
        email: 'testuser2@test.com',
        password: await bcrypt.hash('test123', 10),
        status: 'active',
        points: 3000,
        balance: 50000,
        rankId: 1, // Consultant
        referredBy: 'testuser1'
      },
      {
        username: 'testuser3',
        fullname: 'Test User 3',
        email: 'testuser3@test.com', 
        password: await bcrypt.hash('test123', 10),
        status: 'active',
        points: 2000,
        balance: 30000,
        rankId: 1, // Consultant
        referredBy: 'testuser1'
      }
    ];

    const createdUsers = [];
    for (const userData of testUsers) {
      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { username: userData.username }
      });

      if (!existing) {
        const user = await prisma.user.create({
          data: userData
        });
        createdUsers.push(user);
        console.log(`✅ Created user: ${user.username} (${user.fullname}) - Rank: ${userData.rankId === 1 ? 'Consultant' : 'Manager'}`);
      } else {
        createdUsers.push(existing);
        console.log(`ℹ️ User already exists: ${existing.username}`);
      }
    }

    // 2. Create test package requests
    console.log('\n📦 Creating test package requests...');
    
    const testRequests = [
      {
        userId: createdUsers[1].id, // testuser2
        packageId: 8, // Combo Package (should get Diamond rank)
        transactionId: 'TEST_PKG8_' + Date.now(),
        transactionReceipt: 'Test receipt for Package ID 8 - should get Diamond rank',
        notes: 'Test request for Package ID 8 - Diamond rank assignment',
        status: 'pending'
      },
      {
        userId: createdUsers[2].id, // testuser3  
        packageId: 7, // Master Package (should get Sapphire Manager rank)
        transactionId: 'TEST_PKG7_' + Date.now(),
        transactionReceipt: 'Test receipt for Package ID 7 - should get Sapphire Manager rank',
        notes: 'Test request for Package ID 7 - Sapphire Manager rank assignment',
        status: 'pending'
      }
    ];

    const createdRequests = [];
    for (const requestData of testRequests) {
      const request = await prisma.packageRequest.create({
        data: requestData
      });
      createdRequests.push(request);
      
      const packageName = requestData.packageId === 8 ? 'Combo Package' : 'Master Package';
      const expectedRank = requestData.packageId === 8 ? 'Diamond' : 'Sapphire Manager';
      const user = createdUsers.find(u => u.id === requestData.userId);
      
      console.log(`✅ Created request ID ${request.id}: ${user.username} → ${packageName} (should get ${expectedRank} rank)`);
    }

    console.log('\n🎉 Test data created successfully!');
    console.log('\n📋 Test Data Summary:');
    console.log(`👥 Users created: ${createdUsers.length}`);
    console.log(`📦 Package requests created: ${createdRequests.length}`);
    
    console.log('\n🔑 Test User Credentials:');
    createdUsers.forEach(user => {
      console.log(`   Username: ${user.username} | Password: test123`);
    });

    console.log('\n🧪 Test Package Requests:');
    createdRequests.forEach((req, index) => {
      const user = createdUsers.find(u => u.id === req.userId);
      const packageName = req.packageId === 8 ? 'Combo Package' : 'Master Package';
      const expectedRank = req.packageId === 8 ? 'Diamond' : 'Sapphire Manager';
      console.log(`   ${index + 1}. Request ID ${req.id}: ${user.username} → ${packageName} (should get ${expectedRank})`);
    });

    console.log('\n🚀 Next Steps:');
    console.log('1. Use the test user credentials to login');
    console.log('2. Approve the package requests from admin panel');
    console.log('3. Verify that users get the correct ranks:');
    console.log('   - Package ID 8 (Combo Package) → Diamond rank');
    console.log('   - Package ID 7 (Master Package) → Sapphire Manager rank');

    return {
      users: createdUsers,
      requests: createdRequests
    };

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();

