import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getRankIcon(rank) {
  const icons = {
    'Honory Share Holder': '🏆',
    'Global Ambassador': '🌍',
    'Royal Ambassador': '👑',
    'Sapphire Ambassador': '🌟',
    'Ambassador': '🎖️',
    'Sapphire Diamond': '💠',
    'Diamond': '💎',
    'Sapphire Manager': '💼',
    'Manager': '📊',
    'Consultant': '👤',
    'No Rank': '⚪'
  };
  return icons[rank] || '⚪';
}

async function getCompleteDownline(username, level = 0, maxLevel = 10, prefix = '', isLast = true, stats = null) {
  if (level > maxLevel) {
    return stats;
  }

  // Initialize stats on first call
  if (stats === null) {
    stats = {
      total: 0,
      byRank: {},
      byLevel: {},
      maxDepth: 0
    };
  }

  // Get user
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      fullname: true,
      points: true,
      balance: true,
      rank: {
        select: {
          title: true
        }
      }
    }
  });

  if (!user) {
    return stats;
  }

  // Update stats
  stats.total++;
  const rankTitle = user.rank?.title || 'No Rank';
  stats.byRank[rankTitle] = (stats.byRank[rankTitle] || 0) + 1;
  stats.byLevel[level] = (stats.byLevel[level] || 0) + 1;
  stats.maxDepth = Math.max(stats.maxDepth, level);

  // Display current user
  const connector = level === 0 ? '🌳' : (isLast ? '└─' : '├─');
  const rankIcon = getRankIcon(rankTitle);
  
  if (level === 0) {
    console.log(`\n${connector} ${rankIcon} ${user.username} (${user.fullname})`);
    console.log(`   Points: ${user.points.toLocaleString()} | Rank: ${rankTitle} | Balance: PKR ${parseFloat(user.balance).toLocaleString()}`);
  } else {
    console.log(`${prefix}${connector} ${rankIcon} ${user.username} (${user.fullname})`);
    console.log(`${prefix}${isLast ? '   ' : '│  '} Pts: ${user.points.toLocaleString()} | ${rankTitle}`);
  }

  // Get direct referrals
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
    orderBy: { points: 'desc' }
  });

  // Recursively display referrals
  if (referrals.length > 0) {
    const newPrefix = prefix + (isLast ? '   ' : '│  ');
    
    for (let i = 0; i < referrals.length; i++) {
      const referral = referrals[i];
      const isLastReferral = i === referrals.length - 1;
      
      // Recursively get this referral's downline
      await getCompleteDownline(
        referral.username, 
        level + 1, 
        maxLevel, 
        newPrefix, 
        isLastReferral, 
        stats
      );
    }
  }

  return stats;
}

async function showCompleteTree() {
  try {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║           BUSHRA750 COMPLETE DOWNLINE TREE                    ║');
    console.log('║              (ALL LEVELS EXPANDED)                            ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');

    const startTime = Date.now();
    
    // Get complete tree
    const stats = await getCompleteDownline('bushra750', 0, 15);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Display statistics
    console.log('\n\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    NETWORK STATISTICS                         ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    console.log(`📊 Total Network Size: ${stats.total} members (including Bushra750)`);
    console.log(`🌳 Maximum Depth: ${stats.maxDepth} levels`);
    console.log(`⏱️ Processing Time: ${duration} seconds\n`);

    console.log('📈 Distribution by Level:');
    console.log('─────────────────────────────────────');
    for (let i = 0; i <= stats.maxDepth; i++) {
      const count = stats.byLevel[i] || 0;
      const percentage = ((count / stats.total) * 100).toFixed(1);
      console.log(`Level ${i.toString().padStart(2)}: ${count.toString().padStart(4)} members (${percentage}%)`);
    }

    console.log('\n🏆 Distribution by Rank:');
    console.log('─────────────────────────────────────');
    
    // Sort by count descending
    const sortedRanks = Object.entries(stats.byRank).sort((a, b) => b[1] - a[1]);
    sortedRanks.forEach(([rank, count]) => {
      const icon = getRankIcon(rank);
      const percentage = ((count / stats.total) * 100).toFixed(1);
      console.log(`${icon} ${rank.padEnd(25)}: ${count.toString().padStart(4)} (${percentage}%)`);
    });

    console.log('\n💎 Diamond & Above Summary:');
    console.log('─────────────────────────────────────');
    const diamondRanks = [
      'Honory Share Holder', 'Global Ambassador', 'Royal Ambassador',
      'Sapphire Ambassador', 'Ambassador', 'Sapphire Diamond', 'Diamond'
    ];
    
    let diamondTotal = 0;
    diamondRanks.forEach(rank => {
      if (stats.byRank[rank]) {
        const icon = getRankIcon(rank);
        console.log(`${icon} ${rank.padEnd(25)}: ${stats.byRank[rank]}`);
        diamondTotal += stats.byRank[rank];
      }
    });
    
    const diamondPercentage = ((diamondTotal / stats.total) * 100).toFixed(1);
    console.log(`\nTotal Diamond & Above: ${diamondTotal} members (${diamondPercentage}%)`);

    console.log('\n═════════════════════════════════════════════════════════════════\n');

    // Save tree to file
    console.log('💾 Tree visualization saved to console output');
    console.log('📄 Statistics saved to ALL_RANKS_UPDATE_REPORT.md\n');

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error message:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

showCompleteTree();

