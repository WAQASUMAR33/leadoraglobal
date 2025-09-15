import jwt from 'jsonwebtoken';
import prisma from '../../../../lib/prisma';

export async function GET(request) {
  try {
    // Get admin token from cookie
    const adminToken = request.cookies.get('admin-token')?.value;
    
    if (!adminToken) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Admin authentication required - no token found'
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    
    let decoded;
    try {
      decoded = jwt.verify(adminToken, jwtSecret);
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid admin token'
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if it's an admin token
    if (!decoded.adminId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Admin access required'
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const username = searchParams.get('username');
    const requestNumber = searchParams.get('requestNumber');
    const userName = searchParams.get('userName');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20; // Default 20 items per page
    const skip = (page - 1) * limit;

    let whereClause = {};
    
    if (userId) {
      whereClause.userId = parseInt(userId);
    }
    
    if (status) {
      whereClause.status = status;
    }

    // Add search filters
    if (username || requestNumber || userName) {
      whereClause.OR = [];
      
      if (username) {
        whereClause.OR.push({
          user: {
            username: {
              contains: username,
              mode: 'insensitive'
            }
          }
        });
      }
      
      if (requestNumber) {
        whereClause.OR.push({
          id: {
            equals: parseInt(requestNumber) || 0
          }
        });
      }
      
      if (userName) {
        whereClause.OR.push({
          user: {
            fullname: {
              contains: userName,
              mode: 'insensitive'
            }
          }
        });
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.packageRequest.count({
      where: whereClause
    });

    // Get paginated results
    const packageRequests = await prisma.packageRequest.findMany({
      where: whereClause,
      select: {
        id: true,
        userId: true,
        packageId: true,
        transactionId: true,
        notes: true,
        status: true,
        adminNotes: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            username: true,
            fullname: true
          }
        },
        package: {
          select: {
            id: true,
            package_name: true,
            package_amount: true
          }
        }
        // Note: transactionReceipt is excluded from list view for performance
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: skip,
      take: limit
    });

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return new Response(
      JSON.stringify({
        success: true,
        packageRequests,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching package requests:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch package requests',
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
