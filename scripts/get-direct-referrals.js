const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getDirectReferrals(targetUsername) {
  try {
    console.log(`🔍 Getting direct referrals for username: ${targetUsername}\n`);

    // First, check if the user exists
    const targetUser = await prisma.user.findUnique({
      where: { username: targetUsername },
      select: {
        id: true,
        fullname: true,
        username: true,
        email: true,
        status: true,
        balance: true,
        points: true,
        referralCount: true,
        totalEarnings: true,
        createdAt: true,
        referredBy: true,
        currentPackage: {
          select: {
            package_name: true
          }
        },
        rank: {
          select: {
            title: true
          }
        }
      }
    });

    if (!targetUser) {
      console.log(`❌ User with username "${targetUsername}" not found.`);
      return;
    }

    // Display target user info
    console.log('🎯 TARGET USER:');
    console.log(`├─ Username: ${targetUser.username}`);
    console.log(`├─ Name: ${targetUser.fullname}`);
    console.log(`├─ Status: ${targetUser.status}`);
    console.log(`├─ Balance: $${targetUser.balance}`);
    console.log(`├─ Points: ${targetUser.points}`);
    console.log(`├─ Referrals: ${targetUser.referralCount}`);
    console.log(`├─ Total Earnings: $${targetUser.totalEarnings}`);
    console.log(`├─ Package: ${targetUser.currentPackage?.package_name || 'No Package'}`);
    console.log(`├─ Rank: ${targetUser.rank?.title || 'No Rank'}`);
    console.log(`├─ Referred By: ${targetUser.referredBy || 'No one (Root user)'}`);
    console.log(`└─ Joined: ${targetUser.createdAt.toISOString().split('T')[0]}`);
    console.log('');

    // Get direct referrals only
    console.log('👥 DIRECT REFERRALS:');
    const directReferrals = await prisma.user.findMany({
      where: { referredBy: targetUsername },
      select: {
        id: true,
        fullname: true,
        username: true,
        email: true,
        status: true,
        balance: true,
        points: true,
        referralCount: true,
        totalEarnings: true,
        createdAt: true,
        currentPackage: {
          select: {
            package_name: true
          }
        },
        rank: {
          select: {
            title: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    if (directReferrals.length === 0) {
      console.log('└─ No direct referrals found.');
    } else {
      console.log(`└─ Found ${directReferrals.length} direct referrals:\n`);
      
      directReferrals.forEach((referral, index) => {
        console.log(`${index + 1}. ${referral.username} (${referral.fullname})`);
        console.log(`   ├─ Status: ${referral.status}`);
        console.log(`   ├─ Balance: $${referral.balance}`);
        console.log(`   ├─ Points: ${referral.points}`);
        console.log(`   ├─ Referrals: ${referral.referralCount}`);
        console.log(`   ├─ Total Earnings: $${referral.totalEarnings}`);
        console.log(`   ├─ Package: ${referral.currentPackage?.package_name || 'No Package'}`);
        console.log(`   ├─ Rank: ${referral.rank?.title || 'No Rank'}`);
        console.log(`   └─ Joined: ${referral.createdAt.toISOString().split('T')[0]}`);
        console.log('');
      });

      // Calculate totals
      const totalBalance = directReferrals.reduce((sum, ref) => sum + parseFloat(ref.balance), 0);
      const totalEarnings = directReferrals.reduce((sum, ref) => sum + parseFloat(ref.totalEarnings), 0);
      const totalPoints = directReferrals.reduce((sum, ref) => sum + (ref.points || 0), 0);
      const totalReferrals = directReferrals.reduce((sum, ref) => sum + (ref.referralCount || 0), 0);

      console.log('📊 DIRECT REFERRALS SUMMARY:');
      console.log(`├─ Total Balance: $${totalBalance.toFixed(2)}`);
      console.log(`├─ Total Earnings: $${totalEarnings.toFixed(2)}`);
      console.log(`├─ Total Points: ${totalPoints}`);
      console.log(`└─ Total Sub-referrals: ${totalReferrals}`);
    }

  } catch (error) {
    console.error('❌ Error getting direct referrals:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get the username from command line arguments
const targetUsername = process.argv[2];

if (!targetUsername) {
  console.log('Usage: node get-direct-referrals.js <username>');
  console.log('Example: node get-direct-referrals.js Touseef231');
  process.exit(1);
}

getDirectReferrals(targetUsername);

