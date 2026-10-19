import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetAllUserBalances() {
  try {
    console.log('🔄 RESETTING ALL USER E-WALLET BALANCES TO 0');
    console.log('=============================================\n');

    // First, get a count and summary of current balances
    const totalUsers = await prisma.user.count();
    const usersWithBalance = await prisma.user.count({
      where: {
        balance: {
          gt: 0
        }
      }
    });

    const balanceSummary = await prisma.user.aggregate({
      _sum: {
        balance: true
      },
      _avg: {
        balance: true
      },
      _max: {
        balance: true
      }
    });

    console.log('📊 CURRENT BALANCE SUMMARY:');
    console.log('===========================');
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Users with Balance > 0: ${usersWithBalance}`);
    console.log(`Total Balance in System: PKR ${balanceSummary._sum.balance || 0}`);
    console.log(`Average Balance: PKR ${balanceSummary._avg.balance || 0}`);
    console.log(`Maximum Balance: PKR ${balanceSummary._max.balance || 0}`);
    console.log('');

    // Show top 10 users with highest balances
    const topUsers = await prisma.user.findMany({
      where: {
        balance: {
          gt: 0
        }
      },
      select: {
        id: true,
        username: true,
        fullname: true,
        balance: true
      },
      orderBy: {
        balance: 'desc'
      },
      take: 10
    });

    if (topUsers.length > 0) {
      console.log('💰 TOP 10 USERS BY BALANCE:');
      console.log('===========================');
      topUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username} (${user.fullname}): PKR ${user.balance}`);
      });
      console.log('');
    }

    // Confirm before proceeding
    console.log('⚠️  WARNING: This will set ALL user balances to 0!');
    console.log('This action cannot be undone.');
    console.log('');

    // Update all users' balance to 0
    console.log('🔄 Updating all user balances to 0...');
    const startTime = Date.now();

    const result = await prisma.user.updateMany({
      data: {
        balance: 0
      }
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`✅ Successfully updated ${result.count} users' balances to 0`);
    console.log(`⏱️  Operation completed in ${duration} seconds`);
    console.log('');

    // Verify the update
    const verifyCount = await prisma.user.count({
      where: {
        balance: {
          gt: 0
        }
      }
    });

    const verifyZeroCount = await prisma.user.count({
      where: {
        balance: 0
      }
    });

    console.log('✅ VERIFICATION:');
    console.log('================');
    console.log(`Users with balance > 0: ${verifyCount}`);
    console.log(`Users with balance = 0: ${verifyZeroCount}`);
    console.log(`Total users: ${totalUsers}`);
    
    if (verifyCount === 0 && verifyZeroCount === totalUsers) {
      console.log('✅ All balances successfully reset to 0!');
    } else {
      console.log('⚠️  Warning: Verification shows unexpected results');
    }

  } catch (error) {
    console.error('❌ Error resetting user balances:', error);
    console.error(error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
resetAllUserBalances()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });


