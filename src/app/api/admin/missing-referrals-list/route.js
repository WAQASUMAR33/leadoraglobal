import prisma from '../../../../lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 100;
    const offset = parseInt(searchParams.get('offset')) || 0;
    const includeDetails = searchParams.get('includeDetails') === 'true';

    console.log('🔍 Fetching accounts with missing referrals...', { limit, offset, includeDetails });

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
        email: true,
        phoneNumber: true,
        referredBy: true,
        status: true,
        balance: true,
        points: true,
        totalEarnings: true,
        createdAt: true,
        updatedAt: true
      },
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${usersWithReferrals.length} users with referrals`);

    const accountsWithMissingReferrals = [];
    const missingReferrers = new Map();
    const validReferrals = [];
    const inactiveReferrers = [];

    // Check each user's referral
    for (const user of usersWithReferrals) {
      if (user.referredBy) {
        // Check if referrer exists
        const referrer = await prisma.user.findUnique({
          where: { username: user.referredBy },
          select: { 
            id: true, 
            username: true, 
            fullname: true, 
            status: true,
            email: true,
            createdAt: true,
            updatedAt: true
          }
        });

        if (!referrer) {
          // Missing referrer - this is what we're looking for
          const accountInfo = {
            id: user.id,
            username: user.username,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            status: user.status,
            balance: user.balance,
            points: user.points,
            totalEarnings: user.totalEarnings,
            referredBy: user.referredBy,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            issue: 'Referrer not found',
            severity: 'high',
            daysSinceCreated: Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))
          };

          if (includeDetails) {
            // Get additional details about the user
            const userDetails = await prisma.user.findUnique({
              where: { id: user.id },
              include: {
                package: {
                  select: {
                    id: true,
                    package_name: true,
                    package_amount: true
                  }
                },
                rank: {
                  select: {
                    id: true,
                    title: true,
                    required_points: true
                  }
                },
                currentPackage: {
                  select: {
                    id: true,
                    package_name: true,
                    package_amount: true
                  }
                },
                packageRequests: {
                  select: {
                    id: true,
                    status: true,
                    createdAt: true
                  },
                  take: 5,
                  orderBy: {
                    createdAt: 'desc'
                  }
                },
                earnings: {
                  select: {
                    id: true,
                    amount: true,
                    type: true,
                    createdAt: true
                  },
                  take: 5,
                  orderBy: {
                    createdAt: 'desc'
                  }
                }
              }
            });

            accountInfo.details = {
              package: userDetails?.package,
              rank: userDetails?.rank,
              currentPackage: userDetails?.currentPackage,
              recentPackageRequests: userDetails?.packageRequests || [],
              recentEarnings: userDetails?.earnings || []
            };
          }

          accountsWithMissingReferrals.push(accountInfo);

          // Track missing referrer
          if (!missingReferrers.has(user.referredBy)) {
            missingReferrers.set(user.referredBy, {
              username: user.referredBy,
              referredUsers: [],
              totalAffectedUsers: 0,
              totalBalance: 0,
              totalEarnings: 0
            });
          }

          const referrerInfo = missingReferrers.get(user.referredBy);
          referrerInfo.referredUsers.push({
            id: user.id,
            username: user.username,
            fullname: user.fullname,
            status: user.status,
            balance: user.balance,
            totalEarnings: user.totalEarnings,
            createdAt: user.createdAt
          });
          referrerInfo.totalAffectedUsers++;
          referrerInfo.totalBalance += parseFloat(user.balance || 0);
          referrerInfo.totalEarnings += parseFloat(user.totalEarnings || 0);

        } else if (referrer.status !== 'active') {
          // Referrer exists but is inactive
          inactiveReferrers.push({
            id: user.id,
            username: user.username,
            fullname: user.fullname,
            email: user.email,
            status: user.status,
            referredBy: user.referredBy,
            referrerStatus: referrer.status,
            referrerInfo: {
              id: referrer.id,
              username: referrer.username,
              fullname: referrer.fullname,
              email: referrer.email,
              status: referrer.status,
              createdAt: referrer.createdAt,
              updatedAt: referrer.updatedAt
            },
            issue: 'Referrer is inactive',
            severity: 'medium',
            daysSinceCreated: Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))
          });
        } else {
          // Valid referral
          validReferrals.push({
            id: user.id,
            username: user.username,
            fullname: user.fullname,
            referredBy: user.referredBy,
            referrerExists: true,
            referrerStatus: referrer.status,
            createdAt: user.createdAt
          });
        }
      }
    }

    // Convert missing referrers map to array
    const missingReferrersArray = Array.from(missingReferrers.values()).map(referrer => ({
      ...referrer,
      averageBalance: referrer.totalAffectedUsers > 0 ? (referrer.totalBalance / referrer.totalAffectedUsers).toFixed(2) : 0,
      averageEarnings: referrer.totalAffectedUsers > 0 ? (referrer.totalEarnings / referrer.totalAffectedUsers).toFixed(2) : 0
    }));

    // Sort by number of affected users
    missingReferrersArray.sort((a, b) => b.totalAffectedUsers - a.totalAffectedUsers);

    // Generate statistics
    const stats = {
      totalUsersWithReferrals: usersWithReferrals.length,
      accountsWithMissingReferrals: accountsWithMissingReferrals.length,
      validReferrals: validReferrals.length,
      inactiveReferrers: inactiveReferrers.length,
      uniqueMissingReferrers: missingReferrersArray.length,
      totalAffectedUsers: accountsWithMissingReferrals.length,
      totalBalanceAffected: accountsWithMissingReferrals.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0),
      totalEarningsAffected: accountsWithMissingReferrals.reduce((sum, acc) => sum + parseFloat(acc.totalEarnings || 0), 0),
      averageBalancePerAffectedUser: accountsWithMissingReferrals.length > 0 ? 
        (accountsWithMissingReferrals.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0) / accountsWithMissingReferrals.length).toFixed(2) : 0,
      averageEarningsPerAffectedUser: accountsWithMissingReferrals.length > 0 ? 
        (accountsWithMissingReferrals.reduce((sum, acc) => sum + parseFloat(acc.totalEarnings || 0), 0) / accountsWithMissingReferrals.length).toFixed(2) : 0
    };

    // Generate recommendations
    const recommendations = [];
    
    if (accountsWithMissingReferrals.length > 0) {
      recommendations.push({
        type: 'recreate_missing_referrers',
        priority: 'high',
        description: 'Recreate missing referrer accounts',
        action: 'Recreate deleted referrer accounts or reassign referrals to valid referrers',
        affectedCount: accountsWithMissingReferrals.length,
        estimatedImpact: `$${stats.totalBalanceAffected.toFixed(2)} in balances, $${stats.totalEarningsAffected.toFixed(2)} in earnings`
      });
    }

    if (inactiveReferrers.length > 0) {
      recommendations.push({
        type: 'reactivate_referrers',
        priority: 'medium',
        description: 'Reactivate inactive referrer accounts',
        action: 'Reactivate suspended/inactive referrer accounts',
        affectedCount: inactiveReferrers.length
      });
    }

    const result = {
      success: true,
      message: 'Accounts with missing referrals retrieved successfully',
      timestamp: new Date(),
      statistics: stats,
      accountsWithMissingReferrals,
      missingReferrers: missingReferrersArray,
      inactiveReferrers,
      validReferrals,
      recommendations,
      pagination: {
        limit,
        offset,
        total: accountsWithMissingReferrals.length
      },
      summary: {
        criticalIssues: accountsWithMissingReferrals.length,
        moderateIssues: inactiveReferrers.length,
        requiresAction: recommendations.length > 0,
        financialImpact: {
          totalBalance: stats.totalBalanceAffected,
          totalEarnings: stats.totalEarningsAffected,
          averageBalance: stats.averageBalancePerAffectedUser,
          averageEarnings: stats.averageEarningsPerAffectedUser
        }
      }
    };

    console.log('Missing referrals check completed:', {
      totalUsers: stats.totalUsersWithReferrals,
      missingReferrals: stats.accountsWithMissingReferrals,
      uniqueMissingReferrers: stats.uniqueMissingReferrers,
      financialImpact: `$${stats.totalBalanceAffected.toFixed(2)}`
    });

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching accounts with missing referrals:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch accounts with missing referrals',
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST endpoint to export missing referrals list
export async function POST(request) {
  try {
    const body = await request.json();
    const { format, includeDetails } = body;

    console.log('📤 Exporting accounts with missing referrals...', { format, includeDetails });

    // Get all accounts with missing referrals (no pagination for export)
    const response = await fetch(`http://localhost:3000/api/admin/missing-referrals-list?limit=10000&includeDetails=${includeDetails || false}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch missing referrals data');
    }

    const data = await response.json();
    const result = data;

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertMissingReferralsToCSV(result);
      
      return new Response(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="missing_referrals_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    } else {
      // Return JSON format
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Missing referrals exported successfully',
          data: result,
          exportedAt: new Date(),
          format: 'json'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error exporting missing referrals:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to export missing referrals',
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Convert missing referrals data to CSV format
function convertMissingReferralsToCSV(data) {
  let csv = '';
  
  // CSV header
  csv = 'ID,Username,Full Name,Email,Phone,Status,Balance,Points,Total Earnings,Referred By,Issue,Severity,Days Since Created,Created At\n';
  
  // CSV rows for accounts with missing referrals
  data.accountsWithMissingReferrals.forEach(account => {
    csv += `${account.id},"${account.username}","${account.fullname}","${account.email || ''}","${account.phoneNumber || ''}","${account.status}","${account.balance}","${account.points}","${account.totalEarnings}","${account.referredBy}","${account.issue}","${account.severity}","${account.daysSinceCreated}","${account.createdAt}"\n`;
  });
  
  // Add separator and missing referrers summary
  csv += '\n\nMissing Referrers Summary:\n';
  csv += 'Username,Affected Users,Total Balance,Total Earnings,Average Balance,Average Earnings\n';
  
  data.missingReferrers.forEach(referrer => {
    csv += `"${referrer.username}","${referrer.totalAffectedUsers}","${referrer.totalBalance}","${referrer.totalEarnings}","${referrer.averageBalance}","${referrer.averageEarnings}"\n`;
  });
  
  return csv;
}


