import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { verifyAdminToken } from '../../../../../lib/adminAuth';
import bcrypt from 'bcryptjs';

// GET - Fetch single user
export async function GET(request, { params }) {
  try {
    // Verify admin authentication
    const admin = verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullname: true,
        username: true,
        email: true,
        phoneNumber: true,
        status: true,
        balance: true,
        points: true,
        rankId: true,
        referredBy: true,
        rank: {
          select: {
            id: true,
            title: true,
            required_points: true
          }
        },
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(request, { params }) {
  try {
    // Verify admin authentication
    const admin = verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const body = await request.json();
    const { fullname, username, password, status, balance, points, rankId, referredBy } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if username is being changed and if it already exists
    if (username && username !== existingUser.username) {
      const usernameExists = await prisma.user.findUnique({
        where: { username }
      });
      if (usernameExists) {
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 400 }
        );
      }
    }

    // Check if referredBy is being changed and validate the new referrer
    if (referredBy !== undefined && referredBy !== existingUser.referredBy) {
      if (referredBy) {
        // Check if the new referrer exists
        const referrerExists = await prisma.user.findUnique({
          where: { username: referredBy }
        });
        if (!referrerExists) {
          return NextResponse.json(
            { error: 'Referrer username does not exist' },
            { status: 400 }
          );
        }
        
        // Check for circular reference (user cannot refer themselves)
        if (referredBy === existingUser.username) {
          return NextResponse.json(
            { error: 'User cannot refer themselves' },
            { status: 400 }
          );
        }
        
        // Check for circular reference in the referral chain
        let currentReferrer = referredBy;
        const visited = new Set();
        while (currentReferrer && !visited.has(currentReferrer)) {
          visited.add(currentReferrer);
          if (currentReferrer === existingUser.username) {
            return NextResponse.json(
              { error: 'Circular referral detected' },
              { status: 400 }
            );
          }
          const referrerUser = await prisma.user.findUnique({
            where: { username: currentReferrer },
            select: { referredBy: true }
          });
          currentReferrer = referrerUser?.referredBy;
        }
      }
    }

    // Prepare update data
    const updateData = {};
    if (fullname) updateData.fullname = fullname;
    if (username) updateData.username = username;
    if (status) updateData.status = status;
    if (referredBy !== undefined) updateData.referredBy = referredBy || null;
    
    // Add balance, points, and rank updates
    if (balance !== undefined) updateData.balance = parseFloat(balance);
    if (points !== undefined) updateData.points = parseInt(points);
    if (rankId !== undefined) updateData.rankId = rankId ? parseInt(rankId) : null;

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        fullname: true,
        username: true,
        email: true,
        phoneNumber: true,
        status: true,
        balance: true,
        points: true,
        rankId: true,
        referredBy: true,
        rank: {
          select: {
            id: true,
            title: true,
            required_points: true
          }
        },
        createdAt: true,
        updatedAt: true
      }
    });

    // Convert Decimal fields to numbers
    const userWithNumbers = {
      ...user,
      balance: parseFloat(user.balance || 0)
    };

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: userWithNumbers
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(request, { params }) {
  try {
    // Verify admin authentication
    const admin = verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
