const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateReferredByToBushra750() {
  try {
    console.log('🔄 Updating referred_by to bushra750 for accounts where referred_by is NULL...\n');

    // 1. First, check if bushra750 exists
    console.log('🔍 Checking if bushra750 exists...');
    const bushra750 = await prisma.user.findUnique({
      where: { username: 'bushra750' },
      select: {
        id: true,
        username: true,
        fullname: true,
        status: true,
        createdAt: true
      }
    });

    if (!bushra750) {
      console.log('❌ User bushra750 not found!');
      console.log('   Please create the user bushra750 first or use a different username.');
      return;
    }

    console.log('✅ User bushra750 found:');
    console.log(`   ID: ${bushra750.id}`);
    console.log(`   Username: ${bushra750.username}`);
    console.log(`   Full Name: ${bushra750.fullname}`);
    console.log(`   Status: ${bushra750.status}`);
    console.log(`   Created: ${bushra750.createdAt.toISOString().split('T')[0]}`);

    // 2. Get count of accounts with referred_by = NULL
    console.log('\n📊 Getting accounts with referred_by = NULL...');
    const accountsWithNullReferrals = await prisma.user.findMany({
      where: {
        referredBy: null
      },
      select: {
        id: true,
        username: true,
        fullname: true,
        email: true,
        status: true,
        balance: true,
        totalEarnings: true,
        referralCount: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`   Found ${accountsWithNullReferrals.length} accounts with referred_by = NULL`);

    if (accountsWithNullReferrals.length === 0) {
      console.log('✅ No accounts found with referred_by = NULL. Nothing to update.');
      return;
    }

    // 3. Show preview of accounts to be updated
    console.log('\n📋 Accounts to be updated (first 10):');
    console.log('   ID | Username | Full Name | Status | Balance | Referral Count | Created');
    console.log('   ---|----------|-----------|--------|---------|----------------|--------');
    
    accountsWithNullReferrals.slice(0, 10).forEach(account => {
      const fullname = account.fullname.length > 15 ? account.fullname.substring(0, 15) + '...' : account.fullname;
      console.log(`   ${account.id.toString().padEnd(3)} | ${account.username.padEnd(8)} | ${fullname.padEnd(9)} | ${account.status.padEnd(6)} | $${account.balance.toString().padEnd(7)} | ${account.referralCount.toString().padEnd(14)} | ${account.createdAt.toISOString().split('T')[0]}`);
    });

    if (accountsWithNullReferrals.length > 10) {
      console.log(`   ... and ${accountsWithNullReferrals.length - 10} more accounts`);
    }

    // 4. Calculate statistics
    const stats = {
      totalAccounts: accountsWithNullReferrals.length,
      activeAccounts: accountsWithNullReferrals.filter(acc => acc.status === 'active').length,
      inactiveAccounts: accountsWithNullReferrals.filter(acc => acc.status !== 'active').length,
      totalBalance: accountsWithNullReferrals.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0),
      totalEarnings: accountsWithNullReferrals.reduce((sum, acc) => sum + parseFloat(acc.totalEarnings || 0), 0),
      totalReferralCount: accountsWithNullReferrals.reduce((sum, acc) => sum + (acc.referralCount || 0), 0)
    };

    console.log('\n📊 Statistics:');
    console.log(`   Total Accounts: ${stats.totalAccounts}`);
    console.log(`   Active Accounts: ${stats.activeAccounts}`);
    console.log(`   Inactive Accounts: ${stats.inactiveAccounts}`);
    console.log(`   Total Balance: $${stats.totalBalance.toFixed(2)}`);
    console.log(`   Total Earnings: $${stats.totalEarnings.toFixed(2)}`);
    console.log(`   Total Referral Count: ${stats.totalReferralCount}`);

    // 5. Confirm before proceeding
    console.log('\n⚠️  WARNING: This will update ALL accounts with referred_by = NULL');
    console.log(`   They will be set to referred_by = 'bushra750'`);
    console.log(`   This action affects ${stats.totalAccounts} accounts`);
    console.log(`   Total financial impact: $${stats.totalBalance.toFixed(2)} in balances, $${stats.totalEarnings.toFixed(2)} in earnings`);

    // 6. Perform the update
    console.log('\n🔄 Performing update...');
    
    const updateResult = await prisma.user.updateMany({
      where: {
        referredBy: null
      },
      data: {
        referredBy: 'bushra750',
        updatedAt: new Date()
      }
    });

    console.log(`✅ Update completed successfully!`);
    console.log(`   Updated ${updateResult.count} accounts`);

    // 7. Verify the update
    console.log('\n🔍 Verifying update...');
    
    const remainingNullReferrals = await prisma.user.count({
      where: {
        referredBy: null
      }
    });

    const accountsReferredByBushra750 = await prisma.user.count({
      where: {
        referredBy: 'bushra750'
      }
    });

    console.log(`   Remaining accounts with referred_by = NULL: ${remainingNullReferrals}`);
    console.log(`   Accounts now referred by bushra750: ${accountsReferredByBushra750}`);

    // 8. Update bushra750's referral count
    console.log('\n🔄 Updating bushra750 referral count...');
    
    const updatedBushra750 = await prisma.user.update({
      where: { username: 'bushra750' },
      data: {
        referralCount: accountsReferredByBushra750,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Updated bushra750 referral count to: ${updatedBushra750.referralCount}`);

    // 9. Show final summary
    console.log('\n🎉 Update Summary:');
    console.log(`   ✅ Updated ${updateResult.count} accounts`);
    console.log(`   ✅ Set referred_by = 'bushra750' for all accounts with NULL referrals`);
    console.log(`   ✅ Updated bushra750 referral count to ${updatedBushra750.referralCount}`);
    console.log(`   ✅ Remaining accounts with NULL referrals: ${remainingNullReferrals}`);

    // 10. Show some updated accounts
    console.log('\n📋 Sample of updated accounts:');
    const sampleUpdatedAccounts = await prisma.user.findMany({
      where: {
        referredBy: 'bushra750'
      },
      select: {
        id: true,
        username: true,
        fullname: true,
        status: true,
        balance: true,
        updatedAt: true
      },
      take: 5,
      orderBy: {
        updatedAt: 'desc'
      }
    });

    sampleUpdatedAccounts.forEach(account => {
      console.log(`   ${account.username} (ID: ${account.id}) - ${account.fullname} - Status: ${account.status} - Balance: $${account.balance}`);
    });

  } catch (error) {
    console.error('❌ Update failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Function to preview the update without actually doing it
async function previewUpdate() {
  try {
    console.log('👀 Preview: Updating referred_by to bushra750 for accounts where referred_by is NULL...\n');

    // Check if bushra750 exists
    const bushra750 = await prisma.user.findUnique({
      where: { username: 'bushra750' },
      select: {
        id: true,
        username: true,
        fullname: true,
        status: true
      }
    });

    if (!bushra750) {
      console.log('❌ User bushra750 not found!');
      console.log('   Please create the user bushra750 first or use a different username.');
      return;
    }

    console.log('✅ User bushra750 found:');
    console.log(`   ID: ${bushra750.id}, Username: ${bushra750.username}, Status: ${bushra750.status}`);

    // Get accounts with NULL referrals
    const accountsWithNullReferrals = await prisma.user.findMany({
      where: {
        referredBy: null
      },
      select: {
        id: true,
        username: true,
        fullname: true,
        status: true,
        balance: true,
        totalEarnings: true,
        referralCount: true
      }
    });

    console.log(`\n📊 Preview Results:`);
    console.log(`   Accounts to be updated: ${accountsWithNullReferrals.length}`);
    console.log(`   Current bushra750 referral count: ${bushra750.referralCount || 0}`);
    console.log(`   New bushra750 referral count: ${(bushra750.referralCount || 0) + accountsWithNullReferrals.length}`);

    if (accountsWithNullReferrals.length > 0) {
      console.log('\n📋 First 10 accounts to be updated:');
      accountsWithNullReferrals.slice(0, 10).forEach((account, index) => {
        console.log(`   ${index + 1}. ${account.username} (ID: ${account.id}) - ${account.fullname} - Status: ${account.status}`);
      });
    }

    console.log('\n⚠️  This is a PREVIEW only. No changes have been made.');
    console.log('   Run without --preview to actually perform the update.');

  } catch (error) {
    console.error('❌ Preview failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Function to rollback the update
async function rollbackUpdate() {
  try {
    console.log('🔄 Rolling back: Setting referred_by back to NULL for accounts referred by bushra750...\n');

    // Get accounts referred by bushra750
    const accountsReferredByBushra750 = await prisma.user.findMany({
      where: {
        referredBy: 'bushra750'
      },
      select: {
        id: true,
        username: true,
        fullname: true,
        status: true
      }
    });

    console.log(`Found ${accountsReferredByBushra750.length} accounts referred by bushra750`);

    if (accountsReferredByBushra750.length === 0) {
      console.log('✅ No accounts found referred by bushra750. Nothing to rollback.');
      return;
    }

    // Perform rollback
    const rollbackResult = await prisma.user.updateMany({
      where: {
        referredBy: 'bushra750'
      },
      data: {
        referredBy: null,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Rollback completed!`);
    console.log(`   Rolled back ${rollbackResult.count} accounts`);

    // Update bushra750 referral count
    const updatedBushra750 = await prisma.user.update({
      where: { username: 'bushra750' },
      data: {
        referralCount: 0,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Reset bushra750 referral count to: ${updatedBushra750.referralCount}`);

  } catch (error) {
    console.error('❌ Rollback failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--preview')) {
    previewUpdate();
  } else if (args.includes('--rollback')) {
    rollbackUpdate();
  } else {
    updateReferredByToBushra750();
  }
}

module.exports = {
  updateReferredByToBushra750,
  previewUpdate,
  rollbackUpdate
};


