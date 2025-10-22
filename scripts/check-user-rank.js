import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserRank(username) {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        fullname: true,
        points: true,
        rankId: true,
        rank: { select: { title: true } },
        currentPackageId: true,
        currentPackage: { select: { package_name: true } }
      }
    });
    
    if (!user) {
      console.log(`❌ User ${username} not found!`);
      return;
    }
    
    console.log(`\n👤 User: ${user.username} (${user.fullname})`);
    console.log(`   Points: ${user.points}`);
    console.log(`   Current Rank: ${user.rank?.title || 'No Rank'} (RankID: ${user.rankId || 'None'})`);
    console.log(`   Current Package: ${user.currentPackage?.package_name || 'No Package'} (PackageID: ${user.currentPackageId || 'None'})`);
    
  } catch (error) {
    console.error('Error checking user rank:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get username from command line argument or use a default
const username = process.argv[2] || 'bushra750';
checkUserRank(username);

