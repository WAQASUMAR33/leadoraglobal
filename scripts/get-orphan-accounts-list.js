const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getOrphanAccountsList() {
  try {
    console.log('📋 Getting Orphan Accounts List...\n');

    // 1. Get orphan accounts via API
    console.log('🌐 Fetching via API...');
    
    const response = await fetch('http://localhost:3000/api/admin/orphan-accounts-list?type=all&limit=50');
    
    if (response.ok) {
      const data = await response.json();
      const result = data.data;
      
      console.log('✅ Orphan Accounts Summary:');
      console.log(`   Total Users: ${data.summary.totalUsers}`);
      console.log(`   Users with Referrals: ${data.summary.usersWithReferrals}`);
      console.log(`   Orphan Package Requests: ${data.summary.orphanPackageRequests}`);
      console.log(`   Orphan Earnings: ${data.summary.orphanEarnings}`);
      
      // Display referral issues
      if (result.referrals) {
        console.log('\n🔗 Referral Issues:');
        console.log(`   Orphan Accounts: ${result.referrals.statistics.orphanAccountsCount}`);
        console.log(`   Circular Referrals: ${result.referrals.statistics.circularReferralsCount}`);
        console.log(`   Self Referrals: ${result.referrals.statistics.selfReferralsCount}`);
        console.log(`   Missing Referrers: ${result.referrals.statistics.missingReferrersCount}`);
        
        // Show orphan accounts
        if (result.referrals.orphanAccounts.length > 0) {
          console.log('\n📋 Orphan Accounts (Users with invalid referrals):');
          console.log('   ID | Username | Full Name | Referred By | Issue | Severity');
          console.log('   ---|----------|-----------|-------------|-------|----------');
          
          result.referrals.orphanAccounts.forEach(account => {
            console.log(`   ${account.id.toString().padEnd(3)} | ${account.username.padEnd(8)} | ${account.fullname.padEnd(9)} | ${account.referredBy.padEnd(11)} | ${account.issue.padEnd(5)} | ${account.severity}`);
          });
        }
        
        // Show missing referrers
        if (result.referrals.missingReferrers.length > 0) {
          console.log('\n❌ Missing Referrers:');
          console.log('   Username | Affected Users');
          console.log('   ---------|---------------');
          
          result.referrals.missingReferrers.forEach(referrer => {
            console.log(`   ${referrer.username.padEnd(8)} | ${referrer.referredUsersCount}`);
          });
        }
        
        // Show circular referrals
        if (result.referrals.circularReferrals.length > 0) {
          console.log('\n🔄 Circular Referrals:');
          result.referrals.circularReferrals.forEach(circular => {
            console.log(`   ${circular.user1.username} ↔ ${circular.user2.username}`);
          });
        }
        
        // Show self referrals
        if (result.referrals.selfReferrals.length > 0) {
          console.log('\n🪞 Self Referrals:');
          result.referrals.selfReferrals.forEach(self => {
            console.log(`   ${self.username} (refers to themselves)`);
          });
        }
      }
      
      // Display package request issues
      if (result.packageRequests && result.packageRequests.orphanPackageRequests.length > 0) {
        console.log('\n📦 Orphan Package Requests:');
        console.log('   ID | Package Name | Amount | Transaction ID | Status');
        console.log('   ---|--------------|--------|----------------|-------');
        
        result.packageRequests.orphanPackageRequests.forEach(request => {
          console.log(`   ${request.id.toString().padEnd(3)} | ${(request.package?.package_name || 'N/A').padEnd(12)} | ${request.package?.package_amount || 'N/A'} | ${request.transactionId.padEnd(14)} | ${request.status}`);
        });
      }
      
      // Display earnings issues
      if (result.earnings && result.earnings.orphanEarnings.length > 0) {
        console.log('\n💰 Orphan Earnings:');
        console.log('   ID | Amount | Type | Description | Created At');
        console.log('   ---|--------|------|-------------|-----------');
        
        result.earnings.orphanEarnings.forEach(earning => {
          console.log(`   ${earning.id.toString().padEnd(3)} | ${earning.amount} | ${earning.type.padEnd(4)} | ${(earning.description || 'N/A').padEnd(11)} | ${earning.createdAt.toISOString().split('T')[0]}`);
        });
      }
      
    } else {
      console.log('❌ Failed to fetch via API:', await response.text());
    }

    // 2. Direct database query for detailed analysis
    console.log('\n🗄️  Direct Database Analysis:');
    
    // Get users with referrals
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
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`   Users with Referrals: ${usersWithReferrals.length}`);
    
    // Check for invalid referrals
    let invalidReferrals = 0;
    const invalidReferralDetails = [];
    
    for (const user of usersWithReferrals) {
      if (user.referredBy) {
        const referrer = await prisma.user.findUnique({
          where: { username: user.referredBy }
        });
        if (!referrer) {
          invalidReferrals++;
          invalidReferralDetails.push({
            id: user.id,
            username: user.username,
            fullname: user.fullname,
            referredBy: user.referredBy,
            createdAt: user.createdAt
          });
        }
      }
    }
    
    console.log(`   Invalid Referrals: ${invalidReferrals}`);
    
    if (invalidReferralDetails.length > 0) {
      console.log('\n   Invalid Referral Details:');
      invalidReferralDetails.slice(0, 10).forEach(detail => {
        console.log(`      ${detail.username} (ID: ${detail.id}) → ${detail.referredBy} (NOT FOUND)`);
      });
      
      if (invalidReferralDetails.length > 10) {
        console.log(`      ... and ${invalidReferralDetails.length - 10} more`);
      }
    }

    // 3. Export options
    console.log('\n📤 Export Options:');
    console.log('   To export orphan accounts list:');
    console.log('   curl -X POST http://localhost:3000/api/admin/orphan-accounts-list \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"exportType": "referrals", "format": "csv"}\' > orphan_accounts.csv');
    
    console.log('\n   To get JSON export:');
    console.log('   curl -X POST http://localhost:3000/api/admin/orphan-accounts-list \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"exportType": "all", "format": "json"}\' > orphan_accounts.json');

    console.log('\n🎉 Orphan Accounts List Retrieved!');

  } catch (error) {
    console.error('❌ Failed to get orphan accounts list:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Function to get specific orphan accounts by type
async function getSpecificOrphanAccounts(type = 'referrals') {
  try {
    console.log(`📋 Getting ${type} orphan accounts...\n`);
    
    const response = await fetch(`http://localhost:3000/api/admin/orphan-accounts-list?type=${type}&limit=100`);
    
    if (response.ok) {
      const data = await response.json();
      const result = data.data;
      
      console.log(`✅ ${type} Orphan Accounts:`);
      
      if (type === 'referrals' && result.referrals) {
        console.log(`   Total Orphan Accounts: ${result.referrals.statistics.orphanAccountsCount}`);
        
        if (result.referrals.orphanAccounts.length > 0) {
          console.log('\n   Orphan Accounts List:');
          result.referrals.orphanAccounts.forEach((account, index) => {
            console.log(`   ${index + 1}. ${account.username} (${account.fullname})`);
            console.log(`      ID: ${account.id}`);
            console.log(`      Email: ${account.email || 'N/A'}`);
            console.log(`      Referred By: ${account.referredBy} (NOT FOUND)`);
            console.log(`      Status: ${account.status}`);
            console.log(`      Balance: $${account.balance}`);
            console.log(`      Created: ${account.createdAt.toISOString().split('T')[0]}`);
            console.log(`      Issue: ${account.issue}`);
            console.log(`      Severity: ${account.severity}`);
            console.log('');
          });
        }
      }
      
      return result;
    } else {
      console.log('❌ Failed to fetch:', await response.text());
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--type')) {
    const type = args[args.indexOf('--type') + 1] || 'referrals';
    getSpecificOrphanAccounts(type);
  } else {
    getOrphanAccountsList();
  }
}

module.exports = {
  getOrphanAccountsList,
  getSpecificOrphanAccounts
};






