import prisma from './prisma.js';
import { updateUserRank } from './rankUtils.js';

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
          console.log(`âœ… Gave ${combinedCommission} combined indirect commission to ${upperRank}: ${firstUpperMember.username} (includes ${currentRank} commission)`);
        } else {
          console.log(`âŒ No members found for upper rank ${upperRank}`);
        }
      } else {
        console.log(`âŒ Upper rank ${upperRank} not found or already processed`);
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

  // Update user's package (allow renewals and upgrades)
  await tx.user.update({
    where: { id: user.id },
    data: {
      currentPackageId: packageData.id,
      packageExpiryDate: packageExpiryDate,
      packageId: packageData.id
    }
  });

  console.log(`Updated user ${user.username} with package ${packageData.package_name}`);
  return { success: true };
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
  let currentUsername = username;
  const processedUsers = new Set();

  while (currentUsername) {
    const user = await tx.user.findUnique({
      where: { username: currentUsername }
    });

    if (!user || processedUsers.has(user.id)) {
      break; // Prevent infinite loops
    }

    // Add points to user
    await tx.user.update({
      where: { id: user.id },
      data: {
        points: {
          increment: points
        }
      }
    });

    console.log(`Added ${points} points to ${user.username}`);
    processedUsers.add(user.id);
    currentUsername = user.referredBy;
  }
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
 * Transaction-based version of distributeIndirectCommissions
 */
async function distributeIndirectCommissionsInTransaction(username, indirectCommission, packageRequestId, tx) {
  // Get all ranks from database
  const ranks = await tx.rank.findMany({
    orderBy: { required_points: 'asc' }
  });

  // Create rank hierarchy map (from lowest to highest points)
  const rankHierarchy = ranks.map(rank => rank.title);
  console.log('Rank hierarchy from database:', rankHierarchy);

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
      await giveIndirectCommissionInTransaction(firstMember, indirectCommission, packageRequestId, currentRank, tx);
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
          await giveIndirectCommissionInTransaction(firstUpperMember, combinedCommission, packageRequestId, `${upperRank} (combined - includes ${currentRank})`, tx);
          processedRanks.add(upperRank);
          console.log(`âœ… Gave ${combinedCommission} combined indirect commission to ${upperRank}: ${firstUpperMember.username} (includes ${currentRank} commission)`);
        } else {
          console.log(`âŒ No members found for upper rank ${upperRank}`);
        }
      } else {
        console.log(`âŒ Upper rank ${upperRank} not found or already processed`);
      }
    }
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
  const members = [];
  const processedUsers = new Set();

  // Start from the direct referrer's referrer (skip the direct referrer)
  let currentUsername = directReferrerUsername;
  
  // Get the direct referrer to find their referrer
  const directReferrer = await tx.user.findUnique({
    where: { username: directReferrerUsername }
  });
  
  if (!directReferrer || !directReferrer.referredBy) {
    return []; // Direct referrer has no referrer, so no tree members to process
  }

  // Start from the direct referrer's referrer
  currentUsername = directReferrer.referredBy;

  while (currentUsername) {
    const user = await tx.user.findUnique({
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
