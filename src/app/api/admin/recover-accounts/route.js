import prisma from '../../../../lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    const { accountType, specificIds, forceRecovery } = body;

    console.log('Account recovery request received:', { accountType, specificIds, forceRecovery });

    // Handle different recovery scenarios
    if (accountType === 'all') {
      return await recoverAllAccounts(forceRecovery);
    } else if (accountType === 'users') {
      return await recoverUserAccounts(specificIds, forceRecovery);
    } else if (accountType === 'admins') {
      return await recoverAdminAccounts(specificIds, forceRecovery);
    } else if (accountType === 'specific') {
      return await recoverSpecificAccounts(specificIds, forceRecovery);
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid account type. Use: all, users, admins, or specific'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Account recovery API error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Account recovery failed',
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Recover all suspended/inactive accounts
async function recoverAllAccounts(forceRecovery = false) {
  try {
    console.log('Starting full account recovery process...');
    
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
        createdAt: true,
        lastLoginAt: true
      }
    });

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
        createdAt: true,
        lastLoginAt: true
      }
    });

    console.log(`Found ${suspendedUsers.length} user accounts and ${inactiveAdmins.length} admin accounts to recover`);

    // Recover user accounts
    const userRecoveryResults = await recoverUserAccounts(suspendedUsers.map(u => u.id), forceRecovery);
    
    // Recover admin accounts
    const adminRecoveryResults = await recoverAdminAccounts(inactiveAdmins.map(a => a.id), forceRecovery);

    const totalRecovered = userRecoveryResults.summary.usersRecovered + adminRecoveryResults.summary.adminsRecovered;
    const totalFailures = userRecoveryResults.summary.userFailures + adminRecoveryResults.summary.adminFailures;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Account recovery completed. ${totalRecovered} accounts recovered, ${totalFailures} failures.`,
        summary: {
          totalUsersFound: suspendedUsers.length,
          totalAdminsFound: inactiveAdmins.length,
          usersRecovered: userRecoveryResults.summary.usersRecovered,
          adminsRecovered: adminRecoveryResults.summary.adminsRecovered,
          totalRecovered,
          totalFailures
        },
        userResults: userRecoveryResults.details,
        adminResults: adminRecoveryResults.details
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Full account recovery failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Full account recovery failed',
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Recover specific user accounts
async function recoverUserAccounts(userIds = null, forceRecovery = false) {
  try {
    let whereClause = {
      status: {
        in: ['suspended', 'inactive', 'deactivated', 'banned']
      }
    };

    if (userIds && userIds.length > 0) {
      whereClause.id = {
        in: userIds
      };
    }

    const usersToRecover = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        fullname: true,
        status: true,
        email: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    console.log(`Recovering ${usersToRecover.length} user accounts`);

    const recoveryResults = [];
    let successCount = 0;
    let failureCount = 0;

    for (const user of usersToRecover) {
      try {
        // Additional validation for force recovery
        if (!forceRecovery && user.status === 'banned') {
          console.log(`Skipping banned user ${user.username} (use forceRecovery=true to override)`);
          recoveryResults.push({
            id: user.id,
            username: user.username,
            fullname: user.fullname,
            previousStatus: user.status,
            newStatus: user.status,
            success: false,
            skipped: true,
            reason: 'Banned account requires force recovery'
          });
          failureCount++;
          continue;
        }

        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            status: 'active',
            updatedAt: new Date()
          }
        });
        
        recoveryResults.push({
          id: user.id,
          username: user.username,
          fullname: user.fullname,
          previousStatus: user.status,
          newStatus: 'active',
          success: true,
          recoveredAt: new Date()
        });
        
        successCount++;
        console.log(`Recovered user account: ${user.username}`);
      } catch (error) {
        console.error(`Failed to recover user ${user.username}:`, error);
        recoveryResults.push({
          id: user.id,
          username: user.username,
          fullname: user.fullname,
          previousStatus: user.status,
          success: false,
          error: error.message
        });
        failureCount++;
      }
    }

    return {
      success: true,
      summary: {
        totalFound: usersToRecover.length,
        usersRecovered: successCount,
        userFailures: failureCount
      },
      details: recoveryResults
    };

  } catch (error) {
    console.error('User account recovery failed:', error);
    throw new Error(`User account recovery failed: ${error.message}`);
  }
}

// Recover specific admin accounts
async function recoverAdminAccounts(adminIds = null, forceRecovery = false) {
  try {
    let whereClause = {
      isActive: false
    };

    if (adminIds && adminIds.length > 0) {
      whereClause.id = {
        in: adminIds
      };
    }

    const adminsToRecover = await prisma.admin.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    console.log(`Recovering ${adminsToRecover.length} admin accounts`);

    const recoveryResults = [];
    let successCount = 0;
    let failureCount = 0;

    for (const admin of adminsToRecover) {
      try {
        const updatedAdmin = await prisma.admin.update({
          where: { id: admin.id },
          data: {
            isActive: true,
            updatedAt: new Date()
          }
        });
        
        recoveryResults.push({
          id: admin.id,
          username: admin.username,
          fullName: admin.fullName,
          previousStatus: 'inactive',
          newStatus: 'active',
          success: true,
          recoveredAt: new Date()
        });
        
        successCount++;
        console.log(`Recovered admin account: ${admin.username}`);
      } catch (error) {
        console.error(`Failed to recover admin ${admin.username}:`, error);
        recoveryResults.push({
          id: admin.id,
          username: admin.username,
          fullName: admin.fullName,
          previousStatus: 'inactive',
          success: false,
          error: error.message
        });
        failureCount++;
      }
    }

    return {
      success: true,
      summary: {
        totalFound: adminsToRecover.length,
        adminsRecovered: successCount,
        adminFailures: failureCount
      },
      details: recoveryResults
    };

  } catch (error) {
    console.error('Admin account recovery failed:', error);
    throw new Error(`Admin account recovery failed: ${error.message}`);
  }
}

// Recover specific accounts by IDs (mixed user and admin)
async function recoverSpecificAccounts(accountIds, forceRecovery = false) {
  try {
    if (!accountIds || accountIds.length === 0) {
      throw new Error('No account IDs provided for specific recovery');
    }

    console.log(`Recovering specific accounts: ${accountIds.join(', ')}`);

    // Try to recover as users first
    const userResults = await recoverUserAccounts(accountIds, forceRecovery);
    
    // Try to recover as admins
    const adminResults = await recoverAdminAccounts(accountIds, forceRecovery);

    const totalRecovered = userResults.summary.usersRecovered + adminResults.summary.adminsRecovered;
    const totalFailures = userResults.summary.userFailures + adminResults.summary.adminFailures;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Specific account recovery completed. ${totalRecovered} accounts recovered, ${totalFailures} failures.`,
        summary: {
          requestedIds: accountIds,
          usersRecovered: userResults.summary.usersRecovered,
          adminsRecovered: adminResults.summary.adminsRecovered,
          totalRecovered,
          totalFailures
        },
        userResults: userResults.details,
        adminResults: adminResults.details
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Specific account recovery failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Specific account recovery failed',
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// GET endpoint to check recovery status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountType = searchParams.get('type') || 'all';

    let suspendedUsers = [];
    let inactiveAdmins = [];

    if (accountType === 'all' || accountType === 'users') {
      suspendedUsers = await prisma.user.findMany({
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
          createdAt: true,
          lastLoginAt: true
        }
      });
    }

    if (accountType === 'all' || accountType === 'admins') {
      inactiveAdmins = await prisma.admin.findMany({
        where: {
          isActive: false
        },
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true
        }
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Recovery status retrieved successfully',
        data: {
          suspendedUsers: {
            count: suspendedUsers.length,
            accounts: suspendedUsers
          },
          inactiveAdmins: {
            count: inactiveAdmins.length,
            accounts: inactiveAdmins
          },
          totalRecoverable: suspendedUsers.length + inactiveAdmins.length
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error getting recovery status:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to get recovery status',
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}


