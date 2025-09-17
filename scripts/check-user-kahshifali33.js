const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserKahshifali33() {
  console.log('🔍 Checking user: kahshifali33');
  console.log('============================\n');

  try {
    // 1. Check if user exists
    const user = await prisma.user.findUnique({
      where: { username: 'kahshifali33' },
      include: {
        rank: true,
        currentPackage: true,
        package: true
      }
    });

    if (!user) {
      console.log('❌ User kahshifali33 not found in database');
      return;
    }

    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Full Name: ${user.fullname}`);
    console.log(`   Email: ${user.email || 'N/A'}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Balance: ${user.balance}`);
    console.log(`   Points: ${user.points}`);
    console.log(`   Referred By: ${user.referredBy || 'N/A'}`);
    console.log(`   Referral Count: ${user.referralCount}`);
    console.log(`   Current Package ID: ${user.currentPackageId || 'N/A'}`);
    console.log(`   Package ID: ${user.packageId || 'N/A'}`);
    console.log(`   Rank ID: ${user.rankId || 'N/A'}`);
    console.log(`   Rank: ${user.rank?.title || 'No Rank'}`);
    console.log(`   Created: ${user.createdAt}`);

    // 2. Check all ranks in the system
    console.log('\n📊 All ranks in system:');
    const ranks = await prisma.rank.findMany({
      orderBy: { required_points: 'asc' }
    });
    
    ranks.forEach((rank, index) => {
      console.log(`   ${index + 1}. ${rank.title} - ${rank.required_points} points (ID: ${rank.id})`);
    });

    // 3. Check what rank this user should have based on points
    console.log(`\n🎯 Rank Analysis for ${user.username}:`);
    console.log(`   Current Points: ${user.points}`);
    console.log(`   Current Rank: ${user.rank?.title || 'No Rank'}`);
    
    let expectedRank = 'Consultant';
    if (user.points >= 24000) expectedRank = 'Sapphire Diamond';
    else if (user.points >= 8000) expectedRank = 'Diamond';
    else if (user.points >= 2000) expectedRank = 'Sapphire Manager';
    else if (user.points >= 1000) expectedRank = 'Manager';
    
    console.log(`   Expected Rank: ${expectedRank}`);
    console.log(`   Rank Match: ${user.rank?.title === expectedRank ? '✅ YES' : '❌ NO'}`);

    // 4. Check if the expected rank exists
    const expectedRankRecord = ranks.find(rank => rank.title === expectedRank);
    if (expectedRankRecord) {
      console.log(`   Expected Rank ID: ${expectedRankRecord.id}`);
    } else {
      console.log(`   ❌ Expected rank '${expectedRank}' not found in database`);
    }

    // 5. Check for any package requests
    const packageRequests = await prisma.packageRequest.findMany({
      where: { userId: user.id },
      include: { package: true },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n📋 Package Requests (${packageRequests.length}):`);
    packageRequests.forEach((req, index) => {
      console.log(`   ${index + 1}. ${req.package?.package_name || 'Unknown'} - Status: ${req.status} - Created: ${req.createdAt}`);
    });

    // 6. Check for any earnings
    const earnings = await prisma.earnings.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log(`\n💰 Recent Earnings (${earnings.length}):`);
    earnings.forEach((earning, index) => {
      console.log(`   ${index + 1}. ${earning.type}: ${earning.amount} - ${earning.description} - ${earning.createdAt}`);
    });

    // 7. Test the rank update function
    console.log('\n🔧 Testing rank update...');
    const { updateUserRank } = require('../src/lib/rankUtils.js');
    
    try {
      const newRank = await updateUserRank(user.id);
      console.log(`   Rank update result: ${newRank}`);
      
      // Check user again after update
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { rank: true }
      });
      
      console.log(`   Updated Rank: ${updatedUser.rank?.title || 'No Rank'}`);
      console.log(`   Updated Rank ID: ${updatedUser.rankId || 'N/A'}`);
    } catch (error) {
      console.log(`   ❌ Rank update failed: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Error checking user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserKahshifali33();
