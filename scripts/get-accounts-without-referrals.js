const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getAccountsWithoutReferrals() {
  try {
    console.log('🔍 Getting Accounts Where referred_by is NULL...\n');

    // 1. Get accounts without referrals via API
    console.log('🌐 Fetching via API...');
    
    const response = await fetch('http://localhost:3000/api/admin/accounts-without-referrals?limit=100');
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('✅ Accounts Without Referrals Summary:');
      console.log(`   Total Accounts Without Referrals: ${data.statistics.totalUsersWithoutReferrals}`);
      console.log(`   Current Page: ${data.statistics.currentPage} of ${data.statistics.totalPages}`);
      console.log(`   Accounts on This Page: ${data.statistics.currentPageCount}`);
      console.log(`   Total Balance: $${data.statistics.financialSummary.totalBalance.toFixed(2)}`);
      console.log(`   Total Earnings: $${data.statistics.financialSummary.totalEarnings.toFixed(2)}`);
      console.log(`   Average Balance: $${data.statistics.financialSummary.averageBalance}`);
      console.log(`   Average Earnings: $${data.statistics.financialSummary.averageEarnings}`);
      
      // Show status breakdown
      if (Object.keys(data.statistics.statusBreakdown).length > 0) {
        console.log('\n📊 Status Breakdown:');
        Object.entries(data.statistics.statusBreakdown).forEach(([status, count]) => {
          console.log(`   ${status}: ${count} accounts`);
        });
      }
      
      // Show insights
      if (data.insights && data.insights.length > 0) {
        console.log('\n💡 Insights:');
        data.insights.forEach(insight => {
          console.log(`   ${insight.message} (${insight.percentage}%)`);
        });
      }
      
      // Show accounts without referrals
      if (data.accountsWithoutReferrals.length > 0) {
        console.log('\n📋 Accounts Without Referrals (referred_by = NULL):');
        console.log('   ID | Username | Full Name | Email | Status | Balance | Points | Referral Count | Days Since Created');
        console.log('   ---|----------|-----------|-------|--------|---------|--------|----------------|------------------');
        
        data.accountsWithoutReferrals.forEach(account => {
          const email = account.email ? account.email.substring(0, 20) + (account.email.length > 20 ? '...' : '') : 'N/A';
          const fullname = account.fullname.length > 15 ? account.fullname.substring(0, 15) + '...' : account.fullname;
          console.log(`   ${account.id.toString().padEnd(3)} | ${account.username.padEnd(8)} | ${fullname.padEnd(9)} | ${email.padEnd(5)} | ${account.status.padEnd(6)} | $${account.balance.toString().padEnd(7)} | ${account.points.toString().padEnd(6)} | ${account.referralCount.toString().padEnd(14)} | ${account.daysSinceCreated}`);
        });
      }
      
    } else {
      console.log('❌ Failed to fetch via API:', await response.text());
    }

    // 2. Direct database analysis
    console.log('\n🗄️  Direct Database Analysis:');
    
    // Get users without referrals
    const usersWithoutReferrals = await prisma.user.findMany({
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
        points: true,
        totalEarnings: true,
        referralCount: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    console.log(`   Users Without Referrals: ${usersWithoutReferrals.length} (showing first 50)`);
    
    if (usersWithoutReferrals.length > 0) {
      console.log('\n   Top 20 Accounts Without Referrals:');
      usersWithoutReferrals.slice(0, 20).forEach((user, index) => {
        console.log(`      ${index + 1}. ${user.username} (ID: ${user.id}) - ${user.fullname}`);
        console.log(`         Status: ${user.status}, Balance: $${user.balance}, Points: ${user.points}`);
        console.log(`         Total Earnings: $${user.totalEarnings}, Referral Count: ${user.referralCount}`);
        console.log(`         Created: ${user.createdAt.toISOString().split('T')[0]}`);
        console.log('');
      });
    }

    // 3. Get statistics
    const totalCount = await prisma.user.count({
      where: { referredBy: null }
    });

    const statusCounts = await prisma.user.groupBy({
      by: ['status'],
      where: { referredBy: null },
      _count: {
        id: true
      }
    });

    const totalBalance = await prisma.user.aggregate({
      where: { referredBy: null },
      _sum: {
        balance: true
      }
    });

    const totalEarnings = await prisma.user.aggregate({
      where: { referredBy: null },
      _sum: {
        totalEarnings: true
      }
    });

    const totalReferralCount = await prisma.user.aggregate({
      where: { referredBy: null },
      _sum: {
        referralCount: true
      }
    });

    console.log('\n📊 Database Statistics:');
    console.log(`   Total Accounts Without Referrals: ${totalCount}`);
    console.log(`   Total Balance: $${totalBalance._sum.balance || 0}`);
    console.log(`   Total Earnings: $${totalEarnings._sum.totalEarnings || 0}`);
    console.log(`   Total Referral Count: ${totalReferralCount._sum.referralCount || 0}`);
    
    if (statusCounts.length > 0) {
      console.log('\n   Status Distribution:');
      statusCounts.forEach(status => {
        console.log(`      ${status.status}: ${status._count.id} accounts`);
      });
    }

    // 4. Export options
    console.log('\n📤 Export Options:');
    console.log('   To export accounts without referrals:');
    console.log('   curl -X POST http://localhost:3000/api/admin/accounts-without-referrals \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"format": "csv"}\' > accounts_without_referrals.csv');
    
    console.log('\n   To get detailed JSON export:');
    console.log('   curl -X POST http://localhost:3000/api/admin/accounts-without-referrals \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"format": "json", "includeDetails": true}\' > accounts_without_referrals.json');

    console.log('\n🎉 Accounts Without Referrals Retrieved!');

  } catch (error) {
    console.error('❌ Failed to get accounts without referrals:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Function to get accounts without referrals by status
async function getAccountsWithoutReferralsByStatus(status = 'active') {
  try {
    console.log(`🔍 Getting ${status} accounts without referrals...\n`);
    
    const response = await fetch(`http://localhost:3000/api/admin/accounts-without-referrals?status=${status}&limit=100`);
    
    if (response.ok) {
      const data = await response.json();
      
      console.log(`✅ ${status.toUpperCase()} Accounts Without Referrals:`);
      console.log(`   Total: ${data.statistics.totalUsersWithoutReferrals}`);
      console.log(`   Total Balance: $${data.statistics.financialSummary.totalBalance.toFixed(2)}`);
      console.log(`   Total Earnings: $${data.statistics.financialSummary.totalEarnings.toFixed(2)}`);
      
      if (data.accountsWithoutReferrals.length > 0) {
        console.log('\n   Accounts List:');
        data.accountsWithoutReferrals.forEach((account, index) => {
          console.log(`   ${index + 1}. ${account.username} (ID: ${account.id})`);
          console.log(`      Full Name: ${account.fullname}`);
          console.log(`      Email: ${account.email || 'N/A'}`);
          console.log(`      Balance: $${account.balance}`);
          console.log(`      Points: ${account.points}`);
          console.log(`      Total Earnings: $${account.totalEarnings}`);
          console.log(`      Referral Count: ${account.referralCount}`);
          console.log(`      Created: ${account.createdAt.toISOString().split('T')[0]}`);
          console.log('');
        });
      }
      
      return data;
    } else {
      console.log('❌ Failed to fetch:', await response.text());
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}

// Function to get detailed accounts without referrals
async function getDetailedAccountsWithoutReferrals() {
  try {
    console.log('🔍 Getting Detailed Accounts Without Referrals...\n');
    
    const response = await fetch('http://localhost:3000/api/admin/accounts-without-referrals?limit=50&includeDetails=true');
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('📋 Detailed Accounts Without Referrals:');
      
      data.accountsWithoutReferrals.forEach((account, index) => {
        console.log(`\n${index + 1}. ${account.username} (ID: ${account.id})`);
        console.log(`   Full Name: ${account.fullname}`);
        console.log(`   Email: ${account.email || 'N/A'}`);
        console.log(`   Phone: ${account.phoneNumber || 'N/A'}`);
        console.log(`   Status: ${account.status}`);
        console.log(`   Balance: $${account.balance}`);
        console.log(`   Points: ${account.points}`);
        console.log(`   Total Earnings: $${account.totalEarnings}`);
        console.log(`   Referral Count: ${account.referralCount}`);
        console.log(`   Created: ${account.createdAt.toISOString().split('T')[0]}`);
        console.log(`   Days Since Created: ${account.daysSinceCreated}`);
        
        if (account.details) {
          console.log(`   Package: ${account.details.package?.package_name || 'None'}`);
          console.log(`   Rank: ${account.details.rank?.title || 'None'}`);
          console.log(`   Current Package: ${account.details.currentPackage?.package_name || 'None'}`);
          console.log(`   KYC Status: ${account.details.kyc?.kyc_status || 'Not submitted'}`);
          console.log(`   Recent Package Requests: ${account.details.recentPackageRequests.length}`);
          console.log(`   Recent Earnings: ${account.details.recentEarnings.length}`);
          
          if (account.details.recentPackageRequests.length > 0) {
            console.log(`   Latest Package Request: ${account.details.recentPackageRequests[0].package?.package_name} (${account.details.recentPackageRequests[0].status})`);
          }
          
          if (account.details.recentEarnings.length > 0) {
            console.log(`   Latest Earnings: $${account.details.recentEarnings[0].amount} (${account.details.recentEarnings[0].type})`);
          }
        }
      });
      
      return data;
    } else {
      console.log('❌ Failed to fetch detailed data:', await response.text());
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
  
  if (args.includes('--status')) {
    const status = args[args.indexOf('--status') + 1] || 'active';
    getAccountsWithoutReferralsByStatus(status);
  } else if (args.includes('--detailed')) {
    getDetailedAccountsWithoutReferrals();
  } else {
    getAccountsWithoutReferrals();
  }
}

module.exports = {
  getAccountsWithoutReferrals,
  getAccountsWithoutReferralsByStatus,
  getDetailedAccountsWithoutReferrals
};


