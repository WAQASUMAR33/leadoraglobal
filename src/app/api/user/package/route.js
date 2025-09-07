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

    // Create packageDetails object
    const packageDetails = {
      id: user.currentPackage.id,
      package_name: user.currentPackage.package_name,
      package_amount: user.currentPackage.package_amount,
      package_direct_commission: user.currentPackage.package_direct_commission,
      package_indirect_commission: user.currentPackage.package_indirect_commission,
      shopping_amount: user.currentPackage.shopping_amount,
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