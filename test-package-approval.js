const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPackageApprovalLogic() {
  console.log('🧪 Testing Package Approval Logic...\n');

  try {
    // 1. Check if there are any pending package requests
    const pendingRequests = await prisma.packageRequest.findMany({
      where: { status: 'pending' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullname: true,
            referredBy: true,
            points: true,
            balance: true,
            rank: {
              select: {
                title: true
              }
            }
          }
        },
        package: {
          select: {
            id: true,
            package_name: true,
            package_amount: true,
            package_direct_commission: true,
            package_indirect_commission: true,
            package_points: true
          }
        }
      }
    });

    console.log(`📋 Found ${pendingRequests.length} pending package requests:`);
    pendingRequests.forEach((request, index) => {
      console.log(`  ${index + 1}. Request ID: ${request.id}`);
      console.log(`     User: ${request.user.username} (${request.user.fullname})`);
      console.log(`     Package: ${request.package.package_name} - ₨${request.package.package_amount}`);
      console.log(`     Direct Commission: ₨${request.package.package_direct_commission}`);
      console.log(`     Indirect Commission: ₨${request.package.package_indirect_commission}`);
      console.log(`     Points: ${request.package.package_points}`);
      console.log(`     Referred By: ${request.user.referredBy || 'No referrer'}`);
      console.log(`     Current Points: ${request.user.points}`);
      console.log(`     Current Balance: ₨${request.user.balance}`);
      console.log(`     Current Rank: ${request.user.rank?.title || 'No rank'}`);
      console.log('');
    });

    if (pendingRequests.length === 0) {
      console.log('❌ No pending package requests found. Cannot test approval logic.');
      return;
    }

    // 2. Test the approval logic for the first pending request
    const testRequest = pendingRequests[0];
    console.log(`🎯 Testing approval logic for Request ID: ${testRequest.id}`);
    console.log(`   User: ${testRequest.user.username}`);
    console.log(`   Package: ${testRequest.package.package_name}\n`);

    // 3. Check the referral tree structure
    console.log('🌳 Checking referral tree structure:');
    const treeMembers = await getReferralTree(testRequest.user.username);
    console.log(`   Found ${treeMembers.length} members in referral tree:`);
    treeMembers.forEach((member, index) => {
      console.log(`     ${index + 1}. ${member.username} (${member.rank?.title || 'No rank'}) - Points: ${member.points}, Balance: ₨${member.balance}`);
    });
    console.log('');

    // 4. Check what would happen with commission distribution
    console.log('💰 Commission Distribution Analysis:');
    console.log(`   Direct Commission (₨${testRequest.package.package_direct_commission}) would go to: ${testRequest.user.referredBy || 'No one (no referrer)'}`);
    
    // Check indirect commission recipients
    const indirectRecipients = await analyzeIndirectCommissionRecipients(testRequest.user.username, testRequest.package.package_indirect_commission);
    console.log(`   Indirect Commission (₨${testRequest.package.package_indirect_commission}) would go to:`);
    indirectRecipients.forEach(recipient => {
      console.log(`     - ${recipient.username} (${recipient.rank?.title || 'No rank'}): ₨${recipient.amount} - ${recipient.reason}`);
    });
    console.log('');

    // 5. Check rank update logic
    console.log('🏆 Rank Update Analysis:');
    const rankAnalysis = await analyzeRankUpdates(testRequest.user.username, testRequest.package.package_points);
    console.log(`   Points to be added: ${testRequest.package.package_points}`);
    console.log(`   Current points: ${testRequest.user.points}`);
    console.log(`   New total points: ${testRequest.user.points + testRequest.package.package_points}`);
    console.log(`   Current rank: ${testRequest.user.rank?.title || 'No rank'}`);
    console.log(`   Expected new rank: ${rankAnalysis.expectedRank}`);
    console.log('');

    // 6. Check for any potential issues
    console.log('⚠️  Potential Issues Check:');
    const issues = await checkForIssues(testRequest);
    if (issues.length === 0) {
      console.log('   ✅ No issues found. Package approval should work correctly.');
    } else {
      console.log('   ❌ Issues found:');
      issues.forEach((issue, index) => {
        console.log(`     ${index + 1}. ${issue}`);
      });
    }

  } catch (error) {
    console.error('❌ Error testing package approval logic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function getReferralTree(username) {
  const members = [];
  let currentUsername = username;
  const processedUsers = new Set();

  while (currentUsername) {
    const user = await prisma.user.findUnique({
      where: { username: currentUsername },
      include: {
        rank: true
      }
    });

    if (!user || processedUsers.has(user.id)) {
      break;
    }

    members.push(user);
    processedUsers.add(user.id);
    currentUsername = user.referredBy;
  }

  return members;
}

async function analyzeIndirectCommissionRecipients(username, indirectCommission) {
  // Get all ranks from database
  const ranks = await prisma.rank.findMany({
    orderBy: { required_points: 'asc' }
  });

  const rankHierarchy = ranks.map(rank => rank.title);
  
  // Get tree members excluding direct referrer
  const newUser = await prisma.user.findUnique({
    where: { username: username }
  });

  if (!newUser || !newUser.referredBy) {
    return [];
  }

  const directReferrerUsername = newUser.referredBy;
  const members = [];
  let currentUsername = directReferrerUsername;
  const processedUsers = new Set();

  while (currentUsername) {
    const user = await prisma.user.findUnique({
      where: { username: currentUsername },
      include: {
        rank: true
      }
    });

    if (!user || processedUsers.has(user.id)) {
      break;
    }

    // Skip the direct referrer
    if (currentUsername === directReferrerUsername) {
      currentUsername = user.referredBy;
      continue;
    }

    members.push(user);
    processedUsers.add(user.id);
    currentUsername = user.referredBy;
  }

  // Group by rank and analyze
  const membersByRank = {};
  members.forEach(member => {
    const rankTitle = member.rank?.title || 'No Rank';
    if (!membersByRank[rankTitle]) {
      membersByRank[rankTitle] = [];
    }
    membersByRank[rankTitle].push(member);
  });

  const recipients = [];
  const processedRanks = new Set();

  // Process from highest to lowest rank
  for (let i = rankHierarchy.length - 1; i >= 0; i--) {
    const currentRank = rankHierarchy[i];
    
    if (currentRank === 'Consultant' || processedRanks.has(currentRank)) {
      continue;
    }

    const membersOfRank = membersByRank[currentRank] || [];
    
    if (membersOfRank.length > 0) {
      const firstMember = membersOfRank[0];
      recipients.push({
        username: firstMember.username,
        rank: currentRank,
        amount: indirectCommission,
        reason: `First ${currentRank} in tree`
      });
      processedRanks.add(currentRank);
    } else {
      // Check for upper rank
      const upperRank = findUpperRank(currentRank, rankHierarchy);
      if (upperRank && !processedRanks.has(upperRank)) {
        const upperRankMembers = membersByRank[upperRank] || [];
        if (upperRankMembers.length > 0) {
          const firstUpperMember = upperRankMembers[0];
          recipients.push({
            username: firstUpperMember.username,
            rank: upperRank,
            amount: indirectCommission * 2,
            reason: `Combined commission (includes ${currentRank})`
          });
          processedRanks.add(upperRank);
        }
      }
    }
  }

  return recipients;
}

function findUpperRank(currentRank, rankHierarchy) {
  const currentIndex = rankHierarchy.indexOf(currentRank);
  if (currentIndex < rankHierarchy.length - 1) {
    return rankHierarchy[currentIndex + 1];
  }
  return null;
}

async function analyzeRankUpdates(username, pointsToAdd) {
  const user = await prisma.user.findUnique({
    where: { username: username },
    select: {
      points: true,
      rank: {
        select: {
          title: true
        }
      }
    }
  });

  if (!user) {
    return { expectedRank: 'Unknown' };
  }

  const newPoints = user.points + pointsToAdd;
  
  // Simple rank calculation based on points
  let expectedRank = 'Consultant';
  if (newPoints >= 100000) expectedRank = 'Honorary Share Holder';
  else if (newPoints >= 50000) expectedRank = 'Global Ambassador';
  else if (newPoints >= 25000) expectedRank = 'Royal Ambassador';
  else if (newPoints >= 15000) expectedRank = 'Sapphire Ambassador';
  else if (newPoints >= 10000) expectedRank = 'Ambassador';
  else if (newPoints >= 8000) expectedRank = 'Sapphire Diamond';
  else if (newPoints >= 2000) expectedRank = 'Sapphire Manager';
  else if (newPoints >= 1000) expectedRank = 'Manager';

  return { expectedRank };
}

async function checkForIssues(packageRequest) {
  const issues = [];

  // Check if user has referrer
  if (!packageRequest.user.referredBy) {
    issues.push('User has no referrer - no direct commission will be distributed');
  }

  // Check if package has valid commission values
  if (packageRequest.package.package_direct_commission <= 0) {
    issues.push('Package has zero or negative direct commission');
  }

  if (packageRequest.package.package_indirect_commission <= 0) {
    issues.push('Package has zero or negative indirect commission');
  }

  // Check if package has points
  if (!packageRequest.package.package_points || packageRequest.package.package_points <= 0) {
    issues.push('Package has no points assigned');
  }

  // Check if user already has a package
  if (packageRequest.user.currentPackageId) {
    issues.push('User already has an active package - this will replace it');
  }

  return issues;
}

// Run the test
testPackageApprovalLogic();












