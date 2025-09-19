const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testOrphanAccountChecking() {
  try {
    console.log('🧪 Testing Orphan Account Checking System...\n');

    // 1. Check current orphan status
    console.log('📊 Current Orphan Account Status:');
    
    const response = await fetch('http://localhost:3000/api/admin/check-orphan-accounts?type=all');
    
    if (response.ok) {
      const data = await response.json();
      const result = data.result;
      
      console.log('✅ Orphan Check Results:');
      console.log(`   Total Issues: ${result.statistics.totalIssues}`);
      console.log(`   Referral Issues: ${result.statistics.referralIssues}`);
      console.log(`   Package Request Issues: ${result.statistics.packageRequestIssues}`);
      console.log(`   Earnings Issues: ${result.statistics.earningsIssues}`);
      
      if (result.results) {
        const referrals = result.results.referrals;
        console.log('\n🔗 Referral Issues:');
        console.log(`   Orphan Accounts: ${referrals.statistics.orphanAccountsCount}`);
        console.log(`   Circular Referrals: ${referrals.statistics.circularReferralsCount}`);
        console.log(`   Self Referrals: ${referrals.statistics.selfReferralsCount}`);
        console.log(`   Missing Referrers: ${referrals.statistics.missingReferrersCount}`);
        
        if (referrals.orphanAccounts.length > 0) {
          console.log('\n   Orphan Accounts Details:');
          referrals.orphanAccounts.slice(0, 5).forEach(account => {
            console.log(`      - ${account.username} (${account.fullname}) - Referred by: ${account.referredBy} - Issue: ${account.issue}`);
          });
        }
        
        if (referrals.missingReferrers.length > 0) {
          console.log('\n   Missing Referrers:');
          referrals.missingReferrers.slice(0, 5).forEach(referrer => {
            console.log(`      - ${referrer.username} (${referrer.referredUsersCount} users affected)`);
          });
        }
      }
    } else {
      console.log('❌ Failed to check orphan status:', await response.text());
    }

    // 2. Test package-requests integration
    console.log('\n📦 Testing Package Requests Integration...');
    
    const packageResponse = await fetch('http://localhost:3000/api/package-requests/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'pending',
        checkOrphanAccounts: true
      })
    });

    if (packageResponse.ok) {
      const result = await packageResponse.json();
      console.log('✅ Package Requests Orphan Check:');
      console.log(`   Message: ${result.message}`);
      if (result.orphanResult) {
        console.log(`   Total Issues: ${result.orphanResult.summary.totalIssues}`);
        console.log(`   Critical Issues: ${result.orphanResult.summary.criticalIssues}`);
      }
    } else {
      console.log('❌ Package Requests Orphan Check Failed:', await packageResponse.text());
    }

    // 3. Test dry run fix
    console.log('\n🔧 Testing Dry Run Fix...');
    
    const dryRunResponse = await fetch('http://localhost:3000/api/admin/check-orphan-accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkType: 'referrals',
        fixIssues: true,
        dryRun: true
      })
    });

    if (dryRunResponse.ok) {
      const result = await dryRunResponse.json();
      console.log('✅ Dry Run Results:');
      console.log(`   Would Fix: ${result.result.statistics.fixesApplied} issues`);
      console.log(`   Dry Run: ${result.result.dryRun}`);
    } else {
      console.log('❌ Dry Run Failed:', await dryRunResponse.text());
    }

    // 4. Check specific referral issues
    console.log('\n🔍 Checking Specific Referral Issues...');
    
    const referralResponse = await fetch('http://localhost:3000/api/admin/check-orphan-accounts?type=referrals');
    
    if (referralResponse.ok) {
      const data = await referralResponse.json();
      const result = data.result;
      
      console.log('📋 Detailed Referral Analysis:');
      console.log(`   Total Users with Referrals: ${result.statistics.totalUsersWithReferrals}`);
      console.log(`   Valid Referrals: ${result.statistics.validReferralsCount}`);
      console.log(`   Orphan Accounts: ${result.statistics.orphanAccountsCount}`);
      console.log(`   Circular Referrals: ${result.statistics.circularReferralsCount}`);
      console.log(`   Self Referrals: ${result.statistics.selfReferralsCount}`);
      
      if (result.orphanAccounts.length > 0) {
        console.log('\n   High Severity Issues:');
        result.orphanAccounts.filter(a => a.severity === 'high').forEach(account => {
          console.log(`      - ${account.username}: ${account.issue}`);
        });
        
        console.log('\n   Medium Severity Issues:');
        result.orphanAccounts.filter(a => a.severity === 'medium').forEach(account => {
          console.log(`      - ${account.username}: ${account.issue} (Referrer status: ${account.referrerStatus})`);
        });
      }
    }

    // 5. Test database queries directly
    console.log('\n🗄️  Direct Database Queries:');
    
    // Check users with referrals
    const usersWithReferrals = await prisma.user.findMany({
      where: {
        referredBy: {
          not: null
        }
      },
      select: {
        id: true,
        username: true,
        fullname: true,
        referredBy: true,
        status: true
      }
    });

    console.log(`   Users with Referrals: ${usersWithReferrals.length}`);
    
    // Check for invalid referrals
    let invalidReferrals = 0;
    for (const user of usersWithReferrals) {
      if (user.referredBy) {
        const referrer = await prisma.user.findUnique({
          where: { username: user.referredBy }
        });
        if (!referrer) {
          invalidReferrals++;
        }
      }
    }
    
    console.log(`   Invalid Referrals: ${invalidReferrals}`);
    
    // Check orphan package requests
    const orphanPackageRequests = await prisma.packageRequest.findMany({
      where: {
        user: null
      }
    });
    
    console.log(`   Orphan Package Requests: ${orphanPackageRequests.length}`);
    
    // Check orphan earnings
    const orphanEarnings = await prisma.earnings.findMany({
      where: {
        user: null
      }
    });
    
    console.log(`   Orphan Earnings: ${orphanEarnings.length}`);

    console.log('\n🎉 Orphan Account Testing Completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Function to create test data with orphan referrals
async function createTestOrphanData() {
  try {
    console.log('🧪 Creating test orphan data...');
    
    // Create a user that will be deleted to create orphan referrals
    const testReferrer = await prisma.user.create({
      data: {
        fullname: 'Test Referrer',
        username: 'test_referrer',
        password: '$2a$12$hashedpassword',
        email: 'test_referrer@example.com',
        status: 'active'
      }
    });

    // Create users referred by the test referrer
    const referredUsers = [];
    for (let i = 1; i <= 3; i++) {
      const user = await prisma.user.create({
        data: {
          fullname: `Referred User ${i}`,
          username: `referred_user_${i}`,
          password: '$2a$12$hashedpassword',
          email: `referred_user_${i}@example.com`,
          referredBy: 'test_referrer',
          status: 'active'
        }
      });
      referredUsers.push(user);
    }

    // Create a self-referral
    const selfReferralUser = await prisma.user.create({
      data: {
        fullname: 'Self Referral User',
        username: 'self_referral_user',
        password: '$2a$12$hashedpassword',
        email: 'self_referral@example.com',
        referredBy: 'self_referral_user', // Self referral
        status: 'active'
      }
    });

    // Create circular referrals
    const user1 = await prisma.user.create({
      data: {
        fullname: 'Circular User 1',
        username: 'circular_user_1',
        password: '$2a$12$hashedpassword',
        email: 'circular1@example.com',
        status: 'active'
      }
    });

    const user2 = await prisma.user.create({
      data: {
        fullname: 'Circular User 2',
        username: 'circular_user_2',
        password: '$2a$12$hashedpassword',
        email: 'circular2@example.com',
        referredBy: 'circular_user_1',
        status: 'active'
      }
    });

    // Update user1 to refer to user2 (creating circular referral)
    await prisma.user.update({
      where: { id: user1.id },
      data: { referredBy: 'circular_user_2' }
    });

    // Now delete the test referrer to create orphan referrals
    await prisma.user.delete({
      where: { id: testReferrer.id }
    });

    console.log('✅ Test orphan data created:');
    console.log(`   - Deleted referrer: ${testReferrer.username}`);
    console.log(`   - Orphan users: ${referredUsers.length}`);
    console.log(`   - Self referral user: ${selfReferralUser.username}`);
    console.log(`   - Circular referrals: ${user1.username} <-> ${user2.username}`);

    return {
      deletedReferrer: testReferrer,
      orphanUsers: referredUsers,
      selfReferralUser,
      circularUsers: [user1, user2]
    };

  } catch (error) {
    console.error('❌ Failed to create test data:', error);
    throw error;
  }
}

// Function to clean up test data
async function cleanupTestData() {
  try {
    console.log('🧹 Cleaning up test data...');
    
    const testUsernames = [
      'test_referrer',
      'referred_user_1',
      'referred_user_2', 
      'referred_user_3',
      'self_referral_user',
      'circular_user_1',
      'circular_user_2'
    ];

    for (const username of testUsernames) {
      try {
        await prisma.user.deleteMany({
          where: { username }
        });
      } catch (error) {
        // User might not exist, continue
      }
    }

    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Failed to cleanup test data:', error);
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--create-test-data')) {
    createTestOrphanData();
  } else if (args.includes('--cleanup')) {
    cleanupTestData();
  } else {
    testOrphanAccountChecking();
  }
}

module.exports = {
  testOrphanAccountChecking,
  createTestOrphanData,
  cleanupTestData
};


