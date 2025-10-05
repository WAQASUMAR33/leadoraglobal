const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsernameCaseSensitivity() {
  try {
    console.log('🔍 CHECKING USERNAME CASE SENSITIVITY ISSUES');
    console.log('============================================\n');

    // 1. Check for duplicate usernames with different cases
    console.log('📊 CHECKING FOR DUPLICATE USERNAMES WITH DIFFERENT CASES:');
    console.log('==========================================================');
    
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullname: true,
        referredBy: true
      }
    });

    // Group usernames by lowercase version
    const usernameGroups = {};
    allUsers.forEach(user => {
      const lowerUsername = user.username.toLowerCase();
      if (!usernameGroups[lowerUsername]) {
        usernameGroups[lowerUsername] = [];
      }
      usernameGroups[lowerUsername].push(user);
    });

    // Find groups with multiple usernames (case differences)
    const caseConflicts = Object.entries(usernameGroups).filter(([lower, users]) => users.length > 1);
    
    if (caseConflicts.length > 0) {
      console.log(`❌ Found ${caseConflicts.length} case sensitivity conflicts:`);
      caseConflicts.forEach(([lower, users]) => {
        console.log(`\n🔴 Username "${lower}" has multiple cases:`);
        users.forEach(user => {
          console.log(`   - ID ${user.id}: "${user.username}" (Referred By: ${user.referredBy || 'None'})`);
        });
      });
    } else {
      console.log('✅ No case sensitivity conflicts found');
    }
    console.log('');

    // 2. Check referral chains for case mismatches
    console.log('📊 CHECKING REFERRAL CHAINS FOR CASE MISMATCHES:');
    console.log('================================================');
    
    let brokenChains = 0;
    let totalReferrals = 0;
    const brokenReferrals = [];

    for (const user of allUsers) {
      if (user.referredBy) {
        totalReferrals++;
        const referrerExists = allUsers.find(u => u.username === user.referredBy);
        
        if (!referrerExists) {
          brokenChains++;
          brokenReferrals.push({
            user: user.username,
            referredBy: user.referredBy,
            issue: 'Referrer not found'
          });
        } else {
          // Check if there's a case mismatch
          const exactMatch = allUsers.find(u => u.username === user.referredBy);
          const caseInsensitiveMatch = allUsers.find(u => u.username.toLowerCase() === user.referredBy.toLowerCase());
          
          if (!exactMatch && caseInsensitiveMatch) {
            brokenChains++;
            brokenReferrals.push({
              user: user.username,
              referredBy: user.referredBy,
              actualReferrer: caseInsensitiveMatch.username,
              issue: 'Case mismatch'
            });
          }
        }
      }
    }

    console.log(`📊 Total referrals checked: ${totalReferrals}`);
    console.log(`📊 Broken referral chains: ${brokenChains}`);
    console.log(`📊 Success rate: ${((totalReferrals - brokenChains) / totalReferrals * 100).toFixed(1)}%`);
    console.log('');

    if (brokenReferrals.length > 0) {
      console.log('❌ BROKEN REFERRAL CHAINS:');
      console.log('==========================');
      brokenReferrals.slice(0, 10).forEach((broken, index) => {
        console.log(`${index + 1}. ${broken.user} → ${broken.referredBy}`);
        console.log(`   Issue: ${broken.issue}`);
        if (broken.actualReferrer) {
          console.log(`   Actual referrer: ${broken.actualReferrer}`);
        }
        console.log('');
      });
      
      if (brokenReferrals.length > 10) {
        console.log(`... and ${brokenReferrals.length - 10} more broken chains`);
      }
    } else {
      console.log('✅ All referral chains are working correctly');
    }

    // 3. Check specific problematic cases from our analysis
    console.log('📊 CHECKING SPECIFIC CASES FROM OUR ANALYSIS:');
    console.log('==============================================');
    
    const testCases = [
      'Sanashabbir348',
      'sadiaqadri348', 
      'Sadiaqadri348',
      'akbar348',
      'Akbar348',
      'haseeb99',
      'mrjunaid786',
      'AbdulManan786',
      'bushra750',
      'Bushra750',
      'Touseef231'
    ];

    console.log('Testing specific usernames for case sensitivity:');
    testCases.forEach(username => {
      const exactUser = allUsers.find(u => u.username === username);
      const lowerUser = allUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
      
      if (exactUser) {
        console.log(`✅ "${username}" - Found exact match (ID: ${exactUser.id})`);
      } else if (lowerUser) {
        console.log(`⚠️  "${username}" - Found case-insensitive match: "${lowerUser.username}" (ID: ${lowerUser.id})`);
      } else {
        console.log(`❌ "${username}" - Not found`);
      }
    });
    console.log('');

    // 4. Check database collation settings
    console.log('📊 CHECKING DATABASE COLLATION SETTINGS:');
    console.log('========================================');
    
    try {
      // This would require a raw SQL query to check collation
      console.log('💡 To check database collation settings, run this SQL query:');
      console.log('   SHOW VARIABLES LIKE "collation_database";');
      console.log('   SHOW TABLE STATUS WHERE Name = "users";');
      console.log('');
    } catch (error) {
      console.log('❌ Could not check database collation settings');
    }

    // 5. Recommendations
    console.log('💡 RECOMMENDATIONS:');
    console.log('===================');
    
    if (caseConflicts.length > 0 || brokenChains > 0) {
      console.log('❌ ISSUES FOUND:');
      console.log('1. Username case sensitivity is causing problems');
      console.log('2. Referral chains may be broken');
      console.log('3. Commission distribution may fail');
      console.log('');
      console.log('🔧 SOLUTIONS:');
      console.log('1. Normalize all usernames to lowercase');
      console.log('2. Update referral references to match normalized usernames');
      console.log('3. Add database constraints to prevent case duplicates');
      console.log('4. Update application logic to handle case-insensitive lookups');
    } else {
      console.log('✅ NO ISSUES FOUND:');
      console.log('1. All usernames are unique');
      console.log('2. All referral chains are intact');
      console.log('3. Case sensitivity is not causing problems');
    }

  } catch (error) {
    console.error('❌ Error checking username case sensitivity:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsernameCaseSensitivity();
