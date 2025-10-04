const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../src/lib/auth.js');

const prisma = new PrismaClient();

async function testDashboardAPI() {
  try {
    console.log('🧪 TESTING DASHBOARD API FOR TOUSEEF231');
    console.log('=========================================\n');

    // First, get Touseef231's user ID
    const user = await prisma.user.findUnique({
      where: { username: 'Touseef231' },
      select: { id: true, username: true, points: true, rank: { select: { title: true } } }
    });

    if (!user) {
      console.log('❌ User Touseef231 not found');
      return;
    }

    console.log('📊 User Data:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Username: ${user.username}`);
    console.log(`  Points: ${user.points.toLocaleString()}`);
    console.log(`  Current Rank: ${user.rank?.title || 'No Rank'}`);
    console.log('');

    // Simulate the dashboard API query
    console.log('🔍 Simulating Dashboard API Query...');
    
    const dashboardUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        fullname: true,
        username: true,
        balance: true,
        points: true,
        totalEarnings: true,
        referralCount: true,
        currentPackageId: true,
        packageExpiryDate: true,
        createdAt: true,
        rank: {
          select: {
            id: true,
            title: true,
            required_points: true
          }
        }
      }
    });

    console.log('📊 Dashboard API Response:');
    console.log(`  User ID: ${dashboardUser.id}`);
    console.log(`  Username: ${dashboardUser.username}`);
    console.log(`  Points: ${dashboardUser.points.toLocaleString()}`);
    console.log(`  Rank Title: ${dashboardUser.rank?.title || 'No Rank'}`);
    console.log(`  Rank ID: ${dashboardUser.rank?.id || 'No ID'}`);
    console.log(`  Rank Required Points: ${dashboardUser.rank?.required_points?.toLocaleString() || 'N/A'}`);
    console.log('');

    // Check if the rank is correct
    if (dashboardUser.rank?.title === 'Royal Ambassador') {
      console.log('✅ Dashboard API is returning the correct rank: Royal Ambassador');
    } else {
      console.log(`❌ Dashboard API is returning incorrect rank: ${dashboardUser.rank?.title || 'No Rank'}`);
      console.log('   Expected: Royal Ambassador');
    }

    // Show what the dashboard would display
    console.log('\n🖥️ Dashboard Display:');
    console.log('===================');
    console.log(`Current Rank: ${dashboardUser.rank?.title || 'No Rank'}`);
    console.log(`Total Points: ${dashboardUser.points.toLocaleString()}`);

  } catch (error) {
    console.error('❌ Error testing dashboard API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboardAPI();
