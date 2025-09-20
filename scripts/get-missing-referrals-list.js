const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getMissingReferralsList() {
  try {
    console.log('🔍 Getting Accounts with Missing Referrals...\n');

    // 1. Get missing referrals via API
    console.log('🌐 Fetching via API...');
    
    const response = await fetch('http://localhost:3000/api/admin/missing-referrals-list?limit=100');
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('✅ Missing Referrals Summary:');
      console.log(`   Total Users with Referrals: ${data.statistics.totalUsersWithReferrals}`);
      console.log(`   Accounts with Missing Referrals: ${data.statistics.accountsWithMissingReferrals}`);
      console.log(`   Valid Referrals: ${data.statistics.validReferrals}`);
      console.log(`   Inactive Referrers: ${data.statistics.inactiveReferrers}`);
      console.log(`   Unique Missing Referrers: ${data.statistics.uniqueMissingReferrers}`);
      console.log(`   Total Balance Affected: $${data.statistics.totalBalanceAffected.toFixed(2)}`);
      console.log(`   Total Earnings Affected: $${data.statistics.totalEarningsAffected.toFixed(2)}`);
      
      // Show accounts with missing referrals
      if (data.accountsWithMissingReferrals.length > 0) {
        console.log('\n📋 Accounts with Missing Referrals:');
        console.log('   ID | Username | Full Name | Email | Status | Balance | Referred By | Days Since Created');
        console.log('   ---|----------|-----------|-------|--------|---------|-------------|------------------');
        
        data.accountsWithMissingReferrals.forEach(account => {
          const email = account.email ? account.email.substring(0, 20) + (account.email.length > 20 ? '...' : '') : 'N/A';
          const fullname = account.fullname.length > 15 ? account.fullname.substring(0, 15) + '...' : account.fullname;
          console.log(`   ${account.id.toString().padEnd(3)} | ${account.username.padEnd(8)} | ${fullname.padEnd(9)} | ${email.padEnd(5)} | ${account.status.padEnd(6)} | $${account.balance.toString().padEnd(7)} | ${account.referredBy.padEnd(11)} | ${account.daysSinceCreated}`);
        });
      }
      
      // Show missing referrers summary
      if (data.missingReferrers.length > 0) {
        console.log('\n❌ Missing Referrers Summary:');
        console.log('   Username | Affected Users | Total Balance | Total Earnings | Avg Balance | Avg Earnings');
        console.log('   ---------|----------------|---------------|----------------|-------------|-------------');
        
        data.missingReferrers.forEach(referrer => {
          console.log(`   ${referrer.username.padEnd(8)} | ${referrer.totalAffectedUsers.toString().padEnd(14)} | $${referrer.totalBalance.toFixed(2).padEnd(13)} | $${referrer.totalEarnings.toFixed(2).padEnd(14)} | $${referrer.averageBalance.padEnd(11)} | $${referrer.averageEarnings}`);
        });
      }
      
      // Show inactive referrers
      if (data.inactiveReferrers.length > 0) {
        console.log('\n⚠️  Accounts with Inactive Referrers:');
        console.log('   ID | Username | Full Name | Referred By | Referrer Status');
        console.log('   ---|----------|-----------|-------------|----------------');
        
        data.inactiveReferrers.forEach(account => {
          const fullname = account.fullname.length > 15 ? account.fullname.substring(0, 15) + '...' : account.fullname;
          console.log(`   ${account.id.toString().padEnd(3)} | ${account.username.padEnd(8)} | ${fullname.padEnd(9)} | ${account.referredBy.padEnd(11)} | ${account.referrerStatus}`);
        });
      }
      
      // Show recommendations
      if (data.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        data.recommendations.forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec.description}`);
          console.log(`      Action: ${rec.action}`);
          console.log(`      Affected: ${rec.affectedCount} accounts`);
          if (rec.estimatedImpact) {
            console.log(`      Impact: ${rec.estimatedImpact}`);
          }
          console.log(`      Priority: ${rec.priority}`);
          console.log('');
        });
      }
      
    } else {
      console.log('❌ Failed to fetch via API:', await response.text());
    }

    // 2. Direct database analysis
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
        balance: true,
        totalEarnings: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`   Users with Referrals: ${usersWithReferrals.length}`);
    
    // Check for missing referrals
    let missingReferrals = 0;
    const missingReferralDetails = [];
    const missingReferrerMap = new Map();
    
    for (const user of usersWithReferrals) {
      if (user.referredBy) {
        const referrer = await prisma.user.findUnique({
          where: { username: user.referredBy }
        });
        
        if (!referrer) {
          missingReferrals++;
          missingReferralDetails.push({
            id: user.id,
            username: user.username,
            fullname: user.fullname,
            referredBy: user.referredBy,
            status: user.status,
            balance: user.balance,
            totalEarnings: user.totalEarnings,
            createdAt: user.createdAt
          });
          
          // Track missing referrer
          if (!missingReferrerMap.has(user.referredBy)) {
            missingReferrerMap.set(user.referredBy, []);
          }
          missingReferrerMap.get(user.referredBy).push(user);
        }
      }
    }
    
    console.log(`   Missing Referrals: ${missingReferrals}`);
    console.log(`   Unique Missing Referrers: ${missingReferrerMap.size}`);
    
    if (missingReferralDetails.length > 0) {
      console.log('\n   Top 10 Missing Referral Details:');
      missingReferralDetails.slice(0, 10).forEach((detail, index) => {
        console.log(`      ${index + 1}. ${detail.username} (ID: ${detail.id}) → ${detail.referredBy} (NOT FOUND)`);
        console.log(`         Status: ${detail.status}, Balance: $${detail.balance}, Earnings: $${detail.totalEarnings}`);
        console.log(`         Created: ${detail.createdAt.toISOString().split('T')[0]}`);
      });
      
      if (missingReferralDetails.length > 10) {
        console.log(`      ... and ${missingReferralDetails.length - 10} more`);
      }
    }
    
    // Show missing referrers with counts
    if (missingReferrerMap.size > 0) {
      console.log('\n   Missing Referrers with Affected User Counts:');
      const referrerArray = Array.from(missingReferrerMap.entries())
        .map(([username, users]) => ({
          username,
          count: users.length,
          totalBalance: users.reduce((sum, user) => sum + parseFloat(user.balance || 0), 0),
          totalEarnings: users.reduce((sum, user) => sum + parseFloat(user.totalEarnings || 0), 0)
        }))
        .sort((a, b) => b.count - a.count);
      
      referrerArray.forEach(referrer => {
        console.log(`      ${referrer.username}: ${referrer.count} users affected ($${referrer.totalBalance.toFixed(2)} balance, $${referrer.totalEarnings.toFixed(2)} earnings)`);
      });
    }

    // 3. Export options
    console.log('\n📤 Export Options:');
    console.log('   To export missing referrals list:');
    console.log('   curl -X POST http://localhost:3000/api/admin/missing-referrals-list \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"format": "csv"}\' > missing_referrals.csv');
    
    console.log('\n   To get detailed JSON export:');
    console.log('   curl -X POST http://localhost:3000/api/admin/missing-referrals-list \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"format": "json", "includeDetails": true}\' > missing_referrals.json');

    console.log('\n🎉 Missing Referrals List Retrieved!');

  } catch (error) {
    console.error('❌ Failed to get missing referrals list:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Function to get detailed missing referrals with user details
async function getDetailedMissingReferrals() {
  try {
    console.log('🔍 Getting Detailed Missing Referrals...\n');
    
    const response = await fetch('http://localhost:3000/api/admin/missing-referrals-list?limit=50&includeDetails=true');
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('📋 Detailed Missing Referrals:');
      
      data.accountsWithMissingReferrals.forEach((account, index) => {
        console.log(`\n${index + 1}. ${account.username} (ID: ${account.id})`);
        console.log(`   Full Name: ${account.fullname}`);
        console.log(`   Email: ${account.email || 'N/A'}`);
        console.log(`   Phone: ${account.phoneNumber || 'N/A'}`);
        console.log(`   Status: ${account.status}`);
        console.log(`   Balance: $${account.balance}`);
        console.log(`   Points: ${account.points}`);
        console.log(`   Total Earnings: $${account.totalEarnings}`);
        console.log(`   Referred By: ${account.referredBy} (MISSING)`);
        console.log(`   Created: ${account.createdAt.toISOString().split('T')[0]}`);
        console.log(`   Days Since Created: ${account.daysSinceCreated}`);
        
        if (account.details) {
          console.log(`   Package: ${account.details.package?.package_name || 'None'}`);
          console.log(`   Rank: ${account.details.rank?.title || 'None'}`);
          console.log(`   Current Package: ${account.details.currentPackage?.package_name || 'None'}`);
          console.log(`   Recent Package Requests: ${account.details.recentPackageRequests.length}`);
          console.log(`   Recent Earnings: ${account.details.recentEarnings.length}`);
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
  
  if (args.includes('--detailed')) {
    getDetailedMissingReferrals();
  } else {
    getMissingReferralsList();
  }
}

module.exports = {
  getMissingReferralsList,
  getDetailedMissingReferrals
};



