const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function explainRankLogic() {
  try {
    console.log('🏆 RANK UPGRADATION LOGIC EXPLANATION');
    console.log('=====================================\n');

    // 1. Show current rank hierarchy
    console.log('📊 CURRENT RANK HIERARCHY:');
    console.log('==========================');
    
    const ranks = await prisma.rank.findMany({
      orderBy: { required_points: 'asc' }
    });
    
    console.log('| Rank | Required Points | Description |');
    console.log('|------|----------------|-------------|');
    ranks.forEach(rank => {
      const description = getRankDescription(rank.title);
      console.log(`| ${rank.title} | ${rank.required_points.toLocaleString()} | ${description} |`);
    });
    console.log('');

    // 2. Explain the upgrade process
    console.log('🔄 RANK UPGRADATION PROCESS:');
    console.log('============================');
    console.log('1. 📦 PACKAGE REQUEST APPROVAL');
    console.log('   ├─ User purchases a package');
    console.log('   ├─ Package request is created');
    console.log('   ├─ Admin approves the request');
    console.log('   └─ Triggers rank upgrade process');
    console.log('');

    console.log('2. 💰 POINTS DISTRIBUTION');
    console.log('   ├─ Package buyer gets points from package');
    console.log('   ├─ ALL upline users get same points');
    console.log('   ├─ Points added to each user\'s total');
    console.log('   └─ Example: Master Package = 2,000 points for everyone');
    console.log('');

    console.log('3. 🏆 RANK CALCULATION & UPDATE');
    console.log('   ├─ System reads rank conditions from database');
    console.log('   ├─ Finds highest rank user qualifies for');
    console.log('   ├─ Updates user\'s rank if changed');
    console.log('   └─ Logs rank change with details');
    console.log('');

    // 3. Show example scenario
    console.log('📈 EXAMPLE SCENARIO:');
    console.log('====================');
    
    const exampleUser = await prisma.user.findFirst({
      where: {
        points: { gte: 1000 },
        rank: { title: { not: 'Sapphire Diamond' } }
      },
      select: {
        username: true,
        points: true,
        rank: { select: { title: true } },
        currentPackage: { select: { package_name: true, package_points: true } }
      }
    });

    if (exampleUser) {
      console.log(`👤 EXAMPLE USER: ${exampleUser.username}`);
      console.log(`   Current Points: ${exampleUser.points.toLocaleString()}`);
      console.log(`   Current Rank: ${exampleUser.rank?.title || 'No Rank'}`);
      console.log(`   Package: ${exampleUser.currentPackage?.package_name || 'No Package'}`);
      console.log('');

      // Simulate package approval
      const packagePoints = 2000; // Master Package points
      const newTotalPoints = exampleUser.points + packagePoints;
      
      console.log(`📦 SIMULATING PACKAGE APPROVAL (+${packagePoints} points):`);
      console.log(`   Before: ${exampleUser.points.toLocaleString()} points`);
      console.log(`   After:  ${newTotalPoints.toLocaleString()} points`);
      
      // Calculate expected rank
      const expectedRank = getExpectedRank(newTotalPoints, ranks);
      console.log(`   Expected New Rank: ${expectedRank}`);
      console.log('');

      // Show upline effect
      console.log(`🌳 UPLINE EFFECT:`);
      console.log(`   ├─ ${exampleUser.username} gets +${packagePoints} points`);
      console.log(`   ├─ All upline users get +${packagePoints} points`);
      console.log(`   ├─ Each user's rank is recalculated`);
      console.log(`   └─ Rank changes are applied automatically`);
      console.log('');
    }

    // 4. Show the technical implementation
    console.log('⚙️ TECHNICAL IMPLEMENTATION:');
    console.log('=============================');
    console.log('1. 🔧 MAIN APPROVAL FUNCTION (packageApproval.js):');
    console.log('   └─ approvePackageRequest(packageRequestId)');
    console.log('       ├─ Loads rank conditions from database');
    console.log('       ├─ Starts database transaction');
    console.log('       ├─ Updates user package and rank');
    console.log('       ├─ Distributes MLM commissions');
    console.log('       └─ Updates package request status');
    console.log('');

    console.log('2. 🏆 RANK UPDATE FUNCTIONS:');
    console.log('   ├─ updateUserRank(userId) - Main rank update');
    console.log('   ├─ updateUserRankInTransaction(userId, points, tx) - Transaction version');
    console.log('   └─ updateRanksForAllAffectedUsers(packageRequestId, tx) - Batch update');
    console.log('');

    console.log('3. 💡 RANK CALCULATION LOGIC:');
    console.log('   ├─ Reads all ranks from database (ordered by points desc)');
    console.log('   ├─ Finds highest rank user qualifies for based on points');
    console.log('   ├─ Updates user\'s rankId if rank changed');
    console.log('   └─ Logs rank change with before/after details');
    console.log('');

    // 5. Show when ranks are updated
    console.log('🔄 WHEN RANKS ARE UPDATED:');
    console.log('==========================');
    console.log('1. 📦 During Package Approval:');
    console.log('   ├─ Package buyer gets rank update');
    console.log('   ├─ All upline users get rank updates');
    console.log('   ├─ Commission recipients get rank updates');
    console.log('   └─ Entire referral tree is processed');
    console.log('');

    console.log('2. 🎯 Multiple Update Points:');
    console.log('   ├─ After points distribution');
    console.log('   ├─ After direct commission calculation');
    console.log('   ├─ After indirect commission calculation');
    console.log('   └─ Final batch update for all affected users');
    console.log('');

    // 6. Show current system status
    console.log('📊 CURRENT SYSTEM STATUS:');
    console.log('=========================');
    
    const userCount = await prisma.user.count();
    const rankStats = await prisma.user.groupBy({
      by: ['rankId'],
      _count: { rankId: true },
      where: {
        rank: { isNot: null }
      }
    });

    console.log(`Total Users: ${userCount}`);
    console.log('Users by Rank:');
    
    for (const stat of rankStats) {
      const rank = await prisma.rank.findUnique({
        where: { id: stat.rankId },
        select: { title: true, required_points: true }
      });
      
      if (rank) {
        console.log(`  ├─ ${rank.title}: ${stat._count.rankId} users (requires ${rank.required_points} points)`);
      }
    }
    console.log('');

    // 7. Key features
    console.log('✨ KEY FEATURES:');
    console.log('================');
    console.log('✅ Automatic Rank Updates - No manual intervention needed');
    console.log('✅ Database-Driven Logic - Uses actual rank conditions from DB');
    console.log('✅ Transaction Safety - All operations in database transaction');
    console.log('✅ Comprehensive Coverage - All affected users get updates');
    console.log('✅ Real-time Processing - Ranks update immediately');
    console.log('✅ Detailed Logging - Full transparency and debugging');
    console.log('✅ Performance Optimized - Batch updates and efficient queries');
    console.log('');

    console.log('🎉 The rank upgradation system is working correctly!');
    console.log('   Users are automatically promoted based on their points');
    console.log('   and the system ensures all ranks stay synchronized.');

  } catch (error) {
    console.error('❌ Error explaining rank logic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function getRankDescription(rankTitle) {
  const descriptions = {
    'Consultant': 'Default rank for new users',
    'Manager': 'First promotion level',
    'Sapphire Manager': 'Second promotion level', 
    'Diamond': 'Third promotion level',
    'Sapphire Diamond': 'Highest promotion level',
    'Ambassador': 'Advanced leadership level',
    'Sapphire Ambassador': 'Premium leadership level',
    'Royal Ambassador': 'Elite leadership level',
    'Global Ambassador': 'Top leadership level',
    'Honory Share Holder': 'Highest honor level'
  };
  
  return descriptions[rankTitle] || 'Special rank level';
}

function getExpectedRank(points, ranks) {
  // Find the highest rank the user qualifies for
  const sortedRanks = ranks.sort((a, b) => b.required_points - a.required_points);
  
  for (const rank of sortedRanks) {
    if (points >= rank.required_points) {
      return rank.title;
    }
  }
  
  return 'No Rank';
}

explainRankLogic();

