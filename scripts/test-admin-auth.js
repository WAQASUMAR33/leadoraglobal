const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testAdminAuth() {
  try {
    console.log('Testing admin authentication...');
    
    // Check if admin exists
    const admin = await prisma.admin.findUnique({
      where: { username: 'touseefabbas231@gmail.com' },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true
      }
    });
    
    console.log('Admin found:', admin);
    
    if (!admin) {
      console.log('❌ Admin not found');
      return;
    }
    
    // Test JWT token generation
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const token = jwt.sign(
      { 
        adminId: admin.id, 
        username: admin.username,
        email: admin.email,
        role: admin.role
      },
      jwtSecret,
      { expiresIn: '7d' }
    );
    
    console.log('✅ JWT token generated successfully');
    console.log('Token length:', token.length);
    
    // Verify the token
    const decoded = jwt.verify(token, jwtSecret);
    console.log('✅ Token verification successful:', {
      adminId: decoded.adminId,
      username: decoded.username,
      role: decoded.role
    });
    
    // Check admin sessions
    const sessions = await prisma.adminSession.findMany({
      where: { adminId: admin.id },
      select: {
        id: true,
        token: true,
        expiresAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log('Recent admin sessions:', sessions.length);
    sessions.forEach((session, index) => {
      const isExpired = new Date(session.expiresAt) < new Date();
      console.log(`Session ${index + 1}: ${isExpired ? 'EXPIRED' : 'ACTIVE'} - Created: ${session.createdAt}`);
    });
    
  } catch (error) {
    console.error('Error testing admin auth:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminAuth();
