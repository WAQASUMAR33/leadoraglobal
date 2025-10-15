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

async function countDiamondsInDownline(username, level = 1, maxLevel = 10, visited = new Set()) {
  if (level > maxLevel || visited.has(username.toLowerCase())) {
    return [];
  }

  visited.add(username.toLowerCase());

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
    }
  });

  const diamonds = [];

  for (const referral of referrals) {
    const rankTitle = referral.rank?.title;
    
    // Add if Diamond or higher
    if (rankTitle === 'Diamond' || rankTitle === 'Sapphire Diamond' || rankTitle === 'Ambassador') {
      diamonds.push({
        username: referral.username,
        fullname: referral.fullname,
        points: referral.points,
        rank: rankTitle,
        level: level
      });
    }

    // Recursively check children
    const childDiamonds = await countDiamondsInDownline(referral.username, level + 1, maxLevel, visited);
    diamonds.push(...childDiamonds);
  }

  return diamonds;
}

async function countDiamondsForMultipleUsers() {
  try {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║        DIAMOND COUNT - MULTIPLE USERS ANALYSIS               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    const usernames = [
      'Zaman75',
      'bushra123',
      'bushraking',
      'bushrashehzadi',
      'bushraA',
      'Amnaqayyum75',  // Fixed typo: Anumqayum75 → Amnaqayyum75
      'bushra75',
      'Perveen75',
      'faiz750',  // Fixed: faiz75 → faiz750
      'eman75',
      'bushra4767'
    ];

    console.log('🔍 Analyzing the following users:\n');
    usernames.forEach((username, index) => {
      console.log(`   ${index + 1}. ${username}`);
    });
    console.log('\n═════════════════════════════════════════════════════════════════\n');

    const results = [];

    for (const username of usernames) {
      // Get user info (try exact match first, then case variations)
      let user = await prisma.user.findUnique({
        where: { username: username },
        select: {
          username: true,
          fullname: true,
          points: true,
          referralCount: true,
          rank: {
            select: {
              title: true
            }
          }
        }
      });

      // If not found, try lowercase
      if (!user) {
        user = await prisma.user.findUnique({
          where: { username: username.toLowerCase() },
          select: {
            username: true,
            fullname: true,
            points: true,
            referralCount: true,
            rank: {
              select: {
                title: true
              }
            }
          }
        });
      }

      if (!user) {
        console.log(`⚠️  ${username} - NOT FOUND`);
        results.push({
          username: username,
          found: false,
          diamonds: []
        });
        continue;
      }

      // Count diamonds in downline
      const diamonds = await countDiamondsInDownline(user.username, 1, 10, new Set());

      const icon = getRankIcon(user.rank?.title);
      console.log(`${icon} ${user.username} (${user.fullname})`);
      console.log(`   Points: ${user.points.toLocaleString()}`);
      console.log(`   Rank: ${user.rank?.title || 'No Rank'}`);
      console.log(`   Direct Referrals: ${user.referralCount || 0}`);
      console.log(`   💎 Diamonds in Downline: ${diamonds.length}`);

      if (diamonds.length > 0) {
        // Count by rank
        const diamondCount = diamonds.filter(d => d.rank === 'Diamond').length;
        const sapphireDiamondCount = diamonds.filter(d => d.rank === 'Sapphire Diamond').length;
        const ambassadorCount = diamonds.filter(d => d.rank === 'Ambassador').length;

        console.log(`      └─ 💎 Diamonds: ${diamondCount}`);
        if (sapphireDiamondCount > 0) console.log(`      └─ 💠 Sapphire Diamonds: ${sapphireDiamondCount}`);
        if (ambassadorCount > 0) console.log(`      └─ 🎖️  Ambassadors: ${ambassadorCount}`);

        // Show top 3 diamonds
        const topDiamonds = [...diamonds].sort((a, b) => b.points - a.points).slice(0, 3);
        if (topDiamonds.length > 0) {
          console.log(`      Top Diamonds:`);
          topDiamonds.forEach((d, index) => {
            const dIcon = getRankIcon(d.rank);
            console.log(`         ${index + 1}. ${dIcon} ${d.username} (${d.points.toLocaleString()} pts, Level ${d.level})`);
          });
        }
      }

      console.log('');

      results.push({
        username: user.username,
        actualUsername: user.username,
        fullname: user.fullname,
        points: user.points,
        rank: user.rank?.title,
        referralCount: user.referralCount || 0,
        found: true,
        diamonds: diamonds,
        diamondCount: diamonds.length
      });
    }

    // Summary
    console.log('═════════════════════════════════════════════════════════════════\n');
    console.log('📊 SUMMARY TABLE:\n');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log('Username              | Rank              | Diamonds | Status');
    console.log('─────────────────────────────────────────────────────────────────');

    results.forEach(result => {
      if (!result.found) {
        console.log(`${result.username.padEnd(21)} | ${'NOT FOUND'.padEnd(17)} | ${'-'.padStart(8)} | ❌`);
      } else {
        const icon = getRankIcon(result.rank);
        const rankDisplay = `${icon} ${result.rank || 'No Rank'}`;
        const status = result.diamondCount > 0 ? '✅' : '⚪';
        console.log(`${result.actualUsername.padEnd(21)} | ${rankDisplay.padEnd(17)} | ${result.diamondCount.toString().padStart(8)} | ${status}`);
      }
    });

    console.log('─────────────────────────────────────────────────────────────────\n');

    // Overall statistics
    const foundUsers = results.filter(r => r.found);
    const totalDiamonds = foundUsers.reduce((sum, r) => sum + r.diamondCount, 0);
    const usersWithDiamonds = foundUsers.filter(r => r.diamondCount > 0).length;
    const usersWithoutDiamonds = foundUsers.filter(r => r.diamondCount === 0).length;

    console.log('📈 OVERALL STATISTICS:\n');
    console.log(`Total Users Analyzed:     ${usernames.length}`);
    console.log(`Users Found:              ${foundUsers.length}`);
    console.log(`Users Not Found:          ${usernames.length - foundUsers.length}`);
    console.log(`\nUsers with Diamonds:      ${usersWithDiamonds}`);
    console.log(`Users without Diamonds:   ${usersWithoutDiamonds}`);
    console.log(`\nTotal Diamonds Found:     ${totalDiamonds}`);
    if (foundUsers.length > 0) {
      console.log(`Average per User:         ${Math.round(totalDiamonds / foundUsers.length)}`);
    }

    // Top performers
    const sortedByDiamonds = foundUsers.filter(r => r.diamondCount > 0).sort((a, b) => b.diamondCount - a.diamondCount);
    if (sortedByDiamonds.length > 0) {
      console.log('\n🏆 TOP PERFORMERS (by Diamond count):\n');
      sortedByDiamonds.forEach((user, index) => {
        const icon = getRankIcon(user.rank);
        console.log(`${index + 1}. ${icon} ${user.actualUsername.padEnd(20)} - ${user.diamondCount} Diamonds`);
      });
    }

    // Users without diamonds
    const withoutDiamonds = foundUsers.filter(r => r.diamondCount === 0);
    if (withoutDiamonds.length > 0) {
      console.log('\n⚪ USERS WITHOUT DIAMONDS:\n');
      withoutDiamonds.forEach((user, index) => {
        const icon = getRankIcon(user.rank);
        console.log(`${index + 1}. ${icon} ${user.actualUsername} (${user.rank || 'No Rank'})`);
      });
    }

    console.log('\n═════════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

countDiamondsForMultipleUsers();

