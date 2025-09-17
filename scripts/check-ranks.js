const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRanks() {
  try {
    console.log('Checking ranks in the system...');
    
    const ranks = await prisma.rank.findMany({
      orderBy: { required_points: 'asc' }
    });
    
    console.log('\nRank Hierarchy (from lowest to highest points):');
    ranks.forEach((rank, index) => {
      console.log(`${index + 1}. ${rank.title} - ${rank.required_points} points`);
    });
    
    // Check if Manager rank exists
    const managerRank = ranks.find(rank => rank.title.toLowerCase().includes('manager'));
    if (managerRank) {
      console.log(`\n✅ Manager rank found: ${managerRank.title} (${managerRank.required_points} points)`);
    } else {
      console.log('\n❌ No Manager rank found');
    }
    
    // Check for Sapphire Diamond
    const sapphireDiamond = ranks.find(rank => 
      rank.title.toLowerCase().includes('sapphire') && 
      rank.title.toLowerCase().includes('diamond')
    );
    if (sapphireDiamond) {
      console.log(`✅ Sapphire Diamond rank found: ${sapphireDiamond.title} (${sapphireDiamond.required_points} points)`);
    } else {
      console.log('❌ No Sapphire Diamond rank found');
    }
    
  } catch (error) {
    console.error('Error checking ranks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRanks();
