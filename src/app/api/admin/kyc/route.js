import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';

// GET - Fetch all KYC submissions for admin review
export async function GET(request) {
  try {
    // Verify admin authentication
    const admin = verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    if (status && status !== 'all') {
      where.kyc_status = status;
    }

    // Fetch KYC submissions with user details
    const kycSubmissions = await prisma.kYC.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullname: true,
            email: true,
            phoneNumber: true,
            createdAt: true,
            status: true
          }
        }
      },
      orderBy: [
        { kyc_status: 'asc' }, // Pending first
        { createdAt: 'desc' }
      ],
      skip,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.kYC.count({ where });

    // Get counts by status for dashboard stats
    const statusCounts = await prisma.kYC.groupBy({
      by: ['kyc_status'],
      _count: {
        kyc_status: true
      }
    });

    const stats = statusCounts.reduce((acc, item) => {
      acc[item.kyc_status] = item._count.kyc_status;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      kycSubmissions,
      stats,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching KYC submissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
