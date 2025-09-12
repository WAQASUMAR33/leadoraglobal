import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's earnings data
    const earnings = {
      totalEarnings: existingUser.totalEarnings || 0,
      referralCount: existingUser.referralCount || 0,
      packageId: existingUser.packageId,
      rankId: existingUser.rankId,
      balance: existingUser.balance || 0
    };

    // Get user's package details if they have one
    let packageDetails = null;
    if (existingUser.packageId) {
      packageDetails = await prisma.package.findUnique({
        where: { id: existingUser.packageId },
        include: {
          rank: true
        }
      });
    }

    // Get user's rank details if they have one
    let rankDetails = null;
    if (existingUser.rankId) {
      rankDetails = await prisma.rank.findUnique({
        where: { id: existingUser.rankId }
      });
    }

    return NextResponse.json({
      earnings,
      packageDetails,
      rankDetails
    });
  } catch (error) {
    console.error('Error fetching user earnings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


















