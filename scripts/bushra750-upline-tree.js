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
  const maxLevels = 20; // Prevent infinite loops

  while (currentUsername && level < maxLevels) {
    const user = await prisma.user.findUnique({
      where: { username: currentUsername },
      select: {
        id: true,
        username: true,
        fullname: true,
        points: true,
        balance: true,
        referredBy: true,
        referralCount: true,
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
      break; // Reached root user
    }

    currentUsername = user.referredBy;
    level++;
  }

  return chain;
}

async function showBushra750Upline() {
  try {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║         BUSHRA750 UPLINE TREE (TOP TO BOTTOM)                ║');
    console.log('║            (From Root to Bushra750)                          ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    const uplineChain = await getUplineChain('bushra750');

    if (uplineChain.length === 0) {
      console.log('❌ User bushra750 not found\n');
      return;
    }

    // Reverse the chain to show from top (root) to bottom (bushra750)
    const topToBottom = [...uplineChain].reverse();

    console.log(`📊 Upline Chain Length: ${topToBottom.length} levels\n`);
    console.log('─────────────────────────────────────────────────────────────\n');

    // Display the chain from top to bottom
    topToBottom.forEach((user, index) => {
      const isLast = index === topToBottom.length - 1;
      const isBushra = user.username === 'bushra750';
      const rankIcon = getRankIcon(user.rank?.title);
      const rankTitle = user.rank?.title || 'No Rank';

      // Create indentation based on level
      const indent = '   '.repeat(index);
      const connector = index === 0 ? '🌳' : (isLast ? '└─' : '├─');
      
      // Highlight Bushra750
      if (isBushra) {
        console.log(`${indent}${connector} ${rankIcon} ${user.username} (${user.fullname}) ⭐ TARGET USER`);
      } else {
        console.log(`${indent}${connector} ${rankIcon} ${user.username} (${user.fullname})`);
      }
      
      console.log(`${indent}${index === topToBottom.length - 1 ? '   ' : '│  '} Points: ${user.points.toLocaleString()} | Rank: ${rankTitle} | Balance: PKR ${parseFloat(user.balance).toLocaleString()}`);
      console.log(`${indent}${index === topToBottom.length - 1 ? '   ' : '│  '} Referrals: ${user.referralCount || 0} | Level: ${topToBottom.length - index - 1} from root`);
      
      if (!isLast) {
        console.log(`${indent}│`);
      }
    });

    console.log('\n─────────────────────────────────────────────────────────────\n');

    // Display summary
    console.log('📊 UPLINE SUMMARY:\n');
    
    topToBottom.forEach((user, index) => {
      const position = topToBottom.length - index - 1;
      const isBushra = user.username === 'bushra750';
      const marker = isBushra ? ' ⭐' : '';
      
      console.log(`Level ${position}: ${user.username.padEnd(20)} | ${(user.rank?.title || 'No Rank').padEnd(20)} | ${user.points.toLocaleString().padStart(10)} pts${marker}`);
    });

    console.log('\n🏆 Rank Distribution in Upline:');
    console.log('─────────────────────────────────────');
    
    const rankCounts = {};
    topToBottom.forEach(user => {
      const rank = user.rank?.title || 'No Rank';
      rankCounts[rank] = (rankCounts[rank] || 0) + 1;
    });

    Object.entries(rankCounts).forEach(([rank, count]) => {
      const icon = getRankIcon(rank);
      console.log(`${icon} ${rank.padEnd(25)}: ${count}`);
    });

    console.log('\n💰 Total Points in Upline Chain:');
    console.log('─────────────────────────────────────');
    const totalPoints = topToBottom.reduce((sum, user) => sum + user.points, 0);
    console.log(`Total: ${totalPoints.toLocaleString()} points`);
    console.log(`Average: ${Math.round(totalPoints / topToBottom.length).toLocaleString()} points per user`);

    console.log('\n═════════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

showBushra750Upline();

