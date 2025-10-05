const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeSpecificPackageRequest() {
  try {
    console.log('🔍 ANALYZING SPECIFIC PACKAGE REQUEST 2349');
    console.log('=========================================\n');

    // Get package request 2349 details
    const packageRequest = await prisma.packageRequest.findUnique({
      where: { id: 2349 },
      include: {
        user: {
          include: {
            rank: true
          }
        },
        package: true,
        earnings: {
          include: {
            user: { select: { username: true } }
          }
        }
      }
    });

    if (!packageRequest) {
      console.log('❌ Package request 2349 not found');
      return;
    }

    console.log('📦 PACKAGE REQUEST DETAILS:');
    console.log('===========================');
    console.log(`ID: ${packageRequest.id}`);
    console.log(`Buyer: ${packageRequest.user.username}`);
    console.log(`Package: ${packageRequest.package.package_name}`);
    console.log(`Amount: ${packageRequest.package.package_amount}`);
    console.log(`Direct Commission: ${packageRequest.package.package_direct_commission}`);
    console.log(`Indirect Commission: ${packageRequest.package.package_indirect_commission}`);
    console.log(`Points: ${packageRequest.package.package_points}`);
    console.log('');

    // Show the complete referral tree
    console.log('🌳 COMPLETE REFERRAL TREE:');
    console.log('==========================');
    await showCompleteReferralTree(packageRequest.user.username);
    console.log('');

    // Analyze why indirect commission wasn't distributed
    console.log('🔍 INDIRECT COMMISSION ANALYSIS:');
    console.log('================================');
    
    const buyer = packageRequest.user;
    const directReferrerUsername = buyer.referredBy;
    
    console.log(`📊 Package Buyer: ${buyer.username}`);
    console.log(`📊 Direct Referrer: ${directReferrerUsername}`);
    console.log('');

    if (!directReferrerUsername) {
      console.log('❌ No direct referrer - no indirect commission possible');
      return;
    }

    // Get direct referrer details
    const directReferrer = await prisma.user.findUnique({
      where: { username: directReferrerUsername },
      include: { rank: true }
    });

    if (!directReferrer) {
      console.log('❌ Direct referrer not found');
      return;
    }

    console.log(`📊 Direct Referrer Details:`);
    console.log(`   Username: ${directReferrer.username}`);
    console.log(`   Rank: ${directReferrer.rank?.title || 'No Rank'}`);
    console.log(`   Points: ${directReferrer.points.toLocaleString()}`);
    console.log(`   Referred By: ${directReferrer.referredBy || 'Root User'}`);
    console.log('');

    // Find upline members (excluding direct referrer)
    const uplineMembers = [];
    let currentUsername = directReferrer.referredBy;
    let level = 0;

    console.log('🌳 UPLINE MEMBERS (excluding direct referrer):');
    console.log('==============================================');

    while (currentUsername && level < 10) {
      const user = await prisma.user.findUnique({
        where: { username: currentUsername },
        include: { rank: true }
      });

      if (!user) break;

      console.log(`${level + 1}. ${user.username}`);
      console.log(`   Rank: ${user.rank?.title || 'No Rank'}`);
      console.log(`   Points: ${user.points.toLocaleString()}`);
      console.log(`   Referred By: ${user.referredBy || 'Root User'}`);
      
      uplineMembers.push(user);
      currentUsername = user.referredBy;
      level++;
    }

    if (uplineMembers.length === 0) {
      console.log('❌ No upline members found');
      console.log('💡 This explains why no indirect commission was distributed');
      return;
    }

    console.log(`\n📊 Found ${uplineMembers.length} upline members`);
    console.log('');

    // Check indirect commission eligibility
    console.log('💰 INDIRECT COMMISSION ELIGIBILITY:');
    console.log('===================================');
    
    const ranks = await prisma.rank.findMany({
      orderBy: { required_points: 'asc' }
    });

    const rankHierarchy = ranks.map(rank => rank.title);
    const managerIndex = rankHierarchy.findIndex(rank => rank === 'Manager');

    console.log(`📊 Rank hierarchy: ${rankHierarchy.join(' → ')}`);
    console.log(`📊 Starting from Manager rank (index: ${managerIndex})`);
    console.log(`📊 Commission amount: ${packageRequest.package.package_indirect_commission}`);
    console.log('');

    // Group members by rank
    const membersByRank = {};
    uplineMembers.forEach(member => {
      const rankTitle = member.rank?.title || 'No Rank';
      if (!membersByRank[rankTitle]) {
        membersByRank[rankTitle] = [];
      }
      membersByRank[rankTitle].push(member);
    });

    console.log('📊 Members grouped by rank:');
    Object.entries(membersByRank).forEach(([rank, members]) => {
      console.log(`   ${rank}: ${members.map(m => m.username).join(', ')}`);
    });
    console.log('');

    // Simulate the distribution logic
    console.log('🔄 SIMULATING DISTRIBUTION LOGIC:');
    console.log('=================================');
    
    let accumulatedCommission = 0;
    let accumulatedRanks = [];
    const indirectCommission = parseFloat(packageRequest.package.package_indirect_commission);

    for (let i = managerIndex; i < rankHierarchy.length; i++) {
      const currentRank = rankHierarchy[i];
      
      if (currentRank === 'Consultant') {
        console.log(`⏭️  Skipping ${currentRank} (Consultants don't get indirect commission)`);
        continue;
      }

      const membersOfRank = membersByRank[currentRank] || [];
      
      if (membersOfRank.length > 0) {
        const firstMember = membersOfRank[0];
        const totalCommission = accumulatedCommission + indirectCommission;
        
        console.log(`✅ Found ${currentRank}: ${firstMember.username}`);
        console.log(`   Commission: ${totalCommission} (${accumulatedCommission} accumulated + ${indirectCommission} current)`);
        
        if (accumulatedRanks.length > 0) {
          console.log(`   Includes accumulated from: ${accumulatedRanks.join(', ')}`);
        }
        
        console.log(`   🎯 ${firstMember.username} should have received ${totalCommission} indirect commission`);
        
        accumulatedCommission = 0;
        accumulatedRanks = [];
      } else {
        console.log(`❌ No ${currentRank} found`);
        console.log(`   Accumulating: ${indirectCommission} commission`);
        
        accumulatedCommission += indirectCommission;
        accumulatedRanks.push(currentRank);
      }
    }

    if (accumulatedCommission > 0) {
      console.log(`\n⚠️  FINAL RESULT:`);
      console.log(`   ${accumulatedCommission} commission accumulated from: ${accumulatedRanks.join(', ')}`);
      console.log(`   No eligible users found for these ranks`);
    }

    console.log('\n💡 CONCLUSION:');
    console.log('===============');
    console.log('Based on the analysis:');
    
    if (uplineMembers.length > 0) {
      const eligibleMembers = uplineMembers.filter(m => 
        m.rank && ['Manager', 'Sapphire Manager', 'Diamond', 'Sapphire Diamond', 'Ambassador', 'Sapphire Ambassador', 'Royal Ambassador', 'Global Ambassador', 'Honory Share Holder'].includes(m.rank.title)
      );
      
      if (eligibleMembers.length > 0) {
        console.log(`✅ Found ${eligibleMembers.length} eligible upline members for indirect commission`);
        console.log('❌ But no indirect commission was distributed');
        console.log('💡 This suggests there may be an issue with the indirect commission logic');
      } else {
        console.log(`❌ No eligible upline members found (all are Consultant rank or below)`);
        console.log('✅ This explains why no indirect commission was distributed');
      }
    } else {
      console.log('❌ No upline members found');
      console.log('✅ This explains why no indirect commission was distributed');
    }

  } catch (error) {
    console.error('❌ Error analyzing specific package request:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function showCompleteReferralTree(username) {
  const users = [];
  let currentUsername = username;
  const processedUsers = new Set();
  let level = 0;
  const maxLevels = 15;

  while (currentUsername && level < maxLevels) {
    const user = await prisma.user.findUnique({
      where: { username: currentUsername },
      select: {
        username: true,
        referredBy: true,
        points: true,
        rank: { select: { title: true } }
      }
    });

    if (!user || processedUsers.has(user.username)) {
      break;
    }

    users.push({ ...user, level });
    processedUsers.add(user.username);
    currentUsername = user.referredBy;
    level++;
  }

  users.forEach((user, index) => {
    const indent = '  '.repeat(user.level);
    const arrow = index === 0 ? '🎯' : '👆';
    const rankStatus = user.rank?.title ? `✅ ${user.rank.title}` : '❌ No Rank';
    console.log(`${indent}${arrow} ${user.username}`);
    console.log(`${indent}   Points: ${user.points.toLocaleString()}`);
    console.log(`${indent}   Rank: ${rankStatus}`);
    console.log(`${indent}   Referred By: ${user.referredBy || 'Root User'}`);
  });
}

analyzeSpecificPackageRequest();
