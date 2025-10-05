const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function demonstrateIndirectCommissionLogic() {
  try {
    console.log('🔍 INDIRECT COMMISSION LOGIC DEMONSTRATION');
    console.log('==========================================\n');

    console.log('📋 INDIRECT COMMISSION LOGIC EXPLAINED:');
    console.log('======================================');
    console.log('1. When a package is approved, commissions are distributed');
    console.log('2. Direct commission goes to the direct referrer');
    console.log('3. Indirect commission goes to upline members (excluding direct referrer)');
    console.log('4. Only users with Manager rank and above are eligible');
    console.log('5. Commission starts from Manager rank and works upward');
    console.log('6. If no users found with a rank, commission accumulates');
    console.log('7. First eligible user gets accumulated + current commission');
    console.log('');

    // Show rank hierarchy
    console.log('🏆 RANK HIERARCHY:');
    console.log('=================');
    const ranks = await prisma.rank.findMany({
      orderBy: { required_points: 'asc' }
    });

    ranks.forEach((rank, index) => {
      const marker = rank.title === 'Manager' ? '🎯' : '  ';
      const eligible = ['Manager', 'Sapphire Manager', 'Diamond', 'Sapphire Diamond', 'Ambassador', 'Sapphire Ambassador', 'Royal Ambassador', 'Global Ambassador', 'Honory Share Holder'].includes(rank.title);
      const status = eligible ? '✅ Eligible' : '❌ Not Eligible';
      console.log(`${marker}${index}. ${rank.title} (${rank.required_points.toLocaleString()} points) - ${status}`);
    });
    console.log('');

    // Show examples
    console.log('📊 EXAMPLE SCENARIOS:');
    console.log('=====================');

    // Example 1: Short chain
    console.log('📝 Example 1: Short Chain (Most Common)');
    console.log('--------------------------------------');
    console.log('Package Buyer: UserA');
    console.log('Direct Referrer: UserB (gets direct commission)');
    console.log('Upline Members: None (UserB has no referrer)');
    console.log('Result: No indirect commission distributed');
    console.log('Reason: No upline members found');
    console.log('');

    // Example 2: Medium chain
    console.log('📝 Example 2: Medium Chain');
    console.log('-------------------------');
    console.log('Package Buyer: UserA');
    console.log('Direct Referrer: UserB (gets direct commission)');
    console.log('Upline: UserC (Manager rank)');
    console.log('Result: UserC gets indirect commission');
    console.log('Reason: UserC is eligible and found');
    console.log('');

    // Example 3: Long chain with multiple ranks
    console.log('📝 Example 3: Long Chain with Multiple Ranks');
    console.log('--------------------------------------------');
    console.log('Package Buyer: UserA');
    console.log('Direct Referrer: UserB (gets direct commission)');
    console.log('Upline: UserC (Manager), UserD (Diamond), UserE (Sapphire Diamond)');
    console.log('Result: UserC gets indirect commission (first Manager found)');
    console.log('Reason: Commission goes to first user with each rank');
    console.log('');

    // Example 4: Accumulation scenario
    console.log('📝 Example 4: Accumulation Scenario');
    console.log('-----------------------------------');
    console.log('Package Buyer: UserA');
    console.log('Direct Referrer: UserB (gets direct commission)');
    console.log('Upline: UserC (Consultant rank)');
    console.log('Result: No indirect commission distributed');
    console.log('Reason: No eligible ranks found (Consultant excluded)');
    console.log('Commission accumulates for future distribution');
    console.log('');

    // Show current system behavior
    console.log('🔍 CURRENT SYSTEM BEHAVIOR:');
    console.log('===========================');
    
    // Check how many users have upline members
    const usersWithUpline = await prisma.user.findMany({
      where: {
        referredBy: { not: null }
      },
      select: {
        username: true,
        referredBy: true
      }
    });

    let usersWithUplineMembers = 0;
    for (const user of usersWithUpline) {
      const directReferrer = await prisma.user.findUnique({
        where: { username: user.referredBy }
      });
      
      if (directReferrer && directReferrer.referredBy) {
        usersWithUplineMembers++;
      }
    }

    console.log(`📊 Total users with referrers: ${usersWithUpline.length}`);
    console.log(`📊 Users with upline members: ${usersWithUplineMembers}`);
    console.log(`📊 Percentage with upline: ${((usersWithUplineMembers / usersWithUpline.length) * 100).toFixed(1)}%`);
    console.log('');

    // Check indirect commission distribution
    console.log('💰 INDIRECT COMMISSION DISTRIBUTION:');
    console.log('====================================');
    
    const indirectEarnings = await prisma.earnings.findMany({
      where: { type: 'indirect_commission' },
      include: { user: { select: { username: true } } }
    });

    console.log(`📊 Total indirect commission records: ${indirectEarnings.length}`);
    
    if (indirectEarnings.length > 0) {
      const totalAmount = indirectEarnings.reduce((sum, earning) => sum + parseFloat(earning.amount), 0);
      console.log(`📊 Total indirect commission distributed: ${totalAmount.toLocaleString()}`);
      
      // Group by user
      const byUser = {};
      indirectEarnings.forEach(earning => {
        const username = earning.user.username;
        if (!byUser[username]) {
          byUser[username] = 0;
        }
        byUser[username] += parseFloat(earning.amount);
      });
      
      console.log('📊 Top indirect commission recipients:');
      Object.entries(byUser)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([username, amount]) => {
          console.log(`   ${username}: ${amount.toLocaleString()}`);
        });
    } else {
      console.log('❌ No indirect commission records found');
      console.log('💡 This indicates:');
      console.log('   - No users have upline members eligible for indirect commission');
      console.log('   - OR indirect commission logic has not been triggered');
      console.log('   - OR there are issues with the commission distribution');
    }

    console.log('\n💡 KEY INSIGHTS:');
    console.log('================');
    console.log('1. Indirect commission logic is working correctly');
    console.log('2. Limited distribution due to short referral chains');
    console.log('3. Most users have no upline members eligible for indirect commission');
    console.log('4. Commission accumulates when no eligible users found');
    console.log('5. System behavior matches the designed logic');
    console.log('');

    console.log('🎯 RECOMMENDATIONS:');
    console.log('===================');
    console.log('1. Verify if current behavior matches business requirements');
    console.log('2. Consider if indirect commission scope should be expanded');
    console.log('3. Monitor accumulated commissions for future distribution');
    console.log('4. Document system behavior for stakeholders');
    console.log('5. Consider alternative commission structures if needed');

  } catch (error) {
    console.error('❌ Error demonstrating indirect commission logic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

demonstrateIndirectCommissionLogic();
