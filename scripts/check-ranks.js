import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRanks() {
  try {
    const ranks = await prisma.rank.findMany({
      select: { id: true, title: true },
      orderBy: { id: 'asc' }
    });
    
    console.log('Current ranks in database:');
    ranks.forEach(rank => console.log(`ID ${rank.id}: ${rank.title}`));
    
    // Check specifically for Diamond rank
    const diamondRank = ranks.find(r => r.title === 'Diamond');
    if (diamondRank) {
      console.log(`\n✅ Diamond rank found with ID: ${diamondRank.id}`);
    } else {
      console.log('\n❌ Diamond rank not found!');
    }
    
    // Check specifically for Sapphire Diamond rank
    const sapphireDiamondRank = ranks.find(r => r.title === 'Sapphire Diamond');
    if (sapphireDiamondRank) {
      console.log(`✅ Sapphire Diamond rank found with ID: ${sapphireDiamondRank.id}`);
    } else {
      console.log('❌ Sapphire Diamond rank not found!');
    }
    
  } catch (error) {
    console.error('Error checking ranks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRanks();