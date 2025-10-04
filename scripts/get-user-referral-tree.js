const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error'],
});

// Recursive function to build referral tree
async function buildReferralTree(username, level = 1, maxLevel = 10, visited = new Set()) {
  if (level > maxLevel) return [];
  
  // Prevent infinite loops by tracking visited usernames
  if (visited.has(username)) {
    console.warn(`⚠️ Circular reference detected in referral tree: ${username}`);
    return [];
  }
  visited.add(username);

  try {
    // Get all users referred by this username
    const referrals = await prisma.user.findMany({
    where: { referredBy: username },
    select: {
      id: true,
      fullname: true,
      username: true,
      email: true,
      status: true,
      balance: true,
      points: true,
      createdAt: true,
      referralCount: true,
      totalEarnings: true,
      currentPackage: {
        select: {
          package_name: true
        }
      },
      rank: {
        select: {
          title: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

    const tree = [];

    for (const referral of referrals) {
      const referralData = {
        id: referral.id,
        name: referral.fullname,
        username: referral.username,
        email: referral.email,
        status: referral.status,
        balance: parseFloat(referral.balance) || 0,
        points: referral.points || 0,
        referralCount: referral.referralCount || 0,
        totalEarnings: parseFloat(referral.totalEarnings) || 0,
        joinedDate: referral.createdAt,
        package: referral.currentPackage?.package_name || 'No Package',
        rank: referral.rank?.title || 'No Rank',
        level: level,
        children: []
      };

      // Recursively get children
      const children = await buildReferralTree(referral.username, level + 1, maxLevel, visited);
      referralData.children = children;

      tree.push(referralData);
    }

    return tree;
  } catch (error) {
    console.error(`❌ Error fetching referrals for ${username}:`, error.message);
    return [];
  }
}

// Function to display tree in a formatted way
function displayTree(tree, indent = 0) {
  const prefix = '  '.repeat(indent);
  
  tree.forEach(user => {
    console.log(`${prefix}├─ ${user.username} (${user.name})`);
    console.log(`${prefix}   ├─ Status: ${user.status}`);
    console.log(`${prefix}   ├─ Balance: $${user.balance}`);
    console.log(`${prefix}   ├─ Points: ${user.points}`);
    console.log(`${prefix}   ├─ Referrals: ${user.referralCount}`);
    console.log(`${prefix}   ├─ Total Earnings: $${user.totalEarnings}`);
    console.log(`${prefix}   ├─ Package: ${user.package}`);
    console.log(`${prefix}   ├─ Rank: ${user.rank}`);
    console.log(`${prefix}   ├─ Joined: ${user.joinedDate.toISOString().split('T')[0]}`);
    console.log(`${prefix}   └─ Level: ${user.level}`);
    
    if (user.children.length > 0) {
      console.log(`${prefix}   └─ Children:`);
      displayTree(user.children, indent + 2);
    }
    console.log(''); // Empty line for readability
  });
}

// Function to get tree statistics
function getTreeStats(tree) {
  let totalUsers = 0;
  let totalBalance = 0;
  let totalEarnings = 0;
  let totalPoints = 0;
  let levelCounts = {};

  function traverse(node) {
    totalUsers++;
    totalBalance += node.balance;
    totalEarnings += node.totalEarnings;
    totalPoints += node.points;
    
    if (!levelCounts[node.level]) {
      levelCounts[node.level] = 0;
    }
    levelCounts[node.level]++;

    node.children.forEach(child => traverse(child));
  }

  tree.forEach(root => traverse(root));

  return {
    totalUsers,
    totalBalance,
    totalEarnings,
    totalPoints,
    levelCounts
  };
}

async function getUserReferralTree(targetUsername) {
  try {
    console.log(`🌳 Getting referral tree for username: ${targetUsername}\n`);

    // First, check if the user exists
    const targetUser = await prisma.user.findUnique({
      where: { username: targetUsername },
      select: {
        id: true,
        fullname: true,
        username: true,
        email: true,
        status: true,
        balance: true,
        points: true,
        referralCount: true,
        totalEarnings: true,
        createdAt: true,
        referredBy: true,
        currentPackage: {
          select: {
            package_name: true
          }
        },
        rank: {
          select: {
            title: true
          }
        }
      }
    });

    if (!targetUser) {
      console.log(`❌ User with username "${targetUsername}" not found.`);
      return;
    }

    // Display target user info
    console.log('🎯 TARGET USER:');
    console.log(`├─ Username: ${targetUser.username}`);
    console.log(`├─ Name: ${targetUser.fullname}`);
    console.log(`├─ Status: ${targetUser.status}`);
    console.log(`├─ Balance: $${targetUser.balance}`);
    console.log(`├─ Points: ${targetUser.points}`);
    console.log(`├─ Referrals: ${targetUser.referralCount}`);
    console.log(`├─ Total Earnings: $${targetUser.totalEarnings}`);
    console.log(`├─ Package: ${targetUser.currentPackage?.package_name || 'No Package'}`);
    console.log(`├─ Rank: ${targetUser.rank?.title || 'No Rank'}`);
    console.log(`├─ Referred By: ${targetUser.referredBy || 'No one (Root user)'}`);
    console.log(`└─ Joined: ${targetUser.createdAt.toISOString().split('T')[0]}`);
    console.log('');

    // Build the referral tree
    console.log('🌲 REFERRAL TREE:');
    const tree = await buildReferralTree(targetUsername, 1, 10);

    if (tree.length === 0) {
      console.log('└─ No referrals found.');
    } else {
      displayTree(tree);
    }

    // Display statistics
    const stats = getTreeStats(tree);
    console.log('📊 TREE STATISTICS:');
    console.log(`├─ Total Users in Tree: ${stats.totalUsers}`);
    console.log(`├─ Total Balance: $${stats.totalBalance.toFixed(2)}`);
    console.log(`├─ Total Earnings: $${stats.totalEarnings.toFixed(2)}`);
    console.log(`├─ Total Points: ${stats.totalPoints}`);
    console.log('└─ Users by Level:');
    
    Object.keys(stats.levelCounts).sort((a, b) => parseInt(a) - parseInt(b)).forEach(level => {
      console.log(`   ├─ Level ${level}: ${stats.levelCounts[level]} users`);
    });

  } catch (error) {
    console.error('❌ Error getting referral tree:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get the username from command line arguments
const targetUsername = process.argv[2];

if (!targetUsername) {
  console.log('Usage: node get-user-referral-tree.js <username>');
  console.log('Example: node get-user-referral-tree.js Touseef231');
  process.exit(1);
}

getUserReferralTree(targetUsername);
