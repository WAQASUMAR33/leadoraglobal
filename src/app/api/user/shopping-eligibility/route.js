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
      // User with active package - show package info but allow unlimited shopping
      const remainingAmount = parseFloat(user.currentPackage.shopping_amount) - totalSpent;

      return NextResponse.json({
        success: true,
        eligible: true, // Always allow shopping
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
          shoppingAmount: parseFloat(user.currentPackage.shopping_amount),
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

  } catch (error) {
    console.error('Shopping eligibility API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
