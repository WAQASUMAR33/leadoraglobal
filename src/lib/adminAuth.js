import jwt from 'jsonwebtoken';

// Helper function to verify admin token
export const verifyAdminToken = (request) => {
  try {
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('admin-token')?.value;
    
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : cookieToken;
    
    if (!token) {
      return null;
    }
    
    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    
    try {
      const decoded = jwt.verify(token, jwtSecret);
      return {
        adminId: decoded.adminId,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions
      };
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return null;
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};

// Middleware function to check admin authentication
export const requireAdminAuth = (handler) => {
  return async (request, ...args) => {
    const admin = verifyAdminToken(request);
    if (!admin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Add admin info to request object
    request.admin = admin;
    return handler(request, ...args);
  };
};

