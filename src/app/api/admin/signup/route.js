import bcrypt from 'bcryptjs';
import prisma from '../../../../lib/prisma';

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, email, fullName, password, role, permissions } = body;

    // Validate required fields
    if (!username || !email || !fullName || !password) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Missing required fields: username, email, fullName, password' 
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if username already exists
    const existingUsername = await prisma.admin.findUnique({
      where: { username: username }
    });
    if (existingUsername) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Username already exists' 
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if email already exists
    const existingEmail = await prisma.admin.findUnique({
      where: { email: email }
    });
    if (existingEmail) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Email already exists' 
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Default permissions if not provided
    const defaultPermissions = permissions || [
      'users:read', 'users:write', 
      'products:read', 'products:write', 
      'packages:read', 'packages:write', 
      'ranks:read', 'ranks:write',
      'admin:read', 'admin:write'
    ];

    // Create admin user
    const admin = await prisma.admin.create({
      data: {
        username: username,
        email: email,
        fullName: fullName,
        password: hashedPassword,
        role: role || 'admin',
        permissions: JSON.stringify(defaultPermissions),
        isActive: true
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Admin account created successfully',
        admin: admin
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Admin signup error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'An error occurred during admin creation'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}































