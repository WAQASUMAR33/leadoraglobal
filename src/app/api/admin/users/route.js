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
    const limit = searchParams.get('limit');
    const status = searchParams.get('status');

    // Build where clause
    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    // Calculate pagination
    const skip = limit && limit !== 'all' ? (page - 1) * parseInt(limit) : 0;
    const take = limit && limit !== 'all' ? parseInt(limit) : undefined;

    // Get total count first
    const totalCount = await prisma.user.count({ where });

    // Fetch users with pagination
    const users = await prisma.user.findMany({
      where,
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
        rank: {
          select: {
            id: true,
            title: true,
            required_points: true
          }
        },
        referredBy: true,
        referralCount: true,
        totalEarnings: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take
    });

    // Convert Decimal fields to numbers for proper JSON serialization
    const usersWithNumbers = users.map(user => ({
      ...user,
      balance: parseFloat(user.balance || 0),
      totalEarnings: parseFloat(user.totalEarnings || 0)
    }));

    // Calculate pagination info
    const pageSize = limit && limit !== 'all' ? parseInt(limit) : totalCount;
    const totalPages = limit && limit !== 'all' ? Math.ceil(totalCount / parseInt(limit)) : 1;

    return NextResponse.json({
      success: true,
      users: usersWithNumbers,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
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
    const { fullname, username, password, status } = body;

    // Validate required fields
    if (!fullname || !username || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: fullname, username, password' },
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
        fullname,
        username,
        password: hashedPassword,
        status: status || 'active'
      },
      select: {
        id: true,
        fullname: true,
        username: true,
        email: true,
        phoneNumber: true,
        status: true,
        balance: true,
        points: true,
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
