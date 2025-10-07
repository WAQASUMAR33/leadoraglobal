const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Function to get all direct referrals (these represent the "lines")
async function getDirectReferrals(username, tx = prisma) {
  return await tx.user.findMany({
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
}

// Function to check if a Diamond holder exists in a specific line (recursive)
async function findDiamondInLine(lineUsername, targetDiamondUsername, level = 0, maxLevel = 5, tx = prisma) {
  if (level > maxLevel) return false;
  
  try {
    // Check if this user is the target Diamond holder
    const user = await tx.user.findUnique({
      where: { username: lineUsername },
      select: {
        username: true,
        rank: {
          select: {
            title: true
          }
        }
      }
    });

    if (user?.username === targetDiamondUsername && user?.rank?.title === 'Diamond') {
      return true;
    }

    // Get direct referrals and check recursively
    const directReferrals = await tx.user.findMany({
      where: { referredBy: lineUsername },
      select: { username: true }
    });

    for (const referral of directReferrals) {
      if (await findDiamondInLine(referral.username, targetDiamondUsername, level + 1, maxLevel, tx)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error(`Error checking line ${lineUsername}:`, error);
    return false;
  }
}

// Function to get all Diamond holders in a specific line
async function getDiamondHoldersInLine(lineUsername, level = 0, maxLevel = 5, tx = prisma) {
  if (level > maxLevel) return [];

  try {
    const user = await tx.user.findUnique({
      where: { username: lineUsername },
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

    let diamondHolders = [];

    if (user?.rank?.title === 'Diamond') {
      diamondHolders.push({
        ...user,
        level,
        lineUsername
      });
    }

    // Get direct referrals
    const directReferrals = await tx.user.findMany({
      where: { referredBy: lineUsername },
      select: { username: true }
    });

    for (const referral of directReferrals) {
      const subDiamonds = await getDiamondHoldersInLine(referral.username, level + 1, maxLevel, tx);
      diamondHolders = diamondHolders.concat(subDiamonds.map(d => ({ ...d, lineUsername })));
    }

    return diamondHolders;
  } catch (error) {
    console.error(`Error getting Diamond holders in line ${lineUsername}:`, error);
    return [];
  }
}

async function checkDiamondLinesInKalsoom231Tree() {
  try {
    console.log('🔍 Analyzing Diamond holders by lines in Kalsoom231\'s tree...\n');

    // Get all direct referrals (these are the "lines")
    const directReferrals = await getDirectReferrals('Kalsoom231');
    
    console.log(`📊 Kalsoom231 has ${directReferrals.length} direct referrals (lines):\n`);

    // Analyze each line for Diamond holders
    const lineAnalysis = [];
    
    for (const line of directReferrals) {
      console.log(`🌳 Analyzing Line: ${line.username} (${line.fullname || 'N/A'}) - ${line.rank?.title || 'No Rank'} - ${line.points.toLocaleString()} points`);
      
      const diamondHoldersInLine = await getDiamondHoldersInLine(line.username);
      
      console.log(`   💎 Found ${diamondHoldersInLine.length} Diamond holder(s) in this line:`);
      
      if (diamondHoldersInLine.length === 0) {
        console.log('   ❌ No Diamond holders in this line');
      } else {
        diamondHoldersInLine.forEach((diamond, index) => {
          console.log(`   ${index + 1}. ${diamond.username} (${diamond.fullname || 'N/A'}) - ${diamond.points.toLocaleString()} points - Level ${diamond.level}`);
        });
      }
      
      lineAnalysis.push({
        lineUsername: line.username,
        lineName: line.fullname || 'N/A',
        lineRank: line.rank?.title || 'No Rank',
        linePoints: line.points,
        diamondCount: diamondHoldersInLine.length,
        diamondHolders: diamondHoldersInLine
      });
      
      console.log('');
    }

    // Summary analysis
    console.log('📈 LINE ANALYSIS SUMMARY:');
    console.log('═'.repeat(80));
    
    const linesWithDiamonds = lineAnalysis.filter(line => line.diamondCount > 0);
    const linesWithoutDiamonds = lineAnalysis.filter(line => line.diamondCount === 0);
    
    console.log(`Total Lines: ${lineAnalysis.length}`);
    console.log(`Lines with Diamond holders: ${linesWithDiamonds.length}`);
    console.log(`Lines without Diamond holders: ${linesWithoutDiamonds.length}\n`);

    console.log('✅ LINES WITH DIAMOND HOLDERS:');
    console.log('─'.repeat(50));
    
    let totalDiamonds = 0;
    linesWithDiamonds.forEach((line, index) => {
      console.log(`${index + 1}. ${line.lineUsername} (${line.lineName}) - ${line.diamondCount} Diamond(s)`);
      line.diamondHolders.forEach(diamond => {
        console.log(`   💎 ${diamond.username} - ${diamond.points.toLocaleString()} points - Level ${diamond.level}`);
      });
      totalDiamonds += line.diamondCount;
    });

    console.log('\n❌ LINES WITHOUT DIAMOND HOLDERS:');
    console.log('─'.repeat(50));
    linesWithoutDiamonds.forEach((line, index) => {
      console.log(`${index + 1}. ${line.lineUsername} (${line.lineName}) - ${line.lineRank} - ${line.linePoints.toLocaleString()} points`);
    });

    // Check Sapphire Ambassador qualification
    console.log('\n🔍 SAPPHIRE AMBASSADOR QUALIFICATION CHECK:');
    console.log('═'.repeat(80));
    console.log('Requirements: 100,000+ points AND (3 lines with Ambassador OR 10 lines with Diamond)');
    
    const kalsoom231 = await prisma.user.findUnique({
      where: { username: 'Kalsoom231' },
      select: { points: true }
    });

    if (kalsoom231 && kalsoom231.points >= 100000) {
      console.log(`✅ Points requirement: ${kalsoom231.points.toLocaleString()} >= 100,000`);
      
      console.log(`\n📊 Diamond Lines Analysis:`);
      console.log(`   Total lines with Diamond holders: ${linesWithDiamonds.length}`);
      console.log(`   Required: 10 lines with Diamond holders`);
      
      if (linesWithDiamonds.length >= 10) {
        console.log(`✅ Diamond lines requirement: ${linesWithDiamonds.length} >= 10`);
        console.log('🎉 Kalsoom231 QUALIFIES for Sapphire Ambassador rank!');
      } else {
        console.log(`❌ Diamond lines requirement: ${linesWithDiamonds.length} < 10`);
        console.log('❌ Kalsoom231 does NOT qualify for Sapphire Ambassador rank');
        console.log(`   Need ${10 - linesWithDiamonds.length} more lines with Diamond holders`);
      }
    } else {
      console.log(`❌ Points requirement: ${kalsoom231?.points || 0} < 100,000`);
    }

    // Final answer to the question
    console.log('\n🎯 ANSWER TO YOUR QUESTION:');
    console.log('═'.repeat(80));
    console.log(`Are the 11 Diamonds in different lines or same lines?`);
    console.log(`📊 The 11 Diamond holders are distributed across ${linesWithDiamonds.length} different lines`);
    console.log(`💎 Total Diamond holders: ${totalDiamonds}`);
    
    if (linesWithDiamonds.length === 11) {
      console.log(`✅ Each Diamond holder is in a different line (11 lines with 1 Diamond each)`);
    } else if (linesWithDiamonds.length < 11) {
      console.log(`⚠️ Some lines have multiple Diamond holders (${linesWithDiamonds.length} lines with ${totalDiamonds} Diamonds total)`);
      console.log(`📈 This means some lines have more than 1 Diamond holder`);
    }

  } catch (error) {
    console.error('❌ Error analyzing Diamond lines:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDiamondLinesInKalsoom231Tree();

