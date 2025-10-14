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

let processedCount = 0;
let totalStats = {
  total: 0,
  byRank: {},
  byLevel: {}
};

async function displayUserTree(username, level = 0, prefix = '', isLast = true, maxLevel = 5, targetUser = 'bushra750') {
  if (level > maxLevel) {
    return;
  }

  try {
    // Get user
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        username: true,
        fullname: true,
        points: true,
        rank: { select: { title: true } }
      }
    });

    if (!user) {
      return;
    }

    processedCount++;
    totalStats.total++;
    const rankTitle = user.rank?.title || 'No Rank';
    totalStats.byRank[rankTitle] = (totalStats.byRank[rankTitle] || 0) + 1;
    totalStats.byLevel[level] = (totalStats.byLevel[level] || 0) + 1;

    // Display user
    const connector = level === 0 ? '🌳' : (isLast ? '└─' : '├─');
    const rankIcon = getRankIcon(rankTitle);
    const isTarget = username === targetUser;
    const marker = isTarget ? ' ⭐ TARGET' : '';

    if (level === 0) {
      console.log(`\n${connector} ${rankIcon} ${user.username} (${user.fullname})${marker}`);
      console.log(`   Points: ${user.points.toLocaleString()} | Rank: ${rankTitle}`);
    } else {
      console.log(`${prefix}${connector} ${rankIcon} ${user.username} (${user.fullname})${marker}`);
      console.log(`${prefix}${isLast ? '   ' : '│  '} Pts: ${user.points.toLocaleString()} | ${rankTitle}`);
    }

    // Get direct referrals
    const referrals = await prisma.user.findMany({
      where: { referredBy: username },
      select: {
        username: true
      },
      orderBy: { points: 'desc' }
    });

    // Progress indicator
    if (processedCount % 50 === 0) {
      console.error(`[Progress: ${processedCount} users processed...]`);
    }

    // Display referrals recursively
    if (referrals.length > 0) {
      const newPrefix = prefix + (isLast ? '   ' : '│  ');
      
      for (let i = 0; i < referrals.length; i++) {
        const isLastRef = i === referrals.length - 1;
        await displayUserTree(
          referrals[i].username,
          level + 1,
          newPrefix,
          isLastRef,
          maxLevel,
          targetUser
        );
      }
    }

  } catch (error) {
    console.error(`${prefix}❌ Error loading ${username}: ${error.message}`);
  }
}

async function showCompleteTreeTopToBottom() {
  try {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║     COMPLETE TREE: TOUSEEF231 → BUSHRA750 → DOWNLINE        ║');
    console.log('║              (TOP TO BOTTOM - ALL LEVELS)                     ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');

    console.log('\n⏳ Loading tree... This may take a few minutes for large networks.\n');
    console.log('Showing: Touseef231 (root) + all descendants');
    console.log('Highlighting: bushra750 ⭐\n');
    console.log('─────────────────────────────────────────────────────────────\n');

    const startTime = Date.now();

    // Start from Touseef231 (root) and show complete tree
    await displayUserTree('Touseef231', 0, '', true, 10, 'bushra750');

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Display statistics
    console.log('\n\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    NETWORK STATISTICS                         ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    console.log(`📊 Total Network Size: ${totalStats.total} members`);
    console.log(`⏱️  Processing Time: ${duration} seconds`);
    console.log(`🌳 Maximum Depth: ${Math.max(...Object.keys(totalStats.byLevel).map(Number))} levels\n`);

    console.log('📈 Distribution by Level:');
    console.log('─────────────────────────────────────');
    const levels = Object.keys(totalStats.byLevel).map(Number).sort((a, b) => a - b);
    levels.forEach(lvl => {
      const count = totalStats.byLevel[lvl];
      const percentage = ((count / totalStats.total) * 100).toFixed(1);
      console.log(`Level ${lvl.toString().padStart(2)}: ${count.toString().padStart(4)} members (${percentage}%)`);
    });

    console.log('\n🏆 Rank Distribution:');
    console.log('─────────────────────────────────────');
    const sortedRanks = Object.entries(totalStats.byRank).sort((a, b) => b[1] - a[1]);
    sortedRanks.forEach(([rank, count]) => {
      const icon = getRankIcon(rank);
      const percentage = ((count / totalStats.total) * 100).toFixed(1);
      console.log(`${icon} ${rank.padEnd(25)}: ${count.toString().padStart(4)} (${percentage}%)`);
    });

    console.log('\n💎 Diamond & Above:');
    console.log('─────────────────────────────────────');
    const diamondRanks = ['Ambassador', 'Sapphire Diamond', 'Diamond'];
    let diamondTotal = 0;
    diamondRanks.forEach(rank => {
      if (totalStats.byRank[rank]) {
        const icon = getRankIcon(rank);
        console.log(`${icon} ${rank.padEnd(25)}: ${totalStats.byRank[rank]}`);
        diamondTotal += totalStats.byRank[rank];
      }
    });
    const diamondPercentage = ((diamondTotal / totalStats.total) * 100).toFixed(1);
    console.log(`\nTotal Diamond & Above: ${diamondTotal} members (${diamondPercentage}%)`);

    console.log('\n═════════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

showCompleteTreeTopToBottom();

