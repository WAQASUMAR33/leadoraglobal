import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { approvePackageRequest } from '../../../../lib/packageApproval';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { userId, packageId } = await request.json();

    if (!userId || !packageId) {
      return NextResponse.json({ error: 'User ID and Package ID are required' }, { status: 400 });
    }

    // Fetch user with shoppingAmount
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { currentPackage: true }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch package
    const existingPackage = await prisma.package.findUnique({
      where: { id: parseInt(packageId) },
      include: { rank: true }
    });

    if (!existingPackage) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    const packageAmount = parseFloat(existingPackage.package_amount);
    const shoppingAmount = parseFloat(existingUser.shoppingAmount || 0);

    if (shoppingAmount < packageAmount) {
      return NextResponse.json({
        error: 'Insufficient shopping amount',
        required: packageAmount,
        available: shoppingAmount,
        shortfall: packageAmount - shoppingAmount
      }, { status: 400 });
    }

    // Block if user already has active package
    if (existingUser.currentPackageId && existingUser.currentPackage) {
      const now = new Date();
      const expiryDate = new Date(existingUser.packageExpiryDate);
      if (now <= expiryDate) {
        return NextResponse.json({
          error: 'User already has an active package',
          currentPackage: existingUser.currentPackage.package_name,
          expiryDate: existingUser.packageExpiryDate
        }, { status: 400 });
      }
    }

    // Create package request (do NOT deduct shopping amount yet - will be deducted on admin approval)
    const packageRequest = await prisma.packageRequest.create({
      data: {
        userId: parseInt(userId),
        packageId: parseInt(packageId),
        transactionId: `SHOP_AMT_${Date.now()}_${userId}`,
        transactionReceipt: 'Paid from shopping amount',
        status: 'pending',
        notes: `Package subscription request using shopping amount. Amount: PKR ${packageAmount}. Shopping amount will be deducted upon admin approval.`,
        adminNotes: 'Package request from shopping amount - pending admin approval',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Package request submitted successfully. Admin will review and approve your request.',
      data: {
        packageId: parseInt(packageId),
        packageName: existingPackage.package_name,
        amount: packageAmount,
        packageRequestId: packageRequest.id
      }
    });
  } catch (error) {
    console.error('Error subscribing to package with shopping amount:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}


