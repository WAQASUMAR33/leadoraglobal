import prisma from '../../../../lib/prisma';
import { approvePackageRequest } from '../../../../lib/packageApproval';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const packageRequestId = parseInt(id);
    const body = await request.json();
    const { status, adminNotes, recoverAccounts, checkOrphanAccounts } = body;

    if (!status) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Status is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Handle account recovery if requested
    if (recoverAccounts === true) {
      try {
        const recoveryResult = await recoverAllAccounts();
        
        return new Response(
          JSON.stringify({
            success: true,
            message: 'All accounts recovered successfully',
            recoveryResult
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (recoveryError) {
        console.error('Account recovery failed:', recoveryError);
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Failed to recover accounts',
            error: recoveryError.message
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle orphan account checking if requested
    if (checkOrphanAccounts === true) {
      try {
        const orphanResult = await checkOrphanAccountsWithReferrals();
        
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Orphan account check completed',
            orphanResult
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (orphanError) {
        console.error('Orphan account check failed:', orphanError);
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Failed to check orphan accounts',
            error: orphanError.message
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // If approved, use the comprehensive approval system
    if (status === 'approved') {
      try {
        const approvalResult = await approvePackageRequest(packageRequestId);
        
        // Get updated package request
        const updatedRequest = await prisma.packageRequest.findUnique({
          where: { id: packageRequestId },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullname: true
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

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Package request approved successfully with commission distribution',
            packageRequest: updatedRequest,
            approvalResult
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (approvalError) {
        console.error('Package approval failed:', approvalError);
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Failed to approve package request',
            error: approvalError.message
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // For other statuses (rejected, pending), use simple update
    const updatedRequest = await prisma.packageRequest.update({
      where: { id: packageRequestId },
      data: {
        status,
        adminNotes: adminNotes || '',
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullname: true
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

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Package request updated successfully',
        packageRequest: updatedRequest
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error updating package request:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to update package request',
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const packageRequestId = parseInt(id);

    const packageRequest = await prisma.packageRequest.findUnique({
      where: { id: packageRequestId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullname: true
          }
        },
        package: {
          select: {
            id: true,
            package_name: true,
            package_amount: true
          }
        }
        // transactionReceipt is included for individual request view
      }
    });

    if (!packageRequest) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Package request not found'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        packageRequest
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching package request:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch package request',
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Account Recovery Function
async function recoverAllAccounts() {
  try {
    console.log('Starting account recovery process...');
    
    // Get all suspended/inactive users
    const suspendedUsers = await prisma.user.findMany({
      where: {
        status: {
          in: ['suspended', 'inactive', 'deactivated', 'banned']
        }
      },
      select: {
        id: true,
        username: true,
        fullname: true,
        status: true,
        email: true,
        createdAt: true
      }
    });

    console.log(`Found ${suspendedUsers.length} accounts to recover`);

    // Get all inactive admin accounts
    const inactiveAdmins = await prisma.admin.findMany({
      where: {
        isActive: false
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        isActive: true,
        createdAt: true
      }
    });

    console.log(`Found ${inactiveAdmins.length} admin accounts to recover`);

    // Recover user accounts
    const userRecoveryResults = [];
    for (const user of suspendedUsers) {
      try {
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            status: 'active',
            updatedAt: new Date()
          }
        });
        
        userRecoveryResults.push({
          id: user.id,
          username: user.username,
          fullname: user.fullname,
          previousStatus: user.status,
          newStatus: 'active',
          success: true
        });
        
        console.log(`Recovered user account: ${user.username}`);
      } catch (error) {
        console.error(`Failed to recover user ${user.username}:`, error);
        userRecoveryResults.push({
          id: user.id,
          username: user.username,
          fullname: user.fullname,
          previousStatus: user.status,
          success: false,
          error: error.message
        });
      }
    }

    // Recover admin accounts
    const adminRecoveryResults = [];
    for (const admin of inactiveAdmins) {
      try {
        const updatedAdmin = await prisma.admin.update({
          where: { id: admin.id },
          data: {
            isActive: true,
            updatedAt: new Date()
          }
        });
        
        adminRecoveryResults.push({
          id: admin.id,
          username: admin.username,
          fullName: admin.fullName,
          previousStatus: 'inactive',
          newStatus: 'active',
          success: true
        });
        
        console.log(`Recovered admin account: ${admin.username}`);
      } catch (error) {
        console.error(`Failed to recover admin ${admin.username}:`, error);
        adminRecoveryResults.push({
          id: admin.id,
          username: admin.username,
          fullName: admin.fullName,
          previousStatus: 'inactive',
          success: false,
          error: error.message
        });
      }
    }

    // Log recovery activity
    const recoveryLog = {
      timestamp: new Date(),
      totalUsersFound: suspendedUsers.length,
      totalAdminsFound: inactiveAdmins.length,
      usersRecovered: userRecoveryResults.filter(r => r.success).length,
      adminsRecovered: adminRecoveryResults.filter(r => r.success).length,
      userFailures: userRecoveryResults.filter(r => !r.success).length,
      adminFailures: adminRecoveryResults.filter(r => !r.success).length,
      userResults: userRecoveryResults,
      adminResults: adminRecoveryResults
    };

    console.log('Account recovery completed:', recoveryLog);

    return {
      success: true,
      message: 'Account recovery process completed',
      summary: {
        totalUsersFound: suspendedUsers.length,
        totalAdminsFound: inactiveAdmins.length,
        usersRecovered: userRecoveryResults.filter(r => r.success).length,
        adminsRecovered: adminRecoveryResults.filter(r => r.success).length,
        totalFailures: userRecoveryResults.filter(r => !r.success).length + adminRecoveryResults.filter(r => !r.success).length
      },
      details: recoveryLog
    };

  } catch (error) {
    console.error('Account recovery process failed:', error);
    throw new Error(`Account recovery failed: ${error.message}`);
  }
}

// Orphan Account Checking Function
async function checkOrphanAccountsWithReferrals() {
  try {
    console.log('🔍 Starting orphan account check...');
    
    // 1. Find users with referrals that don't exist
    const usersWithInvalidReferrals = await prisma.user.findMany({
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
        createdAt: true
      }
    });

    console.log(`Found ${usersWithInvalidReferrals.length} users with referrals`);

    // 2. Check which referrals are invalid
    const orphanAccounts = [];
    const validReferrals = [];
    const referralStats = {};

    for (const user of usersWithInvalidReferrals) {
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
            referredBy: user.referredBy,
            email: user.email,
            status: user.status,
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
            referredBy: user.referredBy,
            email: user.email,
            status: user.status,
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

    // 3. Check for circular referrals
    const circularReferrals = [];
    for (const user of usersWithInvalidReferrals) {
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

    // 4. Check for self-referrals
    const selfReferrals = usersWithInvalidReferrals.filter(user => 
      user.referredBy === user.username
    );

    // 5. Find users who are referrers but don't exist
    const allReferrers = [...new Set(usersWithInvalidReferrals.map(u => u.referredBy).filter(Boolean))];
    const missingReferrers = [];
    
    for (const referrerUsername of allReferrers) {
      const referrer = await prisma.user.findUnique({
        where: { username: referrerUsername }
      });
      
      if (!referrer) {
        const referredUsers = usersWithInvalidReferrals.filter(u => u.referredBy === referrerUsername);
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

    // 6. Generate statistics
    const stats = {
      totalUsersWithReferrals: usersWithInvalidReferrals.length,
      orphanAccountsCount: orphanAccounts.length,
      validReferralsCount: validReferrals.length,
      circularReferralsCount: circularReferrals.length,
      selfReferralsCount: selfReferrals.length,
      missingReferrersCount: missingReferrers.length,
      highSeverityIssues: orphanAccounts.filter(o => o.severity === 'high').length,
      mediumSeverityIssues: orphanAccounts.filter(o => o.severity === 'medium').length
    };

    // 7. Generate recommendations
    const recommendations = [];
    
    if (orphanAccounts.length > 0) {
      recommendations.push({
        type: 'cleanup',
        priority: 'high',
        description: 'Clean up orphan accounts with invalid referrals',
        action: 'Update referredBy field to null or assign to valid referrer',
        affectedCount: orphanAccounts.length
      });
    }

    if (circularReferrals.length > 0) {
      recommendations.push({
        type: 'fix_circular',
        priority: 'high',
        description: 'Fix circular referral relationships',
        action: 'Break circular referral chains',
        affectedCount: circularReferrals.length
      });
    }

    if (selfReferrals.length > 0) {
      recommendations.push({
        type: 'fix_self',
        priority: 'medium',
        description: 'Fix self-referral issues',
        action: 'Set referredBy to null for self-referrals',
        affectedCount: selfReferrals.length
      });
    }

    if (missingReferrers.length > 0) {
      recommendations.push({
        type: 'recreate_referrers',
        priority: 'high',
        description: 'Recreate missing referrer accounts',
        action: 'Recreate deleted referrer accounts or reassign referrals',
        affectedCount: missingReferrers.length
      });
    }

    const result = {
      success: true,
      message: 'Orphan account check completed',
      timestamp: new Date(),
      statistics: stats,
      orphanAccounts: orphanAccounts,
      validReferrals: validReferrals,
      circularReferrals: circularReferrals,
      selfReferrals: selfReferrals,
      missingReferrers: missingReferrers,
      referralStats: referralStats,
      recommendations: recommendations,
      summary: {
        totalIssues: orphanAccounts.length + circularReferrals.length + selfReferrals.length,
        criticalIssues: stats.highSeverityIssues,
        moderateIssues: stats.mediumSeverityIssues,
        requiresAction: recommendations.length > 0
      }
    };

    console.log('Orphan account check completed:', {
      totalUsers: stats.totalUsersWithReferrals,
      orphanAccounts: stats.orphanAccountsCount,
      issues: stats.totalIssues,
      recommendations: recommendations.length
    });

    return result;

  } catch (error) {
    console.error('Orphan account check failed:', error);
    throw new Error(`Orphan account check failed: ${error.message}`);
  }
}
