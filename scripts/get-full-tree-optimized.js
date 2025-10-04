const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Function to get all referrals for a specific username
async function getReferralsForUser(username) {
  try {
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
        referralCount: true,
        totalEarnings: true,
        createdAt: true,
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
    return referrals;
  } catch (error) {
    console.error(`❌ Error fetching referrals for ${username}:`, error.message);
    return [];
  }
}

// Function to build tree level by level (breadth-first approach)
async function buildTreeLevelByLevel(targetUsername, maxLevel = 5) {
  const tree = {
    username: targetUsername,
    level: 0,
    children: []
  };

  const queue = [{ node: tree, level: 0 }];
  const processedUsernames = new Set([targetUsername]);

  while (queue.length > 0) {
    const { node, level } = queue.shift();
    
    if (level >= maxLevel) continue;

    console.log(`🔍 Processing level ${level + 1} for ${node.username}...`);
    
    const referrals = await getReferralsForUser(node.username);
    
    for (const referral of referrals) {
      if (processedUsernames.has(referral.username)) {
        console.warn(`⚠️ Circular reference detected: ${referral.username}`);
        continue;
      }
      
      processedUsernames.add(referral.username);
      
      const referralNode = {
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
        level: level + 1,
        children: []
      };
      
      node.children.push(referralNode);
      queue.push({ node: referralNode, level: level + 1 });
    }
    
    console.log(`✅ Found ${referrals.length} referrals for ${node.username}`);
  }

  return tree;
}

// Function to display tree in a formatted way
function displayTree(node, indent = 0) {
  const prefix = '  '.repeat(indent);
  
  if (node.level === 0) {
    console.log(`🌳 ${node.username} (ROOT)`);
  } else {
    console.log(`${prefix}├─ ${node.username} (${node.name})`);
    console.log(`${prefix}   ├─ Status: ${node.status}`);
    console.log(`${prefix}   ├─ Balance: $${node.balance}`);
    console.log(`${prefix}   ├─ Points: ${node.points}`);
    console.log(`${prefix}   ├─ Referrals: ${node.referralCount}`);
    console.log(`${prefix}   ├─ Total Earnings: $${node.totalEarnings}`);
    console.log(`${prefix}   ├─ Package: ${node.package}`);
    console.log(`${prefix}   ├─ Rank: ${node.rank}`);
    console.log(`${prefix}   ├─ Joined: ${node.joinedDate.toISOString().split('T')[0]}`);
    console.log(`${prefix}   └─ Level: ${node.level}`);
  }
  
  if (node.children.length > 0) {
    console.log(`${prefix}   └─ Children (${node.children.length}):`);
    node.children.forEach(child => displayTree(child, indent + 2));
  }
  console.log(''); // Empty line for readability
}

// Function to get tree statistics
function getTreeStats(node) {
  let totalUsers = 0;
  let totalBalance = 0;
  let totalEarnings = 0;
  let totalPoints = 0;
  let levelCounts = {};

  function traverse(currentNode) {
    if (currentNode.level > 0) { // Don't count root
      totalUsers++;
      totalBalance += currentNode.balance;
      totalEarnings += currentNode.totalEarnings;
      totalPoints += currentNode.points;
      
      if (!levelCounts[currentNode.level]) {
        levelCounts[currentNode.level] = 0;
      }
      levelCounts[currentNode.level]++;
    }

    currentNode.children.forEach(child => traverse(child));
  }

  traverse(node);

  return {
    totalUsers,
    totalBalance,
    totalEarnings,
    totalPoints,
    levelCounts
  };
}

async function getUserFullTree(targetUsername) {
  try {
    console.log(`🌳 Getting full referral tree for username: ${targetUsername}\n`);

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

    // Build the tree level by level
    console.log('🌲 BUILDING REFERRAL TREE...\n');
    const tree = await buildTreeLevelByLevel(targetUsername, 5);

    console.log('\n🌲 REFERRAL TREE STRUCTURE:');
    displayTree(tree);

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
  console.log('Usage: node get-full-tree-optimized.js <username>');
  console.log('Example: node get-full-tree-optimized.js Touseef231');
  process.exit(1);
}

getUserFullTree(targetUsername);

