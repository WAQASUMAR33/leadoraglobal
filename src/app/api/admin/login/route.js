import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../../../lib/prisma';

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

    // Find admin by username
    const admin = await prisma.admin.findUnique({ 
      where: { username: username },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        password: true,
        role: true,
        permissions: true,
        isActive: true,
        lastLoginAt: true
      }
    });

    if (!admin) {
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

    // Check if admin is active
    if (!admin.isActive) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Account is deactivated. Please contact support.' 
        }), 
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
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
        adminId: admin.id, 
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Update last login time
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() }
    });

    // Create admin session record
    try {
      await prisma.adminSession.create({
        data: {
          adminId: admin.id,
          token: token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });
    } catch (sessionError) {
      console.warn('Failed to create admin session record:', sessionError);
      // Continue with login even if session creation fails
    }

    // Prepare admin data for response (exclude sensitive information)
    const adminData = {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      permissions: admin.permissions,
      isActive: admin.isActive,
      lastLoginAt: admin.lastLoginAt
    };

    // Set HTTP-only cookie with JWT token
    const isProduction = process.env.NODE_ENV === 'production';
    const domain = process.env.NEXT_PUBLIC_DOMAIN;
    
    // Build cookie string with proper production settings
    let cookieString = `admin-token=${token}; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`;
    
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
        message: 'Admin login successful',
        admin: adminData,
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
    console.error('Admin login error:', error);
    
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

// Admin logout endpoint
export async function DELETE(req) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (token) {
      // Delete admin session record
      await prisma.adminSession.deleteMany({
        where: { token: token }
      });
    }

    // Clear cookie with proper production settings
    const isProduction = process.env.NODE_ENV === 'production';
    const domain = process.env.NEXT_PUBLIC_DOMAIN;
    
    let cookieString = `admin-token=; HttpOnly; SameSite=Strict; Max-Age=0; Path=/`;
    
    if (isProduction) {
      cookieString += '; Secure';
    }
    
    if (domain) {
      cookieString += `; Domain=${domain}`;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Admin logged out successfully'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookieString
        }
      }
    );
  } catch (error) {
    console.error('Admin logout error:', error);
    
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


