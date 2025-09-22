import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

// GET - Fetch user's transfer history
export async function GET(request) {
  try {
    // Verify user authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const type = searchParams.get('type') || 'all'; // 'sent', 'received', 'all'

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      OR: [
        { fromUserId: userId },
        { toUserId: userId }
      ]
    };

    if (type === 'sent') {
      where.OR = [{ fromUserId: userId }];
    } else if (type === 'received') {
      where.OR = [{ toUserId: userId }];
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
    console.error('Error fetching user transfers:', error);
    return NextResponse.json({
      error: 'Failed to fetch transfer history'
    }, { status: 500 });
  }
}

// POST - Create new user-to-user transfer
export async function POST(request) {
  try {
    // Verify user authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const fromUserId = decoded.userId;
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

    // Check if user is trying to transfer to themselves
    if (username === decoded.username) {
      return NextResponse.json({
        error: 'You cannot transfer funds to yourself'
      }, { status: 400 });
    }

    // Get sender's current balance
    const sender = await prisma.user.findUnique({
      where: { id: fromUserId },
      select: {
        id: true,
        fullname: true,
        username: true,
        balance: true
      }
    });

    if (!sender) {
      return NextResponse.json({
        error: 'Sender account not found'
      }, { status: 404 });
    }

    // Check if sender has sufficient balance
    if (parseFloat(sender.balance) < transferAmount) {
      return NextResponse.json({
        error: 'Insufficient balance for this transfer'
      }, { status: 400 });
    }

    // Find recipient by username
    const recipient = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        fullname: true,
        username: true,
        balance: true
      }
    });

    if (!recipient) {
      return NextResponse.json({
        error: 'Recipient not found with the provided username'
      }, { status: 404 });
    }

    // Create transfer record
    const transfer = await prisma.transfer.create({
      data: {
        fromUserId: fromUserId,
        toUserId: recipient.id,
        amount: transferAmount,
        transferType: 'user_to_user',
        description: description || `Transfer from ${sender.fullname} to ${recipient.fullname}`,
        status: 'completed'
      },
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
        }
      }
    });

    // Update balances
    await prisma.$transaction([
      // Deduct from sender
      prisma.user.update({
        where: { id: fromUserId },
        data: {
          balance: {
            decrement: transferAmount
          }
        }
      }),
      // Add to recipient
      prisma.user.update({
        where: { id: recipient.id },
        data: {
          balance: {
            increment: transferAmount
          }
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      message: `Successfully transferred PKR ${transferAmount} to ${recipient.fullname} (${recipient.username})`,
      data: transfer
    });

  } catch (error) {
    console.error('Error creating user transfer:', error);
    return NextResponse.json({
      error: 'Failed to process transfer'
    }, { status: 500 });
  }
}
