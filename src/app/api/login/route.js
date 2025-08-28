// app/api/login/route.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../../lib/prisma';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Email and password are required' 
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        fname: true,
        lname: true,
        isVerified: true,
        phoneNumber: true,
        city: true,
        address: true,
        idCardNo: true,
        lastLoginAt: true
      }
    });

    if (!user) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Invalid email or password' 
        }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if email is verified
    if (!user.isVerified) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Please verify your email address before logging in' 
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
          message: 'Invalid email or password' 
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
        email: user.email,
        role: 'user'
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Create session record (optional)
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
      email: user.email,
      firstName: user.fname,
      lastName: user.lname,
      fullName: `${user.fname} ${user.lname}`,
      phoneNumber: user.phoneNumber,
      city: user.city,
      address: user.address,
      idCardNo: user.idCardNo,
      isVerified: user.isVerified,
      lastLoginAt: user.lastLoginAt
    };

    // Set HTTP-only cookie with JWT token
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    };

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
          'Set-Cookie': `auth-token=${token}; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`
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
          'Set-Cookie': 'auth-token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/'
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
