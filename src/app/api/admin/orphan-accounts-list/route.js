import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAdminToken } from '../../../../lib/adminAuth';

const prisma = new PrismaClient();

// GET - Fetch orphan accounts list
export async function GET(request) {
  try {
    const admin = verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'referrals';
    const format = searchParams.get('format') || 'json';

    let result = {};

    if (type === 'referrals') {
      result = await getOrphanAccounts();
    } else if (type === 'package_requests') {
      result = await getOrphanPackageRequests();
    } else if (type === 'earnings') {
      result = await getOrphanEarnings();
    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

    if (format === 'csv') {
      const csv = convertToCSV(result, type);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="orphan-${type}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error fetching orphan accounts list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get orphan accounts (users with invalid referrals)
async function getOrphanAccounts() {
  try {
    console.log('🔍 Starting orphan accounts check...');
    
    // Find users with referrals that don't exist
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
        status: true,
        balance: true,
        points: true,
        totalEarnings: true,
        referredBy: true,
        createdAt: true
      }
    });

    console.log(`Found ${usersWithReferrals.length} users with referrals`);

    const orphanAccounts = [];
    const validReferrals = [];
    const referralStats = {};

    for (const user of usersWithReferrals) {
      if (user.referredBy) {
        // Check if the referrer exists
        const referrer = await prisma.user.findUnique({
          where: { username: user.referredBy },
          select: { id: true, username: true, fullname: true, status: true }
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
            issue: 'Referrer not found',
            severity: 'high'
          });
          
          // Track referral stats
          if (!referralStats[user.referredBy]) {
            referralStats[user.referredBy] = 0;
          }
          referralStats[user.referredBy]++;
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
            referrerStatus: referrer.status,
            issue: 'Referrer is inactive',
            severity: 'medium'
          });
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

    // Check for circular referrals
    const circularReferrals = [];
    for (const user of usersWithReferrals) {
      if (user.referredBy) {
        const referrer = await prisma.user.findUnique({
          where: { username: user.referredBy },
          select: { referredBy: true, username: true }
        });
        
        if (referrer && referrer.referredBy === user.username) {
          circularReferrals.push({
            user1: {
              id: user.id,
              username: user.username,
              fullname: user.fullname
            },
            user2: {
              username: referrer.username
            },
            issue: 'Circular referral detected'
          });
        }
      }
    }

    // Check for self-referrals
    const selfReferrals = usersWithReferrals.filter(user => 
      user.referredBy === user.username
    );

    // Find users who are referrers but don't exist
    const allReferrers = [...new Set(usersWithReferrals.map(u => u.referredBy).filter(Boolean))];
    const missingReferrers = [];
    
    for (const referrerUsername of allReferrers) {
      const referrer = await prisma.user.findUnique({
        where: { username: referrerUsername }
      });
      
      if (!referrer) {
        const referredUsers = usersWithReferrals.filter(u => u.referredBy === referrerUsername);
        missingReferrers.push({
          username: referrerUsername,
          referredUsersCount: referredUsers.length,
          referredUsers: referredUsers.map(u => ({
            id: u.id,
            username: u.username,
            fullname: u.fullname
          }))
        });
      }
    }

    // Generate statistics
    const stats = {
      totalUsersWithReferrals: usersWithReferrals.length,
      orphanAccountsCount: orphanAccounts.length,
      validReferralsCount: validReferrals.length,
      circularReferralsCount: circularReferrals.length,
      selfReferralsCount: selfReferrals.length,
      missingReferrersCount: missingReferrers.length,
      highSeverityIssues: orphanAccounts.filter(o => o.severity === 'high').length,
      mediumSeverityIssues: orphanAccounts.filter(o => o.severity === 'medium').length
    };

    console.log('Orphan accounts check completed:', {
      totalUsers: stats.totalUsersWithReferrals,
      orphanAccounts: stats.orphanAccountsCount,
      issues: stats.orphanAccountsCount + circularReferrals.length + selfReferrals.length
    });

    return {
      orphanAccounts,
      validReferrals,
      circularReferrals,
      selfReferrals,
      missingReferrers,
      referralStats,
      statistics: stats
    };

  } catch (error) {
    console.error('Error getting orphan accounts:', error);
    throw error;
  }
}

// Get orphan package requests
async function getOrphanPackageRequests() {
  try {
    const orphanPackageRequests = await prisma.packageRequest.findMany({
      where: {
        user: {
          referredBy: {
            not: null
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullname: true,
            referredBy: true
          }
        },
        package: {
          select: {
            id: true,
            package_name: true,
            package_amount: true
          }
        }
      }
    });

    // Filter for orphan requests (where referrer doesn't exist)
    const orphanRequests = [];
    for (const request of orphanPackageRequests) {
      if (request.user.referredBy) {
        const referrer = await prisma.user.findUnique({
          where: { username: request.user.referredBy }
        });
        
        if (!referrer) {
          orphanRequests.push(request);
        }
      }
    }

    return {
      orphanPackageRequests: orphanRequests,
      statistics: {
        totalOrphanRequests: orphanRequests.length,
        totalPackageRequests: orphanPackageRequests.length
      }
    };

  } catch (error) {
    console.error('Error getting orphan package requests:', error);
    throw error;
  }
}

// Get orphan earnings
async function getOrphanEarnings() {
  try {
    const orphanEarnings = await prisma.earnings.findMany({
      where: {
        user: {
          referredBy: {
            not: null
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullname: true,
            referredBy: true
          }
        },
        packageRequest: {
          select: {
            id: true,
            transactionId: true
          }
        }
      }
    });

    // Filter for orphan earnings (where referrer doesn't exist)
    const orphanEarningsList = [];
    for (const earning of orphanEarnings) {
      if (earning.user.referredBy) {
        const referrer = await prisma.user.findUnique({
          where: { username: earning.user.referredBy }
        });
        
        if (!referrer) {
          orphanEarningsList.push(earning);
        }
      }
    }

    return {
      orphanEarnings: orphanEarningsList,
      statistics: {
        totalOrphanEarnings: orphanEarningsList.length,
        totalEarnings: orphanEarnings.length
      }
    };

  } catch (error) {
    console.error('Error getting orphan earnings:', error);
    throw error;
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
      const packageName = request.package?.package_name || 'N/A';
      const packageAmount = request.package?.package_amount || 'N/A';
      const transactionId = request.transactionId || '';
      const status = request.status || '';
      const adminNotes = request.adminNotes || '';
      const createdAt = request.createdAt || '';
      
      csv += `${request.id},"${packageName}","${packageAmount}","${transactionId}","${status}","${adminNotes}","${createdAt}"\n`;
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