import prisma from './prisma.js';
import { calculateMLMCommissionsInTransaction, updateUserPackageAndRankInTransaction } from './commissionSystem.js';

// Rank conditions will be loaded from database
let RANK_CONDITIONS = {};

// Load rank conditions from database
async function loadRankConditions() {
  try {
    const ranks = await prisma.rank.findMany({
      select: {
        title: true,
        required_points: true
      }
    });

    RANK_CONDITIONS = {};
    ranks.forEach(rank => {
      RANK_CONDITIONS[rank.title] = {
        minPoints: rank.required_points
      };
    });

    console.log('✅ Loaded rank conditions:', RANK_CONDITIONS);
  } catch (error) {
    console.error('❌ Error loading rank conditions:', error);
    // Fallback to default conditions
    RANK_CONDITIONS = {
      'Consultant': { minPoints: 0 },
      'Manager': { minPoints: 1000 },
      'Sapphire Manager': { minPoints: 5000 },
      'Diamond': { minPoints: 10000 },
      'Sapphire Diamond': { minPoints: 20000 }
    };
  }
}

// Get rank based on points
function getRankByPoints(points) {
  const sortedRanks = Object.entries(RANK_CONDITIONS)
    .sort(([,a], [,b]) => b.minPoints - a.minPoints);

  for (const [rankName, condition] of sortedRanks) {
    if (points >= condition.minPoints) {
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

  if (!user) {
    return [];
  }

  const eligibleRanks = [];
  const sortedRanks = Object.entries(RANK_CONDITIONS)
    .sort(([,a], [,b]) => a.minPoints - b.minPoints);

  for (const [rankName, condition] of sortedRanks) {
    if (user.points >= condition.minPoints) {
      eligibleRanks.push({
        title: rankName,
        requiredPoints: condition.minPoints,
        eligible: true
      });
    }
  }

  return eligibleRanks;
}

// Get the highest eligible rank for a user
export async function getHighestEligibleRank(userId) {
  const eligibleRanks = await getEligibleRanks(userId);
  
  if (eligibleRanks.length === 0) {
    return null;
  }

  return eligibleRanks[eligibleRanks.length - 1];
}

// Check if user meets downline conditions for a rank
async function checkDownlineCondition(userId, downlineCondition) {
  if (!downlineCondition) return true;

  const downlineUsers = await getDownlineUsers(userId);
  
  if (downlineCondition.type === 'direct_trees_with_rank') {
    return await checkDirectTreesWithRank(userId, downlineCondition.count, downlineCondition.rank);
  } else if (downlineCondition.type === 'trees_with_rank') {
    return await checkTreesWithRank(userId, downlineCondition.count, downlineCondition.rank);
  } else if (downlineCondition.type === 'trees_with_count_of_rank') {
    return await checkTreesWithRank(userId, downlineCondition.treeCount, downlineCondition.rank, downlineCondition.userCount);
  }

  return true;
}

// Check single downline condition
async function checkSingleDownlineCondition(userId, condition) {
  if (!condition) return true;

  if (condition.type === 'direct_trees_with_rank') {
    return await checkDirectTreesWithRank(userId, condition.count, condition.rank);
  } else if (condition.type === 'trees_with_rank') {
    return await checkTreesWithRank(userId, condition.count, condition.rank);
  } else if (condition.type === 'trees_with_count_of_rank') {
    return await checkTreesWithRank(userId, condition.treeCount, condition.rank, condition.userCount);
  }

  return true;
}

// Check direct trees with specific rank
async function checkDirectTreesWithRank(userId, requiredCount, requiredRank) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true }
  });

  if (!user) return false;

  const directReferrals = await prisma.user.findMany({
    where: { referredBy: user.username },
    select: {
      id: true,
      username: true,
      rank: {
        select: { title: true }
      }
    }
  });

  let treesWithRank = 0;
  for (const referral of directReferrals) {
    if (referral.rank?.title === requiredRank) {
      treesWithRank++;
    }
  }

  return treesWithRank >= requiredCount;
}

// Check trees with specific rank (recursive)
async function checkTreesWithRank(userId, requiredCount, requiredRank) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true }
  });

  if (!user) return false;

  const allReferrals = await getAllReferralsRecursive(user.username);
  const usersWithRank = allReferrals.filter(u => u.rank?.title === requiredRank);
  
  return usersWithRank.length >= requiredCount;
}

// Check trees with count of specific rank
async function checkTreesWithCountOfRank(userId, requiredTreeCount, requiredRank, requiredUserCount) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true }
  });

  if (!user) return false;

  const directReferrals = await prisma.user.findMany({
    where: { referredBy: user.username },
    select: { username: true }
  });

  let treesMeetingCondition = 0;
  for (const referral of directReferrals) {
    const treeUsers = await getAllReferralsRecursive(referral.username);
    const usersWithRank = treeUsers.filter(u => u.rank?.title === requiredRank);
    
    if (usersWithRank.length >= requiredUserCount) {
      treesMeetingCondition++;
    }
  }

  return treesMeetingCondition >= requiredTreeCount;
}

// Get all referrals recursively
async function getAllReferralsRecursive(username) {
  const allUsers = [];
  const visited = new Set();

  function findDownline(currentUsername) {
    if (visited.has(currentUsername)) return;
    visited.add(currentUsername);

    return prisma.user.findMany({
      where: { referredBy: currentUsername },
      select: {
        id: true,
        username: true,
        rank: {
          select: { title: true }
        }
      }
    }).then(referrals => {
      allUsers.push(...referrals);
      return Promise.all(referrals.map(r => findDownline(r.username)));
    });
  }

  await findDownline(username);
  return allUsers;
}

// Get downline users
async function getDownlineUsers(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true }
  });

  if (!user) return [];

  return await getAllReferralsRecursive(user.username);
}

// Get tree root (main user)
async function getTreeRoot(userId, mainUserUsername) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      fullname: true,
      points: true,
      balance: true,
      rank: {
        select: { title: true }
      }
    }
  });

  return user;
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

// Get referral tree (upward)
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

// Main package approval function using new MLM commission system
export async function approvePackageRequest(packageRequestId) {
    const requestId = parseInt(packageRequestId);
    console.log(`🚀 Starting package approval for request ${requestId}`);

  try {
    // Load rank conditions first
    await loadRankConditions();

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
            shoppingAmount: true,
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
    console.log(`📦 Approving package: ${packageData.package_name} (₦${packageData.package_amount}) for user: ${user.username}`);

    // Check if this is a renewal or upgrade
    if (user.currentPackageId === packageData.id) {
      console.log(`🔄 This is a package renewal for user ${user.username}`);
    } else if (user.currentPackageId && user.currentPackageId !== packageData.id) {
      console.log(`⬆️ This is a package upgrade for user ${user.username}`);
    } else {
      console.log(`🆕 This is a new package assignment for user ${user.username}`);
    }

    // Check if payment is from shopping amount
    const isShoppingAmountPayment = packageRequest.transactionReceipt === 'Paid from shopping amount';
    
    // If paid from shopping amount, verify user has sufficient shopping amount
    if (isShoppingAmountPayment) {
      const packageAmount = parseFloat(packageData.package_amount);
      const currentShoppingAmount = parseFloat(user.shoppingAmount || 0);
      
      if (currentShoppingAmount < packageAmount) {
        throw new Error(`Insufficient shopping amount. Required: PKR ${packageAmount}, Available: PKR ${currentShoppingAmount}`);
      }
    }

    // Use database transaction to ensure all operations succeed or fail together
    // Increase timeout to 60 seconds for complex MLM calculations
    let result;
    try {
      result = await prisma.$transaction(async (tx) => {
        // Step 0: Deduct shopping amount if payment is from shopping amount
        if (isShoppingAmountPayment) {
          const packageAmount = parseFloat(packageData.package_amount);
          const currentShoppingAmount = parseFloat(user.shoppingAmount || 0);
          const newShoppingAmount = currentShoppingAmount - packageAmount;
          
          console.log(`💳 Step 0: Deducting shopping amount. Current: PKR ${currentShoppingAmount}, Deducting: PKR ${packageAmount}, New: PKR ${newShoppingAmount}`);
          
          await tx.user.update({
            where: { id: user.id },
            data: {
              shoppingAmount: newShoppingAmount,
              updatedAt: new Date()
            }
          });
          console.log(`✅ Deducted PKR ${packageAmount} from shopping amount for user ${user.username}`);
        }

        // Step 1: Update user's package and rank
        console.log(`📝 Step 1: Updating user package and rank...`);
        await updateUserPackageAndRankInTransaction(requestId, tx);
        console.log(`✅ Updated user ${user.username} with package and rank`);

        // Step 2: Calculate and distribute MLM commissions
        console.log(`💰 Step 2: Distributing MLM commissions...`);
        await calculateMLMCommissionsInTransaction(requestId, tx);
        console.log(`✅ MLM commissions distributed successfully`);

        // Step 3: Update package request status
        console.log(`📋 Step 3: Updating package request status...`);
        await tx.packageRequest.update({
          where: { id: requestId },
          data: {
            status: 'approved',
            updatedAt: new Date()
          }
        });
        console.log(`✅ Package request status updated to approved`);

        return {
          success: true,
          message: 'Package approved successfully with MLM commission distribution',
          user: user.username,
          package: packageData.package_name,
          packageAmount: packageData.package_amount,
          packagePoints: packageData.package_points,
          isRenewal: user.currentPackageId === packageData.id,
          isUpgrade: user.currentPackageId && user.currentPackageId !== packageData.id,
          shoppingAmountDeducted: isShoppingAmountPayment ? parseFloat(packageData.package_amount) : null
        };
      }, { 
        timeout: 300000, // 300 second (5 minute) timeout for complex MLM calculations
        maxWait: 30000, // 30 second max wait for transaction to start
        isolationLevel: 'ReadCommitted' // Use ReadCommitted isolation level for better performance
      });
    } catch (transactionError) {
      console.error('❌ Transaction failed, attempting fallback approach:', transactionError);
      
      // Fallback: Try to complete the operation without transaction
      console.log(`🔄 Attempting fallback approach for user ${user.username}...`);
      
      try {
        // Step 0: Deduct shopping amount if payment is from shopping amount (fallback)
        if (isShoppingAmountPayment) {
          const packageAmount = parseFloat(packageData.package_amount);
          const currentShoppingAmount = parseFloat(user.shoppingAmount || 0);
          const newShoppingAmount = currentShoppingAmount - packageAmount;
          
          console.log(`💳 Fallback Step 0: Deducting shopping amount. Current: PKR ${currentShoppingAmount}, Deducting: PKR ${packageAmount}, New: PKR ${newShoppingAmount}`);
          
          await prisma.user.update({
            where: { id: user.id },
            data: {
              shoppingAmount: newShoppingAmount,
              updatedAt: new Date()
            }
          });
          console.log(`✅ Fallback: Deducted PKR ${packageAmount} from shopping amount for user ${user.username}`);
        }

        // Step 1: Update user's package and rank (without transaction)
        console.log(`📝 Fallback Step 1: Updating user package and rank...`);
        await updateUserPackageAndRank(requestId);
        console.log(`✅ Fallback: Updated user ${user.username} with package and rank`);

        // Step 2: Calculate and distribute MLM commissions (without transaction)
        console.log(`💰 Fallback Step 2: Distributing MLM commissions...`);
        await calculateMLMCommissions(requestId);
        console.log(`✅ Fallback: MLM commissions distributed successfully`);

        // Step 3: Update package request status
        console.log(`📋 Fallback Step 3: Updating package request status...`);
        await prisma.packageRequest.update({
          where: { id: requestId },
          data: {
            status: 'approved',
            updatedAt: new Date()
          }
        });
        console.log(`✅ Fallback: Package request status updated to approved`);

        result = {
          success: true,
          message: 'Package approved successfully with MLM commission distribution (fallback method)',
          user: user.username,
          package: packageData.package_name,
          packageAmount: packageData.package_amount,
          packagePoints: packageData.package_points,
          isRenewal: user.currentPackageId === packageData.id,
          isUpgrade: user.currentPackageId && user.currentPackageId !== packageData.id,
          fallback: true,
          shoppingAmountDeducted: isShoppingAmountPayment ? parseFloat(packageData.package_amount) : null
        };
      } catch (fallbackError) {
        console.error('❌ Fallback approach also failed:', fallbackError);
        throw new Error(`Both transaction and fallback approaches failed. Transaction error: ${transactionError.message}. Fallback error: ${fallbackError.message}`);
      }
    }

    console.log(`🎉 Package request ${packageRequestId} approved successfully`);
    return result;

  } catch (error) {
    console.error('❌ Package approval failed:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      meta: error.meta,
      stack: error.stack
    });
    
    // Try to update package request status to failed if possible
    try {
      await prisma.packageRequest.update({
        where: { id: requestId },
        data: {
          status: 'failed',
          adminNotes: `Approval failed: ${error.message}`,
          updatedAt: new Date()
        }
      });
      console.log(`✅ Updated package request ${requestId} status to failed`);
    } catch (updateError) {
      console.error('❌ Failed to update package request status to failed:', updateError);
    }
    
    // Re-throw with more context
    const enhancedError = new Error(`Package approval failed for request ${requestId}: ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.requestId = requestId;
    throw enhancedError;
  }
}

// All functions are already exported above with export async function declarations
