const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPackageApprovalCommission() {
  try {
    console.log('🧪 TESTING PACKAGE APPROVAL COMMISSION DISTRIBUTION');
    console.log('==================================================\n');

    // Find a recent approved package request
    const recentPackageRequest = await prisma.packageRequest.findFirst({
      where: { status: 'approved' },
      include: {
        user: {
          include: {
            rank: true
          }
        },
        package: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    if (!recentPackageRequest) {
      console.log('❌ No approved package requests found');
      return;
    }

    console.log('📦 RECENT PACKAGE REQUEST:');
    console.log('===========================');
    console.log(`ID: ${recentPackageRequest.id}`);
    console.log(`User: ${recentPackageRequest.user.username}`);
    console.log(`Package: ${recentPackageRequest.package.package_name}`);
    console.log(`Amount: ${recentPackageRequest.package.package_amount}`);
    console.log(`Direct Commission: ${recentPackageRequest.package.package_direct_commission}`);
    console.log(`Indirect Commission: ${recentPackageRequest.package.package_indirect_commission}`);
    console.log(`Points: ${recentPackageRequest.package.package_points}`);
    console.log(`Approved At: ${recentPackageRequest.updatedAt}`);
    console.log('');

    // Check if commissions were actually distributed
    console.log('💰 COMMISSION DISTRIBUTION CHECK:');
    console.log('=================================');
    
    const buyer = recentPackageRequest.user;
    const directReferrerUsername = buyer.referredBy;
    
    console.log(`📊 Package Buyer: ${buyer.username}`);
    console.log(`📊 Direct Referrer: ${directReferrerUsername || 'None'}`);
    console.log('');

    // Check direct commission
    if (directReferrerUsername) {
      // First get the user ID
      const directReferrerUser = await prisma.user.findUnique({
        where: { username: directReferrerUsername },
        select: { id: true, username: true }
      });

      if (directReferrerUser) {
        const directCommission = await prisma.earnings.findFirst({
          where: {
            userId: directReferrerUser.id,
            type: 'direct_commission',
            description: { contains: recentPackageRequest.id.toString() }
          },
          include: {
            user: { select: { username: true } }
          }
        });

        if (directCommission) {
          console.log('✅ Direct Commission Found:');
          console.log(`   Recipient: ${directCommission.user.username}`);
          console.log(`   Amount: ${directCommission.amount}`);
          console.log(`   Date: ${directCommission.createdAt}`);
        } else {
          console.log('❌ No Direct Commission Found');
        }
      } else {
        console.log('❌ Direct Referrer User Not Found');
      }
    } else {
      console.log('❌ No Direct Referrer - No Direct Commission');
    }
    console.log('');

    // Check indirect commission
    const indirectCommissions = await prisma.earnings.findMany({
      where: {
        type: 'indirect_commission',
        description: { contains: recentPackageRequest.id.toString() }
      },
      include: {
        user: { select: { username: true } }
      }
    });

    if (indirectCommissions.length > 0) {
      console.log('✅ Indirect Commissions Found:');
      indirectCommissions.forEach((commission, index) => {
        console.log(`   ${index + 1}. ${commission.user.username}: ${commission.amount}`);
        console.log(`      Date: ${commission.createdAt}`);
        console.log(`      Description: ${commission.description}`);
      });
    } else {
      console.log('❌ No Indirect Commissions Found');
      console.log('💡 This could mean:');
      console.log('   - No upline members eligible for indirect commission');
      console.log('   - Indirect commission logic not triggered');
      console.log('   - Commission accumulated but not distributed');
    }
    console.log('');

    // Check if points were distributed
    console.log('⭐ POINTS DISTRIBUTION CHECK:');
    console.log('=============================');
    
    // Find users who should have received points (upline chain)
    const uplineUsers = [];
    let currentUsername = buyer.username;
    const processedUsers = new Set();
    let level = 0;

    while (currentUsername && level < 10) {
      const user = await prisma.user.findUnique({
        where: { username: currentUsername },
        select: {
          username: true,
          points: true,
          referredBy: true
        }
      });

      if (!user || processedUsers.has(user.username)) {
        break;
      }

      uplineUsers.push(user);
      processedUsers.add(user.username);
      currentUsername = user.referredBy;
      level++;
    }

    console.log(`📊 Users in upline chain: ${uplineUsers.length}`);
    uplineUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.username}: ${user.points.toLocaleString()} points`);
    });
    console.log('');

    // Check if any users received points around the approval time
    const pointsAroundApproval = await prisma.earnings.findMany({
      where: {
        type: 'points',
        createdAt: {
          gte: new Date(recentPackageRequest.updatedAt.getTime() - 60000), // 1 minute before
          lte: new Date(recentPackageRequest.updatedAt.getTime() + 60000)  // 1 minute after
        }
      },
      include: {
        user: { select: { username: true } }
      }
    });

    if (pointsAroundApproval.length > 0) {
      console.log('✅ Points Distribution Found:');
      pointsAroundApproval.forEach((point, index) => {
        console.log(`   ${index + 1}. ${point.user.username}: ${point.amount} points`);
        console.log(`      Date: ${point.createdAt}`);
      });
    } else {
      console.log('❌ No Points Distribution Found Around Approval Time');
    }
    console.log('');

    // Test the commission logic manually
    console.log('🧪 MANUAL COMMISSION LOGIC TEST:');
    console.log('=================================');
    
    if (directReferrerUsername) {
      console.log(`Testing indirect commission for package buyer: ${buyer.username}`);
      console.log(`Direct referrer: ${directReferrerUsername}`);
      
      // Get upline members (excluding direct referrer)
      const directReferrer = await prisma.user.findUnique({
        where: { username: directReferrerUsername },
        include: { rank: true }
      });

      if (directReferrer && directReferrer.referredBy) {
        console.log(`Direct referrer has referrer: ${directReferrer.referredBy}`);
        
        // Find upline members
        const uplineMembers = [];
        let currentUplineUsername = directReferrer.referredBy;
        let uplineLevel = 0;

        while (currentUplineUsername && uplineLevel < 10) {
          const uplineUser = await prisma.user.findUnique({
            where: { username: currentUplineUsername },
            include: { rank: true }
          });

          if (!uplineUser) break;

          console.log(`   Upline ${uplineLevel + 1}: ${uplineUser.username} (${uplineUser.rank?.title || 'No Rank'})`);
          uplineMembers.push(uplineUser);
          currentUplineUsername = uplineUser.referredBy;
          uplineLevel++;
        }

        console.log(`\n📊 Found ${uplineMembers.length} upline members for indirect commission`);
        
        if (uplineMembers.length > 0) {
          console.log('✅ Indirect commission should have been distributed');
          console.log(`   Expected recipients: ${uplineMembers.map(u => u.username).join(', ')}`);
        } else {
          console.log('❌ No upline members found - no indirect commission possible');
        }
      } else {
        console.log('❌ Direct referrer has no referrer - no indirect commission possible');
      }
    } else {
      console.log('❌ No direct referrer - no indirect commission possible');
    }

    console.log('\n🎯 CONCLUSION:');
    console.log('==============');
    if (indirectCommissions.length > 0) {
      console.log('✅ Indirect commission logic IS working during package approval');
      console.log(`   ${indirectCommissions.length} indirect commissions were distributed`);
    } else {
      console.log('❌ Indirect commission logic may NOT be working during package approval');
      console.log('   No indirect commissions found for this package request');
      console.log('   This could be due to:');
      console.log('   - No eligible upline members');
      console.log('   - Logic not being called');
      console.log('   - Commission accumulating instead of distributing');
    }

  } catch (error) {
    console.error('❌ Error testing package approval commission:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPackageApprovalCommission();
