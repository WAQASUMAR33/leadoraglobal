import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAdminToken } from '../../../../lib/adminAuth';

const prisma = new PrismaClient();

// GET - Fetch all withdrawal requests for admin
export async function GET(request) {
  try {
    const admin = verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const withdrawals = await prisma.withdrawalRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullname: true,
            email: true,
            balance: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.withdrawalRequest.count({ where });

    return NextResponse.json({
      success: true,
      withdrawals,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
