const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Recursive function to build the referral tree
async function buildReferralTree(username, level = 0, maxLevel = 5, tx = prisma) {
  if (level > maxLevel) {
    return null;
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
        referralCount: true,
        totalEarnings: true,
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
    const directReferrals = await tx.user.findMany({
      where: { referredBy: username },
      select: {
        id: true,
        username: true,
        fullname: true,
        points: true,
        referralCount: true,
        totalEarnings: true,
        rank: {
          select: {
            title: true
          }
        }
      },
      orderBy: { points: 'desc' }
    });

    // Build the tree node
    const treeNode = {
      ...user,
      level,
      directReferrals: []
    };

    // Recursively build subtrees for each direct referral
    for (const referral of directReferrals) {
      const subtree = await buildReferralTree(referral.username, level + 1, maxLevel, tx);
      if (subtree) {
        treeNode.directReferrals.push(subtree);
      }
    }

    return treeNode;
  } catch (error) {
    console.error(`Error building tree for ${username} at level ${level}:`, error);
    return null;
  }
}

// Function to display the tree in a formatted way
function displayTree(node, indent = '') {
  if (!node) return;

  const rankDisplay = node.rank?.title || 'No Rank';
  const earningsDisplay = node.totalEarnings ? `$${parseFloat(node.totalEarnings).toFixed(2)}` : '$0.00';
  
  console.log(`${indent}├─ ${node.username} (${node.fullname || 'N/A'})`);
  console.log(`${indent}   ├─ Rank: ${rankDisplay}`);
  console.log(`${indent}   ├─ Points: ${node.points.toLocaleString()}`);
  console.log(`${indent}   ├─ Referrals: ${node.referralCount}`);
  console.log(`${indent}   └─ Earnings: ${earningsDisplay}`);

  if (node.directReferrals && node.directReferrals.length > 0) {
    node.directReferrals.forEach((referral, index) => {
      const isLast = index === node.directReferrals.length - 1;
      const nextIndent = indent + (isLast ? '   ' : '│  ');
      displayTree(referral, nextIndent);
    });
  }
}

// Function to get tree statistics
function getTreeStats(node) {
  if (!node) return { totalUsers: 0, totalPoints: 0, totalReferrals: 0, ranks: {} };

  let stats = {
    totalUsers: 1,
    totalPoints: node.points,
    totalReferrals: node.referralCount,
    ranks: { [node.rank?.title || 'No Rank']: 1 }
  };

  if (node.directReferrals) {
    for (const referral of node.directReferrals) {
      const childStats = getTreeStats(referral);
      stats.totalUsers += childStats.totalUsers;
      stats.totalPoints += childStats.totalPoints;
      stats.totalReferrals += childStats.totalReferrals;
      
      for (const [rank, count] of Object.entries(childStats.ranks)) {
        stats.ranks[rank] = (stats.ranks[rank] || 0) + count;
      }
    }
  }

  return stats;
}

async function getKalsoom231Tree() {
  try {
    console.log('🌳 Building referral tree for Kalsoom231...\n');

    // First, get the user details to confirm they exist
    const user = await prisma.user.findUnique({
      where: { username: 'Kalsoom231' },
      select: {
        id: true,
        username: true,
        fullname: true,
        points: true,
        referralCount: true,
        totalEarnings: true,
        referredBy: true,
        rank: {
          select: {
            title: true
          }
        }
      }
    });

    if (!user) {
      console.log('❌ User Kalsoom231 not found');
      return;
    }

    console.log('👤 User Details:');
    console.log(`   Username: ${user.username}`);
    console.log(`   Name: ${user.fullname}`);
    console.log(`   Rank: ${user.rank?.title || 'No Rank'}`);
    console.log(`   Points: ${user.points.toLocaleString()}`);
    console.log(`   Referrals: ${user.referralCount}`);
    console.log(`   Total Earnings: $${user.totalEarnings ? parseFloat(user.totalEarnings).toFixed(2) : '0.00'}`);
    console.log(`   Referred By: ${user.referredBy || 'Root'}\n`);

    // Build the referral tree
    console.log('🌳 Referral Tree (Kalsoom231):');
    console.log('═'.repeat(60));
    
    const tree = await buildReferralTree('Kalsoom231', 0, 4);
    
    if (tree) {
      displayTree(tree);
      
      // Get tree statistics
      console.log('\n📊 Tree Statistics:');
      console.log('═'.repeat(60));
      const stats = getTreeStats(tree);
      
      console.log(`Total Users in Tree: ${stats.totalUsers}`);
      console.log(`Total Points: ${stats.totalPoints.toLocaleString()}`);
      console.log(`Total Referrals: ${stats.totalReferrals}`);
      
      console.log('\n📈 Rank Distribution:');
      const sortedRanks = Object.entries(stats.ranks)
        .sort(([,a], [,b]) => b - a);
      
      sortedRanks.forEach(([rank, count]) => {
        console.log(`   ${rank}: ${count} user(s)`);
      });

      // Show direct referrals summary
      if (tree.directReferrals && tree.directReferrals.length > 0) {
        console.log('\n👥 Direct Referrals Summary:');
        console.log('─'.repeat(40));
        tree.directReferrals.forEach((referral, index) => {
          console.log(`${index + 1}. ${referral.username} - ${referral.rank?.title || 'No Rank'} (${referral.points.toLocaleString()} pts, ${referral.referralCount} refs)`);
        });
      } else {
        console.log('\n👥 No direct referrals found');
      }

      // Check if this user qualifies for higher ranks with new logic
      console.log('\n🔍 Rank Qualification Check:');
      console.log('─'.repeat(40));
      
      if (user.rank?.title === 'Ambassador') {
        console.log('✅ User currently has Ambassador rank');
        console.log('🔍 Checking if user qualifies for higher ranks...');
        
        // Check for Sapphire Ambassador (next rank up)
        if (user.points >= 100000) {
          console.log('📊 Points check: ✅ Has 100,000+ points for Sapphire Ambassador');
          console.log('🌳 Need to check downline requirements for Sapphire Ambassador...');
        } else {
          console.log('📊 Points check: ❌ Needs 100,000+ points for Sapphire Ambassador');
        }
      }
      
    } else {
      console.log('❌ Failed to build referral tree');
    }

  } catch (error) {
    console.error('❌ Error getting Kalsoom231 tree:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getKalsoom231Tree();

