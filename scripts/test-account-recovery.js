const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAccountRecovery() {
  try {
    console.log('🧪 Testing Account Recovery System...\n');

    // 1. Check current account status
    console.log('📊 Current Account Status:');
    
    const suspendedUsers = await prisma.user.findMany({
      where: {
        status: {
          in: ['suspended', 'inactive', 'deactivated', 'banned']
        }
      },
      select: {
        id: true,
        username: true,
        fullname: true,
        status: true,
        email: true
      }
    });

    const inactiveAdmins = await prisma.admin.findMany({
      where: {
        isActive: false
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true
      }
    });

    console.log(`   👥 Suspended Users: ${suspendedUsers.length}`);
    suspendedUsers.forEach(user => {
      console.log(`      - ${user.username} (${user.fullname}) - Status: ${user.status}`);
    });

    console.log(`   👨‍💼 Inactive Admins: ${inactiveAdmins.length}`);
    inactiveAdmins.forEach(admin => {
      console.log(`      - ${admin.username} (${admin.fullName})`);
    });

    // 2. Test API endpoint
    console.log('\n🌐 Testing Recovery API Endpoint...');
    
    const recoveryResponse = await fetch('http://localhost:3000/api/admin/recover-accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountType: 'all',
        forceRecovery: false
      })
    });

    if (recoveryResponse.ok) {
      const result = await recoveryResponse.json();
      console.log('✅ Recovery API Response:');
      console.log(`   Message: ${result.message}`);
      console.log(`   Summary:`, result.summary);
      
      if (result.userResults) {
        console.log(`   User Recovery Details: ${result.userResults.length} results`);
      }
      if (result.adminResults) {
        console.log(`   Admin Recovery Details: ${result.adminResults.length} results`);
      }
    } else {
      console.log('❌ Recovery API Failed:', await recoveryResponse.text());
    }

    // 3. Verify recovery results
    console.log('\n🔍 Verifying Recovery Results...');
    
    const remainingSuspendedUsers = await prisma.user.findMany({
      where: {
        status: {
          in: ['suspended', 'inactive', 'deactivated', 'banned']
        }
      },
      select: {
        id: true,
        username: true,
        status: true
      }
    });

    const remainingInactiveAdmins = await prisma.admin.findMany({
      where: {
        isActive: false
      },
      select: {
        id: true,
        username: true
      }
    });

    console.log(`   👥 Remaining Suspended Users: ${remainingSuspendedUsers.length}`);
    console.log(`   👨‍💼 Remaining Inactive Admins: ${remainingInactiveAdmins.length}`);

    // 4. Test package-requests recovery endpoint
    console.log('\n📦 Testing Package Requests Recovery...');
    
    const packageRecoveryResponse = await fetch('http://localhost:3000/api/package-requests/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'pending',
        recoverAccounts: true
      })
    });

    if (packageRecoveryResponse.ok) {
      const result = await packageRecoveryResponse.json();
      console.log('✅ Package Requests Recovery Response:');
      console.log(`   Message: ${result.message}`);
      if (result.recoveryResult) {
        console.log(`   Recovery Summary:`, result.recoveryResult.summary);
      }
    } else {
      console.log('❌ Package Requests Recovery Failed:', await packageRecoveryResponse.text());
    }

    console.log('\n🎉 Account Recovery Test Completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAccountRecovery();






