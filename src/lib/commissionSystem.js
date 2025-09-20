import prisma from './prisma.js';
import { updateUserRank } from './rankUtils.js';

/**
 * Transaction-based version of updateUserRank
 */
async function updateUserRankInTransaction(userId, currentPoints, tx) {
  try {
    // Get all ranks ordered by required points
    const ranks = await tx.rank.findMany({
      orderBy: { required_points: 'asc' }
    });

    // Determine the appropriate rank based on points
    let newRankTitle = 'Consultant'; // Default rank
    
    if (currentPoints >= 24000) {
      newRankTitle = 'Sapphire Diamond';
    } else if (currentPoints >= 8000) {
      newRankTitle = 'Diamond';
    } else if (currentPoints >= 2000) {
      newRankTitle = 'Sapphire Manager';
    } else if (currentPoints >= 1000) {
      newRankTitle = 'Manager';
    }

    // Find the rank record
    const rankRecord = ranks.find(rank => rank.title === newRankTitle);
    
    if (!rankRecord) {
      console.log(`Rank '${newRankTitle}' not found in database`);
      return 'No Rank';
    }

    // Update user's rank
    await tx.user.update({
      where: { id: userId },
      data: { rankId: rankRecord.id }
    });

    console.log(`✅ Updated rank for user ${userId}: ${newRankTitle} (${currentPoints} points)`);
    return newRankTitle;

  } catch (error) {
    console.error(`❌ Failed to update rank for user ${userId}:`, error);
    return 'No Rank';
  }
}

// Rank hierarchy will be fetched from database
let RANK_HIERARCHY = [];

/**
 * Calculate and distribute MLM commissions when a package is approved
 * @param {number} packageRequestId - The ID of the approved package request
 */
export async function calculateMLMCommissions(packageRequestId) {
  try {
    // Get the package request with user and package details
    const packageRequest = await prisma.packageRequest.findUnique({
      where: { id: packageRequestId },
      include: {
        user: {
          include: {
            rank: true
          }
        },
        package: true
      }
    });

    if (!packageRequest) {
      throw new Error('Package request not found');
    }

    const { user, package: packageData } = packageRequest;
    const packageAmount = parseFloat(packageData.package_amount);
    const directCommission = parseFloat(packageData.package_direct_commission);
    const indirectCommission = parseFloat(packageData.package_indirect_commission);
    const packagePoints = packageData.package_points || 0;

    console.log(`Processing MLM commissions for user ${user.username}, package: ${packageData.package_name}`);
    console.log(`Direct Commission: ${directCommission}, Indirect Commission: ${indirectCommission}`);

    // 1. Give points to ALL members in the tree (upward)
    await distributePointsToTree(user.username, packagePoints);

    // 2. Give direct commission to direct referrer only
    if (user.referredBy) {
      console.log(`Giving direct commission to direct referrer: ${user.referredBy}`);
      await giveDirectCommission(user.referredBy, directCommission, packageRequestId);
    } else {
      console.log(`No direct referrer found for ${user.username}`);
    }

    // 3. Give indirect commissions to ranks in the tree (excluding direct referrer)
    console.log(`Starting indirect commission distribution (excluding direct referrer)`);
    await distributeIndirectCommissions(user.username, indirectCommission, packageRequestId);

    console.log('MLM commissions calculated successfully');
    return { success: true };

  } catch (error) {
    console.error('Error calculating MLM commissions:', error);
    throw error;
  }
}

/**
 * Distribute points to all members in the tree (upward)
 */
async function distributePointsToTree(username, points) {
  let currentUsername = username;
  const processedUsers = new Set();

  while (currentUsername) {
    const user = await prisma.user.findUnique({
      where: { username: currentUsername }
    });

    if (!user || processedUsers.has(user.id)) {
      break; // Prevent infinite loops
    }

    // Add points to user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        points: {
          increment: points
        }
      }
    });

    // Update user's rank based on new points
    await updateUserRank(user.id);

    console.log(`Added ${points} points to ${user.username} and updated rank`);
    processedUsers.add(user.id);
    currentUsername = user.referredBy;
  }
}

/**
 * Give direct commission to direct referrer
 */
async function giveDirectCommission(referredByUsername, directCommission, packageRequestId) {
  const referrer = await prisma.user.findUnique({
    where: { username: referredByUsername }
  });

  if (!referrer) {
    console.log(`Direct referrer ${referredByUsername} not found`);
    return;
  }

  // Add direct commission to referrer's balance
  await prisma.user.update({
    where: { id: referrer.id },
    data: {
      balance: {
        increment: directCommission
      },
      totalEarnings: {
        increment: directCommission
      }
    }
  });

  // Update user's rank based on current points (in case points were added earlier)
  await updateUserRank(referrer.id);

  // Create earnings record
  await prisma.earnings.create({
    data: {
      userId: referrer.id,
      amount: directCommission,
      type: 'direct_commission',
      description: `Direct commission from package approval`,
      packageRequestId: packageRequestId
    }
  });

  console.log(`Added ${directCommission} direct commission to ${referrer.username} and updated rank`);
}

/**
 * Distribute indirect commissions to ranks in the tree
 * New Logic:
 * 1. Direct referrer gets only direct commission (no indirect)
 * 2. Indirect commission goes to next person of same rank in tree
 * 3. If no same rank exists, goes to next higher rank with combined commission
 */
async function distributeIndirectCommissions(username, indirectCommission, packageRequestId) {
  // Get all ranks from database
  const ranks = await prisma.rank.findMany({
    orderBy: { required_points: 'asc' }
  });

  // Create rank hierarchy map (from lowest to highest points)
  const rankHierarchy = ranks.map(rank => rank.title);
  console.log('Rank hierarchy from database:', rankHierarchy);

  // Get the tree structure (excluding the direct referrer)
  const treeMembers = await getTreeMembersExcludingDirectReferrer(username);
  console.log(`Found ${treeMembers.length} members in tree (excluding direct referrer)`);
  console.log(`Direct referrer is EXCLUDED from indirect commission distribution`);

  // Group members by rank
  const membersByRank = {};
  treeMembers.forEach(member => {
    const rankTitle = member.rank?.title || 'No Rank';
    if (!membersByRank[rankTitle]) {
      membersByRank[rankTitle] = [];
    }
    membersByRank[rankTitle].push(member);
  });

  // Log eligible members for indirect commission
  console.log('Members eligible for indirect commission:');
  Object.entries(membersByRank).forEach(([rank, members]) => {
    console.log(`  ${rank}: ${members.map(m => m.username).join(', ')}`);
  });

  // Process indirect commissions according to new rules
  const processedRanks = new Set();
  
  // Start from the highest rank and work down
  for (let i = rankHierarchy.length - 1; i >= 0; i--) {
    const currentRank = rankHierarchy[i];
    
    // Skip Consultant rank (they don't get indirect commission)
    if (currentRank === 'Consultant') {
      continue;
    }

    if (processedRanks.has(currentRank)) {
      continue;
    }

    const membersOfRank = membersByRank[currentRank] || [];
    
    if (membersOfRank.length > 0) {
      // Give commission to the first member of this rank
      const firstMember = membersOfRank[0];
      await giveIndirectCommission(firstMember, indirectCommission, packageRequestId, currentRank);
      processedRanks.add(currentRank);
      console.log(`Gave ${indirectCommission} indirect commission to first ${currentRank}: ${firstMember.username}`);
    } else {
      // No member of this rank, give combined commission to upper rank
      const upperRank = findUpperRank(currentRank, rankHierarchy);
      console.log(`No ${currentRank} members found. Looking for upper rank: ${upperRank}`);
      
      if (upperRank && !processedRanks.has(upperRank)) {
        const upperRankMembers = membersByRank[upperRank] || [];
        console.log(`Upper rank ${upperRank} has ${upperRankMembers.length} members`);
        
        if (upperRankMembers.length > 0) {
          const firstUpperMember = upperRankMembers[0];
          // Combined commission: current rank's indirect + upper rank's own indirect
          const combinedCommission = indirectCommission * 2;
          await giveIndirectCommission(firstUpperMember, combinedCommission, packageRequestId, `${upperRank} (combined - includes ${currentRank})`);
          processedRanks.add(upperRank);
          console.log(`✅ Gave ${combinedCommission} combined indirect commission to ${upperRank}: ${firstUpperMember.username} (includes ${currentRank} commission)`);
        } else {
          console.log(`❌ No members found for upper rank ${upperRank}`);
        }
      } else {
        console.log(`❌ Upper rank ${upperRank} not found or already processed`);
      }
    }
  }
}

/**
 * Get all members in the tree (upward)
 */
async function getTreeMembers(username) {
  const members = [];
  let currentUsername = username;
  const processedUsers = new Set();

  while (currentUsername) {
    const user = await prisma.user.findUnique({
      where: { username: currentUsername },
      include: {
        rank: true
      }
    });

    if (!user || processedUsers.has(user.id)) {
      break;
    }

    members.push(user);
    processedUsers.add(user.id);
    currentUsername = user.referredBy;
  }

  return members;
}

/**
 * Get all members in the tree (upward) excluding the direct referrer
 * This ensures direct referrer only gets direct commission, not indirect
 */
async function getTreeMembersExcludingDirectReferrer(username) {
  // First, get the new user to find their direct referrer
  const newUser = await prisma.user.findUnique({
    where: { username: username }
  });

  if (!newUser || !newUser.referredBy) {
    return []; // No direct referrer, so no tree members to process
  }

  const directReferrerUsername = newUser.referredBy;
  const members = [];
  const processedUsers = new Set();

  // Start from the direct referrer's referrer (skip the direct referrer)
  let currentUsername = directReferrerUsername;
  
  // Get the direct referrer to find their referrer
  const directReferrer = await prisma.user.findUnique({
    where: { username: directReferrerUsername }
  });
  
  if (!directReferrer || !directReferrer.referredBy) {
    return []; // Direct referrer has no referrer, so no tree members to process
  }

  // Start from the direct referrer's referrer
  currentUsername = directReferrer.referredBy;

  while (currentUsername) {
    const user = await prisma.user.findUnique({
      where: { username: currentUsername },
      include: {
        rank: true
      }
    });

    if (!user || processedUsers.has(user.id)) {
      break;
    }

    members.push(user);
    processedUsers.add(user.id);
    currentUsername = user.referredBy;
  }

  return members;
}

/**
 * Find the upper rank in the hierarchy
 * Note: rankHierarchy is ordered from lowest to highest points
 * Since we're processing from highest to lowest, upper rank is at higher index
 */
function findUpperRank(currentRank, rankHierarchy) {
  const currentIndex = rankHierarchy.indexOf(currentRank);
  console.log(`Finding upper rank for ${currentRank} (index ${currentIndex}) in hierarchy:`, rankHierarchy);
  
  if (currentIndex < rankHierarchy.length - 1) {
    const upperRank = rankHierarchy[currentIndex + 1];
    console.log(`Upper rank found: ${upperRank} (index ${currentIndex + 1})`);
    return upperRank;
  }
  
  console.log(`No upper rank found for ${currentRank}`);
  return null;
}

/**
 * Give indirect commission to a user
 */
async function giveIndirectCommission(user, commission, packageRequestId, description) {
  // Add commission to user's balance
  await prisma.user.update({
    where: { id: user.id },
    data: {
      balance: {
        increment: commission
      },
      totalEarnings: {
        increment: commission
      }
    }
  });

  // Update user's rank based on current points (in case points were added earlier)
  await updateUserRank(user.id);

  // Create earnings record
  await prisma.earnings.create({
    data: {
      userId: user.id,
      amount: commission,
      type: 'indirect_commission',
      description: `Indirect commission: ${description}`,
      packageRequestId: packageRequestId
    }
  });
}

/**
 * Update user's package and rank when package is approved
 */
export async function updateUserPackageAndRank(packageRequestId) {
  try {
    const packageRequest = await prisma.packageRequest.findUnique({
      where: { id: packageRequestId },
      include: {
        user: true,
        package: {
          include: {
            rank: true
          }
        }
      }
    });

    if (!packageRequest) {
      throw new Error('Package request not found');
    }

    const { user, package: packageData } = packageRequest;
    const packageAmount = parseFloat(packageData.package_amount);
    const packageExpiryDate = new Date();
    packageExpiryDate.setFullYear(packageExpiryDate.getFullYear() + 1); // 1 year expiry

    // Check if user already has a package
    const currentPackage = user.currentPackageId;
    const existingPackage = user.packageId;
    
    if (currentPackage && currentPackage === packageData.id) {
      console.log(`User ${user.username} already has package ${packageData.package_name}. This appears to be a renewal.`);
    } else if (currentPackage && currentPackage !== packageData.id) {
      console.log(`User ${user.username} is upgrading from package ${currentPackage} to ${packageData.package_name}.`);
    }

    // Update user's package (allow renewals and upgrades)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        currentPackageId: packageData.id,
        packageExpiryDate: packageExpiryDate,
        packageId: packageData.id
        // Note: rankId will be updated later based on points after commission distribution
      }
    });

    // Update user's rank based on their current points (this will be called again after points are distributed)
    await updateUserRank(user.id);

    console.log(`Updated user ${user.username} with package ${packageData.package_name} and updated rank`);
    return { success: true };

  } catch (error) {
    console.error('Error updating user package and rank:', error);
    throw error;
  }
}

/**
 * Transaction-based version for package approval
 */
export async function updateUserPackageAndRankInTransaction(packageRequestId, tx) {
  const packageRequest = await tx.packageRequest.findUnique({
    where: { id: packageRequestId },
    include: {
      user: true,
      package: {
        include: {
          rank: true
        }
      }
    }
  });

  if (!packageRequest) {
    throw new Error('Package request not found');
  }

  const { user, package: packageData } = packageRequest;
  const packageExpiryDate = new Date();
  packageExpiryDate.setFullYear(packageExpiryDate.getFullYear() + 1); // 1 year expiry

  // Check if this is a balance payment (shopping amount should be 0)
  const isBalancePayment = packageRequest.transactionId && 
                          packageRequest.transactionId.startsWith('BAL_') && 
                          packageRequest.transactionReceipt === 'Paid from user balance';
  
  // For balance payments, set shopping amount to 0 since user already "paid" from their balance
  const effectiveShoppingAmount = isBalancePayment ? 0 : parseFloat(packageData.shopping_amount);
  
  console.log(`Package activation for user ${user.username}: ${packageData.package_name}`);
  console.log(`Payment method: ${isBalancePayment ? 'Balance Payment' : 'Regular Payment'}`);
  console.log(`Shopping amount: ${effectiveShoppingAmount} (original: ${packageData.shopping_amount})`);

  // Update user's package (allow renewals and upgrades)
  await tx.user.update({
    where: { id: user.id },
    data: {
      currentPackageId: packageData.id,
      packageExpiryDate: packageExpiryDate,
      packageId: packageData.id
    }
  });

  // Update user's rank based on current points
  const updatedUser = await tx.user.findUnique({
    where: { id: user.id },
    select: { points: true }
  });

  if (updatedUser) {
    const newRank = await updateUserRankInTransaction(user.id, updatedUser.points, tx);
    console.log(`Updated user ${user.username} with package ${packageData.package_name} and rank ${newRank}`);
  }

  console.log(`Updated user ${user.username} with package ${packageData.package_name}`);
  return { 
    success: true, 
    isBalancePayment: isBalancePayment,
    effectiveShoppingAmount: effectiveShoppingAmount
  };
}

/**
 * Transaction-based version for MLM commission calculation
 */
export async function calculateMLMCommissionsInTransaction(packageRequestId, tx) {
  try {
    // Get the package request with user and package details
    const packageRequest = await tx.packageRequest.findUnique({
      where: { id: packageRequestId },
      include: {
        user: {
          include: {
            rank: true
          }
        },
        package: true
      }
    });

    if (!packageRequest) {
      throw new Error('Package request not found');
    }

    const { user, package: packageData } = packageRequest;
    const packageAmount = parseFloat(packageData.package_amount);
    const directCommission = parseFloat(packageData.package_direct_commission);
    const indirectCommission = parseFloat(packageData.package_indirect_commission);
    const packagePoints = packageData.package_points || 0;

    console.log(`Processing MLM commissions for user ${user.username}, package: ${packageData.package_name}`);
    console.log(`Direct Commission: ${directCommission}, Indirect Commission: ${indirectCommission}`);

    // 1. Give points to ALL members in the tree (upward)
    await distributePointsToTreeInTransaction(user.username, packagePoints, tx);

    // 2. Give direct commission to direct referrer only
    if (user.referredBy) {
      console.log(`Giving direct commission to direct referrer: ${user.referredBy}`);
      await giveDirectCommissionInTransaction(user.referredBy, directCommission, packageRequestId, tx);
    } else {
      console.log(`No direct referrer found for ${user.username}`);
    }

    // 3. Give indirect commissions to ranks in the tree (excluding direct referrer)
    console.log(`Starting indirect commission distribution (excluding direct referrer)`);
    await distributeIndirectCommissionsInTransaction(user.username, indirectCommission, packageRequestId, tx);

    console.log('MLM commissions calculated successfully');
    return { success: true };

  } catch (error) {
    console.error('Error calculating MLM commissions:', error);
    throw error;
  }
}

/**
 * Transaction-based version of distributePointsToTree
 */
async function distributePointsToTreeInTransaction(username, points, tx) {
  // Get all users first to reduce database queries
  const allUsers = await tx.user.findMany({
    select: {
      id: true,
      username: true,
      referredBy: true,
      points: true
    }
  });

  // Create a lookup map for faster access
  const userMap = new Map();
  allUsers.forEach(user => {
    userMap.set(user.username, user);
  });

  // Build the referral chain
  const usersToUpdate = [];
  let currentUsername = username;
  const processedUsers = new Set();
  let level = 0;
  const maxLevels = 10; // Prevent infinite loops

  while (currentUsername && level < maxLevels) {
    const user = userMap.get(currentUsername);

    if (!user || processedUsers.has(user.id)) {
      break; // Prevent infinite loops
    }

    usersToUpdate.push(user);
    processedUsers.add(user.id);
    currentUsername = user.referredBy;
    level++;
  }

  // Batch update all users at once using Promise.all for better performance
  const updatePromises = usersToUpdate.map(user => 
    tx.user.update({
      where: { id: user.id },
      data: {
        points: {
          increment: points
        }
      }
    })
  );

  await Promise.all(updatePromises);
  
  // Update ranks for all users after points are updated
  console.log(`Updating ranks for ${usersToUpdate.length} users after points distribution...`);
  const rankUpdatePromises = usersToUpdate.map(async (user) => {
    try {
      const updatedUser = await tx.user.findUnique({
        where: { id: user.id },
        select: { points: true }
      });
      
      if (updatedUser) {
        const newRank = await updateUserRankInTransaction(user.id, updatedUser.points, tx);
        console.log(`  - ${user.username}: ${newRank} (${updatedUser.points} points)`);
        return newRank;
      }
    } catch (error) {
      console.error(`Failed to update rank for ${user.username}:`, error);
    }
  });
  
  await Promise.all(rankUpdatePromises);
  
  console.log(`Added ${points} points to ${usersToUpdate.length} users in the referral tree and updated their ranks`);
}

/**
 * Transaction-based version of giveDirectCommission
 */
async function giveDirectCommissionInTransaction(referredByUsername, directCommission, packageRequestId, tx) {
  const referrer = await tx.user.findUnique({
    where: { username: referredByUsername }
  });

  if (!referrer) {
    console.log(`Direct referrer ${referredByUsername} not found`);
    return;
  }

  // Add direct commission to referrer's balance
  await tx.user.update({
    where: { id: referrer.id },
    data: {
      balance: {
        increment: directCommission
      },
      totalEarnings: {
        increment: directCommission
      }
    }
  });

  // Create earnings record
  await tx.earnings.create({
    data: {
      userId: referrer.id,
      amount: directCommission,
      type: 'direct_commission',
      description: `Direct commission from package approval`,
      packageRequestId: packageRequestId
    }
  });

  console.log(`Added ${directCommission} direct commission to ${referrer.username}`);
}

/**
 * NEW LOGIC: Transaction-based version of distributeIndirectCommissions
 * Start from Manager rank, accumulate missing rank commissions
 */
async function distributeIndirectCommissionsInTransaction(username, indirectCommission, packageRequestId, tx) {
  // Get all ranks from database
  const ranks = await tx.rank.findMany({
    orderBy: { required_points: 'asc' }
  });

  // Create rank hierarchy map (from lowest to highest points)
  const rankHierarchy = ranks.map(rank => rank.title);
  console.log('Rank hierarchy from database:', rankHierarchy);

  // Find Manager rank index (starting point for indirect commissions)
  const managerIndex = rankHierarchy.findIndex(rank => rank === 'Manager');
  if (managerIndex === -1) {
    console.log('❌ Manager rank not found - cannot distribute indirect commissions');
    return;
  }

  console.log(`✅ Starting indirect commission distribution from Manager rank (index: ${managerIndex})`);

  // Get the tree structure (excluding the direct referrer)
  const treeMembers = await getTreeMembersExcludingDirectReferrerInTransaction(username, tx);
  console.log(`Found ${treeMembers.length} members in tree (excluding direct referrer)`);

  // Group members by rank
  const membersByRank = {};
  treeMembers.forEach(member => {
    const rankTitle = member.rank?.title || 'No Rank';
    if (!membersByRank[rankTitle]) {
      membersByRank[rankTitle] = [];
    }
    membersByRank[rankTitle].push(member);
  });

  // Log eligible members for indirect commission
  console.log('Members eligible for indirect commission:');
  Object.entries(membersByRank).forEach(([rank, members]) => {
    console.log(`  ${rank}: ${members.map(m => m.username).join(', ')}`);
  });

  // NEW LOGIC: Start from Manager rank and work up
  const processedRanks = new Set();
  let accumulatedCommission = 0;
  let accumulatedRanks = [];

  // Process ranks from Manager onwards (upward in hierarchy)
  for (let i = managerIndex; i < rankHierarchy.length; i++) {
    const currentRank = rankHierarchy[i];
    
    // Skip Consultant rank (they don't get indirect commission)
    if (currentRank === 'Consultant') {
      continue;
    }

    if (processedRanks.has(currentRank)) {
      continue;
    }

    const membersOfRank = membersByRank[currentRank] || [];
    
    if (membersOfRank.length > 0) {
      // Found users with this rank - give accumulated commission to first user
      const firstMember = membersOfRank[0];
      
      // Check if this member meets rank requirements
      const meetsRequirements = await checkRankRequirementsInTransaction(firstMember, currentRank, tx);
      
      if (meetsRequirements) {
        // Calculate total commission: accumulated + current rank's commission
        const totalCommission = accumulatedCommission + indirectCommission;
        const rankDescription = accumulatedRanks.length > 0 
          ? `${currentRank} (includes: ${accumulatedRanks.join(', ')})`
          : currentRank;
        
        await giveIndirectCommissionInTransaction(firstMember, totalCommission, packageRequestId, rankDescription, tx);
        processedRanks.add(currentRank);
        
        console.log(`✅ Gave ${totalCommission} indirect commission to ${currentRank}: ${firstMember.username}`);
        if (accumulatedRanks.length > 0) {
          console.log(`   Includes accumulated commissions from: ${accumulatedRanks.join(', ')}`);
        }
        
        // Reset accumulation since we've distributed it
        accumulatedCommission = 0;
        accumulatedRanks = [];
      } else {
        console.log(`❌ ${firstMember.username} has ${currentRank} rank but doesn't meet requirements - accumulating commission`);
        // Accumulate this rank's commission
        accumulatedCommission += indirectCommission;
        accumulatedRanks.push(currentRank);
      }
    } else {
      // No users with this rank - accumulate the commission
      console.log(`❌ No users found with ${currentRank} rank - accumulating commission`);
      accumulatedCommission += indirectCommission;
      accumulatedRanks.push(currentRank);
    }
  }

  // If there's still accumulated commission at the end, log it
  if (accumulatedCommission > 0) {
    console.log(`⚠️  ${accumulatedCommission} commission accumulated from ranks: ${accumulatedRanks.join(', ')} - no eligible users found`);
  }
}

/**
 * Transaction-based version of getTreeMembersExcludingDirectReferrer
 */
async function getTreeMembersExcludingDirectReferrerInTransaction(username, tx) {
  // First, get the new user to find their direct referrer
  const newUser = await tx.user.findUnique({
    where: { username: username }
  });

  if (!newUser || !newUser.referredBy) {
    return []; // No direct referrer, so no tree members to process
  }

  const directReferrerUsername = newUser.referredBy;
  
  // Get all users first to reduce database queries
  const allUsers = await tx.user.findMany({
    include: {
      rank: true
    }
  });

  // Create a lookup map for faster access
  const userMap = new Map();
  allUsers.forEach(user => {
    userMap.set(user.username, user);
  });

  // Build the referral chain starting from direct referrer's referrer
  const members = [];
  const processedUsers = new Set();
  let level = 0;
  const maxLevels = 10; // Prevent infinite loops

  // Get the direct referrer to find their referrer
  const directReferrer = userMap.get(directReferrerUsername);
  
  if (!directReferrer || !directReferrer.referredBy) {
    return []; // Direct referrer has no referrer, so no tree members to process
  }

  // Start from the direct referrer's referrer
  let currentUsername = directReferrer.referredBy;

  while (currentUsername && level < maxLevels) {
    const user = userMap.get(currentUsername);

    if (!user || processedUsers.has(user.id)) {
      break; // Prevent infinite loops
    }

    members.push(user);
    processedUsers.add(user.id);
    currentUsername = user.referredBy;
    level++;
  }

  return members;
}

/**
 * Transaction-based version of giveIndirectCommission
 */
async function giveIndirectCommissionInTransaction(user, commission, packageRequestId, description, tx) {
  // Add commission to user's balance
  await tx.user.update({
    where: { id: user.id },
    data: {
      balance: {
        increment: commission
      },
      totalEarnings: {
        increment: commission
      }
    }
  });

  // Create earnings record
  await tx.earnings.create({
    data: {
      userId: user.id,
      amount: commission,
      type: 'indirect_commission',
      description: `Indirect commission: ${description}`,
      packageRequestId: packageRequestId
    }
  });
}

/**
 * Check if a user meets the requirements for their rank
 * This function checks if the user has the required downline structure
 */
async function checkRankRequirementsInTransaction(user, rankTitle, tx) {
  // Get rank requirements from database
  const rank = await tx.rank.findFirst({
    where: { title: rankTitle }
  });

  if (!rank) {
    console.log(`Rank ${rankTitle} not found in database`);
    return false;
  }

  // Define specific requirements for higher ranks
  const rankRequirements = {
    'Sapphire Diamond': { requiredDirectDiamonds: 2, requiredDirectSapphireManagers: 1 },
    'Ambassador': { requiredDirectDiamonds: 3, requiredDirectSapphireDiamonds: 1 },
    'Sapphire Ambassador': { requiredDirectDiamonds: 5, requiredDirectSapphireDiamonds: 2 },
    'Royal Ambassador': { requiredDirectDiamonds: 8, requiredDirectSapphireDiamonds: 3 },
    'Global Ambassador': { requiredDirectDiamonds: 12, requiredDirectSapphireDiamonds: 5 },
    'Honory Share Holder': { requiredDirectDiamonds: 20, requiredDirectSapphireDiamonds: 8 }
  };

  const requirements = rankRequirements[rankTitle];
  if (!requirements) {
    // For ranks without specific requirements, just check if they have the rank
    return true;
  }

  // Check if user meets the downline requirements
  const meetsRequirements = await checkDirectTreesWithRankInTransaction(user, requirements, tx);
  
  if (meetsRequirements) {
    console.log(`✅ ${user.username} meets ${rankTitle} requirements`);
  } else {
    console.log(`❌ ${user.username} does not meet ${rankTitle} requirements`);
  }

  return meetsRequirements;
}

/**
 * Check if a user has the required number of direct referrals with specific ranks
 */
async function checkDirectTreesWithRankInTransaction(user, requirements, tx) {
  // Get all direct referrals of the user
  const directReferrals = await tx.user.findMany({
    where: { referredBy: user.username },
    include: { rank: true }
  });

  let directDiamonds = 0;
  let directSapphireManagers = 0;

  // Count direct referrals with required ranks
  directReferrals.forEach(referral => {
    if (referral.rank?.title === 'Diamond') {
      directDiamonds++;
    } else if (referral.rank?.title === 'Sapphire Manager') {
      directSapphireManagers++;
    }
  });

  // Check if requirements are met
  const meetsDiamondRequirement = directDiamonds >= (requirements.requiredDirectDiamonds || 0);
  const meetsSapphireManagerRequirement = directSapphireManagers >= (requirements.requiredDirectSapphireManagers || 0);

  console.log(`Direct referrals check for ${user.username}:`);
  console.log(`  Diamonds: ${directDiamonds}/${requirements.requiredDirectDiamonds || 0}`);
  console.log(`  Sapphire Managers: ${directSapphireManagers}/${requirements.requiredDirectSapphireManagers || 0}`);

  return meetsDiamondRequirement && meetsSapphireManagerRequirement;
}

/**
 * Update ranks for all affected users after commission distribution
 */
export async function updateRanksForAllAffectedUsers(packageRequestId, tx) {
  try {
    // Get the package request to find the user
    const packageRequest = await tx.packageRequest.findUnique({
      where: { id: packageRequestId },
      include: { user: true }
    });

    if (!packageRequest) {
      throw new Error('Package request not found');
    }

    const { user } = packageRequest;

    // Get all users in the referral tree (including the package buyer)
    const allUsers = await tx.user.findMany({
      select: {
        id: true,
        username: true,
        referredBy: true
      }
    });

    // Create a lookup map
    const userMap = new Map();
    allUsers.forEach(u => {
      userMap.set(u.username, u);
    });

    // Build the referral chain
    const usersToUpdate = [];
    let currentUsername = user.username;
    const processedUsers = new Set();
    let level = 0;
    const maxLevels = 10;

    while (currentUsername && level < maxLevels) {
      const currentUser = userMap.get(currentUsername);
      if (!currentUser || processedUsers.has(currentUser.id)) {
        break;
      }

      usersToUpdate.push(currentUser);
      processedUsers.add(currentUser.id);
      currentUsername = currentUser.referredBy;
      level++;
    }

    // Update ranks for all users in the tree
    const updatePromises = usersToUpdate.map(userToUpdate => 
      updateUserRank(userToUpdate.id)
    );

    await Promise.all(updatePromises);
    
    console.log(`Updated ranks for ${usersToUpdate.length} users in the referral tree`);
    return { success: true };

  } catch (error) {
    console.error('Error updating ranks for affected users:', error);
    throw error;
  }
}
