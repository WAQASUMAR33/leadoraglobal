const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Recursive function to find all Diamond rank holders in the tree
async function findDiamondHolders(username, level = 0, maxLevel = 5, tx = prisma) {
  if (level > maxLevel) {
    return [];
  }

  try {
    // Get user details
    const user = await tx.user.findUnique({
      where: { username },
      select: {
        id: true,
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

    if (!user) {
      return [];
    }

    let diamondHolders = [];

    // Check if current user is Diamond rank
    if (user.rank?.title === 'Diamond') {
      diamondHolders.push({
        ...user,
        level,
        parent: level > 0 ? 'direct referral' : 'root'
      });
    }

    // Get direct referrals
    const directReferrals = await tx.user.findMany({
      where: { referredBy: username },
      select: {
        id: true,
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

    // Recursively find Diamond holders in subtrees
    for (const referral of directReferrals) {
      const subDiamonds = await findDiamondHolders(referral.username, level + 1, maxLevel, tx);
      diamondHolders = diamondHolders.concat(subDiamonds);
    }

    return diamondHolders;
  } catch (error) {
    console.error(`Error finding Diamond holders for ${username} at level ${level}:`, error);
    return [];
  }
}

async function checkDiamondCountInKalsoom231Tree() {
  try {
    console.log('💎 Checking Diamond rank holders in Kalsoom231\'s tree...\n');

    // Get all Diamond rank holders in the tree
    const diamondHolders = await findDiamondHolders('Kalsoom231', 0, 5);

    console.log(`🔍 Found ${diamondHolders.length} Diamond rank holders in Kalsoom231's tree:\n`);

    if (diamondHolders.length === 0) {
      console.log('❌ No Diamond rank holders found in the tree');
      return;
    }

    // Display Diamond holders
    console.log('┌──────┬─────────────────────┬─────────────────────┬──────────┬──────┬─────────────────────┐');
    console.log('│ Level│      Username       │        Name         │  Points  │ Rank │      Position       │');
    console.log('├──────┼─────────────────────┼─────────────────────┼──────────┼──────┼─────────────────────┤');

    diamondHolders.forEach((user, index) => {
      const position = user.level === 0 ? 'Root (Kalsoom231)' : 
                     user.level === 1 ? 'Direct Referral' : 
                     `Level ${user.level} Downline`;
      
      console.log(`│ ${String(user.level).padStart(4)} │ ${user.username.padEnd(19)} │ ${(user.fullname || 'N/A').padEnd(19)} │ ${String(user.points).padStart(8)} │ ${(user.rank?.title || 'N/A').padEnd(4)} │ ${position.padEnd(19)} │`);
    });

    console.log('└──────┴─────────────────────┴─────────────────────┴──────────┴──────┴─────────────────────┘\n');

    // Group by level
    const byLevel = {};
    diamondHolders.forEach(diamond => {
      if (!byLevel[diamond.level]) {
        byLevel[diamond.level] = [];
      }
      byLevel[diamond.level].push(diamond);
    });

    console.log('📊 Diamond Holders by Level:');
    console.log('─'.repeat(50));
    
    Object.keys(byLevel).sort((a, b) => parseInt(a) - parseInt(b)).forEach(level => {
      const levelUsers = byLevel[level];
      console.log(`Level ${level}: ${levelUsers.length} Diamond holder(s)`);
      levelUsers.forEach(user => {
        console.log(`   - ${user.username} (${user.fullname || 'N/A'}) - ${user.points.toLocaleString()} points`);
      });
    });

    // Check direct referrals specifically
    console.log('\n👥 Direct Referrals with Diamond Rank:');
    console.log('─'.repeat(50));
    
    const directReferrals = await prisma.user.findMany({
      where: { referredBy: 'Kalsoom231' },
      select: {
        id: true,
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

    const directDiamonds = directReferrals.filter(user => user.rank?.title === 'Diamond');
    
    console.log(`Found ${directDiamonds.length} direct referrals with Diamond rank:`);
    directDiamonds.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.fullname || 'N/A'}) - ${user.points.toLocaleString()} points`);
    });

    // Total summary
    console.log('\n📈 Summary:');
    console.log('─'.repeat(50));
    console.log(`Total Diamond holders in tree: ${diamondHolders.length}`);
    console.log(`Direct referrals with Diamond: ${directDiamonds.length}`);
    console.log(`Diamond holders in downlines: ${diamondHolders.length - directDiamonds.length}`);

    // Check if Kalsoom231 qualifies for Sapphire Ambassador with new logic
    console.log('\n🔍 Sapphire Ambassador Qualification Check:');
    console.log('─'.repeat(50));
    console.log('Requirements: 100,000+ points AND (3 lines with Ambassador OR 10 lines with Diamond)');
    
    const kalsoom231 = await prisma.user.findUnique({
      where: { username: 'Kalsoom231' },
      select: { points: true }
    });

    if (kalsoom231 && kalsoom231.points >= 100000) {
      console.log(`✅ Points requirement met: ${kalsoom231.points.toLocaleString()} >= 100,000`);
      
      if (diamondHolders.length >= 10) {
        console.log(`✅ Diamond lines requirement met: ${diamondHolders.length} >= 10`);
        console.log('🎉 Kalsoom231 QUALIFIES for Sapphire Ambassador rank!');
      } else {
        console.log(`❌ Diamond lines requirement not met: ${diamondHolders.length} < 10`);
        console.log('❌ Kalsoom231 does NOT qualify for Sapphire Ambassador rank');
      }
    } else {
      console.log(`❌ Points requirement not met: ${kalsoom231?.points || 0} < 100,000`);
    }

  } catch (error) {
    console.error('❌ Error checking Diamond count:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDiamondCountInKalsoom231Tree();

