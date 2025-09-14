import jwt from 'jsonwebtoken';
import prisma from '../../../../lib/prisma';

export async function GET(req) {
  try {
    // Admin authentication is handled by middleware
    // The admin info is available in headers set by middleware
    const adminId = req.headers.get('x-admin-id');
    const adminUsername = req.headers.get('x-admin-username');
    const adminEmail = req.headers.get('x-admin-email');
    const adminRole = req.headers.get('x-admin-role');
    
    // Debug logging
    console.log('Admin stats API called');
    console.log('Admin ID:', adminId);
    console.log('Admin username:', adminUsername);
    console.log('All headers:', Object.fromEntries(req.headers.entries()));
    
    if (!adminId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Admin authentication required',
          debug: {
            hasAdminId: !!adminId,
            hasAdminUsername: !!adminUsername,
            hasAdminEmail: !!adminEmail,
            hasAdminRole: !!adminRole
          }
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch dashboard statistics
    const [
      totalUsers,
      totalProducts,
      totalPackages,
      totalRanks
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.package.count(),
      prisma.rank.count()
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        totalUsers,
        totalProducts,
        totalPackages,
        totalRanks
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Admin stats error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        message: 'An error occurred while fetching statistics' 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}


