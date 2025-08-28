import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ 
          valid: false,
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
      return new Response(
        JSON.stringify({ 
          valid: true,
          user: decoded
        }), 
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (jwtError) {
      return new Response(
        JSON.stringify({ 
          valid: false,
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
        valid: false,
        message: 'An error occurred during token verification' 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}


