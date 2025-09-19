import prisma from '../../../../lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 100;
    const offset = parseInt(searchParams.get('offset')) || 0;
    const includeDetails = searchParams.get('includeDetails') === 'true';
    const status = searchParams.get('status') || 'all'; // all, active, inactive, suspended, etc.

    console.log('🔍 Fetching accounts without referrals...', { limit, offset, includeDetails, status });

    // Build where clause
    let whereClause = {
      referredBy: null
    };

    // Add status filter if specified
    if (status !== 'all') {
      whereClause.status = status;
    }

    // Find users without referrals
    const usersWithoutReferrals = await prisma.user.findMany({
      where: whereClause,
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
        referralCount: true,
        createdAt: true,
        updatedAt: true
      },
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${usersWithoutReferrals.length} users without referrals`);

    const accountsWithoutReferrals = [];

    // Process each user
    for (const user of usersWithoutReferrals) {
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
        referralCount: user.referralCount,
        referredBy: user.referredBy,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        daysSinceCreated: Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)),
        daysSinceUpdated: Math.floor((new Date() - new Date(user.updatedAt)) / (1000 * 60 * 60 * 24))
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
                createdAt: true,
                package: {
                  select: {
                    package_name: true,
                    package_amount: true
                  }
                }
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
                description: true,
                createdAt: true
              },
              take: 5,
              orderBy: {
                createdAt: 'desc'
              }
            },
            kyc: {
              select: {
                id: true,
                kyc_status: true,
                createdAt: true
              }
            }
          }
        });

        accountInfo.details = {
          package: userDetails?.package,
          rank: userDetails?.rank,
          currentPackage: userDetails?.currentPackage,
          recentPackageRequests: userDetails?.packageRequests || [],
          recentEarnings: userDetails?.earnings || [],
          kyc: userDetails?.kyc
        };
      }

      accountsWithoutReferrals.push(accountInfo);
    }

    // Get total count for pagination
    const totalCount = await prisma.user.count({
      where: whereClause
    });

    // Generate statistics
    const stats = {
      totalUsersWithoutReferrals: totalCount,
      currentPageCount: accountsWithoutReferrals.length,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Math.floor(offset / limit) + 1,
      statusBreakdown: {},
      financialSummary: {
        totalBalance: accountsWithoutReferrals.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0),
        totalEarnings: accountsWithoutReferrals.reduce((sum, acc) => sum + parseFloat(acc.totalEarnings || 0), 0),
        totalReferralCount: accountsWithoutReferrals.reduce((sum, acc) => sum + (acc.referralCount || 0), 0),
        averageBalance: accountsWithoutReferrals.length > 0 ? 
          (accountsWithoutReferrals.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0) / accountsWithoutReferrals.length).toFixed(2) : 0,
        averageEarnings: accountsWithoutReferrals.length > 0 ? 
          (accountsWithoutReferrals.reduce((sum, acc) => sum + parseFloat(acc.totalEarnings || 0), 0) / accountsWithoutReferrals.length).toFixed(2) : 0
      }
    };

    // Get status breakdown
    const statusCounts = await prisma.user.groupBy({
      by: ['status'],
      where: { referredBy: null },
      _count: {
        id: true
      }
    });

    statusCounts.forEach(status => {
      stats.statusBreakdown[status.status] = status._count.id;
    });

    // Generate insights
    const insights = [];
    
    if (accountsWithoutReferrals.length > 0) {
      const activeUsers = accountsWithoutReferrals.filter(acc => acc.status === 'active').length;
      const inactiveUsers = accountsWithoutReferrals.filter(acc => acc.status !== 'active').length;
      
      insights.push({
        type: 'status_distribution',
        message: `${activeUsers} active users, ${inactiveUsers} inactive users without referrals`,
        percentage: ((activeUsers / accountsWithoutReferrals.length) * 100).toFixed(1)
      });

      const usersWithBalance = accountsWithoutReferrals.filter(acc => parseFloat(acc.balance || 0) > 0).length;
      insights.push({
        type: 'balance_distribution',
        message: `${usersWithBalance} users have balance > $0`,
        percentage: ((usersWithBalance / accountsWithoutReferrals.length) * 100).toFixed(1)
      });

      const usersWithEarnings = accountsWithoutReferrals.filter(acc => parseFloat(acc.totalEarnings || 0) > 0).length;
      insights.push({
        type: 'earnings_distribution',
        message: `${usersWithEarnings} users have earnings > $0`,
        percentage: ((usersWithEarnings / accountsWithoutReferrals.length) * 100).toFixed(1)
      });

      const usersWithReferrals = accountsWithoutReferrals.filter(acc => (acc.referralCount || 0) > 0).length;
      insights.push({
        type: 'referral_activity',
        message: `${usersWithReferrals} users have made referrals (but weren't referred themselves)`,
        percentage: ((usersWithReferrals / accountsWithoutReferrals.length) * 100).toFixed(1)
      });
    }

    const result = {
      success: true,
      message: 'Accounts without referrals retrieved successfully',
      timestamp: new Date(),
      statistics: stats,
      accountsWithoutReferrals,
      insights,
      pagination: {
        limit,
        offset,
        total: totalCount,
        currentPage: stats.currentPage,
        totalPages: stats.totalPages,
        hasNextPage: (offset + limit) < totalCount,
        hasPreviousPage: offset > 0
      },
      summary: {
        totalAccounts: totalCount,
        currentPageAccounts: accountsWithoutReferrals.length,
        financialImpact: {
          totalBalance: stats.financialSummary.totalBalance,
          totalEarnings: stats.financialSummary.totalEarnings,
          averageBalance: stats.financialSummary.averageBalance,
          averageEarnings: stats.financialSummary.averageEarnings
        }
      }
    };

    console.log('Accounts without referrals retrieved:', {
      total: totalCount,
      currentPage: accountsWithoutReferrals.length,
      status: status,
      financialImpact: `$${stats.financialSummary.totalBalance.toFixed(2)}`
    });

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching accounts without referrals:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch accounts without referrals',
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST endpoint to export accounts without referrals
export async function POST(request) {
  try {
    const body = await request.json();
    const { format, includeDetails, status } = body;

    console.log('📤 Exporting accounts without referrals...', { format, includeDetails, status });

    // Get all accounts without referrals (no pagination for export)
    const response = await fetch(`http://localhost:3000/api/admin/accounts-without-referrals?limit=10000&includeDetails=${includeDetails || false}&status=${status || 'all'}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch accounts without referrals data');
    }

    const data = await response.json();
    const result = data;

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertAccountsWithoutReferralsToCSV(result);
      
      return new Response(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="accounts_without_referrals_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    } else {
      // Return JSON format
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Accounts without referrals exported successfully',
          data: result,
          exportedAt: new Date(),
          format: 'json'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error exporting accounts without referrals:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to export accounts without referrals',
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Convert accounts without referrals data to CSV format
function convertAccountsWithoutReferralsToCSV(data) {
  let csv = '';
  
  // CSV header
  csv = 'ID,Username,Full Name,Email,Phone,Status,Balance,Points,Total Earnings,Referral Count,Days Since Created,Days Since Updated,Created At\n';
  
  // CSV rows
  data.accountsWithoutReferrals.forEach(account => {
    csv += `${account.id},"${account.username}","${account.fullname}","${account.email || ''}","${account.phoneNumber || ''}","${account.status}","${account.balance}","${account.points}","${account.totalEarnings}","${account.referralCount}","${account.daysSinceCreated}","${account.daysSinceUpdated}","${account.createdAt}"\n`;
  });
  
  // Add separator and summary
  csv += '\n\nSummary:\n';
  csv += `Total Accounts Without Referrals,${data.statistics.totalUsersWithoutReferrals}\n`;
  csv += `Total Balance,${data.statistics.financialSummary.totalBalance}\n`;
  csv += `Total Earnings,${data.statistics.financialSummary.totalEarnings}\n`;
  csv += `Average Balance,${data.statistics.financialSummary.averageBalance}\n`;
  csv += `Average Earnings,${data.statistics.financialSummary.averageEarnings}\n`;
  
  return csv;
}


