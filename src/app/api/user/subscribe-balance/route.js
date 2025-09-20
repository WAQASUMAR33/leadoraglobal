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

    // Check if user exists and get current balance
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        currentPackage: true
      }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if package exists
    const existingPackage = await prisma.package.findUnique({
      where: { id: parseInt(packageId) },
      include: {
        rank: true
      }
    });

    if (!existingPackage) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    // Check if user has sufficient balance
    const packageAmount = parseFloat(existingPackage.package_amount);
    const userBalance = parseFloat(existingUser.balance);

    if (userBalance < packageAmount) {
      return NextResponse.json({ 
        error: 'Insufficient balance',
        required: packageAmount,
        available: userBalance,
        shortfall: packageAmount - userBalance
      }, { status: 400 });
    }

    // Check if user already has an active package
    if (existingUser.currentPackageId && existingUser.currentPackage) {
      // Check if current package is still active (not expired)
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

    // Start transaction for package subscription
    const result = await prisma.$transaction(async (tx) => {
      // Deduct package amount from user balance first
      const newBalance = userBalance - packageAmount;
      
      // Update user's balance immediately
      await tx.user.update({
        where: { id: parseInt(userId) },
        data: {
          balance: newBalance,
          updatedAt: new Date()
        }
      });

      // Create a package request record for tracking (status: pending initially)
      const packageRequest = await tx.packageRequest.create({
        data: {
          userId: parseInt(userId),
          packageId: parseInt(packageId),
          transactionId: `BAL_${Date.now()}_${userId}`, // Generate unique transaction ID for balance payment
          transactionReceipt: 'Paid from user balance',
          status: 'pending', // Start as pending, will be approved using same algorithm
          notes: `Package subscription paid from user balance. Amount: PKR ${packageAmount}`,
          adminNotes: 'Auto-approved balance payment',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      return {
        packageRequestId: packageRequest.id,
        newBalance: newBalance
      };
    });

    // Now use the same approval algorithm as admin to handle package assignment, rank updates, and MLM commissions
    console.log(`🚀 Using admin approval algorithm for balance payment package request ${result.packageRequestId}`);
    const approvalResult = await approvePackageRequest(result.packageRequestId);

    return NextResponse.json({ 
      success: true,
      message: 'Package subscribed successfully using balance with full MLM commission distribution',
      data: {
        packageId: parseInt(packageId),
        packageName: existingPackage.package_name,
        amount: packageAmount,
        newBalance: result.newBalance,
        approvalResult: approvalResult,
        packageRequestId: result.packageRequestId
      }
    });

  } catch (error) {
    console.error('Error subscribing to package with balance:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
