import prisma from './prisma';

// Rank point thresholds
const RANK_THRESHOLDS = {
  'Consultant': { min: 0, max: 999 },
  'Manager': { min: 1000, max: 1999 },
  'Sapphire Manager': { min: 2000, max: 7999 },
  'Diamond': { min: 8000, max: 23999 },
  'Sapphire Diamond': { min: 24000, max: Infinity }
};

// Get rank by points
export function getRankByPoints(points) {
  for (const [rankName, threshold] of Object.entries(RANK_THRESHOLDS)) {
    if (points >= threshold.min && points <= threshold.max) {
      return rankName;
    }
  }
  return 'Consultant'; // Default rank
}

// Get or create rank
export async function getOrCreateRank(rankName) {
  let rank = await prisma.rank.findFirst({
    where: { title: rankName }
  });

  if (!rank) {
    const points = RANK_THRESHOLDS[rankName]?.min || 0;
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

// Update user rank based on points
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

  const newRankName = getRankByPoints(user.points);
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
export async function distributeCommissions(referralTree, packageData) {
  const { package_direct_commission, package_indirect_commission, package_points } = packageData;
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
    let pointsToAdd = package_points || 0; // ALL members get points (MLM style)

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

// Main package approval function
export async function approvePackageRequest(packageRequestId) {
  try {
    console.log(`🚀 Starting package approval for request ${packageRequestId}`);

    // Get package request with all related data
    const packageRequest = await prisma.packageRequest.findUnique({
      where: { id: parseInt(packageRequestId) },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullname: true,
            referredBy: true,
            points: true,
            balance: true,
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
            package_points: true
          }
        }
      }
    });

    if (!packageRequest) {
      throw new Error('Package request not found');
    }

    if (packageRequest.status !== 'pending') {
      throw new Error('Package request is not pending');
    }

    const { user, package: packageData } = packageRequest;
    console.log(`📦 Approving package: ${packageData.package_name} for user: ${user.username}`);

    // Step 1: Update user's package and points
    await prisma.user.update({
      where: { id: user.id },
      data: {
        currentPackageId: packageData.id,
        packageExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        points: (user.points || 0) + (packageData.package_points || 0)
      }
    });

    console.log(`✅ Updated user ${user.username} with package and ${packageData.package_points || 0} points`);

    // Step 2: Handle referral commissions if user has a referrer
    if (user.referredBy) {
      console.log(`🔗 User ${user.username} was referred by: ${user.referredBy}`);

      // Get the immediate referrer first
      const immediateReferrer = await prisma.user.findUnique({
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

      if (immediateReferrer) {
        // Give direct commission to immediate referrer (NO points here - points go to ALL in tree)
        const directCommission = parseFloat(packageData.package_direct_commission) || 0;
        
        await prisma.user.update({
          where: { id: immediateReferrer.id },
          data: {
            balance: parseFloat(immediateReferrer.balance) + directCommission
            // Note: Points will be added later in the tree distribution
          }
        });

        console.log(`💰 Direct commission to ${immediateReferrer.username}: +₨${directCommission} (points will be added in tree distribution)`);
      }

      // Get referral tree for indirect commissions and points distribution
      const referralTree = await getReferralTree(user.id);
      console.log(`🌳 Found ${referralTree.length} referrers in tree for indirect commissions and points`);

      if (referralTree.length > 0) {
        // Add immediate referrer to the tree for points distribution (MLM style)
        const fullTree = [immediateReferrer, ...referralTree];
        console.log(`🌳 Full tree for points distribution: ${fullTree.length} members`);
        
        // Distribute indirect commissions and points to ALL in tree
        const updates = await distributeCommissions(fullTree, packageData);
        
        // Execute all updates
        const results = await executeUpdates(updates);
        
        console.log(`💰 Commission and points distribution completed for ${results.length} referrers`);
      } else {
        // Even if no additional referrers, give points to immediate referrer
        if (immediateReferrer) {
          const pointsToAdd = packageData.package_points || 0;
          await prisma.user.update({
            where: { id: immediateReferrer.id },
            data: {
              points: (immediateReferrer.points || 0) + pointsToAdd
            }
          });
          await updateUserRank(immediateReferrer.id);
          console.log(`💰 Points to immediate referrer ${immediateReferrer.username}: +${pointsToAdd} points`);
        }
      }
    } else {
      console.log('ℹ️ User has no referrer, skipping commission distribution');
    }

    // Step 3: Update package request status
    await prisma.packageRequest.update({
      where: { id: parseInt(packageRequestId) },
      data: {
        status: 'approved',
        updatedAt: new Date()
      }
    });

    console.log(`✅ Package request ${packageRequestId} approved successfully`);

    return {
      success: true,
      message: 'Package approved successfully',
      user: user.username,
      package: packageData.package_name
    };

  } catch (error) {
    console.error('❌ Package approval failed:', error);
    throw error;
  }
}
