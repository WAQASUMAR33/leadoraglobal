import prisma from './prisma.js';
import { checkNewRankRequirementsOptimized } from './newRankLogicOptimized.js';

// Define higher ranks that require downline requirements (using NEW LOGIC)
const HIGHER_RANKS = [
  'Diamond',           // NEW: 8000 points + 3 lines with 2000+ points
  'Sapphire Diamond',  // NEW: 3 lines with Diamond rank
  'Ambassador',        // NEW: 6 lines with Diamond rank
  'Sapphire Ambassador', // NEW: 3 lines with Ambassador OR 10 lines with Diamond
  'Royal Ambassador',  // NEW: 3 lines with Sapphire Ambassador OR 15 lines with Diamond
  'Global Ambassador', // NEW: 3 lines with Royal Ambassador OR 25 lines with Diamond
  'Honory Share Holder' // NEW: 3 lines with Global Ambassador OR 50 lines with Diamond + 10 lines with Royal Ambassador
];

// Define downline requirements for higher ranks
const RANK_REQUIREMENTS = {
  'Sapphire Diamond': { requiredDirectDiamonds: 2, requiredDirectSapphireManagers: 1 },
  'Ambassador': { requiredDirectDiamonds: 3, requiredDirectSapphireDiamonds: 1 },
  'Sapphire Ambassador': { requiredDirectDiamonds: 5, requiredDirectSapphireDiamonds: 2 },
  'Royal Ambassador': { requiredDirectDiamonds: 8, requiredDirectSapphireDiamonds: 3 },
  'Global Ambassador': { requiredDirectDiamonds: 12, requiredDirectSapphireDiamonds: 5 },
  'Honory Share Holder': { requiredDirectDiamonds: 20, requiredDirectSapphireDiamonds: 8 }
};

// Check if a user meets downline requirements for higher ranks
async function checkDownlineRequirements(user, rankTitle) {
  try {
    const requirements = RANK_REQUIREMENTS[rankTitle];
    if (!requirements) {
      return true; // No special requirements for this rank
    }

    // Get all direct referrals of the user
    const directReferrals = await prisma.user.findMany({
      where: { referredBy: user.username },
      include: { rank: true }
    });

    let directDiamonds = 0;
    let directSapphireManagers = 0;
    let directSapphireDiamonds = 0;

    // Count direct referrals with required ranks
    directReferrals.forEach(referral => {
      if (referral.rank?.title === 'Diamond') {
        directDiamonds++;
      } else if (referral.rank?.title === 'Sapphire Manager') {
        directSapphireManagers++;
      } else if (referral.rank?.title === 'Sapphire Diamond') {
        directSapphireDiamonds++;
      }
    });

    // Check if requirements are met
    const meetsDiamondRequirement = directDiamonds >= (requirements.requiredDirectDiamonds || 0);
    const meetsSapphireManagerRequirement = directSapphireManagers >= (requirements.requiredDirectSapphireManagers || 0);
    const meetsSapphireDiamondRequirement = directSapphireDiamonds >= (requirements.requiredDirectSapphireDiamonds || 0);

    console.log(`🔍 Downline check for ${user.username} (${rankTitle}):`);
    console.log(`  Direct Diamonds: ${directDiamonds}/${requirements.requiredDirectDiamonds || 0}`);
    console.log(`  Direct Sapphire Managers: ${directSapphireManagers}/${requirements.requiredDirectSapphireManagers || 0}`);
    console.log(`  Direct Sapphire Diamonds: ${directSapphireDiamonds}/${requirements.requiredDirectSapphireDiamonds || 0}`);

    const meetsRequirements = meetsDiamondRequirement && meetsSapphireManagerRequirement && meetsSapphireDiamondRequirement;
    
    if (meetsRequirements) {
      console.log(`✅ ${user.username} meets ${rankTitle} downline requirements`);
    } else {
      console.log(`❌ ${user.username} does not meet ${rankTitle} downline requirements`);
    }

    return meetsRequirements;
  } catch (error) {
    console.error(`❌ Error checking downline requirements for ${user.username}:`, error);
    return false;
  }
}

// Enhanced rank calculation with downline requirements for higher ranks
export async function updateUserRank(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      console.log(`❌ User ${userId} not found for rank update`);
      return null;
    }

    // Get all ranks from database ordered by required points (descending)
    const ranks = await prisma.rank.findMany({
      orderBy: { required_points: 'desc' }
    });

    if (ranks.length === 0) {
      console.log(`❌ No ranks found in database`);
      return null;
    }

    // Find the highest rank the user qualifies for
    let newRankName = 'Consultant'; // Default fallback
    let newRankId = null;

    for (const rank of ranks) {
      if (user.points >= rank.required_points) {
        // For higher ranks, also check downline requirements using NEW LOGIC
        if (HIGHER_RANKS.includes(rank.title)) {
          console.log(`🔍 Checking ${rank.title} requirements for ${user.username} using NEW LOGIC...`);
          const rankCheckResult = await checkNewRankRequirementsOptimized(user.username, rank.title);
          
          if (rankCheckResult.qualifies) {
            newRankName = rank.title;
            newRankId = rank.id;
            console.log(`✅ ${user.username} qualifies for ${rank.title}: ${rankCheckResult.reason}`);
            if (rankCheckResult.details) {
              console.log(`📊 Details:`, rankCheckResult.details);
            }
            break;
          } else {
            console.log(`❌ ${user.username} doesn't qualify for ${rank.title}: ${rankCheckResult.reason}`);
            // Continue checking lower ranks
          }
        } else {
          // For lower ranks, only points matter
          newRankName = rank.title;
          newRankId = rank.id;
          console.log(`✅ ${user.username} qualifies for ${rank.title} (points requirement met)`);
          break;
        }
      }
    }

    // If no rank found that user qualifies for, use the lowest rank
    if (!newRankId) {
      const lowestRank = ranks[ranks.length - 1];
      newRankName = lowestRank.title;
      newRankId = lowestRank.id;
    }

    // Only update if rank changed
    if (!user.rank || user.rank.title !== newRankName) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          rankId: newRankId
        }
      });

      console.log(`✅ Updated rank for user ${userId}: ${user.rank?.title || 'No rank'} → ${newRankName} (${user.points} points, requires ${ranks.find(r => r.title === newRankName)?.required_points || 0} points)`);
      return newRankName;
    }

    console.log(`ℹ️ User ${userId} rank unchanged: ${user.rank.title} (${user.points} points)`);
    return user.rank.title;
  } catch (error) {
    console.error(`❌ Error updating rank for user ${userId}:`, error);
    return null;
  }
}
