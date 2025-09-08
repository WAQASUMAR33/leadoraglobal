import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request) {
  try {
    const { userId, fullName, username, email, phoneNumber } = await request.json();

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

    // Check if email is being changed and if it's already taken by another user
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: email,
          id: { not: parseInt(userId) }
        }
      });

      if (emailExists) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }
    }

    // Check if phone number is being changed and if it's already taken by another user
    if (phoneNumber && phoneNumber !== existingUser.phoneNumber) {
      const phoneExists = await prisma.user.findFirst({
        where: {
          phoneNumber: phoneNumber,
          id: { not: parseInt(userId) }
        }
      });

      if (phoneExists) {
        return NextResponse.json({ error: 'Phone number already exists' }, { status: 400 });
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        fullname: fullName || null,
        email: email || null,
        phoneNumber: phoneNumber || null,
        updatedAt: new Date()
      },
      select: {
        id: true,
        username: true,
        fullname: true,
        email: true,
        phoneNumber: true,
        referredBy: true,
        referralCount: true,
        totalEarnings: true,
        packageId: true,
        rankId: true,
        balance: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
