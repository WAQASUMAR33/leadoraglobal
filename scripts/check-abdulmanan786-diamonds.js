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

async function getDownlineWithRanks(username, level = 1, maxLevel = 10, targetRank = 'Diamond') {
  if (level > maxLevel) return [];

  const referrals = await prisma.user.findMany({
    where: { referredBy: username },
    select: {
      id: true,
      username: true,
      fullname: true,
      points: true,
      referralCount: true,
      rank: {
        select: {
          title: true
        }
      }
    },
    orderBy: { points: 'desc' }
  });

  const results = [];

  for (const referral of referrals) {
    const rankTitle = referral.rank?.title;
    
    // Add if matches target rank or higher
    if (rankTitle === targetRank || rankTitle === 'Sapphire Diamond' || rankTitle === 'Ambassador') {
      results.push({
        ...referral,
        level: level,
        path: [username, referral.username]
      });
    }

    // Recursively check children
    const childResults = await getDownlineWithRanks(referral.username, level + 1, maxLevel, targetRank);
    childResults.forEach(child => {
      child.path = [username, ...child.path];
      results.push(child);
    });
  }

  return results;
}

async function checkAbdulManan786Diamonds() {
  try {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║        ABDULMANAN786 - DIAMOND ANALYSIS                      ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    // Get AbdulManan786 info
    const abdulManan = await prisma.user.findUnique({
      where: { username: 'AbdulManan786' },
      select: {
        id: true,
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

    if (!abdulManan) {
      console.log('❌ User AbdulManan786 not found\n');
      return;
    }

    console.log('👤 ROOT USER:');
    console.log('─────────────────────────────────────────────────────────────');
    const rankIcon = getRankIcon(abdulManan.rank?.title);
    console.log(`${rankIcon} ${abdulManan.username} (${abdulManan.fullname})`);
    console.log(`Points: ${abdulManan.points.toLocaleString()}`);
    console.log(`Rank: ${abdulManan.rank?.title || 'No Rank'}`);
    console.log(`Direct Referrals: ${abdulManan.referralCount || 0}`);
    console.log('─────────────────────────────────────────────────────────────\n');

    // Get all Diamonds in downline
    console.log('🔍 Searching for Diamonds in downline...\n');
    const diamonds = await getDownlineWithRanks('AbdulManan786', 1, 10, 'Diamond');

    if (diamonds.length === 0) {
      console.log('❌ No Diamonds found in downline\n');
      return;
    }

    console.log(`💎 FOUND ${diamonds.length} DIAMOND+ ACCOUNTS IN DOWNLINE\n`);
    console.log('═════════════════════════════════════════════════════════════════\n');

    // Group by level
    const byLevel = {};
    diamonds.forEach(diamond => {
      if (!byLevel[diamond.level]) {
        byLevel[diamond.level] = [];
      }
      byLevel[diamond.level].push(diamond);
    });

    // Display by level
    Object.keys(byLevel).sort((a, b) => parseInt(a) - parseInt(b)).forEach(level => {
      const levelDiamonds = byLevel[level];
      console.log(`📊 LEVEL ${level} (${levelDiamonds.length} Diamond+ accounts):`);
      console.log('─────────────────────────────────────────────────────────────');

      levelDiamonds.forEach((diamond, index) => {
        const icon = getRankIcon(diamond.rank?.title);
        console.log(`\n${index + 1}. ${icon} ${diamond.username} (${diamond.fullname})`);
        console.log(`   Points: ${diamond.points.toLocaleString()}`);
        console.log(`   Rank: ${diamond.rank?.title}`);
        console.log(`   Direct Referrals: ${diamond.referralCount || 0}`);
        console.log(`   Path: ${diamond.path.join(' → ')}`);
      });

      console.log('\n');
    });

    // Get direct referrals to check Diamond lines
    const directReferrals = await prisma.user.findMany({
      where: { referredBy: 'AbdulManan786' },
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

    console.log('═════════════════════════════════════════════════════════════════\n');
    console.log('📊 DIRECT REFERRALS ANALYSIS:\n');
    console.log(`Total Direct Referrals: ${directReferrals.length}\n`);

    // Check which direct lines have Diamonds
    const linesWithDiamonds = {};
    diamonds.forEach(diamond => {
      const directLine = diamond.path[1]; // First person after AbdulManan786
      if (!linesWithDiamonds[directLine]) {
        linesWithDiamonds[directLine] = [];
      }
      linesWithDiamonds[directLine].push(diamond);
    });

    console.log('💎 DIAMOND LINES (Direct referrals with Diamonds in their downline):\n');
    Object.entries(linesWithDiamonds).forEach(([line, lineDiamonds]) => {
      const directRef = directReferrals.find(ref => ref.username === line);
      const icon = getRankIcon(directRef?.rank?.title);
      
      console.log(`${icon} ${line} (${directRef?.fullname || 'Unknown'})`);
      console.log(`   Rank: ${directRef?.rank?.title || 'No Rank'}`);
      console.log(`   Points: ${directRef?.points?.toLocaleString() || 0}`);
      console.log(`   Diamonds in downline: ${lineDiamonds.length}`);
      
      lineDiamonds.forEach(d => {
        const dIcon = getRankIcon(d.rank?.title);
        console.log(`      └─ ${dIcon} ${d.username} (${d.rank?.title}) - Level ${d.level}`);
      });
      console.log('');
    });

    // Summary statistics
    console.log('═════════════════════════════════════════════════════════════════\n');
    console.log('📈 SUMMARY STATISTICS:\n');

    const totalDiamonds = diamonds.filter(d => d.rank?.title === 'Diamond').length;
    const totalSapphireDiamonds = diamonds.filter(d => d.rank?.title === 'Sapphire Diamond').length;
    const totalAmbassadors = diamonds.filter(d => d.rank?.title === 'Ambassador').length;

    console.log(`💎 Diamonds:           ${totalDiamonds}`);
    console.log(`💠 Sapphire Diamonds:  ${totalSapphireDiamonds}`);
    console.log(`🎖️  Ambassadors:        ${totalAmbassadors}`);
    console.log(`📊 Total Diamond+:     ${diamonds.length}`);
    console.log(`\n📍 Lines with Diamonds: ${Object.keys(linesWithDiamonds).length} out of ${directReferrals.length} direct referrals`);

    const totalPoints = diamonds.reduce((sum, d) => sum + d.points, 0);
    console.log(`\n💰 Total Points (Diamond+): ${totalPoints.toLocaleString()}`);
    console.log(`📈 Average Points: ${Math.round(totalPoints / diamonds.length).toLocaleString()}`);

    // Level distribution
    console.log('\n📊 Level Distribution:');
    Object.keys(byLevel).sort((a, b) => parseInt(a) - parseInt(b)).forEach(level => {
      const count = byLevel[level].length;
      const percentage = ((count / diamonds.length) * 100).toFixed(1);
      console.log(`   Level ${level}: ${count} (${percentage}%)`);
    });

    // Top performers
    console.log('\n🌟 Top 5 Diamonds by Points:');
    const topDiamonds = [...diamonds].sort((a, b) => b.points - a.points).slice(0, 5);
    topDiamonds.forEach((d, index) => {
      const icon = getRankIcon(d.rank?.title);
      console.log(`   ${index + 1}. ${icon} ${d.username} - ${d.points.toLocaleString()} pts (Level ${d.level})`);
    });

    console.log('\n═════════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkAbdulManan786Diamonds();

