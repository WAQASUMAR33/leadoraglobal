import prisma from './prisma.js';

// Optimized version of rank logic that uses fewer database queries
// This version focuses on direct referrals and immediate downlines to avoid deep recursion

// Helper function to get direct referrals with their ranks
async function getDirectReferralsWithRanks(username, tx = prisma) {
  return await tx.user.findMany({
    where: { referredBy: username },
    select: {
      id: true,
      username: true,
      points: true,
      rank: {
        select: {
          title: true
        }
      }
    }
  });
}

// Optimized Diamond rank check - only check direct referrals for 2000+ points
async function checkDiamondRankRequirementsOptimized(username, tx = prisma) {
  const user = await tx.user.findUnique({ 
    where: { username }, 
    select: { points: true } 
  });
  
  if (!user || user.points < 8000) {
    return { qualifies: false, reason: `Insufficient points: ${user?.points || 0}/8000` };
  }

  const directReferrals = await getDirectReferralsWithRanks(username, tx);
  const requiredLines = 3;
  const minPointsInLine = 2000;
  
  // Count direct referrals with 2000+ points (simplified check)
  let qualifyingLines = 0;
  for (const referral of directReferrals) {
    if (referral.points >= minPointsInLine) {
      qualifyingLines++;
    }
  }

  if (qualifyingLines >= requiredLines) {
    return { 
      qualifies: true, 
      reason: `Met points and ${qualifyingLines}/${requiredLines} direct lines with ${minPointsInLine}+ points`,
      details: { 
        points: user.points, 
        requiredPoints: 8000, 
        totalLines: directReferrals.length, 
        qualifyingLines, 
        requiredLines 
      } 
    };
  } else {
    return { 
      qualifies: false, 
      reason: `Insufficient qualifying lines: ${qualifyingLines}/${requiredLines} (need direct lines with ${minPointsInLine}+ points)`,
      details: { 
        points: user.points, 
        requiredPoints: 8000, 
        totalLines: directReferrals.length, 
        qualifyingLines, 
        requiredLines 
      } 
    };
  }
}

// Optimized Sapphire Diamond check - only check direct referrals for Diamond rank
async function checkSapphireDiamondRankRequirementsOptimized(username, tx = prisma) {
  const user = await tx.user.findUnique({ 
    where: { username }, 
    select: { points: true } 
  });
  
  if (!user) {
    return { qualifies: false, reason: 'User not found' };
  }

  const directReferrals = await getDirectReferralsWithRanks(username, tx);
  const requiredLines = 3;
  
  // Count direct referrals with Diamond rank
  let qualifyingLines = 0;
  for (const referral of directReferrals) {
    if (referral.rank?.title === 'Diamond') {
      qualifyingLines++;
    }
  }

  if (qualifyingLines >= requiredLines) {
    return { 
      qualifies: true, 
      reason: `Met downline requirement: ${qualifyingLines}/${requiredLines} direct lines with Diamond rank`,
      details: { 
        points: user.points, 
        totalLines: directReferrals.length, 
        qualifyingLines, 
        requiredLines 
      } 
    };
  } else {
    return { 
      qualifies: false, 
      reason: `Insufficient qualifying lines: ${qualifyingLines}/${requiredLines} (need direct lines with Diamond rank)`,
      details: { 
        points: user.points, 
        totalLines: directReferrals.length, 
        qualifyingLines, 
        requiredLines 
      } 
    };
  }
}

// Optimized Ambassador check - only check direct referrals for Diamond rank
async function checkAmbassadorRankRequirementsOptimized(username, tx = prisma) {
  const user = await tx.user.findUnique({ 
    where: { username }, 
    select: { points: true } 
  });
  
  if (!user) {
    return { qualifies: false, reason: 'User not found' };
  }

  const directReferrals = await getDirectReferralsWithRanks(username, tx);
  const requiredLines = 6;
  
  // Count direct referrals with Diamond rank
  let qualifyingLines = 0;
  for (const referral of directReferrals) {
    if (referral.rank?.title === 'Diamond') {
      qualifyingLines++;
    }
  }

  if (qualifyingLines >= requiredLines) {
    return { 
      qualifies: true, 
      reason: `Met downline requirement: ${qualifyingLines}/${requiredLines} direct lines with Diamond rank`,
      details: { 
        points: user.points, 
        totalLines: directReferrals.length, 
        qualifyingLines, 
        requiredLines 
      } 
    };
  } else {
    return { 
      qualifies: false, 
      reason: `Insufficient qualifying lines: ${qualifyingLines}/${requiredLines} (need direct lines with Diamond rank)`,
      details: { 
        points: user.points, 
        totalLines: directReferrals.length, 
        qualifyingLines, 
        requiredLines 
      } 
    };
  }
}

// Optimized Sapphire Ambassador check - check direct referrals for Ambassador or Diamond rank
async function checkSapphireAmbassadorRankRequirementsOptimized(username, tx = prisma) {
  const user = await tx.user.findUnique({ 
    where: { username }, 
    select: { points: true } 
  });
  
  if (!user) {
    return { qualifies: false, reason: 'User not found' };
  }

  const directReferrals = await getDirectReferralsWithRanks(username, tx);
  
  // Option 1: 3 lines with Ambassador rank
  let option1Qualifies = false;
  const requiredLinesOption1 = 3;
  let qualifyingLinesOption1 = 0;
  for (const referral of directReferrals) {
    if (referral.rank?.title === 'Ambassador') {
      qualifyingLinesOption1++;
    }
  }
  if (qualifyingLinesOption1 >= requiredLinesOption1) {
    option1Qualifies = true;
  }

  // Option 2: 10 lines with Diamond rank
  let option2Qualifies = false;
  const requiredLinesOption2 = 10;
  let qualifyingLinesOption2 = 0;
  for (const referral of directReferrals) {
    if (referral.rank?.title === 'Diamond') {
      qualifyingLinesOption2++;
    }
  }
  if (qualifyingLinesOption2 >= requiredLinesOption2) {
    option2Qualifies = true;
  }

  if (option1Qualifies || option2Qualifies) {
    return { 
      qualifies: true, 
      reason: `Met downline requirement: (Option 1: ${qualifyingLinesOption1}/${requiredLinesOption1} direct lines with Ambassador OR Option 2: ${qualifyingLinesOption2}/${requiredLinesOption2} direct lines with Diamond)`,
      details: { 
        points: user.points, 
        totalLines: directReferrals.length, 
        qualifyingLinesOption1, 
        requiredLinesOption1, 
        qualifyingLinesOption2, 
        requiredLinesOption2 
      } 
    };
  } else {
    return { 
      qualifies: false, 
      reason: `Insufficient qualifying lines for both options`,
      details: { 
        points: user.points, 
        totalLines: directReferrals.length, 
        qualifyingLinesOption1, 
        requiredLinesOption1, 
        qualifyingLinesOption2, 
        requiredLinesOption2 
      } 
    };
  }
}

// Optimized Royal Ambassador check
async function checkRoyalAmbassadorRankRequirementsOptimized(username, tx = prisma) {
  const user = await tx.user.findUnique({ 
    where: { username }, 
    select: { points: true } 
  });
  
  if (!user) {
    return { qualifies: false, reason: 'User not found' };
  }

  const directReferrals = await getDirectReferralsWithRanks(username, tx);
  
  // Option 1: 3 lines with Sapphire Ambassador rank
  let option1Qualifies = false;
  const requiredLinesOption1 = 3;
  let qualifyingLinesOption1 = 0;
  for (const referral of directReferrals) {
    if (referral.rank?.title === 'Sapphire Ambassador') {
      qualifyingLinesOption1++;
    }
  }
  if (qualifyingLinesOption1 >= requiredLinesOption1) {
    option1Qualifies = true;
  }

  // Option 2: 15 lines with Diamond rank
  let option2Qualifies = false;
  const requiredLinesOption2 = 15;
  let qualifyingLinesOption2 = 0;
  for (const referral of directReferrals) {
    if (referral.rank?.title === 'Diamond') {
      qualifyingLinesOption2++;
    }
  }
  if (qualifyingLinesOption2 >= requiredLinesOption2) {
    option2Qualifies = true;
  }

  if (option1Qualifies || option2Qualifies) {
    return { 
      qualifies: true, 
      reason: `Met downline requirement: (Option 1: ${qualifyingLinesOption1}/${requiredLinesOption1} direct lines with Sapphire Ambassador OR Option 2: ${qualifyingLinesOption2}/${requiredLinesOption2} direct lines with Diamond)`,
      details: { 
        points: user.points, 
        totalLines: directReferrals.length, 
        qualifyingLinesOption1, 
        requiredLinesOption1, 
        qualifyingLinesOption2, 
        requiredLinesOption2 
      } 
    };
  } else {
    return { 
      qualifies: false, 
      reason: `Insufficient qualifying lines for both options`,
      details: { 
        points: user.points, 
        totalLines: directReferrals.length, 
        qualifyingLinesOption1, 
        requiredLinesOption1, 
        qualifyingLinesOption2, 
        requiredLinesOption2 
      } 
    };
  }
}

// Optimized Global Ambassador check
async function checkGlobalAmbassadorRankRequirementsOptimized(username, tx = prisma) {
  const user = await tx.user.findUnique({ 
    where: { username }, 
    select: { points: true } 
  });
  
  if (!user) {
    return { qualifies: false, reason: 'User not found' };
  }

  const directReferrals = await getDirectReferralsWithRanks(username, tx);
  
  // Option 1: 3 lines with Royal Ambassador rank
  let option1Qualifies = false;
  const requiredLinesOption1 = 3;
  let qualifyingLinesOption1 = 0;
  for (const referral of directReferrals) {
    if (referral.rank?.title === 'Royal Ambassador') {
      qualifyingLinesOption1++;
    }
  }
  if (qualifyingLinesOption1 >= requiredLinesOption1) {
    option1Qualifies = true;
  }

  // Option 2: 25 lines with Diamond rank
  let option2Qualifies = false;
  const requiredLinesOption2 = 25;
  let qualifyingLinesOption2 = 0;
  for (const referral of directReferrals) {
    if (referral.rank?.title === 'Diamond') {
      qualifyingLinesOption2++;
    }
  }
  if (qualifyingLinesOption2 >= requiredLinesOption2) {
    option2Qualifies = true;
  }

  if (option1Qualifies || option2Qualifies) {
    return { 
      qualifies: true, 
      reason: `Met downline requirement: (Option 1: ${qualifyingLinesOption1}/${requiredLinesOption1} direct lines with Royal Ambassador OR Option 2: ${qualifyingLinesOption2}/${requiredLinesOption2} direct lines with Diamond)`,
      details: { 
        points: user.points, 
        totalLines: directReferrals.length, 
        qualifyingLinesOption1, 
        requiredLinesOption1, 
        qualifyingLinesOption2, 
        requiredLinesOption2 
      } 
    };
  } else {
    return { 
      qualifies: false, 
      reason: `Insufficient qualifying lines for both options`,
      details: { 
        points: user.points, 
        totalLines: directReferrals.length, 
        qualifyingLinesOption1, 
        requiredLinesOption1, 
        qualifyingLinesOption2, 
        requiredLinesOption2 
      } 
    };
  }
}

// Optimized Honory Share Holder check
async function checkHonoryShareHolderRankRequirementsOptimized(username, tx = prisma) {
  const user = await tx.user.findUnique({ 
    where: { username }, 
    select: { points: true } 
  });
  
  if (!user) {
    return { qualifies: false, reason: 'User not found' };
  }

  const directReferrals = await getDirectReferralsWithRanks(username, tx);
  
  // Option 1: 3 lines with Global Ambassador rank
  let option1Qualifies = false;
  const requiredLinesOption1 = 3;
  let qualifyingLinesOption1 = 0;
  for (const referral of directReferrals) {
    if (referral.rank?.title === 'Global Ambassador') {
      qualifyingLinesOption1++;
    }
  }
  if (qualifyingLinesOption1 >= requiredLinesOption1) {
    option1Qualifies = true;
  }

  // Option 2: 50 lines with Diamond AND 10 lines with Royal Ambassador
  let option2Qualifies = false;
  const requiredLinesOption2Diamond = 50;
  const requiredLinesOption2RoyalAmbassador = 10;
  let qualifyingLinesOption2Diamond = 0;
  let qualifyingLinesOption2RoyalAmbassador = 0;

  for (const referral of directReferrals) {
    if (referral.rank?.title === 'Diamond') {
      qualifyingLinesOption2Diamond++;
    }
    if (referral.rank?.title === 'Royal Ambassador') {
      qualifyingLinesOption2RoyalAmbassador++;
    }
  }

  if (qualifyingLinesOption2Diamond >= requiredLinesOption2Diamond && qualifyingLinesOption2RoyalAmbassador >= requiredLinesOption2RoyalAmbassador) {
    option2Qualifies = true;
  }

  if (option1Qualifies || option2Qualifies) {
    return { 
      qualifies: true, 
      reason: `Met downline requirement: (Option 1: ${qualifyingLinesOption1}/${requiredLinesOption1} direct lines with Global Ambassador OR Option 2: ${qualifyingLinesOption2Diamond}/${requiredLinesOption2Diamond} direct lines with Diamond AND ${qualifyingLinesOption2RoyalAmbassador}/${requiredLinesOption2RoyalAmbassador} direct lines with Royal Ambassador)`,
      details: { 
        points: user.points, 
        totalLines: directReferrals.length, 
        qualifyingLinesOption1, 
        requiredLinesOption1, 
        qualifyingLinesOption2Diamond, 
        requiredLinesOption2Diamond, 
        qualifyingLinesOption2RoyalAmbassador, 
        requiredLinesOption2RoyalAmbassador 
      } 
    };
  } else {
    return { 
      qualifies: false, 
      reason: `Insufficient qualifying lines for both options`,
      details: { 
        points: user.points, 
        totalLines: directReferrals.length, 
        qualifyingLinesOption1, 
        requiredLinesOption1, 
        qualifyingLinesOption2Diamond, 
        requiredLinesOption2Diamond, 
        qualifyingLinesOption2RoyalAmbassador, 
        requiredLinesOption2RoyalAmbassador 
      } 
    };
  }
}

// Main function to check rank requirements based on rank title (OPTIMIZED VERSION)
export async function checkNewRankRequirementsOptimized(username, rankTitle, tx = prisma) {
  try {
    switch (rankTitle) {
      case 'Diamond':
        return await checkDiamondRankRequirementsOptimized(username, tx);
      case 'Sapphire Diamond':
        return await checkSapphireDiamondRankRequirementsOptimized(username, tx);
      case 'Ambassador':
        return await checkAmbassadorRankRequirementsOptimized(username, tx);
      case 'Sapphire Ambassador':
        return await checkSapphireAmbassadorRankRequirementsOptimized(username, tx);
      case 'Royal Ambassador':
        return await checkRoyalAmbassadorRankRequirementsOptimized(username, tx);
      case 'Global Ambassador':
        return await checkGlobalAmbassadorRankRequirementsOptimized(username, tx);
      case 'Honory Share Holder':
        return await checkHonoryShareHolderRankRequirementsOptimized(username, tx);
      default:
        return { qualifies: true, reason: 'No specific downline requirements for this rank' };
    }
  } catch (error) {
    console.error(`Error checking ${rankTitle} requirements for ${username}:`, error);
    return { qualifies: false, reason: `Error checking requirements: ${error.message}` };
  }
}

// Function to get the highest rank a user qualifies for based on optimized logic
export async function getUserHighestQualifyingRankOptimized(username, tx = prisma) {
  try {
    const user = await tx.user.findUnique({
      where: { username },
      select: { id: true, points: true }
    });

    if (!user) {
      return { rank: 'No Rank', reason: 'User not found' };
    }

    const ranks = await tx.rank.findMany({
      orderBy: { required_points: 'desc' }
    });

    for (const rank of ranks) {
      if (user.points >= rank.required_points) {
        if (['Diamond', 'Sapphire Diamond', 'Ambassador', 'Sapphire Ambassador', 'Royal Ambassador', 'Global Ambassador', 'Honory Share Holder'].includes(rank.title)) {
          const result = await checkNewRankRequirementsOptimized(username, rank.title, tx);
          if (result.qualifies) {
            return { rank: rank.title, reason: result.reason, details: result.details };
          }
        } else {
          return { rank: rank.title, reason: 'Met points requirement' };
        }
      }
    }
    return { rank: 'Consultant', reason: 'Default rank' };
  } catch (error) {
    console.error(`Error getting highest qualifying rank for ${username}:`, error);
    return { rank: 'No Rank', reason: `Error: ${error.message}` };
  }
}

