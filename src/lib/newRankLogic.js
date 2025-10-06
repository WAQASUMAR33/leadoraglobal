import prisma from './prisma.js';

/**
 * NEW RANK LOGIC IMPLEMENTATION
 * Based on tree-based downline requirements instead of direct referrals
 */

/**
 * Get all lines in the downline tree for a user
 * A line is a complete path from the user to any leaf node
 */
async function getAllDownlineLines(username, maxDepth = 10) {
  const lines = [];
  const visited = new Set();

  async function traverseLine(currentUser, currentLine, depth) {
    if (depth > maxDepth || visited.has(currentUser)) {
      return;
    }

    visited.add(currentUser);
    const newLine = [...currentLine, currentUser];

    // Get direct referrals of current user
    const referrals = await prisma.user.findMany({
      where: { referredBy: currentUser },
      include: { rank: true }
    });

    if (referrals.length === 0) {
      // This is a leaf node - we have a complete line
      lines.push(newLine);
    } else {
      // Continue traversing each referral
      for (const referral of referrals) {
        await traverseLine(referral.username, newLine, depth + 1);
      }
    }
  }

  await traverseLine(username, [], 0);
  return lines;
}

/**
 * Check if a line has at least one account with specified points or rank
 */
function lineMeetsCriteria(line, criteria) {
  if (criteria.minPoints) {
    return line.some(user => user.points >= criteria.minPoints);
  }
  
  if (criteria.rank) {
    return line.some(user => user.rank?.title === criteria.rank);
  }
  
  return false;
}

/**
 * Count lines that meet specific criteria
 */
function countLinesWithCriteria(lines, criteria) {
  return lines.filter(line => lineMeetsCriteria(line, criteria)).length;
}

/**
 * NEW DIAMOND RANK LOGIC
 * 1. 8000 points
 * 2. At least 3 lines with at least one account having 2000+ points
 */
async function checkDiamondRankRequirements(username, tx = prisma) {
  try {
    const user = await tx.user.findUnique({
      where: { username },
      include: { rank: true }
    });

    if (!user) {
      return { qualifies: false, reason: 'User not found' };
    }

    // Check points requirement
    if (user.points < 8000) {
      return { 
        qualifies: false, 
        reason: `Insufficient points: ${user.points}/${8000}` 
      };
    }

    // Get all downline lines
    const lines = await getAllDownlineLines(username);
    
    // Count lines with at least one account having 2000+ points
    const qualifyingLines = countLinesWithCriteria(lines, { minPoints: 2000 });
    
    const qualifies = qualifyingLines >= 3;
    
    return {
      qualifies,
      reason: qualifies ? 
        'Meets Diamond requirements' : 
        `Insufficient qualifying lines: ${qualifyingLines}/3 (need lines with 2000+ points)`,
      details: {
        points: user.points,
        requiredPoints: 8000,
        totalLines: lines.length,
        qualifyingLines,
        requiredLines: 3
      }
    };
  } catch (error) {
    console.error('Error checking Diamond rank requirements:', error);
    return { qualifies: false, reason: 'Error checking requirements' };
  }
}

/**
 * NEW SAPPHIRE DIAMOND RANK LOGIC
 * At least 3 lines with each line having at least one Diamond rank
 */
async function checkSapphireDiamondRankRequirements(username, tx = prisma) {
  try {
    // Get all downline lines
    const lines = await getAllDownlineLines(username);
    
    // Count lines with at least one Diamond rank
    const qualifyingLines = countLinesWithCriteria(lines, { rank: 'Diamond' });
    
    const qualifies = qualifyingLines >= 3;
    
    return {
      qualifies,
      reason: qualifies ? 
        'Meets Sapphire Diamond requirements' : 
        `Insufficient qualifying lines: ${qualifyingLines}/3 (need lines with Diamond rank)`,
      details: {
        totalLines: lines.length,
        qualifyingLines,
        requiredLines: 3
      }
    };
  } catch (error) {
    console.error('Error checking Sapphire Diamond rank requirements:', error);
    return { qualifies: false, reason: 'Error checking requirements' };
  }
}

/**
 * NEW AMBASSADOR RANK LOGIC
 * At least 6 lines with each line having at least one Diamond rank
 */
async function checkAmbassadorRankRequirements(username, tx = prisma) {
  try {
    // Get all downline lines
    const lines = await getAllDownlineLines(username);
    
    // Count lines with at least one Diamond rank
    const qualifyingLines = countLinesWithCriteria(lines, { rank: 'Diamond' });
    
    const qualifies = qualifyingLines >= 6;
    
    return {
      qualifies,
      reason: qualifies ? 
        'Meets Ambassador requirements' : 
        `Insufficient qualifying lines: ${qualifyingLines}/6 (need lines with Diamond rank)`,
      details: {
        totalLines: lines.length,
        qualifyingLines,
        requiredLines: 6
      }
    };
  } catch (error) {
    console.error('Error checking Ambassador rank requirements:', error);
    return { qualifies: false, reason: 'Error checking requirements' };
  }
}

/**
 * NEW SAPPHIRE AMBASSADOR RANK LOGIC
 * Option 1: At least 3 lines with each line having at least one Ambassador rank
 * Option 2: At least 10 lines with each line having at least one Diamond rank
 */
async function checkSapphireAmbassadorRankRequirements(username, tx = prisma) {
  try {
    // Get all downline lines
    const lines = await getAllDownlineLines(username);
    
    // Check Option 1: 3 lines with Ambassador rank
    const ambassadorLines = countLinesWithCriteria(lines, { rank: 'Ambassador' });
    const option1Qualifies = ambassadorLines >= 3;
    
    // Check Option 2: 10 lines with Diamond rank
    const diamondLines = countLinesWithCriteria(lines, { rank: 'Diamond' });
    const option2Qualifies = diamondLines >= 10;
    
    const qualifies = option1Qualifies || option2Qualifies;
    
    let reason;
    if (qualifies) {
      if (option1Qualifies && option2Qualifies) {
        reason = 'Meets Sapphire Ambassador requirements (both options)';
      } else if (option1Qualifies) {
        reason = 'Meets Sapphire Ambassador requirements (Option 1: 3 Ambassador lines)';
      } else {
        reason = 'Meets Sapphire Ambassador requirements (Option 2: 10 Diamond lines)';
      }
    } else {
      reason = `Does not meet requirements: ${ambassadorLines}/3 Ambassador lines OR ${diamondLines}/10 Diamond lines`;
    }
    
    return {
      qualifies,
      reason,
      details: {
        totalLines: lines.length,
        ambassadorLines,
        diamondLines,
        option1Qualifies,
        option2Qualifies,
        requiredAmbassadorLines: 3,
        requiredDiamondLines: 10
      }
    };
  } catch (error) {
    console.error('Error checking Sapphire Ambassador rank requirements:', error);
    return { qualifies: false, reason: 'Error checking requirements' };
  }
}

/**
 * NEW ROYAL AMBASSADOR RANK LOGIC
 * Option 1: At least 3 lines with each line having at least one Sapphire Ambassador rank
 * Option 2: At least 15 lines with each line having at least one Diamond rank
 */
async function checkRoyalAmbassadorRankRequirements(username, tx = prisma) {
  try {
    // Get all downline lines
    const lines = await getAllDownlineLines(username);
    
    // Check Option 1: 3 lines with Sapphire Ambassador rank
    const sapphireAmbassadorLines = countLinesWithCriteria(lines, { rank: 'Sapphire Ambassador' });
    const option1Qualifies = sapphireAmbassadorLines >= 3;
    
    // Check Option 2: 15 lines with Diamond rank
    const diamondLines = countLinesWithCriteria(lines, { rank: 'Diamond' });
    const option2Qualifies = diamondLines >= 15;
    
    const qualifies = option1Qualifies || option2Qualifies;
    
    let reason;
    if (qualifies) {
      if (option1Qualifies && option2Qualifies) {
        reason = 'Meets Royal Ambassador requirements (both options)';
      } else if (option1Qualifies) {
        reason = 'Meets Royal Ambassador requirements (Option 1: 3 Sapphire Ambassador lines)';
      } else {
        reason = 'Meets Royal Ambassador requirements (Option 2: 15 Diamond lines)';
      }
    } else {
      reason = `Does not meet requirements: ${sapphireAmbassadorLines}/3 Sapphire Ambassador lines OR ${diamondLines}/15 Diamond lines`;
    }
    
    return {
      qualifies,
      reason,
      details: {
        totalLines: lines.length,
        sapphireAmbassadorLines,
        diamondLines,
        option1Qualifies,
        option2Qualifies,
        requiredSapphireAmbassadorLines: 3,
        requiredDiamondLines: 15
      }
    };
  } catch (error) {
    console.error('Error checking Royal Ambassador rank requirements:', error);
    return { qualifies: false, reason: 'Error checking requirements' };
  }
}

/**
 * NEW GLOBAL AMBASSADOR RANK LOGIC
 * Option 1: At least 3 lines with each line having at least one Royal Ambassador rank
 * Option 2: At least 25 lines with each line having at least one Diamond rank
 */
async function checkGlobalAmbassadorRankRequirements(username, tx = prisma) {
  try {
    // Get all downline lines
    const lines = await getAllDownlineLines(username);
    
    // Check Option 1: 3 lines with Royal Ambassador rank
    const royalAmbassadorLines = countLinesWithCriteria(lines, { rank: 'Royal Ambassador' });
    const option1Qualifies = royalAmbassadorLines >= 3;
    
    // Check Option 2: 25 lines with Diamond rank
    const diamondLines = countLinesWithCriteria(lines, { rank: 'Diamond' });
    const option2Qualifies = diamondLines >= 25;
    
    const qualifies = option1Qualifies || option2Qualifies;
    
    let reason;
    if (qualifies) {
      if (option1Qualifies && option2Qualifies) {
        reason = 'Meets Global Ambassador requirements (both options)';
      } else if (option1Qualifies) {
        reason = 'Meets Global Ambassador requirements (Option 1: 3 Royal Ambassador lines)';
      } else {
        reason = 'Meets Global Ambassador requirements (Option 2: 25 Diamond lines)';
      }
    } else {
      reason = `Does not meet requirements: ${royalAmbassadorLines}/3 Royal Ambassador lines OR ${diamondLines}/25 Diamond lines`;
    }
    
    return {
      qualifies,
      reason,
      details: {
        totalLines: lines.length,
        royalAmbassadorLines,
        diamondLines,
        option1Qualifies,
        option2Qualifies,
        requiredRoyalAmbassadorLines: 3,
        requiredDiamondLines: 25
      }
    };
  } catch (error) {
    console.error('Error checking Global Ambassador rank requirements:', error);
    return { qualifies: false, reason: 'Error checking requirements' };
  }
}

/**
 * NEW HONORY SHARE HOLDER RANK LOGIC
 * Option 1: At least 3 lines with each line having at least one Global Ambassador rank
 * Option 2: At least 50 lines with Diamond rank AND at least 10 lines with Royal Ambassador rank
 */
async function checkHonoryShareHolderRankRequirements(username, tx = prisma) {
  try {
    // Get all downline lines
    const lines = await getAllDownlineLines(username);
    
    // Check Option 1: 3 lines with Global Ambassador rank
    const globalAmbassadorLines = countLinesWithCriteria(lines, { rank: 'Global Ambassador' });
    const option1Qualifies = globalAmbassadorLines >= 3;
    
    // Check Option 2: 50 lines with Diamond rank AND 10 lines with Royal Ambassador rank
    const diamondLines = countLinesWithCriteria(lines, { rank: 'Diamond' });
    const royalAmbassadorLines = countLinesWithCriteria(lines, { rank: 'Royal Ambassador' });
    const option2Qualifies = diamondLines >= 50 && royalAmbassadorLines >= 10;
    
    const qualifies = option1Qualifies || option2Qualifies;
    
    let reason;
    if (qualifies) {
      if (option1Qualifies && option2Qualifies) {
        reason = 'Meets Honory Share Holder requirements (both options)';
      } else if (option1Qualifies) {
        reason = 'Meets Honory Share Holder requirements (Option 1: 3 Global Ambassador lines)';
      } else {
        reason = 'Meets Honory Share Holder requirements (Option 2: 50 Diamond lines + 10 Royal Ambassador lines)';
      }
    } else {
      reason = `Does not meet requirements: ${globalAmbassadorLines}/3 Global Ambassador lines OR (${diamondLines}/50 Diamond lines AND ${royalAmbassadorLines}/10 Royal Ambassador lines)`;
    }
    
    return {
      qualifies,
      reason,
      details: {
        totalLines: lines.length,
        globalAmbassadorLines,
        diamondLines,
        royalAmbassadorLines,
        option1Qualifies,
        option2Qualifies,
        requiredGlobalAmbassadorLines: 3,
        requiredDiamondLines: 50,
        requiredRoyalAmbassadorLines: 10
      }
    };
  } catch (error) {
    console.error('Error checking Honory Share Holder rank requirements:', error);
    return { qualifies: false, reason: 'Error checking requirements' };
  }
}

/**
 * Main function to check rank requirements using new logic
 */
export async function checkNewRankRequirements(username, rankTitle, tx = prisma) {
  console.log(`🔍 Checking new rank requirements for ${username} -> ${rankTitle}`);
  
  switch (rankTitle) {
    case 'Diamond':
      return await checkDiamondRankRequirements(username, tx);
    
    case 'Sapphire Diamond':
      return await checkSapphireDiamondRankRequirements(username, tx);
    
    case 'Ambassador':
      return await checkAmbassadorRankRequirements(username, tx);
    
    case 'Sapphire Ambassador':
      return await checkSapphireAmbassadorRankRequirements(username, tx);
    
    case 'Royal Ambassador':
      return await checkRoyalAmbassadorRankRequirements(username, tx);
    
    case 'Global Ambassador':
      return await checkGlobalAmbassadorRankRequirements(username, tx);
    
    case 'Honory Share Holder':
      return await checkHonoryShareHolderRankRequirements(username, tx);
    
    default:
      return { qualifies: true, reason: 'No special requirements for this rank' };
  }
}

/**
 * Get user's highest qualifying rank using new logic
 */
export async function getUserHighestQualifyingRank(username, tx = prisma) {
  try {
    const user = await tx.user.findUnique({
      where: { username },
      include: { rank: true }
    });

    if (!user) {
      return { rank: null, reason: 'User not found' };
    }

    // Get all ranks ordered by points
    const allRanks = await tx.rank.findMany({
      orderBy: { required_points: 'asc' }
    });

    // Check each rank starting from highest
    for (let i = allRanks.length - 1; i >= 0; i--) {
      const rank = allRanks[i];
      
      // Skip basic ranks that only need points
      if (!['Diamond', 'Sapphire Diamond', 'Ambassador', 'Sapphire Ambassador', 'Royal Ambassador', 'Global Ambassador', 'Honory Share Holder'].includes(rank.title)) {
        if (user.points >= rank.required_points) {
          return { 
            rank: rank.title, 
            reason: `Meets ${rank.title} requirements (${user.points}/${rank.required_points} points)` 
          };
        }
        continue;
      }

      // Check higher ranks with new logic
      const result = await checkNewRankRequirements(username, rank.title, tx);
      
      if (result.qualifies) {
        // Also check if user has enough points for this rank
        if (user.points >= rank.required_points) {
          return { 
            rank: rank.title, 
            reason: result.reason,
            details: result.details
          };
        }
      }
    }

    // If no higher rank qualifies, check basic ranks
    for (const rank of allRanks) {
      if (['Consultant', 'Manager', 'Sapphire Manager'].includes(rank.title)) {
        if (user.points >= rank.required_points) {
          return { 
            rank: rank.title, 
            reason: `Meets ${rank.title} requirements (${user.points}/${rank.required_points} points)` 
          };
        }
      }
    }

    return { 
      rank: 'Consultant', 
      reason: 'Default rank - no other qualifications met' 
    };

  } catch (error) {
    console.error('Error getting user highest qualifying rank:', error);
    return { rank: null, reason: 'Error checking rank qualifications' };
  }
}

export {
  getAllDownlineLines,
  checkDiamondRankRequirements,
  checkSapphireDiamondRankRequirements,
  checkAmbassadorRankRequirements,
  checkSapphireAmbassadorRankRequirements,
  checkRoyalAmbassadorRankRequirements,
  checkGlobalAmbassadorRankRequirements,
  checkHonoryShareHolderRankRequirements
};
