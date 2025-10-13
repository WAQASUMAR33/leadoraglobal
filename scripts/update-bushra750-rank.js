import { PrismaClient } from '@prisma/client';
import { updateUserRank } from '../src/lib/rankUtils.js';

const prisma = new PrismaClient();

async function updateBushra750Rank() {
  try {
    console.log('🔍 Fetching user Bushra750...\n');
    
    // Get user details
    const user = await prisma.user.findUnique({
      where: { username: 'Bushra750' },
      select: {
        id: true,
        username: true,
        fullname: true,
        points: true,
        balance: true,
        rank: {
          select: {
            id: true,
            title: true,
            required_points: true
          }
        }
      }
    });

    if (!user) {
      console.log('❌ User Bushra750 not found');
      return;
    }

    console.log('📊 Current User Status:');
    console.log('─────────────────────────────────────');
    console.log(`Username: ${user.username}`);
    console.log(`Full Name: ${user.fullname}`);
    console.log(`Points: ${user.points}`);
    console.log(`Balance: PKR ${parseFloat(user.balance).toLocaleString()}`);
    console.log(`Current Rank: ${user.rank?.title || 'No Rank'}`);
    console.log(`Rank Required Points: ${user.rank?.required_points || 0}`);
    console.log('');

    // Get direct referrals with their ranks and points
    console.log('👥 Direct Referrals:');
    console.log('─────────────────────────────────────');
    
    const directReferrals = await prisma.user.findMany({
      where: { referredBy: 'Bushra750' },
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
      },
      orderBy: { points: 'desc' }
    });

    console.log(`Total Direct Referrals: ${directReferrals.length}\n`);

    // Count by rank
    const rankCounts = {};
    const pointsRanges = {
      '2000+': 0,
      '1000-1999': 0,
      '0-999': 0
    };

    directReferrals.forEach((referral, index) => {
      const rankTitle = referral.rank?.title || 'No Rank';
      rankCounts[rankTitle] = (rankCounts[rankTitle] || 0) + 1;
      
      if (referral.points >= 2000) pointsRanges['2000+']++;
      else if (referral.points >= 1000) pointsRanges['1000-1999']++;
      else pointsRanges['0-999']++;

      console.log(`${(index + 1).toString().padStart(2)}. ${referral.username.padEnd(20)} | ${referral.points.toString().padStart(8)} pts | ${rankTitle}`);
    });

    console.log('\n📊 Rank Distribution:');
    console.log('─────────────────────────────────────');
    Object.entries(rankCounts).forEach(([rank, count]) => {
      console.log(`${rank.padEnd(25)}: ${count}`);
    });

    console.log('\n📊 Points Distribution:');
    console.log('─────────────────────────────────────');
    console.log(`2,000+ points: ${pointsRanges['2000+']}`);
    console.log(`1,000-1,999 points: ${pointsRanges['1000-1999']}`);
    console.log(`0-999 points: ${pointsRanges['0-999']}`);

    // Check qualification for each higher rank
    console.log('\n🏆 Rank Qualification Check (New Criteria):');
    console.log('─────────────────────────────────────');
    
    // Diamond
    const diamondLines = directReferrals.filter(r => r.points >= 2000).length;
    console.log(`\n💎 Diamond:`);
    console.log(`  Points: ${user.points} >= 8,000? ${user.points >= 8000 ? '✅' : '❌'}`);
    console.log(`  Downline: ${diamondLines} lines with 2,000+ points (need 3)`);
    console.log(`  Qualifies: ${user.points >= 8000 && diamondLines >= 3 ? '✅ YES' : '❌ NO'}`);

    // Sapphire Diamond
    const sapphireDiamondLines = directReferrals.filter(r => r.rank?.title === 'Diamond').length;
    console.log(`\n💠 Sapphire Diamond:`);
    console.log(`  Points: NOT REQUIRED (removed) ✅`);
    console.log(`  Downline: ${sapphireDiamondLines} Diamond lines (need 3)`);
    console.log(`  Qualifies: ${sapphireDiamondLines >= 3 ? '✅ YES' : '❌ NO'}`);

    // Ambassador
    const ambassadorDiamondLines = sapphireDiamondLines;
    console.log(`\n🎖️ Ambassador:`);
    console.log(`  Points: NOT REQUIRED (removed) ✅`);
    console.log(`  Downline: ${ambassadorDiamondLines} Diamond lines (need 6)`);
    console.log(`  Qualifies: ${ambassadorDiamondLines >= 6 ? '✅ YES' : '❌ NO'}`);

    // Sapphire Ambassador
    const ambassadorLines = directReferrals.filter(r => r.rank?.title === 'Ambassador').length;
    console.log(`\n🌟 Sapphire Ambassador:`);
    console.log(`  Points: NOT REQUIRED (removed) ✅`);
    console.log(`  Option 1: ${ambassadorLines} Ambassador lines (need 3)`);
    console.log(`  Option 2: ${ambassadorDiamondLines} Diamond lines (need 10)`);
    console.log(`  Qualifies: ${ambassadorLines >= 3 || ambassadorDiamondLines >= 10 ? '✅ YES' : '❌ NO'}`);

    // Royal Ambassador
    const sapphireAmbassadorLines = directReferrals.filter(r => r.rank?.title === 'Sapphire Ambassador').length;
    console.log(`\n👑 Royal Ambassador:`);
    console.log(`  Points: NOT REQUIRED (removed) ✅`);
    console.log(`  Option 1: ${sapphireAmbassadorLines} Sapphire Ambassador lines (need 3)`);
    console.log(`  Option 2: ${ambassadorDiamondLines} Diamond lines (need 15)`);
    console.log(`  Qualifies: ${sapphireAmbassadorLines >= 3 || ambassadorDiamondLines >= 15 ? '✅ YES' : '❌ NO'}`);

    // Global Ambassador
    const royalAmbassadorLines = directReferrals.filter(r => r.rank?.title === 'Royal Ambassador').length;
    console.log(`\n🌍 Global Ambassador:`);
    console.log(`  Points: NOT REQUIRED (removed) ✅`);
    console.log(`  Option 1: ${royalAmbassadorLines} Royal Ambassador lines (need 3)`);
    console.log(`  Option 2: ${ambassadorDiamondLines} Diamond lines (need 25)`);
    console.log(`  Qualifies: ${royalAmbassadorLines >= 3 || ambassadorDiamondLines >= 25 ? '✅ YES' : '❌ NO'}`);

    // Honory Share Holder
    const globalAmbassadorLines = directReferrals.filter(r => r.rank?.title === 'Global Ambassador').length;
    console.log(`\n🏆 Honory Share Holder:`);
    console.log(`  Points: NOT REQUIRED (removed) ✅`);
    console.log(`  Option 1: ${globalAmbassadorLines} Global Ambassador lines (need 3)`);
    console.log(`  Option 2: ${ambassadorDiamondLines} Diamond + ${royalAmbassadorLines} Royal Ambassador (need 50 + 10)`);
    console.log(`  Qualifies: ${globalAmbassadorLines >= 3 || (ambassadorDiamondLines >= 50 && royalAmbassadorLines >= 10) ? '✅ YES' : '❌ NO'}`);

    // Update rank
    console.log('\n🔄 Updating rank...');
    console.log('─────────────────────────────────────');
    
    const newRank = await updateUserRank(user.id);
    
    if (newRank) {
      // Get updated user
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          rank: {
            select: {
              title: true,
              required_points: true
            }
          }
        }
      });

      console.log(`\n✅ Rank Update Complete!`);
      console.log('─────────────────────────────────────');
      console.log(`Old Rank: ${user.rank?.title || 'No Rank'}`);
      console.log(`New Rank: ${updatedUser.rank?.title || 'No Rank'}`);
      
      if (user.rank?.title !== updatedUser.rank?.title) {
        console.log(`\n🎉 RANK UPGRADED: ${user.rank?.title} → ${updatedUser.rank?.title}`);
      } else {
        console.log(`\nℹ️ Rank unchanged (already at highest qualifying rank)`);
      }
    } else {
      console.log('❌ Failed to update rank');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error details:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateBushra750Rank();

