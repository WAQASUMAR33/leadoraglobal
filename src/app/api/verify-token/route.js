import jwt from 'jsonwebtoken';
import prisma from '../../../lib/prisma';

export async function GET(req) {
  try {
    // Try to get token from cookie first
    const cookieHeader = req.headers.get('cookie');
    let token = null;
    
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});
      token = cookies['auth-token'];
    }
    
    // If no cookie token, try authorization header
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'No authentication token found' 
        }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    
    try {
      const decoded = jwt.verify(token, jwtSecret);
      
      // Get full user data from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          fullname: true,
          referredBy: true,
          referralCount: true,
          totalEarnings: true,
          packageId: true,
          rankId: true,
          balance: true,
          status: true,
          createdAt: true
        }
      });

      if (!user) {
        return new Response(
          JSON.stringify({ 
            success: false,
            message: 'User not found' 
          }), 
          { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      if (user.status !== 'active') {
        return new Response(
          JSON.stringify({ 
            success: false,
            message: 'Account is not active' 
          }), 
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          user: user
        }), 
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (jwtError) {
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

  } catch (error) {
    console.error('Token verification error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        message: 'An error occurred during token verification' 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Keep POST method for backward compatibility
export async function POST(req) {
  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Token is required' 
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    
    try {
      const decoded = jwt.verify(token, jwtSecret);
      
      // Get full user data from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          fullname: true,
          referredBy: true,
          referralCount: true,
          totalEarnings: true,
          packageId: true,
          rankId: true,
          balance: true,
          status: true,
          createdAt: true
        }
      });

      if (!user) {
        return new Response(
          JSON.stringify({ 
            success: false,
            message: 'User not found' 
          }), 
          { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          user: user
        }), 
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (jwtError) {
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

  } catch (error) {
    console.error('Token verification error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        message: 'An error occurred during token verification' 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}


