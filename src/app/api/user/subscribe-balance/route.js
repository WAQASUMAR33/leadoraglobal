import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculateMLMCommissions, updateUserPackageAndRank } from '../../../../lib/commissionSystem';

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
      // Deduct package amount from user balance
      const newBalance = userBalance - packageAmount;
      
      // Update user's package, rank, and balance
      const updatedUser = await tx.user.update({
        where: { id: parseInt(userId) },
        data: {
          packageId: parseInt(packageId),
          rankId: existingPackage.rankId,
          currentPackageId: parseInt(packageId),
          packageExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          balance: newBalance,
          updatedAt: new Date()
        },
        include: {
          currentPackage: {
            include: {
              rank: true
            }
          }
        }
      });

      // Create a package request record for tracking (marked as approved)
      const packageRequest = await tx.packageRequest.create({
        data: {
          userId: parseInt(userId),
          packageId: parseInt(packageId),
          amount: packageAmount,
          status: 'approved',
          paymentMethod: 'balance',
          paymentProof: 'Paid from user balance',
          approvedAt: new Date(),
          approvedBy: 'system'
        }
      });

      // Apply MLM commission system if user has a referrer
      if (existingUser.referredBy) {
        try {
          await calculateMLMCommissions(
            parseInt(userId),
            parseInt(packageId),
            packageRequest.id,
            tx
          );
        } catch (commissionError) {
          console.error('Error applying MLM commissions:', commissionError);
          // Don't fail the transaction for commission errors
        }
      }

      return {
        user: updatedUser,
        packageRequest: packageRequest,
        newBalance: newBalance
      };
    });

    return NextResponse.json({ 
      success: true,
      message: 'Package subscribed successfully using balance',
      data: {
        packageId: parseInt(packageId),
        packageName: existingPackage.package_name,
        amount: packageAmount,
        newBalance: result.newBalance,
        expiryDate: result.user.packageExpiryDate,
        rank: existingPackage.rank?.title || 'No Rank'
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
