import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Function to get user's downline recursively
async function getDownlineTree(username, level = 0, maxLevel = 5) {
  if (level >= maxLevel) {
    return null;
  }

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
    return null;
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

  return {
    ...user,
    level,
    referrals: referrals.map(r => ({
      ...r,
      level: level + 1
    }))
  };
}

// Function to display tree
function displayTree(node, prefix = '', isLast = true, stats = { total: 0, byRank: {} }) {
  if (!node) return stats;

  const connector = isLast ? '└─' : '├─';
  const rankIcon = getRankIcon(node.rank?.title);
  const rankColor = node.rank?.title || 'No Rank';
  
  // Count this user
  stats.total++;
  stats.byRank[rankColor] = (stats.byRank[rankColor] || 0) + 1;

  // Display current node
  if (node.level === 0) {
    console.log(`\n🌳 ${rankIcon} ${node.username} (${node.fullname})`);
    console.log(`   Points: ${node.points.toLocaleString()} | Rank: ${rankColor} | Balance: PKR ${parseFloat(node.balance).toLocaleString()}`);
  } else {
    const line = `${prefix}${connector} ${rankIcon} ${node.username} (${node.fullname})`;
    console.log(line);
    console.log(`${prefix}${isLast ? '   ' : '│  '} Points: ${node.points.toLocaleString()} | Rank: ${rankColor}`);
  }

  // Display referrals
  if (node.referrals && node.referrals.length > 0) {
    const newPrefix = prefix + (isLast ? '   ' : '│  ');
    
    node.referrals.forEach((referral, index) => {
      const isLastReferral = index === node.referrals.length - 1;
      displayReferral(referral, newPrefix, isLastReferral, stats);
    });
  }

  return stats;
}

function displayReferral(referral, prefix, isLast, stats) {
  const connector = isLast ? '└─' : '├─';
  const rankIcon = getRankIcon(referral.rank?.title);
  const rankColor = referral.rank?.title || 'No Rank';
  
  // Count this user
  stats.total++;
  stats.byRank[rankColor] = (stats.byRank[rankColor] || 0) + 1;

  const line = `${prefix}${connector} ${rankIcon} ${referral.username} (${referral.fullname})`;
  console.log(line);
  console.log(`${prefix}${isLast ? '   ' : '│  '} Points: ${referral.points.toLocaleString()} | Rank: ${rankColor}`);
}

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

async function showBushra750Tree() {
  try {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║         BUSHRA750 DOWNLINE TREE (TOP TO BOTTOM)              ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');

    // Get Bushra750's info
    const bushra = await prisma.user.findUnique({
      where: { username: 'bushra750' },
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

    if (!bushra) {
      console.log('\n❌ User bushra750 not found\n');
      return;
    }

    // Get all direct referrals (Level 1)
    const level1 = await prisma.user.findMany({
      where: { referredBy: 'bushra750' },
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

    // Display root
    const stats = {
      total: 1,
      byRank: {}
    };
    stats.byRank[bushra.rank?.title || 'No Rank'] = 1;

    const rankIcon = getRankIcon(bushra.rank?.title);
    console.log(`\n🌳 ${rankIcon} bushra750 (${bushra.fullname})`);
    console.log(`   Points: ${bushra.points.toLocaleString()} | Rank: ${bushra.rank?.title} | Balance: PKR ${parseFloat(bushra.balance).toLocaleString()}`);
    console.log(`   Direct Referrals: ${level1.length}`);

    // Display Level 1 referrals
    if (level1.length > 0) {
      console.log('');
      level1.forEach((referral, index) => {
        const isLast = index === level1.length - 1;
        const connector = isLast ? '└─' : '├─';
        const rankIcon = getRankIcon(referral.rank?.title);
        const rankTitle = referral.rank?.title || 'No Rank';
        
        stats.total++;
        stats.byRank[rankTitle] = (stats.byRank[rankTitle] || 0) + 1;

        console.log(`${connector} ${rankIcon} ${referral.username} (${referral.fullname})`);
        console.log(`${isLast ? '   ' : '│  '} Points: ${referral.points.toLocaleString()} | Rank: ${rankTitle}`);

        // Get Level 2 referrals for this user
        const level2Promise = prisma.user.findMany({
          where: { referredBy: referral.username },
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

        // We'll handle level 2 separately
      });

      // Now get and display Level 2 for each Level 1 user
      console.log('\n📊 Expanding Level 2 (Grandchildren)...\n');
      
      for (let i = 0; i < level1.length; i++) {
        const level1User = level1[i];
        const level2 = await prisma.user.findMany({
          where: { referredBy: level1User.username },
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

        if (level2.length > 0) {
          const isLastL1 = i === level1.length - 1;
          const prefix = isLastL1 ? '   ' : '│  ';
          
          console.log(`${prefix}${level1User.username} has ${level2.length} referrals:`);
          
          level2.forEach((l2User, l2Index) => {
            const isLastL2 = l2Index === level2.length - 1;
            const connector = isLastL2 ? '└─' : '├─';
            const rankIcon = getRankIcon(l2User.rank?.title);
            const rankTitle = l2User.rank?.title || 'No Rank';
            
            stats.total++;
            stats.byRank[rankTitle] = (stats.byRank[rankTitle] || 0) + 1;

            console.log(`${prefix}  ${connector} ${rankIcon} ${l2User.username} (${l2User.fullname})`);
            console.log(`${prefix}  ${isLastL2 ? '   ' : '│  '} Points: ${l2User.points.toLocaleString()} | Rank: ${rankTitle}`);
          });
          console.log('');
        }
      }
    }

    // Display statistics
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                      NETWORK STATISTICS                       ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    
    console.log(`📊 Total Network Size: ${stats.total} users (including Bushra750)`);
    console.log(`   Level 0 (Root): 1 user`);
    console.log(`   Level 1 (Direct): ${level1.length} users`);
    
    // Count Level 2
    let level2Total = 0;
    for (const l1User of level1) {
      const count = await prisma.user.count({
        where: { referredBy: l1User.username }
      });
      level2Total += count;
    }
    console.log(`   Level 2 (Grandchildren): ${level2Total} users`);
    
    console.log('\n🏆 Rank Distribution:');
    console.log('─────────────────────────────────────');
    
    // Sort ranks by count
    const sortedRanks = Object.entries(stats.byRank).sort((a, b) => b[1] - a[1]);
    sortedRanks.forEach(([rank, count]) => {
      const icon = getRankIcon(rank);
      const percentage = ((count / stats.total) * 100).toFixed(1);
      console.log(`${icon} ${rank.padEnd(25)}: ${count.toString().padStart(3)} (${percentage}%)`);
    });

    console.log('\n💎 Diamond & Above:');
    console.log('─────────────────────────────────────');
    const diamondAndAbove = ['Honory Share Holder', 'Global Ambassador', 'Royal Ambassador', 
                             'Sapphire Ambassador', 'Ambassador', 'Sapphire Diamond', 'Diamond'];
    let diamondCount = 0;
    diamondAndAbove.forEach(rank => {
      if (stats.byRank[rank]) {
        const icon = getRankIcon(rank);
        console.log(`${icon} ${rank.padEnd(25)}: ${stats.byRank[rank]}`);
        diamondCount += stats.byRank[rank];
      }
    });
    console.log(`\nTotal Diamond & Above: ${diamondCount} users`);

    console.log('\n═════════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error message:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

showBushra750Tree();

