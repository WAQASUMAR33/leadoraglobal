import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { userId, packageId } = await request.json();

    if (!userId || !packageId) {
      return NextResponse.json({ error: 'User ID and Package ID are required' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if package exists
    const existingPackage = await prisma.package.findUnique({
      where: { id: parseInt(packageId) }
    });

    if (!existingPackage) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    // Check if user already has an active package
    if (existingUser.currentPackageId) {
      return NextResponse.json({ error: 'User already has an active package' }, { status: 400 });
    }

    // Update user's package and rank
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        packageId: parseInt(packageId),
        rankId: existingPackage.rankId,
        currentPackageId: parseInt(packageId),
        packageExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      message: 'Package subscribed successfully',
      packageId: parseInt(packageId)
    });
  } catch (error) {
    console.error('Error subscribing to package:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

