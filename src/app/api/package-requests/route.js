import prisma from '../../../lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Received package request data:', body);
    
    const {
      userId,
      packageId,
      transactionId,
      transactionReceipt,
      notes,
      status
    } = body;

    if (!userId || !packageId || !transactionId || !transactionReceipt) {
      console.log('Missing fields:', { userId, packageId, transactionId, transactionReceipt });
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required fields',
          received: { userId, packageId, transactionId, transactionReceipt }
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Test database connection first
    try {
      await prisma.$connect();
      console.log('Database connected successfully');
      
      // Check if PackageRequest model exists in Prisma client
      if (!prisma.packageRequest) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'PackageRequest model not found in Prisma client. Please run: npx prisma generate',
            error: 'Prisma client needs to be regenerated'
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Test if PackageRequest table exists by trying to count records
      const tableTest = await prisma.packageRequest.count();
      console.log('PackageRequest table exists, current count:', tableTest);
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Database connection failed',
          error: dbError.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create package request
    const packageRequest = await prisma.packageRequest.create({
      data: {
        userId: parseInt(userId),
        packageId: parseInt(packageId),
        transactionId,
        transactionReceipt,
        notes: notes || '',
        status: status || 'pending'
      },
      include: {
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
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Package request created successfully',
        packageRequest
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

      } catch (error) {
      console.error('Error creating package request:', error);
      
      // Check if it's a table doesn't exist error
      if (error.message.includes('Unknown table') || error.message.includes('doesn\'t exist')) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'PackageRequest table does not exist. Please run database migration first.',
            error: error.message,
            solution: 'Run: npx prisma db push'
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to create package request',
          error: error.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
}

export async function GET(request) {
  try {
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
