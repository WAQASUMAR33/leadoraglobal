import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';
import bcrypt from 'bcryptjs';

// GET - Fetch all users for admin
export async function GET(request) {
  try {
    // Verify admin authentication
    const admin = verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = (page - 1) * limit;
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    // Build where clause
    const where = {};
    if (role && role !== 'all') {
      where.role = role;
    }
    if (status && status !== 'all') {
      where.status = status;
    }

    const users = await prisma.user.findMany({
      where,
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
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.user.count({ where });

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request) {
  try {
    // Verify admin authentication
    const admin = verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { firstname, lastname, username, password, role, status } = body;

    // Validate required fields
    if (!firstname || !username || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: firstname, username, password' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstname,
        lastname: lastname || '',
        fullname: `${firstname} ${lastname || ''}`.trim(),
        username,
        password: hashedPassword,
        role: role || 'user',
        status: status || 'active'
      },
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
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
