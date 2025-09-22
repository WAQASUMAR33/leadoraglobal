// app/api/login/route.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../../lib/prisma';

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Username and password are required' 
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Find user by username
    let user = await prisma.user.findUnique({ 
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        username: true,
        password: true,
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
          message: 'Invalid username or password' 
        }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if user is active
    if (user.status !== 'active') {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Account is not active. Please contact support.' 
        }), 
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Invalid username or password' 
        }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Create session record
    try {
      await prisma.session.create({
        data: {
          userId: user.id,
          token: token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });
    } catch (sessionError) {
      console.warn('Failed to create session record:', sessionError);
      // Continue with login even if session creation fails
    }

    // Prepare user data for response (exclude sensitive information)
    const userData = {
      id: user.id,
      username: user.username,
      fullname: user.fullname,
      referredBy: user.referredBy,
      referralCount: user.referralCount,
      totalEarnings: user.totalEarnings,
      packageId: user.packageId,
      rankId: user.rankId,
      balance: user.balance,
      status: user.status,
      createdAt: user.createdAt
    };

    // Set HTTP-only cookie with JWT token
    const isProduction = process.env.NODE_ENV === 'production';
    const domain = process.env.NEXT_PUBLIC_DOMAIN;
    
    // Build cookie string with proper production settings
    let cookieString = `auth-token=${token}; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`;
    
    // Only add Secure flag if we're actually on HTTPS
    if (isProduction) {
      cookieString += '; Secure';
    }
    
    // Add domain if specified
    if (domain) {
      cookieString += `; Domain=${domain}`;
    }

    const response = new Response(
      JSON.stringify({
        success: true,
        message: 'Login successful',
        user: userData,
        token: token
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookieString
        }
      }
    );

    return response;

  } catch (error) {
    console.error('Login error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        message: 'An error occurred during login. Please try again.' 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Optional: Add logout endpoint
export async function DELETE(req) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (token) {
      // Delete session record
      await prisma.session.deleteMany({
        where: { token: token }
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Logged out successfully'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `auth-token=; HttpOnly; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''} SameSite=Strict; Max-Age=0; Path=/`
        }
      }
    );
  } catch (error) {
    console.error('Logout error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'An error occurred during logout'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
