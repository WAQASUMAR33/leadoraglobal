import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getRankIcon(rank) {
  const icons = {
    'Ambassador': '🎖️',
    'Sapphire Diamond': '💠',
    'Diamond': '💎',
    'Sapphire Manager': '💼',
    'Manager': '📊',
    'Consultant': '👤'
  };
  return icons[rank] || '⚪';
}

async function showBushra750DirectReferrals() {
  try {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║           BUSHRA750 - DIRECT REFERRALS                       ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    // Get bushra750 info
    const bushra = await prisma.user.findUnique({
      where: { username: 'bushra750' },
      select: {
        id: true,
        username: true,
        fullname: true,
        points: true,
        balance: true,
        referralCount: true,
        rank: {
          select: {
            title: true
          }
        }
      }
    });

    if (!bushra) {
      console.log('❌ User bushra750 not found\n');
      return;
    }

    console.log('👤 ROOT USER:');
    console.log('─────────────────────────────────────────────────────────────');
    const rankIcon = getRankIcon(bushra.rank?.title);
    console.log(`${rankIcon} ${bushra.username} (${bushra.fullname})`);
    console.log(`Points: ${bushra.points.toLocaleString()}`);
    console.log(`Rank: ${bushra.rank?.title || 'No Rank'}`);
    console.log(`Balance: PKR ${parseFloat(bushra.balance).toLocaleString()}`);
    console.log(`Total Referrals: ${bushra.referralCount || 0}`);
    console.log('─────────────────────────────────────────────────────────────\n');

    // Get direct referrals
    const directReferrals = await prisma.user.findMany({
      where: { referredBy: 'bushra750' },
      select: {
        id: true,
        username: true,
        fullname: true,
        points: true,
        balance: true,
        status: true,
        referralCount: true,
        createdAt: true,
        currentPackage: {
          select: {
            package_name: true,
            package_amount: true
          }
        },
        rank: {
          select: {
            title: true
          }
        }
      },
      orderBy: { points: 'desc' }
    });

    console.log(`📊 DIRECT REFERRALS: ${directReferrals.length}\n`);
    console.log('═════════════════════════════════════════════════════════════════\n');

    // Display each referral
    directReferrals.forEach((referral, index) => {
      const refRankIcon = getRankIcon(referral.rank?.title);
      const joinDate = new Date(referral.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      console.log(`${index + 1}. ${refRankIcon} ${referral.username} (${referral.fullname})`);
      console.log(`   ─────────────────────────────────────────────────────────────`);
      console.log(`   Points:          ${referral.points.toLocaleString()}`);
      console.log(`   Rank:            ${referral.rank?.title || 'No Rank'}`);
      console.log(`   Balance:         PKR ${parseFloat(referral.balance).toLocaleString()}`);
      console.log(`   Status:          ${referral.status}`);
      console.log(`   Package:         ${referral.currentPackage?.package_name || 'No Package'}`);
      if (referral.currentPackage?.package_amount) {
        console.log(`   Package Amount:  PKR ${parseFloat(referral.currentPackage.package_amount).toLocaleString()}`);
      }
      console.log(`   Their Referrals: ${referral.referralCount || 0}`);
      console.log(`   Joined:          ${joinDate}`);
      console.log('');
    });

    // Summary statistics
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    SUMMARY STATISTICS                         ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    const totalPoints = directReferrals.reduce((sum, ref) => sum + ref.points, 0);
    const totalBalance = directReferrals.reduce((sum, ref) => sum + parseFloat(ref.balance), 0);
    const totalSubReferrals = directReferrals.reduce((sum, ref) => sum + (ref.referralCount || 0), 0);
    const activeMembers = directReferrals.filter(ref => ref.status === 'active').length;
    const withPackage = directReferrals.filter(ref => ref.currentPackage?.package_name).length;

    console.log(`📊 Total Direct Referrals:    ${directReferrals.length}`);
    console.log(`✅ Active Members:             ${activeMembers}`);
    console.log(`📦 With Active Package:        ${withPackage}`);
    console.log(`💰 Total Points:               ${totalPoints.toLocaleString()}`);
    console.log(`💵 Total Balance:              PKR ${totalBalance.toLocaleString()}`);
    console.log(`👥 Total Sub-Referrals:        ${totalSubReferrals}`);
    console.log(`📈 Average Points per Member:  ${Math.round(totalPoints / directReferrals.length).toLocaleString()}`);
    console.log(`📊 Average Referrals per Member: ${Math.round(totalSubReferrals / directReferrals.length)}`);

    // Rank distribution
    console.log('\n🏆 Rank Distribution:');
    console.log('─────────────────────────────────────');
    const rankCounts = {};
    directReferrals.forEach(ref => {
      const rank = ref.rank?.title || 'No Rank';
      rankCounts[rank] = (rankCounts[rank] || 0) + 1;
    });

    const sortedRanks = Object.entries(rankCounts).sort((a, b) => b[1] - a[1]);
    sortedRanks.forEach(([rank, count]) => {
      const icon = getRankIcon(rank);
      const percentage = ((count / directReferrals.length) * 100).toFixed(1);
      console.log(`${icon} ${rank.padEnd(25)}: ${count.toString().padStart(2)} (${percentage}%)`);
    });

    // Top performers
    console.log('\n🌟 Top 5 by Points:');
    console.log('─────────────────────────────────────');
    const topByPoints = [...directReferrals].slice(0, 5);
    topByPoints.forEach((ref, index) => {
      const icon = getRankIcon(ref.rank?.title);
      console.log(`${index + 1}. ${icon} ${ref.username.padEnd(20)} - ${ref.points.toLocaleString().padStart(10)} pts`);
    });

    console.log('\n👥 Top 5 by Sub-Referrals:');
    console.log('─────────────────────────────────────');
    const topByReferrals = [...directReferrals].sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0)).slice(0, 5);
    topByReferrals.forEach((ref, index) => {
      const icon = getRankIcon(ref.rank?.title);
      console.log(`${index + 1}. ${icon} ${ref.username.padEnd(20)} - ${(ref.referralCount || 0).toString().padStart(4)} referrals`);
    });

    // Package distribution
    console.log('\n📦 Package Distribution:');
    console.log('─────────────────────────────────────');
    const packageCounts = {};
    directReferrals.forEach(ref => {
      const pkg = ref.currentPackage?.package_name || 'No Package';
      packageCounts[pkg] = (packageCounts[pkg] || 0) + 1;
    });

    const sortedPackages = Object.entries(packageCounts).sort((a, b) => b[1] - a[1]);
    sortedPackages.forEach(([pkg, count]) => {
      const percentage = ((count / directReferrals.length) * 100).toFixed(1);
      console.log(`${pkg.padEnd(25)}: ${count.toString().padStart(2)} (${percentage}%)`);
    });

    console.log('\n═════════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

showBushra750DirectReferrals();

