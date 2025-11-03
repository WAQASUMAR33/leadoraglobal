const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteUserComplete(username) {
  try {
    console.log(`🔍 Searching for user: ${username}`);
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      include: {
        orders: true,
        packageRequests: true,
        withdrawalRequests: true,
        earnings: true,
        cartItems: true,
        sessions: true,
        kyc: true,
        paymentMethods: true,
        transfersFrom: true,
        transfersTo: true
      }
    });

    if (!user) {
      // Try case-insensitive search
      const userCaseInsensitive = await prisma.user.findFirst({
        where: {
          username: {
            contains: username,
            mode: 'insensitive'
          }
        }
      });

      if (!userCaseInsensitive) {
        console.log(`❌ User "${username}" not found`);
        return;
      }

      console.log(`⚠️  Found user with different case: ${userCaseInsensitive.username}`);
      console.log(`📝 Proceeding with deletion of user: ${userCaseInsensitive.username}`);
      return await deleteUserComplete(userCaseInsensitive.username);
    }

    console.log(`✅ Found user: ${user.username} (ID: ${user.id})`);
    console.log(`\n📊 User Data Summary:`);
    console.log(`   - Full Name: ${user.fullname}`);
    console.log(`   - Email: ${user.email || 'N/A'}`);
    console.log(`   - Balance: PKR ${user.balance}`);
    console.log(`   - Shopping Amount: PKR ${user.shoppingAmount}`);
    console.log(`   - Points: ${user.points}`);
    console.log(`   - Referred By: ${user.referredBy || 'None'}`);
    console.log(`   - Referral Count: ${user.referralCount}`);
    console.log(`\n📦 Related Records:`);
    console.log(`   - Orders: ${user.orders.length}`);
    console.log(`   - Package Requests: ${user.packageRequests.length}`);
    console.log(`   - Withdrawal Requests: ${user.withdrawalRequests.length}`);
    console.log(`   - Earnings: ${user.earnings.length}`);
    console.log(`   - Cart Items: ${user.cartItems.length}`);
    console.log(`   - Sessions: ${user.sessions.length}`);
    console.log(`   - KYC Records: ${user.kyc ? 1 : 0}`);
    console.log(`   - Payment Methods: ${user.paymentMethods.length}`);
    console.log(`   - Transfers From: ${user.transfersFrom.length}`);
    console.log(`   - Transfers To: ${user.transfersTo.length}`);

    // Check for users who have this user as referrer
    const referrals = await prisma.user.findMany({
      where: {
        referredBy: user.username
      },
      select: {
        id: true,
        username: true
      }
    });

    console.log(`   - Direct Referrals: ${referrals.length}`);
    if (referrals.length > 0) {
      console.log(`   ⚠️  WARNING: This user has ${referrals.length} direct referral(s)!`);
      console.log(`   Referrals: ${referrals.map(r => r.username).join(', ')}`);
      console.log(`   ⚠️  These referrals will have their referredBy set to NULL`);
    }

    console.log(`\n🗑️  Starting deletion process...`);

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Update referrals to remove this user as referrer
      if (referrals.length > 0) {
        console.log(`\n📝 Step 1: Updating ${referrals.length} referral(s) to remove referrer...`);
        await tx.user.updateMany({
          where: {
            referredBy: user.username
          },
          data: {
            referredBy: null
          }
        });
        console.log(`✅ Updated referrals`);
      }

      // Step 2: Delete all related records (many will cascade, but we'll do it explicitly)
      console.log(`\n📝 Step 2: Deleting related records...`);
      
      // Delete earnings (linked to package requests)
      const earningsDeleted = await tx.earnings.deleteMany({
        where: { userId: user.id }
      });
      console.log(`   ✅ Deleted ${earningsDeleted.count} earnings records`);

      // Delete package requests (will cascade to earnings that weren't deleted)
      const packageRequestsDeleted = await tx.packageRequest.deleteMany({
        where: { userId: user.id }
      });
      console.log(`   ✅ Deleted ${packageRequestsDeleted.count} package request(s)`);

      // Delete withdrawal requests
      const withdrawalRequestsDeleted = await tx.withdrawalRequest.deleteMany({
        where: { userId: user.id }
      });
      console.log(`   ✅ Deleted ${withdrawalRequestsDeleted.count} withdrawal request(s)`);

      // Delete orders (will cascade to order items)
      const ordersDeleted = await tx.order.deleteMany({
        where: { userId: user.id }
      });
      console.log(`   ✅ Deleted ${ordersDeleted.count} order(s)`);

      // Delete cart items
      const cartItemsDeleted = await tx.cartItem.deleteMany({
        where: { userId: user.id }
      });
      console.log(`   ✅ Deleted ${cartItemsDeleted.count} cart item(s)`);

      // Delete sessions
      const sessionsDeleted = await tx.session.deleteMany({
        where: { userId: user.id }
      });
      console.log(`   ✅ Deleted ${sessionsDeleted.count} session(s)`);

      // Delete payment methods
      const paymentMethodsDeleted = await tx.paymentMethod.deleteMany({
        where: { userId: user.id }
      });
      console.log(`   ✅ Deleted ${paymentMethodsDeleted.count} payment method(s)`);

      // Delete KYC
      if (user.kyc) {
        await tx.kYC.delete({
          where: { userId: user.id }
        });
        console.log(`   ✅ Deleted KYC record`);
      }

      // Delete transfers (transfersTo will cascade, transfersFrom will set to null)
      const transfersToDeleted = await tx.transfer.deleteMany({
        where: { toUserId: user.id }
      });
      console.log(`   ✅ Deleted ${transfersToDeleted.count} incoming transfer(s)`);

      // Note: transfersFrom will have fromUserId set to NULL (onDelete: SetNull)

      // Step 3: Finally delete the user
      console.log(`\n📝 Step 3: Deleting user record...`);
      await tx.user.delete({
        where: { id: user.id }
      });
      console.log(`✅ Deleted user: ${user.username}`);

      return {
        userDeleted: true,
        referralsUpdated: referrals.length,
        ordersDeleted: ordersDeleted.count,
        packageRequestsDeleted: packageRequestsDeleted.count,
        withdrawalRequestsDeleted: withdrawalRequestsDeleted.count,
        earningsDeleted: earningsDeleted.count,
        cartItemsDeleted: cartItemsDeleted.count,
        sessionsDeleted: sessionsDeleted.count,
        paymentMethodsDeleted: paymentMethodsDeleted.count,
        transfersDeleted: transfersToDeleted.count
      };
    }, {
      timeout: 60000 // 60 second timeout
    });

    console.log(`\n🎉 Successfully deleted all records for user: ${username}`);
    console.log(`\n📊 Deletion Summary:`);
    console.log(`   - User: ✅ Deleted`);
    console.log(`   - Referrals Updated: ${result.referralsUpdated}`);
    console.log(`   - Orders: ${result.ordersDeleted}`);
    console.log(`   - Package Requests: ${result.packageRequestsDeleted}`);
    console.log(`   - Withdrawal Requests: ${result.withdrawalRequestsDeleted}`);
    console.log(`   - Earnings: ${result.earningsDeleted}`);
    console.log(`   - Cart Items: ${result.cartItemsDeleted}`);
    console.log(`   - Sessions: ${result.sessionsDeleted}`);
    console.log(`   - Payment Methods: ${result.paymentMethodsDeleted}`);
    console.log(`   - Transfers: ${result.transfersDeleted}`);

  } catch (error) {
    console.error(`\n❌ Error deleting user:`, error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get username from command line arguments
const username = process.argv[2];

if (!username) {
  console.error('❌ Please provide a username');
  console.log('Usage: node scripts/delete-user-complete.cjs <username>');
  process.exit(1);
}

// Confirmation prompt
console.log(`\n⚠️  WARNING: This will permanently delete ALL records for user: ${username}`);
console.log(`   - User account`);
console.log(`   - All orders and order items`);
console.log(`   - All package requests`);
console.log(`   - All withdrawal requests`);
console.log(`   - All earnings records`);
console.log(`   - All cart items`);
console.log(`   - All sessions`);
console.log(`   - All payment methods`);
console.log(`   - All KYC records`);
console.log(`   - All transfers`);
console.log(`   - Referrals will have their referredBy set to NULL`);
console.log(`\n🔴 This action cannot be undone!\n`);

// For safety, require explicit confirmation
if (process.argv[3] !== '--confirm') {
  console.log('To confirm deletion, run with --confirm flag:');
  console.log(`node scripts/delete-user-complete.cjs ${username} --confirm`);
  process.exit(0);
}

// Execute deletion
deleteUserComplete(username)
  .then(() => {
    console.log('\n✅ Deletion completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Deletion failed:', error.message);
    process.exit(1);
  });

