import prisma from './prisma.js';

// Simple rank calculation based on points
export async function updateUserRank(userId) {
  try {
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
      console.log(`❌ User ${userId} not found for rank update`);
      return null;
    }

    // Simple rank calculation based on points
    let newRankName = 'Consultant';
    if (user.points >= 24000) newRankName = 'Sapphire Diamond';
    else if (user.points >= 8000) newRankName = 'Diamond';
    else if (user.points >= 2000) newRankName = 'Sapphire Manager';
    else if (user.points >= 1000) newRankName = 'Manager';

    // Get or create rank
    let rank = await prisma.rank.findFirst({
      where: { title: newRankName }
    });

    if (!rank) {
      const points = user.points >= 24000 ? 24000 : 
                    user.points >= 8000 ? 8000 : 
                    user.points >= 2000 ? 2000 : 
                    user.points >= 1000 ? 1000 : 0;
      rank = await prisma.rank.create({
        data: {
          title: newRankName,
          required_points: points,
          details: `Auto-created rank for ${newRankName}`
        }
      });
    }

    // Only update if rank changed
    if (!user.rank || user.rank.title !== newRankName) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          rankId: rank.id
        }
      });

      console.log(`✅ Updated rank for user ${userId}: ${user.rank?.title || 'No rank'} → ${newRankName} (${user.points} points)`);
      return newRankName;
    }

    console.log(`ℹ️ User ${userId} rank unchanged: ${user.rank.title} (${user.points} points)`);
    return user.rank.title;
  } catch (error) {
    console.error(`❌ Error updating rank for user ${userId}:`, error);
    return null;
  }
}
