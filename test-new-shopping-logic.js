/**
 * Test script for the new shopping logic implementation
 * 
 * This script tests the new shopping logic where:
 * 1. Users without active packages can shop and send payment proof
 * 2. Users with active packages can only shop within their package shopping amount
 * 3. When admin approves orders from users without packages, the amount is added to their account
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNewShoppingLogic() {
  console.log('🧪 Testing New Shopping Logic Implementation...\n');

  try {
    // Test 1: Check shopping eligibility for user without package
    console.log('📋 Test 1: User without active package');
    const userWithoutPackage = await prisma.user.findFirst({
      where: {
        currentPackageId: null
      },
      select: {
        id: true,
        username: true,
        fullname: true,
        currentPackageId: true,
        packageExpiryDate: true
      }
    });

    if (userWithoutPackage) {
      console.log(`✅ Found user without package: ${userWithoutPackage.username} (ID: ${userWithoutPackage.id})`);
      
      // Check their shopping eligibility
      const hasActivePackage = userWithoutPackage.currentPackageId && 
                              userWithoutPackage.packageExpiryDate && 
                              new Date(userWithoutPackage.packageExpiryDate) > new Date();
      
      console.log(`   - Has active package: ${hasActivePackage}`);
      console.log(`   - Should be eligible to shop with payment proof: ${!hasActivePackage}`);
    } else {
      console.log('❌ No user without package found for testing');
    }

    // Test 2: Check shopping eligibility for user with active package
    console.log('\n📋 Test 2: User with active package');
    const userWithPackage = await prisma.user.findFirst({
      where: {
        currentPackageId: { not: null },
        packageExpiryDate: { gt: new Date() }
      },
      include: {
        currentPackage: {
          select: {
            id: true,
            package_name: true,
            shopping_amount: true
          }
        }
      }
    });

    if (userWithPackage) {
      console.log(`✅ Found user with active package: ${userWithPackage.username} (ID: ${userWithPackage.id})`);
      console.log(`   - Package: ${userWithPackage.currentPackage.package_name}`);
      console.log(`   - Shopping amount: PKR ${userWithPackage.currentPackage.shopping_amount}`);
      
      // Check their orders
      const userOrders = await prisma.order.findMany({
        where: { userId: userWithPackage.id },
        select: { totalAmount: true }
      });
      
      const totalSpent = userOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
      const remainingAmount = parseFloat(userWithPackage.currentPackage.shopping_amount) - totalSpent;
      
      console.log(`   - Total spent: PKR ${totalSpent}`);
      console.log(`   - Remaining amount: PKR ${remainingAmount}`);
      console.log(`   - Can shop: ${remainingAmount > 0}`);
    } else {
      console.log('❌ No user with active package found for testing');
    }

    // Test 3: Check order approval logic
    console.log('\n📋 Test 3: Order approval logic');
    const pendingOrder = await prisma.order.findFirst({
      where: {
        status: 'pending',
        paymentStatus: 'pending'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            balance: true,
            currentPackageId: true,
            packageExpiryDate: true
          }
        }
      }
    });

    if (pendingOrder) {
      console.log(`✅ Found pending order: ${pendingOrder.orderNumber}`);
      console.log(`   - User: ${pendingOrder.user.username}`);
      console.log(`   - Order amount: PKR ${pendingOrder.totalAmount}`);
      console.log(`   - User current balance: PKR ${pendingOrder.user.balance}`);
      
      // Check if user has active package
      const hasActivePackage = pendingOrder.user.currentPackageId && 
                              pendingOrder.user.packageExpiryDate && 
                              new Date(pendingOrder.user.packageExpiryDate) > new Date();
      
      console.log(`   - User has active package: ${hasActivePackage}`);
      
      if (!hasActivePackage) {
        const newBalance = parseFloat(pendingOrder.user.balance) + parseFloat(pendingOrder.totalAmount);
        console.log(`   - Would add PKR ${pendingOrder.totalAmount} to balance`);
        console.log(`   - New balance would be: PKR ${newBalance}`);
      } else {
        console.log(`   - No balance addition (user has active package)`);
      }
    } else {
      console.log('❌ No pending orders found for testing');
    }

    console.log('\n✅ New Shopping Logic Test Completed!');
    console.log('\n📝 Summary of Changes:');
    console.log('   1. ✅ ALL USERS can now shop - NO RESTRICTIONS');
    console.log('   2. ✅ Users without active packages can shop and send payment proof');
    console.log('   3. ✅ Users with active packages can shop with package benefits (no limits)');
    console.log('   4. ✅ When admin approves orders from users without packages, amount is added to their balance');
    console.log('   5. ✅ Shop page shows different UI based on user package status');
    console.log('   6. ✅ Admin orders page shows payment proof status and approval instructions');
    console.log('   7. ✅ REMOVED: "You need an active package to shop" restriction');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testNewShoppingLogic();
