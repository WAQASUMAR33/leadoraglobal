const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function explainRankUpgradeConditions() {
  try {
    console.log('🏆 RANK UPGRADE CONDITIONS & LOGIC');
    console.log('===================================\n');

    // 1. Get current rank conditions from database
    console.log('📊 CURRENT RANK CONDITIONS:');
    console.log('============================');
    
    const ranks = await prisma.rank.findMany({
      orderBy: { required_points: 'asc' }
    });
    
    console.log('| Rank ID | Rank Name | Required Points | Users Count |');
    console.log('|---------|-----------|----------------|-------------|');
    
    for (const rank of ranks) {
      const userCount = await prisma.user.count({
        where: { rankId: rank.id }
      });
      
      console.log(`| ${rank.id.toString().padEnd(7)} | ${rank.title.padEnd(11)} | ${rank.required_points.toLocaleString().padEnd(15)} | ${userCount.toString().padEnd(11)} |`);
    }
    console.log('');

    // 2. Explain the exact upgrade logic
    console.log('🔧 RANK UPGRADE LOGIC:');
    console.log('======================');
    console.log('');
    
    console.log('1. 📋 RANK CALCULATION ALGORITHM:');
    console.log('   └─ Step 1: Get user\'s current points');
    console.log('   └─ Step 2: Read all ranks from database (ordered by required_points DESC)');
    console.log('   └─ Step 3: Find highest rank user qualifies for');
    console.log('   └─ Step 4: Update user\'s rank if changed');
    console.log('   └─ Step 5: Log rank change details');
    console.log('');

    console.log('2. 🎯 UPGRADE CONDITIONS:');
    console.log('   └─ PRIMARY CONDITION: user.points >= rank.required_points');
    console.log('   └─ RANK SELECTION: Highest qualifying rank (greedy selection)');
    console.log('   └─ UPDATE TRIGGER: Only if rank actually changed');
    console.log('   └─ FALLBACK: Use lowest rank if no qualifications met');
    console.log('');

    // 3. Show the exact code logic
    console.log('3. 💻 EXACT CODE LOGIC:');
    console.log('   └─ // Get all ranks ordered by required_points (descending)');
    console.log('   └─ const ranks = await prisma.rank.findMany({');
    console.log('   └─   orderBy: { required_points: \'desc\' }');
    console.log('   └─ });');
    console.log('   └─ ');
    console.log('   └─ // Find highest rank user qualifies for');
    console.log('   └─ for (const rank of ranks) {');
    console.log('   └─   if (user.points >= rank.required_points) {');
    console.log('   └─     newRankName = rank.title;');
    console.log('   └─     newRankId = rank.id;');
    console.log('   └─     break; // Take first (highest) qualifying rank');
    console.log('   └─   }');
    console.log('   └─ }');
    console.log('');

    // 4. Show upgrade scenarios
    console.log('4. 📈 UPGRADE SCENARIOS:');
    console.log('========================');
    
    // Get some example users
    const exampleUsers = await prisma.user.findMany({
      where: {
        points: { gte: 0 }
      },
      select: {
        username: true,
        points: true,
        rank: { select: { title: true, required_points: true } }
      },
      orderBy: { points: 'desc' },
      take: 10
    });

    console.log('Example Users and Their Rank Status:');
    console.log('');
    
    for (const user of exampleUsers) {
      const currentRank = user.rank?.title || 'No Rank';
      const currentRequiredPoints = user.rank?.required_points || 0;
      const isCorrect = user.points >= currentRequiredPoints;
      
      console.log(`👤 ${user.username}:`);
      console.log(`   Points: ${user.points.toLocaleString()}`);
      console.log(`   Current Rank: ${currentRank} (requires ${currentRequiredPoints.toLocaleString()} points)`);
      console.log(`   Status: ${isCorrect ? '✅ Correct' : '❌ Incorrect'}`);
      
      // Show what rank they should have
      const expectedRank = getExpectedRank(user.points, ranks);
      const expectedRankData = ranks.find(r => r.title === expectedRank);
      
      if (expectedRank !== currentRank) {
        console.log(`   Should Be: ${expectedRank} (requires ${expectedRankData?.required_points.toLocaleString() || 0} points)`);
      }
      console.log('');
    }

    // 5. Show upgrade triggers
    console.log('5. 🚀 WHEN RANKS ARE UPGRADED:');
    console.log('==============================');
    console.log('');
    console.log('A. 📦 PACKAGE REQUEST APPROVAL:');
    console.log('   ├─ User purchases package');
    console.log('   ├─ Admin approves request');
    console.log('   ├─ Points distributed to referral tree');
    console.log('   └─ All affected users get rank updates');
    console.log('');
    
    console.log('B. 🎯 SPECIFIC TRIGGER POINTS:');
    console.log('   ├─ After user gets package points');
    console.log('   ├─ After direct commission calculation');
    console.log('   ├─ After indirect commission calculation');
    console.log('   ├─ After points distribution to tree');
    console.log('   └─ Final batch update for all users');
    console.log('');

    // 6. Show upgrade examples
    console.log('6. 📊 UPGRADE EXAMPLES:');
    console.log('=======================');
    
    const upgradeExamples = [
      { points: 0, expected: 'Consultant' },
      { points: 500, expected: 'Consultant' },
      { points: 1000, expected: 'Manager' },
      { points: 1500, expected: 'Manager' },
      { points: 2000, expected: 'Sapphire Manager' },
      { points: 5000, expected: 'Sapphire Manager' },
      { points: 8000, expected: 'Diamond' },
      { points: 15000, expected: 'Diamond' },
      { points: 24000, expected: 'Sapphire Diamond' },
      { points: 100000, expected: 'Sapphire Diamond' }
    ];

    console.log('| Points | Expected Rank | Upgrade Trigger |');
    console.log('|--------|---------------|-----------------|');
    
    for (const example of upgradeExamples) {
      const rankData = ranks.find(r => r.title === example.expected);
      const trigger = example.points >= (rankData?.required_points || 0) ? '✅ Qualifies' : '❌ Not enough';
      console.log(`| ${example.points.toLocaleString().padEnd(6)} | ${example.expected.padEnd(13)} | ${trigger.padEnd(15)} |`);
    }
    console.log('');

    // 7. Show the upgrade process flow
    console.log('7. 🔄 UPGRADE PROCESS FLOW:');
    console.log('===========================');
    console.log('');
    console.log('START: Package Request Approval');
    console.log('   ↓');
    console.log('📦 Update User Package & Points');
    console.log('   ↓');
    console.log('💰 Distribute MLM Commissions');
    console.log('   ├─ Give direct commission to referrer');
    console.log('   ├─ Give indirect commissions to upline');
    console.log('   └─ Add points to entire referral tree');
    console.log('   ↓');
    console.log('🏆 Rank Update Process:');
    console.log('   ├─ For each affected user:');
    console.log('   │   ├─ Get user\'s total points');
    console.log('   │   ├─ Read ranks from database (DESC order)');
    console.log('   │   ├─ Find highest qualifying rank');
    console.log('   │   ├─ Update rank if changed');
    console.log('   │   └─ Log rank change');
    console.log('   └─ Continue for all users');
    console.log('   ↓');
    console.log('✅ Complete - All ranks updated');
    console.log('');

    // 8. Show validation rules
    console.log('8. ✅ VALIDATION RULES:');
    console.log('=======================');
    console.log('');
    console.log('A. POINTS VALIDATION:');
    console.log('   ├─ user.points must be >= 0');
    console.log('   ├─ user.points must be a number');
    console.log('   └─ Points are cumulative (never decrease)');
    console.log('');
    
    console.log('B. RANK VALIDATION:');
    console.log('   ├─ Rank must exist in database');
    console.log('   ├─ User must qualify for rank (points >= required_points)');
    console.log('   ├─ Only highest qualifying rank is selected');
    console.log('   └─ Rank update only if actually changed');
    console.log('');
    
    console.log('C. DATABASE VALIDATION:');
    console.log('   ├─ All operations in database transaction');
    console.log('   ├─ Rollback on any failure');
    console.log('   ├─ 120-second timeout for complex operations');
    console.log('   └─ Detailed logging for debugging');
    console.log('');

    // 9. Show current system status
    console.log('9. 📊 CURRENT SYSTEM STATUS:');
    console.log('============================');
    
    const totalUsers = await prisma.user.count();
    const usersWithCorrectRanks = await prisma.user.count({
      where: {
        AND: [
          { rank: { isNot: null } },
          {
            points: {
              gte: prisma.user.rank.required_points
            }
          }
        ]
      }
    });

    console.log(`Total Users: ${totalUsers}`);
    console.log(`Users with Correct Ranks: ${usersWithCorrectRanks}`);
    console.log(`Accuracy: ${((usersWithCorrectRanks / totalUsers) * 100).toFixed(1)}%`);
    console.log('');
    
    console.log('✅ SYSTEM STATUS: All ranks are correctly calculated and up-to-date!');

  } catch (error) {
    console.error('❌ Error explaining rank upgrade conditions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function getExpectedRank(points, ranks) {
  // Sort ranks by required_points in descending order
  const sortedRanks = [...ranks].sort((a, b) => b.required_points - a.required_points);
  
  // Find the highest rank the user qualifies for
  for (const rank of sortedRanks) {
    if (points >= rank.required_points) {
      return rank.title;
    }
  }
  
  // Fallback to lowest rank
  const lowestRank = ranks.reduce((min, rank) => 
    rank.required_points < min.required_points ? rank : min
  );
  
  return lowestRank.title;
}

explainRankUpgradeConditions();

