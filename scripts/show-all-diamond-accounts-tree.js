import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getRankIcon(rank) {
  const icons = {
    'Ambassador': '🎖️',
    'Sapphire Diamond': '💠',
    'Diamond': '💎',
    'Sapphire Manager': '💼',
    'Manager': '📊',
    'Consultant': '👤'
  };
  return icons[rank] || '⚪';
}

async function getUplineChain(username) {
  const chain = [];
  let currentUsername = username;
  let level = 0;
  const maxLevels = 20;

  while (currentUsername && level < maxLevels) {
    const user = await prisma.user.findUnique({
      where: { username: currentUsername },
      select: {
        id: true,
        username: true,
        fullname: true,
        points: true,
        referredBy: true,
        rank: {
          select: {
            title: true
          }
        }
      }
    });

    if (!user) {
      break;
    }

    chain.push({
      ...user,
      level
    });

    if (!user.referredBy) {
      break;
    }

    currentUsername = user.referredBy;
    level++;
  }

  return chain;
}

async function getDirectReferrals(username) {
  const referrals = await prisma.user.findMany({
    where: { referredBy: username },
    select: {
      username: true,
      fullname: true,
      points: true,
      rank: {
        select: {
          title: true
        }
      }
    },
    orderBy: { points: 'desc' },
    take: 10 // Limit to top 10 referrals
  });

  return referrals;
}

async function showAllDiamondAccountsTree() {
  try {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║           ALL DIAMOND ACCOUNTS - TREE VIEW                    ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    // Get all Diamond rank users
    const diamondUsers = await prisma.user.findMany({
      where: {
        rank: {
          title: 'Diamond'
        }
      },
      select: {
        id: true,
        username: true,
        fullname: true,
        points: true,
        referredBy: true,
        referralCount: true,
        rank: {
          select: {
            title: true
          }
        }
      },
      orderBy: { points: 'desc' }
    });

    console.log(`📊 Total Diamond Accounts: ${diamondUsers.length}\n`);
    console.log('═════════════════════════════════════════════════════════════════\n');

    let processedCount = 0;

    for (const diamond of diamondUsers) {
      processedCount++;
      
      console.log(`\n${processedCount}. 💎 ${diamond.username} (${diamond.fullname})`);
      console.log(`   Points: ${diamond.points.toLocaleString()} | Direct Referrals: ${diamond.referralCount || 0}`);
      console.log('   ─────────────────────────────────────────────────────────────');

      // Get upline chain
      const uplineChain = await getUplineChain(diamond.username);
      
      // Display upline (from top to bottom)
      if (uplineChain.length > 1) {
        console.log('   📈 UPLINE CHAIN (Top → Diamond):');
        const reversedChain = [...uplineChain].reverse();
        
        for (let i = 0; i < reversedChain.length; i++) {
          const user = reversedChain[i];
          const isTarget = user.username === diamond.username;
          const rankIcon = getRankIcon(user.rank?.title);
          const indent = '      ' + '   '.repeat(i);
          const connector = i === 0 ? '🌳' : (isTarget ? '└─' : '├─');
          const marker = isTarget ? ' ⭐ DIAMOND' : '';
          
          console.log(`${indent}${connector} ${rankIcon} ${user.username} (${user.rank?.title || 'No Rank'})${marker}`);
          console.log(`${indent}${i === reversedChain.length - 1 ? '   ' : '│  '} ${user.points.toLocaleString()} pts`);
        }
      } else {
        console.log('   📈 UPLINE: None (Root User)');
      }

      // Get direct referrals
      const referrals = await getDirectReferrals(diamond.username);
      
      if (referrals.length > 0) {
        console.log('\n   📊 DIRECT REFERRALS (Top 10):');
        for (let i = 0; i < referrals.length; i++) {
          const ref = referrals[i];
          const isLast = i === referrals.length - 1;
          const connector = isLast ? '└─' : '├─';
          const rankIcon = getRankIcon(ref.rank?.title);
          
          console.log(`      ${connector} ${rankIcon} ${ref.username} (${ref.rank?.title || 'No Rank'})`);
          console.log(`      ${isLast ? '   ' : '│  '} ${ref.points.toLocaleString()} pts`);
        }
      } else {
        console.log('\n   📊 DIRECT REFERRALS: None');
      }

      console.log('\n   ═════════════════════════════════════════════════════════════');

      // Progress indicator
      if (processedCount % 5 === 0) {
        console.log(`\n   [Progress: ${processedCount}/${diamondUsers.length} Diamond accounts processed...]\n`);
      }
    }

    // Summary statistics
    console.log('\n\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    SUMMARY STATISTICS                         ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    const totalPoints = diamondUsers.reduce((sum, user) => sum + user.points, 0);
    const avgPoints = Math.round(totalPoints / diamondUsers.length);
    const totalReferrals = diamondUsers.reduce((sum, user) => sum + (user.referralCount || 0), 0);
    const avgReferrals = Math.round(totalReferrals / diamondUsers.length);

    // Find top performers
    const topByPoints = [...diamondUsers].sort((a, b) => b.points - a.points).slice(0, 5);
    const topByReferrals = [...diamondUsers].sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0)).slice(0, 5);

    console.log(`💎 Total Diamond Accounts: ${diamondUsers.length}`);
    console.log(`📊 Total Points: ${totalPoints.toLocaleString()}`);
    console.log(`📈 Average Points: ${avgPoints.toLocaleString()}`);
    console.log(`👥 Total Direct Referrals: ${totalReferrals}`);
    console.log(`📊 Average Referrals: ${avgReferrals}\n`);

    console.log('🏆 Top 5 by Points:');
    console.log('─────────────────────────────────────');
    topByPoints.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username.padEnd(20)} - ${user.points.toLocaleString().padStart(10)} pts`);
    });

    console.log('\n👥 Top 5 by Direct Referrals:');
    console.log('─────────────────────────────────────');
    topByReferrals.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username.padEnd(20)} - ${(user.referralCount || 0).toString().padStart(4)} referrals`);
    });

    console.log('\n═════════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

showAllDiamondAccountsTree();

