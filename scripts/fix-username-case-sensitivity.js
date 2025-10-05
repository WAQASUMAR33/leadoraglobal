const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUsernameCaseSensitivity() {
  try {
    console.log('🔧 FIXING USERNAME CASE SENSITIVITY ISSUES');
    console.log('==========================================\n');

    // 1. First, let's see the scope of the problem
    console.log('📊 ANALYZING THE PROBLEM:');
    console.log('=========================');
    
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        referredBy: true
      }
    });

    // Find broken referral chains
    const brokenReferrals = [];
    for (const user of allUsers) {
      if (user.referredBy) {
        const exactReferrer = allUsers.find(u => u.username === user.referredBy);
        if (!exactReferrer) {
          // Try case-insensitive match
          const caseInsensitiveReferrer = allUsers.find(u => u.username.toLowerCase() === user.referredBy.toLowerCase());
          if (caseInsensitiveReferrer) {
            brokenReferrals.push({
              user: user.username,
              referredBy: user.referredBy,
              actualReferrer: caseInsensitiveReferrer.username,
              userId: user.id,
              referrerId: caseInsensitiveReferrer.id
            });
          }
        }
      }
    }

    console.log(`📊 Found ${brokenReferrals.length} case sensitivity issues`);
    console.log('');

    if (brokenReferrals.length === 0) {
      console.log('✅ No case sensitivity issues found!');
      return;
    }

    // 2. Show some examples
    console.log('📋 EXAMPLES OF CASE SENSITIVITY ISSUES:');
    console.log('======================================');
    brokenReferrals.slice(0, 10).forEach((broken, index) => {
      console.log(`${index + 1}. ${broken.user} → "${broken.referredBy}" (not found)`);
      console.log(`   Should be: ${broken.user} → "${broken.actualReferrer}"`);
    });
    
    if (brokenReferrals.length > 10) {
      console.log(`... and ${brokenReferrals.length - 10} more issues`);
    }
    console.log('');

    // 3. Fix the referral references
    console.log('🔧 FIXING REFERRAL REFERENCES:');
    console.log('==============================');
    
    let fixedCount = 0;
    
    for (const broken of brokenReferrals) {
      try {
        await prisma.user.update({
          where: { id: broken.userId },
          data: { referredBy: broken.actualReferrer }
        });
        
        console.log(`✅ Fixed: ${broken.user} → ${broken.actualReferrer}`);
        fixedCount++;
      } catch (error) {
        console.log(`❌ Failed to fix: ${broken.user} → ${broken.actualReferrer}`);
        console.log(`   Error: ${error.message}`);
      }
    }

    console.log(`\n📊 Fixed ${fixedCount} out of ${brokenReferrals.length} referral references`);
    console.log('');

    // 4. Verify the fix
    console.log('🔍 VERIFYING THE FIX:');
    console.log('=====================');
    
    const updatedUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        referredBy: true
      }
    });

    let remainingBrokenChains = 0;
    for (const user of updatedUsers) {
      if (user.referredBy) {
        const referrerExists = updatedUsers.find(u => u.username === user.referredBy);
        if (!referrerExists) {
          remainingBrokenChains++;
        }
      }
    }

    const totalReferrals = updatedUsers.filter(u => u.referredBy).length;
    const successRate = ((totalReferrals - remainingBrokenChains) / totalReferrals * 100).toFixed(1);

    console.log(`📊 Total referrals: ${totalReferrals}`);
    console.log(`📊 Remaining broken chains: ${remainingBrokenChains}`);
    console.log(`📊 Success rate: ${successRate}%`);
    console.log('');

    if (remainingBrokenChains === 0) {
      console.log('🎉 ALL REFERRAL CHAINS FIXED!');
      console.log('✅ Commission distribution should now work properly');
    } else {
      console.log(`⚠️  ${remainingBrokenChains} referral chains still broken`);
      console.log('💡 These may be legitimate missing referrers');
    }

    // 5. Test commission logic with fixed chains
    console.log('\n🧪 TESTING COMMISSION LOGIC WITH FIXED CHAINS:');
    console.log('=============================================');
    
    // Test with a user who had case sensitivity issues
    const testUser = brokenReferrals[0];
    if (testUser) {
      console.log(`📊 Testing with user: ${testUser.user}`);
      console.log(`📊 Referred By: ${testUser.actualReferrer}`);
      
      // Check if we can now find the referral chain
      const user = await prisma.user.findUnique({
        where: { username: testUser.user },
        include: {
          rank: true
        }
      });

      if (user && user.referredBy) {
        const directReferrer = await prisma.user.findUnique({
          where: { username: user.referredBy },
          include: { rank: true }
        });

        if (directReferrer) {
          console.log(`✅ Referral chain is now working:`);
          console.log(`   ${user.username} → ${directReferrer.username}`);
          console.log(`   Direct referrer rank: ${directReferrer.rank?.title || 'No Rank'}`);
          
          // Check if there are upline members for indirect commission
          if (directReferrer.referredBy) {
            console.log(`   Direct referrer has referrer: ${directReferrer.referredBy}`);
            console.log(`✅ Indirect commission should now work for this user`);
          } else {
            console.log(`   Direct referrer has no referrer (no indirect commission)`);
          }
        } else {
          console.log(`❌ Still cannot find direct referrer`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error fixing username case sensitivity:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUsernameCaseSensitivity();
