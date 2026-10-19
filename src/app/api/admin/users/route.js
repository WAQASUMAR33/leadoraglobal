import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';
import bcrypt from 'bcryptjs';

// GET - Fetch users with high-speed server pagination and search
export async function GET(request) {
  try {
    const admin = verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
    const limitParam = searchParams.get('limit');
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.trim();

    // Build optimized WHERE query
    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { fullname: { contains: search } },
        { username: { contains: search } },
        { email: { contains: search } },
        { phoneNumber: { contains: search } }
      ];
    }

    // Determine pagination bounds
    const isAll = limitParam === 'all';
    const limit = isAll ? undefined : Math.min(100, Math.max(5, parseInt(limitParam) || 20));
    const skip = isAll ? 0 : (page - 1) * limit;

    // Run count and query in parallel for speed
    const [totalCount, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
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
              title: true
            }
          },
          referredBy: true,
          referralCount: true,
          totalEarnings: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      })
    ]);

    // Fast numerical serialization
    const usersWithNumbers = users.map(user => ({
      ...user,
      balance: parseFloat(user.balance || 0),
      totalEarnings: parseFloat(user.totalEarnings || 0)
    }));

    const pageSize = isAll ? totalCount : limit;
    const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalCount / limit));

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
    const admin = verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fullname, username, email, phoneNumber, password, role = 'user', balance = 0, points = 0 } = body;

    if (!fullname || !username || !password) {
      return NextResponse.json(
        { error: 'Full name, username, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          ...(email ? [{ email: email }] : [])
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this username or email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        fullname,
        username,
        email,
        phoneNumber,
        password: hashedPassword,
        balance: parseFloat(balance) || 0,
        points: parseInt(points) || 0,
        status: 'active'
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
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        ...newUser,
        balance: parseFloat(newUser.balance)
      }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
