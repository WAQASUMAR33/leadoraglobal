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

async function showBushra750Tree() {
  try {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║              BUSHRA750 DOWNLINE TREE VIEW                     ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    // Get Bushra750
    const bushra = await prisma.user.findUnique({
      where: { username: 'bushra750' },
      select: {
        username: true,
        fullname: true,
        points: true,
        balance: true,
        rank: { select: { title: true } }
      }
    });

    if (!bushra) {
      console.log('❌ User bushra750 not found\n');
      return;
    }

    const rankIcon = getRankIcon(bushra.rank?.title);
    console.log(`🌳 ${rankIcon} ${bushra.username} (${bushra.fullname})`);
    console.log(`   Points: ${bushra.points.toLocaleString()} | Rank: ${bushra.rank?.title} | Balance: PKR ${parseFloat(bushra.balance).toLocaleString()}\n`);

    // Get Level 1 (Direct Referrals)
    const level1 = await prisma.user.findMany({
      where: { referredBy: 'bushra750' },
      select: {
        username: true,
        fullname: true,
        points: true,
        rank: { select: { title: true } }
      },
      orderBy: { points: 'desc' }
    });

    console.log(`📊 Direct Referrals: ${level1.length}\n`);

    let stats = {
      total: 1,
      byRank: { [bushra.rank?.title || 'No Rank']: 1 },
      level1Count: level1.length,
      level2Count: 0
    };

    // Display Level 1
    for (let i = 0; i < level1.length; i++) {
      const user1 = level1[i];
      const isLast1 = i === level1.length - 1;
      const connector1 = isLast1 ? '└─' : '├─';
      const icon1 = getRankIcon(user1.rank?.title);
      const rank1 = user1.rank?.title || 'No Rank';
      
      stats.total++;
      stats.byRank[rank1] = (stats.byRank[rank1] || 0) + 1;

      console.log(`${connector1} ${icon1} ${user1.username} (${user1.fullname})`);
      console.log(`${isLast1 ? '   ' : '│  '} Pts: ${user1.points.toLocaleString()} | ${rank1}`);

      // Get Level 2 for this user
      try {
        const level2 = await prisma.user.findMany({
          where: { referredBy: user1.username },
          select: {
            username: true,
            fullname: true,
            points: true,
            rank: { select: { title: true } }
          },
          orderBy: { points: 'desc' },
          take: 10 // Limit to first 10 to avoid timeout
        });

        if (level2.length > 0) {
          const prefix1 = isLast1 ? '   ' : '│  ';
          
          for (let j = 0; j < level2.length; j++) {
            const user2 = level2[j];
            const isLast2 = j === level2.length - 1;
            const connector2 = isLast2 ? '└─' : '├─';
            const icon2 = getRankIcon(user2.rank?.title);
            const rank2 = user2.rank?.title || 'No Rank';
            
            stats.total++;
            stats.level2Count++;
            stats.byRank[rank2] = (stats.byRank[rank2] || 0) + 1;

            console.log(`${prefix1}${connector2} ${icon2} ${user2.username} (${user2.fullname})`);
            console.log(`${prefix1}${isLast2 ? '   ' : '│  '} Pts: ${user2.points.toLocaleString()} | ${rank2}`);
          }
        }
      } catch (error) {
        console.log(`${isLast1 ? '   ' : '│  '}⚠️ Error fetching level 2 for ${user1.username}`);
      }

      console.log('');
    }

    // Statistics
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    NETWORK STATISTICS                         ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    console.log(`📊 Levels Shown:`);
    console.log(`   Level 0 (Root): 1 user`);
    console.log(`   Level 1 (Direct): ${stats.level1Count} users`);
    console.log(`   Level 2 (Grandchildren): ${stats.level2Count} users (top 10 per line)`);
    console.log(`   Total Displayed: ${stats.total} users\n`);

    console.log('🏆 Rank Distribution:');
    console.log('─────────────────────────────────────');
    const sortedRanks = Object.entries(stats.byRank).sort((a, b) => b[1] - a[1]);
    sortedRanks.forEach(([rank, count]) => {
      const icon = getRankIcon(rank);
      const percentage = ((count / stats.total) * 100).toFixed(1);
      console.log(`${icon} ${rank.padEnd(25)}: ${count.toString().padStart(3)} (${percentage}%)`);
    });

    console.log('\n💎 Diamond & Above:');
    console.log('─────────────────────────────────────');
    const diamondRanks = ['Ambassador', 'Sapphire Diamond', 'Diamond'];
    let diamondTotal = 0;
    diamondRanks.forEach(rank => {
      if (stats.byRank[rank]) {
        const icon = getRankIcon(rank);
        console.log(`${icon} ${rank.padEnd(25)}: ${stats.byRank[rank]}`);
        diamondTotal += stats.byRank[rank];
      }
    });
    console.log(`\nTotal Diamond & Above: ${diamondTotal} users`);

    console.log('\n═════════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

showBushra750Tree();

