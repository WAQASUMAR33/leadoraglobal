import prisma from '../../../../lib/prisma';

export async function GET(request) {
  try {
    // Admin authentication is handled by middleware
    // The admin info is available in headers set by middleware
    const adminId = request.headers.get('x-admin-id');
    
    if (!adminId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Admin authentication required'
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
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
