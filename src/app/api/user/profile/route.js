import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../../../lib/auth';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // Verify user authentication - check both cookie and authorization header
    let token = request.cookies.get('auth-token')?.value;
    
    // If no cookie token, check authorization header
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
        shoppingAmount: true,
        points: true,
        currentPackageId: true,
        packageExpiryDate: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Convert Decimal fields to numbers for proper JSON serialization
    const userResponse = {
      ...user,
      balance: parseFloat(user.balance || 0),
      shoppingAmount: parseFloat(user.shoppingAmount || 0),
      totalEarnings: parseFloat(user.totalEarnings || 0),
      points: user.points || 0
    };

    return NextResponse.json({
      success: true,
      user: userResponse
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
