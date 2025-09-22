import prisma from '../../../../lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    const { checkType, fixIssues, dryRun } = body;

    console.log('🔍 Orphan Account Check Request:', { checkType, fixIssues, dryRun });

    let result;

    switch (checkType) {
      case 'referrals':
        result = await checkOrphanAccountsWithReferrals(fixIssues, dryRun);
        break;
      case 'package_requests':
        result = await checkOrphanPackageRequests(fixIssues, dryRun);
        break;
      case 'earnings':
        result = await checkOrphanEarnings(fixIssues, dryRun);
        break;
      case 'all':
        result = await checkAllOrphanAccounts(fixIssues, dryRun);
        break;
      default:
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Invalid check type. Use: referrals, package_requests, earnings, or all'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Orphan account check completed',
        result
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Orphan account check API error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Orphan account check failed',
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Check orphan accounts with invalid referrals
async function checkOrphanAccountsWithReferrals(fixIssues = false, dryRun = true) {
  try {
    console.log('🔍 Checking orphan accounts with referrals...');
    
    // Find users with referrals
    const usersWithReferrals = await prisma.user.findMany({
      where: {
        referredBy: {
          not: null
        }
      },
      select: {
        id: true,
        username: true,
        fullname: true,
        referredBy: true,
        email: true,
        status: true,
        createdAt: true,
        referralCount: true
      }
    });

    console.log(`Found ${usersWithReferrals.length} users with referrals`);

    const orphanAccounts = [];
    const validReferrals = [];
    const circularReferrals = [];
    const selfReferrals = [];
    const missingReferrers = new Map();
    const fixes = [];

    // Check each user's referral
    for (const user of usersWithReferrals) {
      if (user.referredBy) {
        // Check for self-referral
        if (user.referredBy === user.username) {
          selfReferrals.push({
            id: user.id,
            username: user.username,
            fullname: user.fullname,
            issue: 'Self-referral detected'
          });

          if (fixIssues && !dryRun) {
            await prisma.user.update({
              where: { id: user.id },
              data: { referredBy: null }
            });
            fixes.push({
              type: 'self_referral',
              userId: user.id,
              username: user.username,
              action: 'Set referredBy to null'
            });
          }
          continue;
        }

        // Check if referrer exists
        const referrer = await prisma.user.findUnique({
          where: { username: user.referredBy },
          select: { 
            id: true, 
            username: true, 
            fullname: true, 
            status: true,
            referralCount: true
          }
        });

        if (!referrer) {
          // Orphan account - referrer doesn't exist
          orphanAccounts.push({
            id: user.id,
            username: user.username,
            fullname: user.fullname,
            referredBy: user.referredBy,
            email: user.email,
            status: user.status,
            createdAt: user.createdAt,
            issue: 'Referrer not found',
            severity: 'high'
          });

          // Track missing referrer
          if (!missingReferrers.has(user.referredBy)) {
            missingReferrers.set(user.referredBy, []);
          }
          missingReferrers.get(user.referredBy).push({
            id: user.id,
            username: user.username,
            fullname: user.fullname
          });

          if (fixIssues && !dryRun) {
            await prisma.user.update({
              where: { id: user.id },
              data: { referredBy: null }
            });
            fixes.push({
              type: 'orphan_referral',
              userId: user.id,
              username: user.username,
              action: 'Set referredBy to null (referrer not found)'
            });
          }
        } else if (referrer.status !== 'active') {
          // Referrer exists but is inactive
          orphanAccounts.push({
            id: user.id,
            username: user.username,
            fullname: user.fullname,
            referredBy: user.referredBy,
            email: user.email,
            status: user.status,
            createdAt: user.createdAt,
            referrerStatus: referrer.status,
            issue: 'Referrer is inactive',
            severity: 'medium'
          });
        } else {
          // Check for circular referral
          if (referrer.referredBy === user.username) {
            circularReferrals.push({
              user1: {
                id: user.id,
                username: user.username,
                fullname: user.fullname
              },
              user2: {
                id: referrer.id,
                username: referrer.username,
                fullname: referrer.fullname
              },
              issue: 'Circular referral detected'
            });

            if (fixIssues && !dryRun) {
              // Break the circular referral by setting the newer user's referredBy to null
              const newerUser = user.createdAt > referrer.createdAt ? user : referrer;
              await prisma.user.update({
                where: { id: newerUser.id },
                data: { referredBy: null }
              });
              fixes.push({
                type: 'circular_referral',
                userId: newerUser.id,
                username: newerUser.username,
                action: 'Broke circular referral chain'
              });
            }
          } else {
            // Valid referral
            validReferrals.push({
              id: user.id,
              username: user.username,
              referredBy: user.referredBy,
              referrerExists: true,
              referrerStatus: referrer.status
            });
          }
        }
      }
    }

    // Convert missing referrers map to array
    const missingReferrersArray = Array.from(missingReferrers.entries()).map(([username, users]) => ({
      username,
      referredUsersCount: users.length,
      referredUsers: users
    }));

    const stats = {
      totalUsersWithReferrals: usersWithReferrals.length,
      orphanAccountsCount: orphanAccounts.length,
      validReferralsCount: validReferrals.length,
      circularReferralsCount: circularReferrals.length,
      selfReferralsCount: selfReferrals.length,
      missingReferrersCount: missingReferrersArray.length,
      highSeverityIssues: orphanAccounts.filter(o => o.severity === 'high').length,
      mediumSeverityIssues: orphanAccounts.filter(o => o.severity === 'medium').length,
      fixesApplied: fixes.length
    };

    return {
      checkType: 'referrals',
      timestamp: new Date(),
      statistics: stats,
      orphanAccounts,
      validReferrals,
      circularReferrals,
      selfReferrals,
      missingReferrers: missingReferrersArray,
      fixes: fixes,
      dryRun,
      summary: {
        totalIssues: orphanAccounts.length + circularReferrals.length + selfReferrals.length,
        criticalIssues: stats.highSeverityIssues,
        moderateIssues: stats.mediumSeverityIssues,
        fixesApplied: fixes.length
      }
    };

  } catch (error) {
    console.error('Referral orphan check failed:', error);
    throw new Error(`Referral orphan check failed: ${error.message}`);
  }
}

// Check orphan package requests
async function checkOrphanPackageRequests(fixIssues = false, dryRun = true) {
  try {
    console.log('🔍 Checking orphan package requests...');
    
    const orphanPackageRequests = await prisma.packageRequest.findMany({
      where: {
        user: null
      },
      include: {
        package: true
      }
    });

    const fixes = [];
    
    if (fixIssues && !dryRun && orphanPackageRequests.length > 0) {
      // Delete orphan package requests
      for (const request of orphanPackageRequests) {
        await prisma.packageRequest.delete({
          where: { id: request.id }
        });
        fixes.push({
          type: 'orphan_package_request',
          requestId: request.id,
          action: 'Deleted orphan package request'
        });
      }
    }

    return {
      checkType: 'package_requests',
      timestamp: new Date(),
      statistics: {
        orphanPackageRequestsCount: orphanPackageRequests.length,
        fixesApplied: fixes.length
      },
      orphanPackageRequests,
      fixes,
      dryRun
    };

  } catch (error) {
    console.error('Package request orphan check failed:', error);
    throw new Error(`Package request orphan check failed: ${error.message}`);
  }
}

// Check orphan earnings
async function checkOrphanEarnings(fixIssues = false, dryRun = true) {
  try {
    console.log('🔍 Checking orphan earnings...');
    
    const orphanEarnings = await prisma.earnings.findMany({
      where: {
        user: null
      }
    });

    const fixes = [];
    
    if (fixIssues && !dryRun && orphanEarnings.length > 0) {
      // Delete orphan earnings
      for (const earning of orphanEarnings) {
        await prisma.earnings.delete({
          where: { id: earning.id }
        });
        fixes.push({
          type: 'orphan_earning',
          earningId: earning.id,
          action: 'Deleted orphan earning record'
        });
      }
    }

    return {
      checkType: 'earnings',
      timestamp: new Date(),
      statistics: {
        orphanEarningsCount: orphanEarnings.length,
        fixesApplied: fixes.length
      },
      orphanEarnings,
      fixes,
      dryRun
    };

  } catch (error) {
    console.error('Earnings orphan check failed:', error);
    throw new Error(`Earnings orphan check failed: ${error.message}`);
  }
}

// Check all types of orphan accounts
async function checkAllOrphanAccounts(fixIssues = false, dryRun = true) {
  try {
    console.log('🔍 Running comprehensive orphan account check...');
    
    const [referralResults, packageRequestResults, earningsResults] = await Promise.all([
      checkOrphanAccountsWithReferrals(fixIssues, dryRun),
      checkOrphanPackageRequests(fixIssues, dryRun),
      checkOrphanEarnings(fixIssues, dryRun)
    ]);

    const totalIssues = 
      referralResults.statistics.orphanAccountsCount +
      referralResults.statistics.circularReferralsCount +
      referralResults.statistics.selfReferralsCount +
      packageRequestResults.statistics.orphanPackageRequestsCount +
      earningsResults.statistics.orphanEarningsCount;

    const totalFixes = 
      referralResults.statistics.fixesApplied +
      packageRequestResults.statistics.fixesApplied +
      earningsResults.statistics.fixesApplied;

    return {
      checkType: 'all',
      timestamp: new Date(),
      statistics: {
        totalIssues,
        totalFixes,
        referralIssues: referralResults.statistics.orphanAccountsCount + referralResults.statistics.circularReferralsCount + referralResults.statistics.selfReferralsCount,
        packageRequestIssues: packageRequestResults.statistics.orphanPackageRequestsCount,
        earningsIssues: earningsResults.statistics.orphanEarningsCount
      },
      results: {
        referrals: referralResults,
        packageRequests: packageRequestResults,
        earnings: earningsResults
      },
      dryRun,
      summary: {
        requiresAction: totalIssues > 0,
        criticalIssues: referralResults.statistics.highSeverityIssues,
        totalFixesApplied: totalFixes
      }
    };

  } catch (error) {
    console.error('Comprehensive orphan check failed:', error);
    throw new Error(`Comprehensive orphan check failed: ${error.message}`);
  }
}

// GET endpoint to check orphan status without fixing
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const checkType = searchParams.get('type') || 'all';

    let result;

    switch (checkType) {
      case 'referrals':
        result = await checkOrphanAccountsWithReferrals(false, true);
        break;
      case 'package_requests':
        result = await checkOrphanPackageRequests(false, true);
        break;
      case 'earnings':
        result = await checkOrphanEarnings(false, true);
        break;
      case 'all':
        result = await checkAllOrphanAccounts(false, true);
        break;
      default:
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Invalid check type. Use: referrals, package_requests, earnings, or all'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Orphan account status retrieved',
        result
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error getting orphan status:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to get orphan status',
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}






