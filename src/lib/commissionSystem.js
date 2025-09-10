import prisma from './prisma';

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

    console.log(`Added ${points} points to ${user.username}`);
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

  console.log(`Added ${directCommission} direct commission to ${referrer.username}`);
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
    
    // Skip Consultant and Ambassador ranks (they don't get indirect commission)
    if (currentRank === 'Consultant' || currentRank === 'Ambassador' || 
        currentRank === 'Sapphire Ambassador' || currentRank === 'Royal Ambassador' || 
        currentRank === 'Global Ambassador') {
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
      if (upperRank && !processedRanks.has(upperRank)) {
        const upperRankMembers = membersByRank[upperRank] || [];
        if (upperRankMembers.length > 0) {
          const firstUpperMember = upperRankMembers[0];
          // Combined commission: current rank's indirect + upper rank's own indirect
          const combinedCommission = indirectCommission * 2;
          await giveIndirectCommission(firstUpperMember, combinedCommission, packageRequestId, `${upperRank} (combined - includes ${currentRank})`);
          processedRanks.add(upperRank);
          console.log(`Gave ${combinedCommission} combined indirect commission to ${upperRank}: ${firstUpperMember.username} (includes ${currentRank} commission)`);
        }
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
  let currentUsername = directReferrerUsername; // Start from direct referrer
  const processedUsers = new Set();

  // Skip the direct referrer and go up the tree from their referrer
  currentUsername = directReferrerUsername;

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

    // Skip the direct referrer - they only get direct commission
    if (currentUsername === directReferrerUsername) {
      currentUsername = user.referredBy;
      continue;
    }

    members.push(user);
    processedUsers.add(user.id);
    currentUsername = user.referredBy;
  }

  return members;
}

/**
 * Find the upper rank in the hierarchy
 */
function findUpperRank(currentRank, rankHierarchy) {
  const currentIndex = rankHierarchy.indexOf(currentRank);
  if (currentIndex < rankHierarchy.length - 1) {
    return rankHierarchy[currentIndex + 1];
  }
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

    // Update user's package
    await prisma.user.update({
      where: { id: user.id },
      data: {
        currentPackageId: packageData.id,
        packageExpiryDate: packageExpiryDate,
        packageId: packageData.id,
        rankId: packageData.rankId
      }
    });

    console.log(`Updated user ${user.username} with package ${packageData.package_name}`);
    return { success: true };

  } catch (error) {
    console.error('Error updating user package and rank:', error);
    throw error;
  }
}
