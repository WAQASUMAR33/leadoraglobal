import jwt from 'jsonwebtoken';
import prisma from '../../../../lib/prisma';

export async function GET(req) {
  try {
    // Get token from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Authorization token required' 
        }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

    // Verify admin token
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Invalid token' 
        }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if it's an admin token
    if (!decoded.adminId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Admin access required' 
        }), 
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
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


