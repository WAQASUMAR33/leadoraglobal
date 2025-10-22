import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixExistingPackage8Users() {
  try {
    console.log('🔧 Fixing existing users with Package ID 8 but wrong ranks...');

    // Find all users with Package ID 8 (Combo Package) but not Diamond rank
    const usersToFix = await prisma.user.findMany({
      where: {
        currentPackageId: 8,  // Combo Package
        rankId: { not: 4 }    // Not Diamond rank (ID 4)
      },
      select: {
        id: true,
        username: true,
        fullname: true,
        rank: { select: { title: true } }
      }
    });

    console.log(`Found ${usersToFix.length} users with Package ID 8 but wrong rank:`);
    usersToFix.forEach(user => {
      console.log(`  - ${user.username} (${user.fullname}): ${user.rank?.title || 'No Rank'}`);
    });

    if (usersToFix.length === 0) {
      console.log('✅ No users need fixing!');
      return;
    }

    // Update all these users to Diamond rank
    const updateResult = await prisma.user.updateMany({
      where: {
        currentPackageId: 8,
        rankId: { not: 4 }
      },
      data: {
        rankId: 4  // Diamond rank
      }
    });

    console.log(`\n✅ Updated ${updateResult.count} users to Diamond rank`);

    // Verify the changes
    const updatedUsers = await prisma.user.findMany({
      where: {
        currentPackageId: 8
      },
      select: {
        username: true,
        fullname: true,
        rank: { select: { title: true } }
      }
    });

    console.log('\n📊 All users with Package ID 8 after fix:');
    updatedUsers.forEach(user => {
      const status = user.rank?.title === 'Diamond' ? '✅' : '❌';
      console.log(`  ${status} ${user.username} (${user.fullname}): ${user.rank?.title || 'No Rank'}`);
    });

    const correctCount = updatedUsers.filter(u => u.rank?.title === 'Diamond').length;
    console.log(`\n🎉 Summary: ${correctCount}/${updatedUsers.length} users now have correct Diamond rank`);

  } catch (error) {
    console.error('❌ Error fixing existing users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixExistingPackage8Users();

