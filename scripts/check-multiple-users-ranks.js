import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsersRanks() {
  try {
    const usernames = ['Abdulmanan786', 'sohailmurtaza892'];
    
    console.log('🔍 Checking ranks for multiple users...\n');
    console.log('═════════════════════════════════════════════════════════════\n');

    for (const username of usernames) {
      // Try exact match first
      let user = await prisma.user.findUnique({
        where: { username: username },
        select: {
          id: true,
          username: true,
          fullname: true,
          points: true,
          balance: true,
          totalEarnings: true,
          referralCount: true,
          referredBy: true,
          currentPackageId: true,
          packageExpiryDate: true,
          rank: {
            select: {
              id: true,
              title: true,
              required_points: true
            }
          },
          currentPackage: {
            select: {
              package_name: true,
              package_amount: true,
              shopping_amount: true
            }
          }
        }
      });

      // If not found, try case-insensitive search
      if (!user) {
        console.log(`⚠️ User "${username}" not found with exact match. Trying case-insensitive search...\n`);
        
        const users = await prisma.user.findMany({
          where: {
            username: {
              contains: username,
              mode: 'insensitive'
            }
          },
          select: {
            id: true,
            username: true,
            fullname: true,
            points: true,
            balance: true,
            totalEarnings: true,
            referralCount: true,
            referredBy: true,
            currentPackageId: true,
            packageExpiryDate: true,
            rank: {
              select: {
                id: true,
                title: true,
                required_points: true
              }
            },
            currentPackage: {
              select: {
                package_name: true,
                package_amount: true,
                shopping_amount: true
              }
            }
          }
        });

        if (users.length === 0) {
          console.log(`❌ User "${username}" not found\n`);
          console.log('─────────────────────────────────────────────────────────────\n');
          continue;
        } else if (users.length === 1) {
          user = users[0];
          console.log(`✅ Found user: ${user.username} (case mismatch corrected)\n`);
        } else {
          console.log(`⚠️ Multiple users found matching "${username}":\n`);
          users.forEach((u, index) => {
            console.log(`${index + 1}. ${u.username} (${u.fullname})`);
          });
          console.log('\nUsing first match...\n');
          user = users[0];
        }
      }

      // Display user information
      console.log(`👤 USER: ${user.username}`);
      console.log('═════════════════════════════════════════════════════════════');
      console.log(`Full Name: ${user.fullname}`);
      console.log(`User ID: ${user.id}`);
      console.log('');
      
      console.log('📊 RANK & POINTS:');
      console.log(`  Current Rank: ${user.rank?.title || 'No Rank'}`);
      console.log(`  Rank ID: ${user.rank?.id || 'N/A'}`);
      console.log(`  Required Points: ${user.rank?.required_points || 0}`);
      console.log(`  User Points: ${user.points.toLocaleString()}`);
      console.log('');
      
      console.log('💰 FINANCIAL:');
      console.log(`  Balance: PKR ${parseFloat(user.balance).toLocaleString()}`);
      console.log(`  Total Earnings: PKR ${parseFloat(user.totalEarnings).toLocaleString()}`);
      console.log('');
      
      console.log('📦 PACKAGE:');
      if (user.currentPackageId && user.currentPackage) {
        const isActive = user.packageExpiryDate && new Date(user.packageExpiryDate) > new Date();
        console.log(`  Package: ${user.currentPackage.package_name}`);
        console.log(`  Amount: PKR ${parseFloat(user.currentPackage.package_amount).toLocaleString()}`);
        console.log(`  Shopping Amount: PKR ${parseFloat(user.currentPackage.shopping_amount).toLocaleString()}`);
        console.log(`  Expiry: ${user.packageExpiryDate ? new Date(user.packageExpiryDate).toLocaleDateString() : 'N/A'}`);
        console.log(`  Status: ${isActive ? '✅ Active' : '❌ Expired'}`);
      } else {
        console.log(`  No active package`);
      }
      console.log('');
      
      console.log('👥 NETWORK:');
      console.log(`  Referred By: ${user.referredBy || 'No Referrer'}`);
      console.log(`  Referral Count: ${user.referralCount || 0}`);
      console.log('');

      // Get direct referrals with ranks
      const directReferrals = await prisma.user.findMany({
        where: { referredBy: user.username },
        select: {
          username: true,
          points: true,
          rank: {
            select: {
              title: true
            }
          }
        },
        orderBy: { points: 'desc' }
      });

      console.log('👥 DIRECT REFERRALS:');
      console.log(`  Total: ${directReferrals.length}`);
      
      if (directReferrals.length > 0) {
        console.log('');
        
        // Count by rank
        const rankCounts = {};
        const pointsRanges = {
          '2000+': 0,
          '1000-1999': 0,
          '0-999': 0
        };

        directReferrals.forEach(ref => {
          const rankTitle = ref.rank?.title || 'No Rank';
          rankCounts[rankTitle] = (rankCounts[rankTitle] || 0) + 1;
          
          if (ref.points >= 2000) pointsRanges['2000+']++;
          else if (ref.points >= 1000) pointsRanges['1000-1999']++;
          else pointsRanges['0-999']++;
        });

        console.log('  Rank Distribution:');
        Object.entries(rankCounts).forEach(([rank, count]) => {
          console.log(`    ${rank.padEnd(25)}: ${count}`);
        });

        console.log('');
        console.log('  Points Distribution:');
        console.log(`    2,000+ points: ${pointsRanges['2000+']}`);
        console.log(`    1,000-1,999 points: ${pointsRanges['1000-1999']}`);
        console.log(`    0-999 points: ${pointsRanges['0-999']}`);

        console.log('');
        console.log('  Top 5 Referrals:');
        directReferrals.slice(0, 5).forEach((ref, index) => {
          console.log(`    ${index + 1}. ${ref.username.padEnd(20)} | ${ref.points.toString().padStart(8)} pts | ${ref.rank?.title || 'No Rank'}`);
        });
      }

      console.log('');
      console.log('🏆 RANK QUALIFICATION (New Criteria):');
      console.log('─────────────────────────────────────');
      
      // Diamond
      const diamondQualifyingLines = directReferrals.filter(r => r.points >= 2000).length;
      console.log(`💎 Diamond: ${user.points >= 8000 && diamondQualifyingLines >= 3 ? '✅' : '❌'}`);
      console.log(`   Points: ${user.points.toLocaleString()} >= 8,000? ${user.points >= 8000 ? '✅' : '❌'}`);
      console.log(`   Downline: ${diamondQualifyingLines}/3 lines with 2,000+ points`);

      // Sapphire Diamond
      const sapphireDiamondLines = directReferrals.filter(r => r.rank?.title === 'Diamond').length;
      console.log(`💠 Sapphire Diamond: ${sapphireDiamondLines >= 3 ? '✅' : '❌'}`);
      console.log(`   Points: NOT REQUIRED ✅`);
      console.log(`   Downline: ${sapphireDiamondLines}/3 Diamond lines`);

      // Ambassador
      console.log(`🎖️ Ambassador: ${sapphireDiamondLines >= 6 ? '✅' : '❌'}`);
      console.log(`   Points: NOT REQUIRED ✅`);
      console.log(`   Downline: ${sapphireDiamondLines}/6 Diamond lines`);

      // Sapphire Ambassador
      const ambassadorLines = directReferrals.filter(r => r.rank?.title === 'Ambassador').length;
      console.log(`🌟 Sapphire Ambassador: ${ambassadorLines >= 3 || sapphireDiamondLines >= 10 ? '✅' : '❌'}`);
      console.log(`   Points: NOT REQUIRED ✅`);
      console.log(`   Option 1: ${ambassadorLines}/3 Ambassador lines`);
      console.log(`   Option 2: ${sapphireDiamondLines}/10 Diamond lines`);

      console.log('');
      console.log('─────────────────────────────────────────────────────────────\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error message:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsersRanks();

