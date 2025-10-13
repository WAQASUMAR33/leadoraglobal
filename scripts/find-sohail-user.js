import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findSohailUser() {
  try {
    console.log('🔍 Searching for users with "sohail" in username...\n');
    
    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: 'sohail'
        }
      },
      select: {
        id: true,
        username: true,
        fullname: true,
        points: true,
        rank: {
          select: {
            title: true
          }
        }
      }
    });

    if (users.length === 0) {
      console.log('❌ No users found with "sohail" in username\n');
    } else {
      console.log(`✅ Found ${users.length} user(s):\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. Username: ${user.username}`);
        console.log(`   Full Name: ${user.fullname}`);
        console.log(`   Points: ${user.points.toLocaleString()}`);
        console.log(`   Rank: ${user.rank?.title || 'No Rank'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

findSohailUser();

