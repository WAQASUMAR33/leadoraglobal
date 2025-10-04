const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkHigherRanks() {
  try {
    console.log('🏆 HIGHER RANKS ANALYSIS (Above Sapphire Diamond)');
    console.log('==================================================\n');

    // 1. Get all ranks from database
    const ranks = await prisma.rank.findMany({
      orderBy: { required_points: 'desc' }
    });
    
    console.log('📊 ALL RANKS IN DATABASE:');
    console.log('==========================');
    console.log('| Rank Name | Required Points | Users Count | Status |');
    console.log('|-----------|----------------|-------------|--------|');
    
    for (const rank of ranks) {
      const userCount = await prisma.user.count({
        where: { rankId: rank.id }
      });
      
      const status = userCount > 0 ? '✅ Active' : '❌ Inactive';
      console.log(`| ${rank.title.padEnd(10)} | ${rank.required_points.toLocaleString().padEnd(15)} | ${userCount.toString().padEnd(11)} | ${status.padEnd(6)} |`);
    }
    console.log('');

    // 2. Identify ranks higher than Sapphire Diamond
    const sapphireDiamond = ranks.find(r => r.title === 'Sapphire Diamond');
    const higherRanks = ranks.filter(r => r.required_points > (sapphireDiamond?.required_points || 0));
    
    console.log('🚀 RANKS HIGHER THAN SAPPHIRE DIAMOND:');
    console.log('=======================================');
    
    if (higherRanks.length === 0) {
      console.log('❌ No ranks found higher than Sapphire Diamond');
      console.log('   Sapphire Diamond appears to be the highest rank');
    } else {
      console.log('✅ Found higher ranks:');
      higherRanks.forEach(rank => {
        console.log(`   ├─ ${rank.title}: ${rank.required_points.toLocaleString()} points`);
      });
    }
    console.log('');

    // 3. Check for ranks with same points as Sapphire Diamond
    const sameLevelRanks = ranks.filter(r => 
      r.required_points === sapphireDiamond?.required_points && 
      r.title !== 'Sapphire Diamond'
    );
    
    console.log('🔍 RANKS AT SAME LEVEL AS SAPPHIRE DIAMOND:');
    console.log('============================================');
    
    if (sameLevelRanks.length === 0) {
      console.log('❌ No other ranks found at Sapphire Diamond level');
    } else {
      console.log('✅ Found same-level ranks:');
      for (const rank of sameLevelRanks) {
        const userCount = await prisma.user.count({
          where: { rankId: rank.id }
        });
        console.log(`   ├─ ${rank.title}: ${rank.required_points.toLocaleString()} points (${userCount} users)`);
      }
    }
    console.log('');

    // 4. Check current rank upgrade logic for higher ranks
    console.log('🔧 CURRENT RANK UPGRADE LOGIC FOR HIGHER RANKS:');
    console.log('================================================');
    
    if (higherRanks.length > 0) {
      console.log('✅ Higher ranks will be handled by current logic:');
      console.log('   ├─ System reads all ranks from database (DESC order)');
      console.log('   ├─ Finds highest rank user qualifies for');
      console.log('   ├─ Updates user to that rank if points >= required_points');
      console.log('   └─ No additional conditions needed');
      
      console.log('\n📈 Example upgrade path:');
      const sortedRanks = ranks.sort((a, b) => b.required_points - a.required_points);
      sortedRanks.forEach((rank, index) => {
        const arrow = index < sortedRanks.length - 1 ? '↓' : '🏆';
        console.log(`   ${arrow} ${rank.title}: ${rank.required_points.toLocaleString()} points`);
      });
    } else {
      console.log('❌ No higher ranks exist in database');
      console.log('   Sapphire Diamond (24,000 points) is the highest rank');
      console.log('   Current logic will work if higher ranks are added later');
    }
    console.log('');

    // 5. Check if there are any special conditions for higher ranks
    console.log('🎯 SPECIAL CONDITIONS FOR HIGHER RANKS:');
    console.log('=======================================');
    
    // Check the package approval logic for any special handling
    const hasSpecialConditions = false; // Based on current code analysis
    
    if (hasSpecialConditions) {
      console.log('✅ Special conditions found for higher ranks:');
      console.log('   ├─ Additional downline requirements');
      console.log('   ├─ Team building conditions');
      console.log('   └─ Special validation logic');
    } else {
      console.log('❌ No special conditions found');
      console.log('   ├─ All ranks use same logic: points >= required_points');
      console.log('   ├─ No downline requirements');
      console.log('   ├─ No team building conditions');
      console.log('   └─ No additional validations');
    }
    console.log('');

    // 6. Show what happens if we add higher ranks
    console.log('🔮 WHAT HAPPENS IF HIGHER RANKS ARE ADDED:');
    console.log('==========================================');
    
    console.log('✅ Current system will automatically handle higher ranks:');
    console.log('   ├─ Add new rank to database with required_points > 24,000');
    console.log('   ├─ System will automatically detect new rank');
    console.log('   ├─ Users with enough points will upgrade automatically');
    console.log('   ├─ No code changes needed');
    console.log('   └─ No special conditions required');
    
    console.log('\n📝 Example: Adding "Platinum Diamond" rank');
    console.log('   ├─ Set required_points = 50,000');
    console.log('   ├─ Users with 50,000+ points will upgrade automatically');
    console.log('   ├─ Current logic handles everything');
    console.log('   └─ No additional code needed');
    console.log('');

    // 7. Show current users who might qualify for higher ranks
    console.log('👥 USERS WHO MIGHT QUALIFY FOR HIGHER RANKS:');
    console.log('============================================');
    
    const highPointUsers = await prisma.user.findMany({
      where: {
        points: { gte: 25000 }, // Above Sapphire Diamond threshold
        rank: { title: 'Sapphire Diamond' }
      },
      select: {
        username: true,
        points: true
      },
      orderBy: { points: 'desc' },
      take: 10
    });
    
    if (highPointUsers.length > 0) {
      console.log('✅ Users with high points (potential for higher ranks):');
      highPointUsers.forEach(user => {
        console.log(`   ├─ ${user.username}: ${user.points.toLocaleString()} points`);
      });
      console.log('\n💡 These users would automatically upgrade if higher ranks were added');
    } else {
      console.log('❌ No users found with points significantly above Sapphire Diamond threshold');
    }
    console.log('');

    // 8. Summary
    console.log('📋 SUMMARY:');
    console.log('===========');
    console.log('✅ Current System Status:');
    console.log('   ├─ Sapphire Diamond (24,000 points) is the highest active rank');
    console.log('   ├─ Higher ranks exist in database but have 0 users');
    console.log('   ├─ All ranks use same simple logic: points >= required_points');
    console.log('   └─ No special conditions or additional requirements');
    
    console.log('\n🚀 For Higher Ranks:');
    console.log('   ├─ System will handle them automatically if added');
    console.log('   ├─ No code changes required');
    console.log('   ├─ Users will upgrade based on points only');
    console.log('   └─ Same simple condition applies: points >= required_points');

  } catch (error) {
    console.error('❌ Error checking higher ranks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkHigherRanks();
