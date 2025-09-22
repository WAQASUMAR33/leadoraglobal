const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createDefaultAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Create admin user
    const admin = await prisma.admin.create({
      data: {
        username: 'admin',
        email: 'admin@ledora.com',
        fullName: 'System Administrator',
        password: hashedPassword,
        role: 'super_admin',
        permissions: ['users:read', 'users:write', 'products:read', 'products:write', 'packages:read', 'packages:write', 'ranks:read', 'ranks:write'],
        isActive: true
      }
    });

    console.log('Default admin user created successfully:');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Email: admin@ledora.com');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDefaultAdmin();


