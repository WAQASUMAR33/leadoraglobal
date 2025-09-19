import prisma from '../../../../lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit')) || 100;
    const offset = parseInt(searchParams.get('offset')) || 0;

    console.log('📋 Fetching orphan accounts list...', { type, limit, offset });

    let result = {};

    if (type === 'all' || type === 'referrals') {
      result.referrals = await getOrphanReferralAccounts(limit, offset);
    }

    if (type === 'all' || type === 'package_requests') {
      result.packageRequests = await getOrphanPackageRequests(limit, offset);
    }

    if (type === 'all' || type === 'earnings') {
      result.earnings = await getOrphanEarnings(limit, offset);
    }

    // Get summary statistics
    const summary = await getOrphanSummary();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Orphan accounts list retrieved successfully',
        summary,
        data: result,
        pagination: {
          limit,
          offset,
          type
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching orphan accounts list:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch orphan accounts list',
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Get orphan referral accounts
async function getOrphanReferralAccounts(limit = 100, offset = 0) {
  try {
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
        phoneNumber: true,
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

    const orphanAccounts = [];
    const validReferrals = [];
    const circularReferrals = [];
    const selfReferrals = [];
    const missingReferrers = new Map();

    // Check each user's referral
    for (const user of usersWithReferrals) {
      if (user.referredBy) {
        // Check for self-referral
        if (user.referredBy === user.username) {
          selfReferrals.push({
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
            issue: 'Self-referral detected',
            severity: 'medium'
          });
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
            createdAt: true
          }
        });

        if (!referrer) {
          // Orphan account - referrer doesn't exist
          orphanAccounts.push({
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
        } else if (referrer.status !== 'active') {
          // Referrer exists but is inactive
          orphanAccounts.push({
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
            referrerStatus: referrer.status,
            referrerCreatedAt: referrer.createdAt,
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
                fullname: user.fullname,
                email: user.email,
                status: user.status,
                createdAt: user.createdAt
              },
              user2: {
                id: referrer.id,
                username: referrer.username,
                fullname: referrer.fullname,
                status: referrer.status,
                createdAt: referrer.createdAt
              },
              issue: 'Circular referral detected',
              severity: 'high'
            });
          } else {
            // Valid referral
            validReferrals.push({
              id: user.id,
              username: user.username,
              fullname: user.fullname,
              email: user.email,
              status: user.status,
              referredBy: user.referredBy,
              referrerExists: true,
              referrerStatus: referrer.status,
              createdAt: user.createdAt
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

    return {
      orphanAccounts,
      validReferrals,
      circularReferrals,
      selfReferrals,
      missingReferrers: missingReferrersArray,
      statistics: {
        totalUsersWithReferrals: usersWithReferrals.length,
        orphanAccountsCount: orphanAccounts.length,
        validReferralsCount: validReferrals.length,
        circularReferralsCount: circularReferrals.length,
        selfReferralsCount: selfReferrals.length,
        missingReferrersCount: missingReferrersArray.length,
        highSeverityIssues: orphanAccounts.filter(o => o.severity === 'high').length,
        mediumSeverityIssues: orphanAccounts.filter(o => o.severity === 'medium').length
      }
    };

  } catch (error) {
    console.error('Error getting orphan referral accounts:', error);
    throw error;
  }
}

// Get orphan package requests
async function getOrphanPackageRequests(limit = 100, offset = 0) {
  try {
    const orphanPackageRequests = await prisma.packageRequest.findMany({
      where: {
        user: null
      },
      include: {
        package: {
          select: {
            id: true,
            package_name: true,
            package_amount: true
          }
        }
      },
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      orphanPackageRequests,
      statistics: {
        orphanPackageRequestsCount: orphanPackageRequests.length
      }
    };

  } catch (error) {
    console.error('Error getting orphan package requests:', error);
    throw error;
  }
}

// Get orphan earnings
async function getOrphanEarnings(limit = 100, offset = 0) {
  try {
    const orphanEarnings = await prisma.earnings.findMany({
      where: {
        user: null
      },
      include: {
        packageRequest: {
          select: {
            id: true,
            transactionId: true,
            status: true
          }
        }
      },
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      orphanEarnings,
      statistics: {
        orphanEarningsCount: orphanEarnings.length
      }
    };

  } catch (error) {
    console.error('Error getting orphan earnings:', error);
    throw error;
  }
}

// Get summary statistics
async function getOrphanSummary() {
  try {
    // Count users with referrals
    const usersWithReferralsCount = await prisma.user.count({
      where: {
        referredBy: {
          not: null
        }
      }
    });

    // Count orphan package requests
    const orphanPackageRequestsCount = await prisma.packageRequest.count({
      where: {
        user: null
      }
    });

    // Count orphan earnings
    const orphanEarningsCount = await prisma.earnings.count({
      where: {
        user: null
      }
    });

    // Count total users
    const totalUsersCount = await prisma.user.count();

    // Count total package requests
    const totalPackageRequestsCount = await prisma.packageRequest.count();

    // Count total earnings
    const totalEarningsCount = await prisma.earnings.count();

    return {
      totalUsers: totalUsersCount,
      totalPackageRequests: totalPackageRequestsCount,
      totalEarnings: totalEarningsCount,
      usersWithReferrals: usersWithReferralsCount,
      orphanPackageRequests: orphanPackageRequestsCount,
      orphanEarnings: orphanEarningsCount,
      orphanPercentage: {
        packageRequests: totalPackageRequestsCount > 0 ? 
          ((orphanPackageRequestsCount / totalPackageRequestsCount) * 100).toFixed(2) : 0,
        earnings: totalEarningsCount > 0 ? 
          ((orphanEarningsCount / totalEarningsCount) * 100).toFixed(2) : 0
      }
    };

  } catch (error) {
    console.error('Error getting orphan summary:', error);
    throw error;
  }
}

// POST endpoint to export orphan accounts list
export async function POST(request) {
  try {
    const body = await request.json();
    const { exportType, format } = body;

    console.log('📤 Exporting orphan accounts...', { exportType, format });

    let data;
    
    if (exportType === 'referrals') {
      data = await getOrphanReferralAccounts(1000, 0); // Get more for export
    } else if (exportType === 'package_requests') {
      data = await getOrphanPackageRequests(1000, 0);
    } else if (exportType === 'earnings') {
      data = await getOrphanEarnings(1000, 0);
    } else {
      data = {
        referrals: await getOrphanReferralAccounts(1000, 0),
        packageRequests: await getOrphanPackageRequests(1000, 0),
        earnings: await getOrphanEarnings(1000, 0)
      };
    }

    const summary = await getOrphanSummary();

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV(data, exportType);
      
      return new Response(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="orphan_accounts_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    } else {
      // Return JSON format
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Orphan accounts exported successfully',
          summary,
          data,
          exportedAt: new Date(),
          format: 'json'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error exporting orphan accounts:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to export orphan accounts',
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Convert data to CSV format
function convertToCSV(data, type) {
  let csv = '';
  
  if (type === 'referrals' && data.orphanAccounts) {
    // CSV header for orphan accounts
    csv = 'ID,Username,Full Name,Email,Phone,Status,Balance,Points,Total Earnings,Referred By,Issue,Severity,Created At\n';
    
    // CSV rows
    data.orphanAccounts.forEach(account => {
      csv += `${account.id},"${account.username}","${account.fullname}","${account.email || ''}","${account.phoneNumber || ''}","${account.status}","${account.balance}","${account.points}","${account.totalEarnings}","${account.referredBy}","${account.issue}","${account.severity}","${account.createdAt}"\n`;
    });
  } else if (type === 'package_requests' && data.orphanPackageRequests) {
    // CSV header for orphan package requests
    csv = 'ID,Package Name,Package Amount,Transaction ID,Status,Admin Notes,Created At\n';
    
    // CSV rows
    data.orphanPackageRequests.forEach(request => {
      csv += `${request.id},"${request.package?.package_name || 'N/A'}","${request.package?.package_amount || 'N/A"}","${request.transactionId}","${request.status}","${request.adminNotes || ''}","${request.createdAt}"\n`;
    });
  } else if (type === 'earnings' && data.orphanEarnings) {
    // CSV header for orphan earnings
    csv = 'ID,Amount,Type,Description,Package Request ID,Transaction ID,Created At\n';
    
    // CSV rows
    data.orphanEarnings.forEach(earning => {
      csv += `${earning.id},"${earning.amount}","${earning.type}","${earning.description || ''}","${earning.packageRequestId || 'N/A'}","${earning.packageRequest?.transactionId || 'N/A'}","${earning.createdAt}"\n`;
    });
  }
  
  return csv;
}


