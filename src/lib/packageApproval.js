import prisma from './prisma';
import { calculateMLMCommissions, updateUserPackageAndRank } from './commissionSystem';

// Rank point thresholds and conditions
const RANK_CONDITIONS = {
  'Consultant': { minPoints: 0, maxPoints: 999, requiresDownline: false },
  'Manager': { minPoints: 1000, maxPoints: 1999, requiresDownline: false },
  'Sapphire Manager': { minPoints: 2000, maxPoints: 7999, requiresDownline: false },
  'Diamond': { 
    minPoints: 8000, 
    maxPoints: Infinity, 
    requiresDownline: true,
    downlineCondition: { type: 'direct_trees_with_rank', count: 3, requiredRank: 'Sapphire Manager' }
  },
  'Sapphire Diamond': { 
    minPoints: 0, 
    maxPoints: Infinity, 
    requiresDownline: true,
    downlineCondition: { type: 'trees_with_count_of_rank', count: 3, requiredRank: 'Diamond', requiredCount: 3 }
  },
  'Ambassador': { 
    minPoints: 0, 
    maxPoints: Infinity, 
    requiresDownline: true,
    downlineCondition: [
      { type: 'trees_with_rank', count: 3, requiredRank: 'Sapphire Diamond' },
      { type: 'trees_with_rank', count: 6, requiredRank: 'Diamond' }
    ]
  },
  'Sapphire Ambassador': { 
    minPoints: 0, 
    maxPoints: Infinity, 
    requiresDownline: true,
    downlineCondition: [
      { type: 'trees_with_rank', count: 3, requiredRank: 'Ambassador' },
      { type: 'trees_with_rank', count: 10, requiredRank: 'Diamond' }
    ]
  },
  'Royal Ambassador': { 
    minPoints: 0, 
    maxPoints: Infinity, 
    requiresDownline: true,
    downlineCondition: [
      { type: 'trees_with_rank', count: 4, requiredRank: 'Sapphire Ambassador' },
      { type: 'trees_with_rank', count: 10, requiredRank: 'Sapphire Diamond' }
    ]
  },
  'Global Ambassador': { 
    minPoints: 0, 
    maxPoints: Infinity, 
    requiresDownline: true,
    downlineCondition: [
      { type: 'trees_with_rank', count: 4, requiredRank: 'Royal Ambassador' },
      { type: 'trees_with_rank', count: 10, requiredRank: 'Ambassador' }
    ]
  },
  'Honorary Share Holder': { 
    minPoints: 0, 
    maxPoints: Infinity, 
    requiresDownline: true,
    downlineCondition: [
      { type: 'trees_with_rank', count: 5, requiredRank: 'Global Ambassador' },
      { type: 'trees_with_rank', count: 10, requiredRank: 'Royal Ambassador' }
    ]
  }
};

// Get rank by points only (for basic ranks)
export function getRankByPoints(points) {
  for (const [rankName, condition] of Object.entries(RANK_CONDITIONS)) {
    if (!condition.requiresDownline && points >= condition.minPoints && points <= condition.maxPoints) {
      return rankName;
    }
  }
  return 'Consultant'; // Default rank
}

// Get all possible ranks for a user based on points and downline structure
export async function getEligibleRanks(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      points: true,
      rank: {
        select: {
          title: true
        }
      }
    }
  });

  if (!user) return [];

  const eligibleRanks = [];
  
  for (const [rankName, condition] of Object.entries(RANK_CONDITIONS)) {
    // Check if user meets point requirements
    if (user.points < condition.minPoints) {
      continue;
    }

    // For ranks that don't require downline structure
    if (!condition.requiresDownline) {
      eligibleRanks.push(rankName);
      continue;
    }

    // For ranks that require downline structure
    const meetsDownlineCondition = await checkDownlineCondition(userId, condition.downlineCondition);
    if (meetsDownlineCondition) {
      eligibleRanks.push(rankName);
    }
  }

  return eligibleRanks;
}

// Get the highest eligible rank for a user
export async function getHighestEligibleRank(userId) {
  const eligibleRanks = await getEligibleRanks(userId);
  
  if (eligibleRanks.length === 0) {
    return 'Consultant';
  }

  // Return the highest rank (last in the hierarchy)
  const rankHierarchy = [
    'Consultant', 'Manager', 'Sapphire Manager', 'Diamond', 
    'Sapphire Diamond', 'Ambassador', 'Sapphire Ambassador', 
    'Royal Ambassador', 'Global Ambassador', 'Honorary Share Holder'
  ];

  let highestRank = 'Consultant';
  for (const rank of rankHierarchy) {
    if (eligibleRanks.includes(rank)) {
      highestRank = rank;
    }
  }

  return highestRank;
}

// Check if user meets downline condition
async function checkDownlineCondition(userId, downlineCondition) {
  if (Array.isArray(downlineCondition)) {
    // Multiple conditions (OR logic)
    for (const condition of downlineCondition) {
      if (await checkSingleDownlineCondition(userId, condition)) {
        return true;
      }
    }
    return false;
  } else {
    // Single condition
    return await checkSingleDownlineCondition(userId, downlineCondition);
  }
}

// Check a single downline condition
async function checkSingleDownlineCondition(userId, condition) {
  switch (condition.type) {
    case 'direct_trees_with_rank':
      return await checkDirectTreesWithRank(userId, condition.count, condition.requiredRank);
    
    case 'trees_with_rank':
      return await checkTreesWithRank(userId, condition.count, condition.requiredRank);
    
    case 'trees_with_count_of_rank':
      return await checkTreesWithCountOfRank(userId, condition.count, condition.requiredRank, condition.requiredCount);
    
    default:
      return false;
  }
}

// Check if user has at least X direct trees with specific rank
async function checkDirectTreesWithRank(userId, requiredCount, requiredRank) {
  // Get the user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true }
  });

  if (!user) return false;

  // Get direct referrals of the user
  const directReferrals = await prisma.user.findMany({
    where: { referredBy: user.username },
    include: {
      rank: true
    }
  });

  // Count direct referrals that have the required rank
  const treesWithRequiredRank = directReferrals.filter(referral => 
    referral.rank && referral.rank.title === requiredRank
  );

  console.log(`User ${user.username} has ${treesWithRequiredRank.length} direct trees with ${requiredRank} rank (required: ${requiredCount})`);
  return treesWithRequiredRank.length >= requiredCount;
}

// Check if user has at least X trees (anywhere in downline) with specific rank
async function checkTreesWithRank(userId, requiredCount, requiredRank) {
  // Get the user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true }
  });

  if (!user) return false;

  // Get all users in the downline
  const downlineUsers = await getDownlineUsers(userId);
  const usersWithRequiredRank = downlineUsers.filter(downlineUser => 
    downlineUser.rank && downlineUser.rank.title === requiredRank
  );

  // Group users by their direct referral tree
  const treeGroups = new Map();
  for (const downlineUser of usersWithRequiredRank) {
    const treeRoot = await getTreeRoot(downlineUser.id, user.username);
    if (treeRoot) {
      if (!treeGroups.has(treeRoot)) {
        treeGroups.set(treeRoot, []);
      }
      treeGroups.get(treeRoot).push(downlineUser);
    }
  }

  // Count trees that have at least one user with the required rank
  const qualifyingTrees = Array.from(treeGroups.values()).filter(users => users.length > 0);

  console.log(`User ${user.username} has ${qualifyingTrees.length} trees with ${requiredRank} rank (required: ${requiredCount})`);
  return qualifyingTrees.length >= requiredCount;
}

// Check if user has at least X trees with at least Y users of specific rank
async function checkTreesWithCountOfRank(userId, requiredTreeCount, requiredRank, requiredUserCount) {
  // Get the user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true }
  });

  if (!user) return false;

  // Get all users in the downline
  const downlineUsers = await getDownlineUsers(userId);
  const usersWithRequiredRank = downlineUsers.filter(downlineUser => 
    downlineUser.rank && downlineUser.rank.title === requiredRank
  );

  // Group users by their direct referral tree
  const treeGroups = new Map();
  for (const downlineUser of usersWithRequiredRank) {
    const treeRoot = await getTreeRoot(downlineUser.id, user.username);
    if (treeRoot) {
      if (!treeGroups.has(treeRoot)) {
        treeGroups.set(treeRoot, []);
      }
      treeGroups.get(treeRoot).push(downlineUser);
    }
  }

  // Count trees that have at least requiredUserCount users of requiredRank
  let qualifyingTrees = 0;
  for (const [treeRoot, users] of treeGroups) {
    if (users.length >= requiredUserCount) {
      qualifyingTrees++;
    }
  }

  console.log(`User ${user.username} has ${qualifyingTrees} trees with at least ${requiredUserCount} ${requiredRank} users (required: ${requiredTreeCount} trees)`);
  return qualifyingTrees >= requiredTreeCount;
}

// Get all users in downline
async function getDownlineUsers(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true }
  });

  if (!user) return [];

  const allUsers = await prisma.user.findMany({
    where: { referredBy: { not: null } },
    include: {
      rank: true
    }
  });

  const downlineUsers = [];
  const processed = new Set();

  function findDownline(currentUsername) {
    if (processed.has(currentUsername)) return;
    processed.add(currentUsername);

    const directReferrals = allUsers.filter(u => u.referredBy === currentUsername);
    for (const referral of directReferrals) {
      downlineUsers.push(referral);
      findDownline(referral.username);
    }
  }

  findDownline(user.username);
  return downlineUsers;
}

// Get the root of a tree (direct referral of the main user)
async function getTreeRoot(userId, mainUserUsername) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referredBy: true }
  });

  if (!user || !user.referredBy) return null;

  // If this user is directly referred by main user, return their username (they are the tree root)
  if (user.referredBy === mainUserUsername) {
    return user.referredBy;
  }

  // Otherwise, find the tree root recursively by going up the referral chain
  const referrer = await prisma.user.findUnique({
    where: { username: user.referredBy },
    select: { id: true, referredBy: true }
  });

  if (!referrer) return null;

  // If the referrer is directly referred by main user, then the referrer is the tree root
  if (referrer.referredBy === mainUserUsername) {
    return user.referredBy; // This is the direct referral (tree root)
  }

  // Continue up the chain
  return await getTreeRoot(referrer.id, mainUserUsername);
}

// Get or create rank
export async function getOrCreateRank(rankName) {
  let rank = await prisma.rank.findFirst({
    where: { title: rankName }
  });

  if (!rank) {
    const condition = RANK_CONDITIONS[rankName];
    const points = condition?.minPoints || 0;
    rank = await prisma.rank.create({
      data: {
        title: rankName,
        required_points: points,
        details: `Auto-created rank for ${rankName}`
      }
    });
  }

  return rank;
}

// Get referral tree (upward hierarchy)
export async function getReferralTree(userId) {
  const tree = [];
  let currentUserId = userId;
  let level = 0;
  const maxLevels = 10; // Prevent infinite loops

  while (currentUserId && level < maxLevels) {
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        id: true,
        username: true,
        fullname: true,
        referredBy: true,
        points: true,
        rank: {
          select: {
            title: true
          }
        }
      }
    });

    if (!user || !user.referredBy) break;

    // Find the referrer
    const referrer = await prisma.user.findUnique({
      where: { username: user.referredBy },
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

    if (referrer) {
      tree.push({
        ...referrer,
        level: level + 1,
        referredUser: user
      });
      currentUserId = referrer.id;
    } else {
      break;
    }

    level++;
  }

  return tree;
}

// Update user rank based on points and downline structure
export async function updateUserRank(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      points: true,
      rank: {
        select: {
          title: true
        }
      }
    }
  });

  if (!user) return null;

  // Get the highest eligible rank based on points and downline structure
  const newRankName = await getHighestEligibleRank(userId);
  const newRank = await getOrCreateRank(newRankName);

  // Only update if rank changed
  if (!user.rank || user.rank.title !== newRankName) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        rankId: newRank.id
      }
    });

    console.log(`✅ Updated rank for user ${userId}: ${user.rank?.title || 'No rank'} → ${newRankName}`);
    return newRankName;
  }

  return user.rank.title;
}

// Distribute commissions in referral tree
export async function distributeCommissions(referralTree, packageData, calculatedPoints) {
  const { package_direct_commission, package_indirect_commission } = packageData;
  const processedRanks = new Set();
  const updates = [];

  console.log('🌳 Processing referral tree:', referralTree.map(r => `${r.username} (${r.rank?.title || 'No rank'})`));

  for (let i = 0; i < referralTree.length; i++) {
    const referrer = referralTree[i];
    const currentRank = referrer.rank?.title || 'No rank';
    const isImmediateReferrer = i === 0; // First in tree is immediate referrer
    
    // Skip if we already processed this rank (for indirect commissions)
    if (processedRanks.has(currentRank)) {
      console.log(`⏭️ Skipping ${referrer.username} - rank ${currentRank} already processed for indirect commission`);
    }

    let commissionAmount = 0;
    let pointsToAdd = calculatedPoints || 0; // ALL members get points (MLM style)

    // Commission logic
    if (isImmediateReferrer) {
      // Immediate referrer already got direct commission, no additional commission here
      commissionAmount = 0;
      console.log(`ℹ️ ${referrer.username} (${currentRank}): Already received direct commission, only points here`);
    } else {
      // For other referrers, apply indirect commission logic
      if (!processedRanks.has(currentRank)) {
        // Only Manager rank and above get package_indirect_commission
        if (currentRank === 'Manager') {
          commissionAmount = package_indirect_commission;
          processedRanks.add(currentRank);
        } else if (currentRank === 'Sapphire Manager') {
          // Check if Manager exists in tree
          const hasManager = referralTree.some(r => r.rank?.title === 'Manager');
          if (!hasManager) {
            commissionAmount = package_indirect_commission * 2;
          } else {
            commissionAmount = package_indirect_commission;
          }
          processedRanks.add(currentRank);
        } else if (currentRank === 'Diamond') {
          // Check if Sapphire Manager exists in tree
          const hasSapphireManager = referralTree.some(r => r.rank?.title === 'Sapphire Manager');
          if (!hasSapphireManager) {
            commissionAmount = package_indirect_commission * 2;
          } else {
            commissionAmount = package_indirect_commission;
          }
          processedRanks.add(currentRank);
        } else if (currentRank === 'Sapphire Diamond') {
          commissionAmount = package_indirect_commission;
          processedRanks.add(currentRank);
        } else {
          // For Consultant rank or no rank, NO indirect commission
          commissionAmount = 0;
          processedRanks.add(currentRank);
          console.log(`ℹ️ ${referrer.username} (${currentRank}): No indirect commission - rank too low`);
        }
      } else {
        console.log(`⏭️ Skipping ${referrer.username} - rank ${currentRank} already processed`);
      }
    }

    // Add to updates array (everyone gets points, commission varies)
    if (commissionAmount > 0 || pointsToAdd > 0) {
      updates.push({
        userId: referrer.id,
        username: referrer.username,
        currentRank,
        commissionAmount,
        pointsToAdd,
        newBalance: parseFloat(referrer.balance) + commissionAmount,
        newPoints: (referrer.points || 0) + pointsToAdd
      });
    }

    console.log(`💰 ${referrer.username} (${currentRank}): +₨${commissionAmount} +${pointsToAdd} points`);
  }

  return updates;
}

// Execute all updates
export async function executeUpdates(updates) {
  const results = [];

  for (const update of updates) {
    try {
      // Update user balance and points
      await prisma.user.update({
        where: { id: update.userId },
        data: {
          balance: update.newBalance,
          points: update.newPoints
        }
      });

      // Update rank based on new points
      const newRank = await updateUserRank(update.userId);

      results.push({
        ...update,
        newRank
      });

      console.log(`✅ Updated ${update.username}: Balance ₨${update.newBalance}, Points ${update.newPoints}, Rank ${newRank}`);
    } catch (error) {
      console.error(`❌ Failed to update ${update.username}:`, error);
      results.push({
        ...update,
        error: error.message
      });
    }
  }

  return results;
}

// Calculate points based on package amount
export function calculatePointsFromPackageAmount(packageAmount) {
  const amount = parseFloat(packageAmount);
  
  // Specific point assignments as requested
  if (amount === 100000) {
    return 2000;
  } else if (amount === 4000000) {
    return 8000;
  }
  
  // Default calculation: 2% of package amount
  return Math.floor(amount * 0.02);
}

// Main package approval function using new MLM commission system
export async function approvePackageRequest(packageRequestId) {
  try {
    const requestId = parseInt(packageRequestId);
    console.log(`🚀 Starting package approval for request ${requestId}`);

    // Get package request with all related data
    const packageRequest = await prisma.packageRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullname: true,
            referredBy: true,
            points: true,
            balance: true,
            currentPackageId: true,
            packageId: true,
            status: true,
            rank: {
              select: {
                title: true
              }
            }
          }
        },
        package: {
          select: {
            id: true,
            package_name: true,
            package_amount: true,
            package_direct_commission: true,
            package_indirect_commission: true,
            package_points: true,
            status: true
          }
        }
      }
    });

    if (!packageRequest) {
      throw new Error('Package request not found');
    }

    if (packageRequest.status !== 'pending') {
      throw new Error(`Package request is not pending (current status: ${packageRequest.status})`);
    }

    // Validate user status
    if (packageRequest.user.status !== 'active') {
      throw new Error(`User is not active (current status: ${packageRequest.user.status})`);
    }

    // Validate package status
    if (packageRequest.package.status !== 'active') {
      throw new Error(`Package is not active (current status: ${packageRequest.package.status})`);
    }

    const { user, package: packageData } = packageRequest;
    console.log(`📦 Approving package: ${packageData.package_name} (₨${packageData.package_amount}) for user: ${user.username}`);

    // Check if this is a renewal or upgrade
    if (user.currentPackageId === packageData.id) {
      console.log(`🔄 This is a package renewal for user ${user.username}`);
    } else if (user.currentPackageId && user.currentPackageId !== packageData.id) {
      console.log(`⬆️ This is a package upgrade for user ${user.username}`);
    } else {
      console.log(`🆕 This is a new package assignment for user ${user.username}`);
    }

    // Step 1: Update user's package and rank
    await updateUserPackageAndRank(requestId);
    console.log(`✅ Updated user ${user.username} with package and rank`);

    // Step 2: Calculate and distribute MLM commissions
    await calculateMLMCommissions(requestId);
    console.log(`💰 MLM commissions distributed successfully`);

    // Step 3: Update package request status
    await prisma.packageRequest.update({
      where: { id: requestId },
      data: {
        status: 'approved',
        updatedAt: new Date()
      }
    });

    console.log(`✅ Package request ${packageRequestId} approved successfully`);

    return {
      success: true,
      message: 'Package approved successfully with MLM commission distribution',
      user: user.username,
      package: packageData.package_name,
      packageAmount: packageData.package_amount,
      packagePoints: packageData.package_points,
      isRenewal: user.currentPackageId === packageData.id,
      isUpgrade: user.currentPackageId && user.currentPackageId !== packageData.id
    };

  } catch (error) {
    console.error('❌ Package approval failed:', error);
    throw error;
  }
}
