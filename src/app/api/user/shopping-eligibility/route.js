import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

export async function GET(request) {
  try {
    // Verify user authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;

    // Fetch user data with current package
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        fullname: true,
        username: true,
        currentPackageId: true,
        packageExpiryDate: true,
        currentPackage: {
          select: {
            id: true,
            package_name: true,
            shopping_amount: true,
            package_amount: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has an active package
    const hasActivePackage = user.currentPackageId && 
                            user.packageExpiryDate && 
                            new Date(user.packageExpiryDate) > new Date();

    // Check if user paid from balance (shopping amount should be 0)
    let effectiveShoppingAmount = parseFloat(user.currentPackage?.shopping_amount || 0);
    let paidFromBalance = false;
    
    if (hasActivePackage) {
      // Get the most recent approved package request to check payment method
      const recentPackageRequest = await prisma.packageRequest.findFirst({
        where: {
          userId: parseInt(userId),
          packageId: user.currentPackageId,
          status: 'approved'
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });
      
      // If the package was paid from balance, shopping amount should be 0 BUT allow unlimited shopping
      if (recentPackageRequest && 
          recentPackageRequest.transactionId && 
          recentPackageRequest.transactionId.startsWith('BAL_') && 
          recentPackageRequest.transactionReceipt === 'Paid from user balance') {
        paidFromBalance = true;
        console.log(`Shopping eligibility: User ${user.username} paid from balance - unlimited shopping with payment proof`);
      }
    }

    // Get existing orders to check shopping history
    const existingOrders = await prisma.order.findMany({
      where: { userId: parseInt(userId) },
      select: { id: true, totalAmount: true, createdAt: true, status: true, paymentStatus: true }
    });

    const hasShopped = existingOrders.length > 0;
    const totalSpent = existingOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

    // NEW LOGIC: Different behavior based on package status
    if (!hasActivePackage) {
      // User without active package can shop and send payment proof
      return NextResponse.json({
        success: true,
        eligible: true,
        reason: 'no_package_shopping',
        message: 'You can shop and send payment proof. Amount will be added to your account after approval.',
        user: {
          id: user.id,
          fullname: user.fullname,
          username: user.username
        },
        package: null,
        shopping: {
          hasShopped,
          totalSpent,
          remainingAmount: null, // No limit for users without packages
          orderCount: existingOrders.length,
          shoppingType: 'payment_proof_required'
        }
      });
    } else {
      // User with active package
      const remainingAmount = effectiveShoppingAmount - totalSpent;

      // Three scenarios:
      // 1. Paid from balance (paidFromBalance = true) → unlimited shopping with payment proof
      // 2. Package has shopping amount > 0 → shopping within limit
      // 3. Package has shopping amount = 0 (like Student package) → NO shopping allowed

      if (paidFromBalance) {
        // Scenario 1: Paid from balance - unlimited shopping with payment proof
        return NextResponse.json({
          success: true,
          eligible: true,
          reason: 'balance_payment_shopping',
          message: 'You subscribed from balance. You can shop with payment proof.',
          user: {
            id: user.id,
            fullname: user.fullname,
            username: user.username
          },
          package: {
            id: user.currentPackage.id,
            name: user.currentPackage.package_name,
            shoppingAmount: effectiveShoppingAmount,
            packageAmount: parseFloat(user.currentPackage.package_amount)
          },
          shopping: {
            hasShopped,
            totalSpent,
            remainingAmount: null, // Unlimited
            orderCount: existingOrders.length,
            shoppingType: 'payment_proof_required'
          }
        });
      } else if (effectiveShoppingAmount === 0) {
        // Scenario 3: Package with 0 shopping amount (Student package) - NO shopping
        return NextResponse.json({
          success: true,
          eligible: false,
          reason: 'no_shopping_amount',
          message: 'Your package does not include shopping benefits. Upgrade your package to shop.',
          user: {
            id: user.id,
            fullname: user.fullname,
            username: user.username
          },
          package: {
            id: user.currentPackage.id,
            name: user.currentPackage.package_name,
            shoppingAmount: 0,
            packageAmount: parseFloat(user.currentPackage.package_amount)
          },
          shopping: {
            hasShopped,
            totalSpent,
            remainingAmount: 0,
            orderCount: existingOrders.length,
            shoppingType: 'no_shopping_allowed'
          }
        });
      } else {
        // Scenario 2: Package with shopping amount - shopping within limit
        return NextResponse.json({
          success: true,
          eligible: true,
          reason: 'package_shopping',
          message: 'You can shop with your package benefits',
          user: {
            id: user.id,
            fullname: user.fullname,
            username: user.username
          },
          package: {
            id: user.currentPackage.id,
            name: user.currentPackage.package_name,
            shoppingAmount: effectiveShoppingAmount,
            packageAmount: parseFloat(user.currentPackage.package_amount)
          },
          shopping: {
            hasShopped,
            totalSpent,
            remainingAmount: Math.max(0, remainingAmount),
            orderCount: existingOrders.length,
            shoppingType: 'package_benefits'
          }
        });
      }
    }

  } catch (error) {
    console.error('Shopping eligibility API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
