import prisma from '../../../../lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'User ID is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user with current package information
    console.log('🔍 Fetching user package for userId:', userId);
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        currentPackage: {
          include: {
            rank: true
          }
        }
      }
    });
    
    console.log('🔍 User found:', {
      id: user?.id,
      currentPackageId: user?.currentPackageId,
      packageExpiryDate: user?.packageExpiryDate,
      hasCurrentPackage: !!user?.currentPackage
    });

    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'User not found'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If user has no current package, return null
    if (!user.currentPackage) {
      return new Response(
        JSON.stringify({
          success: true,
          userPackage: null,
          packageDetails: null
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Determine package status based on expiry date
    let status = 'active';
    if (user.packageExpiryDate) {
      const now = new Date();
      const expiryDate = new Date(user.packageExpiryDate);
      if (now > expiryDate) {
        status = 'expired';
      }
    }

    // Create userPackage object
    const userPackage = {
      id: user.id,
      packageId: user.currentPackageId,
      status: status,
      startDate: user.createdAt,
      expiryDate: user.packageExpiryDate
    };

    // Check if user paid from balance (shopping amount should be 0)
    let effectiveShoppingAmount = parseFloat(user.currentPackage.shopping_amount);
    
    // Get the most recent approved package request to check payment method
    const recentPackageRequest = await prisma.packageRequest.findFirst({
      where: {
        userId: user.id,
        packageId: user.currentPackageId,
        status: 'approved'
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    // If the package was paid from balance, shopping amount should be 0
    if (recentPackageRequest && 
        recentPackageRequest.transactionId && 
        recentPackageRequest.transactionId.startsWith('BAL_') && 
        recentPackageRequest.transactionReceipt === 'Paid from user balance') {
      effectiveShoppingAmount = 0;
      console.log(`User ${user.username} paid from balance - setting shopping amount to 0`);
    }

    // Create packageDetails object
    const packageDetails = {
      id: user.currentPackage.id,
      package_name: user.currentPackage.package_name,
      package_amount: user.currentPackage.package_amount,
      package_direct_commission: user.currentPackage.package_direct_commission,
      package_indirect_commission: user.currentPackage.package_indirect_commission,
      shopping_amount: effectiveShoppingAmount, // Use effective shopping amount
      rank: user.currentPackage.rank
    };

    return new Response(
      JSON.stringify({
        success: true,
        userPackage: userPackage,
        packageDetails: packageDetails
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching user package:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch user package',
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}