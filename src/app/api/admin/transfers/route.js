import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';

// GET - Fetch transfer history
export async function GET(request) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('admin-auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const admin = verifyAdminToken(token);
    if (!admin) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const type = searchParams.get('type') || 'all';
    const status = searchParams.get('status') || 'all';

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    if (type !== 'all') {
      where.transferType = type;
    }
    if (status !== 'all') {
      where.status = status;
    }

    // Fetch transfers with pagination
    const [transfers, totalCount] = await Promise.all([
      prisma.transfer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          fromUser: {
            select: {
              id: true,
              fullname: true,
              username: true,
              email: true
            }
          },
          toUser: {
            select: {
              id: true,
              fullname: true,
              username: true,
              email: true
            }
          },
          admin: {
            select: {
              id: true,
              fullName: true,
              username: true
            }
          }
        }
      }),
      prisma.transfer.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        transfers,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching transfers:', error);
    return NextResponse.json({
      error: 'Failed to fetch transfer history'
    }, { status: 500 });
  }
}

// POST - Create new transfer
export async function POST(request) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('admin-auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const admin = verifyAdminToken(token);
    if (!admin) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { username, amount, description } = await request.json();

    // Validate input
    if (!username || !amount) {
      return NextResponse.json({
        error: 'Username and amount are required'
      }, { status: 400 });
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return NextResponse.json({
        error: 'Amount must be a positive number'
      }, { status: 400 });
    }

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        fullname: true,
        username: true,
        balance: true
      }
    });

    if (!user) {
      return NextResponse.json({
        error: 'User not found with the provided username'
      }, { status: 404 });
    }

    // Create transfer record
    const transfer = await prisma.transfer.create({
      data: {
        toUserId: user.id,
        amount: transferAmount,
        transferType: 'admin_to_user',
        description: description || `Direct transfer from admin`,
        adminId: admin.id,
        status: 'completed'
      },
      include: {
        toUser: {
          select: {
            id: true,
            fullname: true,
            username: true,
            email: true
          }
        },
        admin: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        }
      }
    });

    // Update user balance
    await prisma.user.update({
      where: { id: user.id },
      data: {
        balance: {
          increment: transferAmount
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully transferred PKR ${transferAmount} to ${user.fullname} (${user.username})`,
      data: transfer
    });

  } catch (error) {
    console.error('Error creating transfer:', error);
    return NextResponse.json({
      error: 'Failed to process transfer'
    }, { status: 500 });
  }
}











