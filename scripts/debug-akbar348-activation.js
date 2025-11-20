import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugAkbar348Activation() {
  try {
    console.log('🔍 DEBUGGING ACCOUNT ACTIVATION FOR Akbar348');
    console.log('============================================\n');

    // Find the user
    const user = await prisma.user.findUnique({
      where: { username: 'Akbar348' },
      include: {
        rank: true,
        currentPackage: true,
        packageRequests: {
          orderBy: { createdAt: 'desc' },
          include: {
            package: true,
            earnings: {
              include: {
                user: { select: { username: true } }
              }
            }
          }
        }
      }
    });

    if (!user) {
      console.log('❌ User Akbar348 not found');
      return;
    }

    console.log('👤 USER INFORMATION:');
    console.log('====================');
    console.log(`Username: ${user.username}`);
    console.log(`Full Name: ${user.fullname}`);
    console.log(`Status: ${user.status}`);
    console.log(`Current Package: ${user.currentPackage?.package_name || 'None'}`);
    console.log(`Package ID: ${user.currentPackageId || 'None'}`);
    console.log(`Package Expiry: ${user.packageExpiryDate || 'None'}`);
    console.log(`Current Rank: ${user.rank?.title || 'No Rank'}`);
    console.log(`Points: ${user.points}`);
    console.log(`Balance: ${user.balance}`);
    console.log(`Total Earnings: ${user.totalEarnings}`);
    console.log(`Referred By: ${user.referredBy || 'None'}`);
    console.log(`Created At: ${user.createdAt}`);
    console.log('');

    // Show referral tree
    console.log('🌳 REFERRAL TREE (UPWARD):');
    console.log('===========================');
    await showReferralTree(user.username);
    console.log('');

    // Check package requests
    console.log('📦 PACKAGE REQUESTS:');
    console.log('====================');
    if (user.packageRequests.length === 0) {
      console.log('❌ No package requests found');
    } else {
      user.packageRequests.forEach((request, index) => {
        console.log(`\n${index + 1}. Package Request ID: ${request.id}`);
        console.log(`   Package: ${request.package.package_name}`);
        console.log(`   Amount: ${request.package.package_amount}`);
        console.log(`   Direct Commission: ${request.package.package_direct_commission}`);
        console.log(`   Indirect Commission: ${request.package.package_indirect_commission}`);
        console.log(`   Points: ${request.package.package_points}`);
        console.log(`   Status: ${request.status}`);
        console.log(`   Created At: ${request.createdAt}`);
        console.log(`   Updated At: ${request.updatedAt}`);
        
        // Check earnings for this package request
        if (request.earnings && request.earnings.length > 0) {
          console.log(`   ✅ Earnings Records: ${request.earnings.length}`);
          request.earnings.forEach((earning, idx) => {
            console.log(`      ${idx + 1}. ${earning.user.username}: ${earning.amount} (${earning.type})`);
            console.log(`         Description: ${earning.description}`);
            console.log(`         Date: ${earning.createdAt}`);
          });
        } else {
          console.log(`   ❌ No earnings records found for this package request`);
        }
      });
    }
    console.log('');

    // Check all earnings for this user
    console.log('💰 ALL EARNINGS FOR Akbar348:');
    console.log('==============================');
    const allEarnings = await prisma.earnings.findMany({
      where: { userId: user.id },
      include: {
        packageRequest: {
          include: {
            package: { select: { package_name: true } },
            user: { select: { username: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (allEarnings.length === 0) {
      console.log('❌ No earnings found for this user');
    } else {
      console.log(`Total Earnings Records: ${allEarnings.length}\n`);
      allEarnings.forEach((earning, index) => {
        console.log(`${index + 1}. Amount: ${earning.amount}`);
        console.log(`   Type: ${earning.type}`);
        console.log(`   Description: ${earning.description}`);
        if (earning.packageRequest) {
          console.log(`   Package Request ID: ${earning.packageRequestId}`);
          console.log(`   Package Buyer: ${earning.packageRequest.user.username}`);
          console.log(`   Package: ${earning.packageRequest.package.package_name}`);
        }
        console.log(`   Date: ${earning.createdAt}`);
        console.log('');
      });
    }
    console.log('');

    // Check if Akbar348 should receive commissions from downline
    console.log('🔍 CHECKING DOWNLINE FOR COMMISSION OPPORTUNITIES:');
    console.log('================================================');
    const downline = await getDownline(user.username);
    console.log(`Total Downline Members: ${downline.length}`);
    
    if (downline.length > 0) {
      console.log('\nDownline Members:');
      downline.forEach((member, index) => {
        console.log(`${index + 1}. ${member.username} (${member.rank?.title || 'No Rank'}) - Points: ${member.points}`);
      });

      // Check recent package activations in downline
      console.log('\n📦 RECENT PACKAGE ACTIVATIONS IN DOWNLINE:');
      console.log('==========================================');
      const recentPackageRequests = await prisma.packageRequest.findMany({
        where: {
          userId: { in: downline.map(d => d.id) },
          status: 'approved',
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        },
        include: {
          user: { select: { username: true } },
          package: true,
          earnings: {
            where: { userId: user.id },
            include: { user: { select: { username: true } } }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      if (recentPackageRequests.length === 0) {
        console.log('❌ No recent package activations in downline');
      } else {
        for (let index = 0; index < recentPackageRequests.length; index++) {
          const request = recentPackageRequests[index];
          console.log(`\n${index + 1}. Package Request ID: ${request.id}`);
          console.log(`   Buyer: ${request.user.username}`);
          console.log(`   Package: ${request.package.package_name}`);
          console.log(`   Direct Commission: ${request.package.package_direct_commission}`);
          console.log(`   Indirect Commission: ${request.package.package_indirect_commission}`);
          console.log(`   Approved At: ${request.updatedAt}`);
          
          // Check if Akbar348 received commission
          if (request.earnings && request.earnings.length > 0) {
            console.log(`   ✅ Akbar348 received commission: ${request.earnings[0].amount} (${request.earnings[0].type})`);
          } else {
            console.log(`   ❌ Akbar348 did NOT receive commission from this activation`);
            
            // Check why - analyze the referral chain
            const buyer = await prisma.user.findUnique({
              where: { username: request.user.username },
              include: { rank: true }
            });
            
            if (buyer) {
              console.log(`   🔍 Analysis:`);
              console.log(`      Buyer's Referrer: ${buyer.referredBy || 'None'}`);
              
              // Check if Akbar348 is in the referral chain
              const chain = await getReferralChain(buyer.username);
              const akbarInChain = chain.some(u => u.username.toLowerCase() === 'akbar348');
              console.log(`      Akbar348 in referral chain: ${akbarInChain ? 'Yes' : 'No'}`);
              
              if (akbarInChain) {
                const akbarPosition = chain.findIndex(u => u.username.toLowerCase() === 'akbar348');
                console.log(`      Akbar348 position in chain: ${akbarPosition + 1}`);
                console.log(`      Chain: ${chain.map(u => u.username).join(' → ')}`);
              }
            }
          }
        }
      }
    }
    console.log('');

    // Summary
    console.log('📊 SUMMARY:');
    console.log('===========');
    console.log(`Total Package Requests: ${user.packageRequests.length}`);
    const approvedRequests = user.packageRequests.filter(r => r.status === 'approved');
    console.log(`Approved Package Requests: ${approvedRequests.length}`);
    const requestsWithEarnings = user.packageRequests.filter(r => r.earnings && r.earnings.length > 0);
    console.log(`Package Requests with Commission Distribution: ${requestsWithEarnings.length}`);
    console.log(`Total Earnings Records: ${allEarnings.length}`);
    console.log(`Total Balance: ${user.balance}`);
    console.log(`Total Earnings (lifetime): ${user.totalEarnings}`);

  } catch (error) {
    console.error('❌ Error debugging Akbar348 activation:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

async function showReferralTree(username) {
  let currentUsername = username;
  const processedUsers = new Set();
  let level = 0;
  const maxLevels = 10;

  while (currentUsername && level < maxLevels) {
    const user = await prisma.user.findUnique({
      where: { username: currentUsername },
      include: {
        rank: true,
        currentPackage: true
      }
    });

    if (!user || processedUsers.has(user.id)) {
      break;
    }

    const indent = '  '.repeat(level);
    console.log(`${indent}${level === 0 ? '👤' : '⬆️'} ${user.username} (${user.rank?.title || 'No Rank'})`);
    console.log(`${indent}   Points: ${user.points}, Balance: ${user.balance}`);
    if (user.currentPackage) {
      console.log(`${indent}   Package: ${user.currentPackage.package_name}`);
    }

    processedUsers.add(user.id);
    currentUsername = user.referredBy;
    level++;
  }
}

async function getDownline(username) {
  const downline = [];
  const visited = new Set();

  async function findDownline(currentUsername) {
    if (visited.has(currentUsername)) return;
    visited.add(currentUsername);

    const referrals = await prisma.user.findMany({
      where: { referredBy: currentUsername },
      include: { rank: true }
    });

    for (const referral of referrals) {
      downline.push(referral);
      await findDownline(referral.username);
    }
  }

  await findDownline(username);
  return downline;
}

async function getReferralChain(username) {
  const chain = [];
  let currentUsername = username;
  const processedUsers = new Set();
  let level = 0;
  const maxLevels = 10;

  while (currentUsername && level < maxLevels) {
    const user = await prisma.user.findUnique({
      where: { username: currentUsername },
      select: { username: true, referredBy: true }
    });

    if (!user || processedUsers.has(user.username)) {
      break;
    }

    chain.push(user);
    processedUsers.add(user.username);
    currentUsername = user.referredBy;
    level++;
  }

  return chain;
}

debugAkbar348Activation();

