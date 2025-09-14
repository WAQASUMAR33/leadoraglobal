import jwt from 'jsonwebtoken';
import prisma from '../../../../lib/prisma';

export async function GET(req) {
  try {
    // Get admin token from cookie
    const adminToken = req.cookies.get('admin-token')?.value;
    
    // Debug logging
    console.log('Admin stats API called');
    console.log('Admin token from cookie:', adminToken ? 'exists' : 'missing');
    console.log('All cookies:', req.cookies.getAll().map(c => c.name));
    
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
      console.log('JWT verification failed:', error.message);
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
    
    console.log('Admin authenticated successfully:', decoded.adminId);

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


