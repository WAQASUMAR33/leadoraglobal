import prisma from '../../../../lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    const { referrerUsername, preview, rollback } = body;

    if (!referrerUsername && !rollback) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'referrerUsername is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔄 Update referred_by request:', { referrerUsername, preview, rollback });

    if (rollback) {
      return await rollbackUpdate();
    }

    if (preview) {
      return await previewUpdate(referrerUsername);
    }

    return await performUpdate(referrerUsername);

  } catch (error) {
    console.error('Update referred_by API error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Update referred_by failed',
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Preview the update without actually doing it
async function previewUpdate(referrerUsername) {
  try {
    console.log(`👀 Preview: Updating referred_by to ${referrerUsername} for accounts where referred_by is NULL...`);

    // Check if referrer exists
    const referrer = await prisma.user.findUnique({
      where: { username: referrerUsername },
      select: {
        id: true,
        username: true,
        fullname: true,
        status: true,
        referralCount: true
      }
    });

    if (!referrer) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `User ${referrerUsername} not found`
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get accounts with NULL referrals
    const accountsWithNullReferrals = await prisma.user.findMany({
      where: {
        referredBy: null
      },
      select: {
        id: true,
        username: true,
        fullname: true,
        status: true,
        balance: true,
        totalEarnings: true,
        referralCount: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Limit for preview
    });

    const totalCount = await prisma.user.count({
      where: {
        referredBy: null
      }
    });

    // Calculate statistics
    const stats = {
      totalAccounts: totalCount,
      previewCount: accountsWithNullReferrals.length,
      activeAccounts: accountsWithNullReferrals.filter(acc => acc.status === 'active').length,
      inactiveAccounts: accountsWithNullReferrals.filter(acc => acc.status !== 'active').length,
      totalBalance: accountsWithNullReferrals.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0),
      totalEarnings: accountsWithNullReferrals.reduce((sum, acc) => sum + parseFloat(acc.totalEarnings || 0), 0),
      currentReferralCount: referrer.referralCount || 0,
      newReferralCount: (referrer.referralCount || 0) + totalCount
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Preview completed',
        preview: true,
        referrer: {
          id: referrer.id,
          username: referrer.username,
          fullname: referrer.fullname,
          status: referrer.status,
          currentReferralCount: referrer.referralCount || 0
        },
        statistics: stats,
        accountsToUpdate: accountsWithNullReferrals,
        summary: {
          totalAccountsToUpdate: totalCount,
          previewAccountsShown: accountsWithNullReferrals.length,
          financialImpact: {
            totalBalance: stats.totalBalance,
            totalEarnings: stats.totalEarnings
          },
          referralImpact: {
            currentCount: stats.currentReferralCount,
            newCount: stats.newReferralCount,
            increase: totalCount
          }
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Preview update failed:', error);
    throw new Error(`Preview update failed: ${error.message}`);
  }
}

// Perform the actual update
async function performUpdate(referrerUsername) {
  try {
    console.log(`🔄 Updating referred_by to ${referrerUsername} for accounts where referred_by is NULL...`);

    // Check if referrer exists
    const referrer = await prisma.user.findUnique({
      where: { username: referrerUsername },
      select: {
        id: true,
        username: true,
        fullname: true,
        status: true,
        referralCount: true
      }
    });

    if (!referrer) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `User ${referrerUsername} not found`
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get accounts with NULL referrals for statistics
    const accountsWithNullReferrals = await prisma.user.findMany({
      where: {
        referredBy: null
      },
      select: {
        id: true,
        username: true,
        fullname: true,
        status: true,
        balance: true,
        totalEarnings: true,
        referralCount: true
      }
    });

    if (accountsWithNullReferrals.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No accounts found with referred_by = NULL. Nothing to update.',
          updatedCount: 0
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Perform the update
    const updateResult = await prisma.user.updateMany({
      where: {
        referredBy: null
      },
      data: {
        referredBy: referrerUsername,
        updatedAt: new Date()
      }
    });

    // Update referrer's referral count
    const updatedReferrer = await prisma.user.update({
      where: { username: referrerUsername },
      data: {
        referralCount: (referrer.referralCount || 0) + updateResult.count,
        updatedAt: new Date()
      }
    });

    // Verify the update
    const remainingNullReferrals = await prisma.user.count({
      where: {
        referredBy: null
      }
    });

    const accountsReferredByUser = await prisma.user.count({
      where: {
        referredBy: referrerUsername
      }
    });

    // Calculate statistics
    const stats = {
      totalAccounts: accountsWithNullReferrals.length,
      updatedAccounts: updateResult.count,
      activeAccounts: accountsWithNullReferrals.filter(acc => acc.status === 'active').length,
      inactiveAccounts: accountsWithNullReferrals.filter(acc => acc.status !== 'active').length,
      totalBalance: accountsWithNullReferrals.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0),
      totalEarnings: accountsWithNullReferrals.reduce((sum, acc) => sum + parseFloat(acc.totalEarnings || 0), 0),
      previousReferralCount: referrer.referralCount || 0,
      newReferralCount: updatedReferrer.referralCount
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully updated ${updateResult.count} accounts to be referred by ${referrerUsername}`,
        referrer: {
          id: referrer.id,
          username: referrer.username,
          fullname: referrer.fullname,
          status: referrer.status,
          previousReferralCount: stats.previousReferralCount,
          newReferralCount: stats.newReferralCount
        },
        statistics: stats,
        verification: {
          remainingNullReferrals,
          accountsReferredByUser,
          updateSuccessful: remainingNullReferrals === 0
        },
        summary: {
          updatedCount: updateResult.count,
          financialImpact: {
            totalBalance: stats.totalBalance,
            totalEarnings: stats.totalEarnings
          },
          referralImpact: {
            previousCount: stats.previousReferralCount,
            newCount: stats.newReferralCount,
            increase: updateResult.count
          }
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Update failed:', error);
    throw new Error(`Update failed: ${error.message}`);
  }
}

// Rollback the update
async function rollbackUpdate() {
  try {
    console.log('🔄 Rolling back: Setting referred_by back to NULL for all accounts...');

    // Get all accounts (we need to find which referrer to rollback)
    // For now, let's rollback all accounts that have any referrer
    const accountsWithReferrers = await prisma.user.findMany({
      where: {
        referredBy: {
          not: null
        }
      },
      select: {
        id: true,
        username: true,
        referredBy: true
      }
    });

    if (accountsWithReferrers.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No accounts found with referrers. Nothing to rollback.',
          rollbackCount: 0
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Group by referrer
    const referrerGroups = {};
    accountsWithReferrers.forEach(account => {
      if (!referrerGroups[account.referredBy]) {
        referrerGroups[account.referredBy] = [];
      }
      referrerGroups[account.referredBy].push(account);
    });

    // Perform rollback
    const rollbackResult = await prisma.user.updateMany({
      where: {
        referredBy: {
          not: null
        }
      },
      data: {
        referredBy: null,
        updatedAt: new Date()
      }
    });

    // Update all referrers' referral counts to 0
    const referrerUsernames = Object.keys(referrerGroups);
    for (const username of referrerUsernames) {
      await prisma.user.updateMany({
        where: { username },
        data: {
          referralCount: 0,
          updatedAt: new Date()
        }
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully rolled back ${rollbackResult.count} accounts`,
        rollbackCount: rollbackResult.count,
        affectedReferrers: referrerUsernames,
        summary: {
          rolledBackAccounts: rollbackResult.count,
          affectedReferrers: referrerUsernames.length,
          referrerGroups: referrerGroups
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Rollback failed:', error);
    throw new Error(`Rollback failed: ${error.message}`);
  }
}






