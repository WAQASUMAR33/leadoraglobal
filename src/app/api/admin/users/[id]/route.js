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
        firstname: true,
        lastname: true,
        fullname: true,
        username: true,
        email: true,
        phoneNumber: true,
        role: true,
        status: true,
        balance: true,
        points: true,
        rankId: true,
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
    const { firstname, lastname, username, password, role, status, balance, points, rankId } = body;

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

    // Prepare update data
    const updateData = {};
    if (firstname) updateData.firstname = firstname;
    if (lastname !== undefined) updateData.lastname = lastname;
    if (username) updateData.username = username;
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    
    // Add balance, points, and rank updates
    if (balance !== undefined) updateData.balance = parseFloat(balance);
    if (points !== undefined) updateData.points = parseInt(points);
    if (rankId !== undefined) updateData.rankId = rankId ? parseInt(rankId) : null;

    // Update fullname if firstname or lastname changed
    if (firstname || lastname !== undefined) {
      const newFirstname = firstname || existingUser.firstname;
      const newLastname = lastname !== undefined ? lastname : existingUser.lastname;
      updateData.fullname = `${newFirstname} ${newLastname}`.trim();
    }

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
        firstname: true,
        lastname: true,
        fullname: true,
        username: true,
        email: true,
        phoneNumber: true,
        role: true,
        status: true,
        balance: true,
        points: true,
        rankId: true,
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
