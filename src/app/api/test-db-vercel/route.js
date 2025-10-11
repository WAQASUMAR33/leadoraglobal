import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log('🔍 Testing database connection from Vercel...');
    
    // Check if DATABASE_URL is set
    const dbUrlSet = !!process.env.DATABASE_URL;
    console.log('DATABASE_URL set:', dbUrlSet);
    
    if (!dbUrlSet) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL environment variable is not set',
        solution: 'Add DATABASE_URL in Vercel project settings → Environment Variables',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    // Test connection
    console.log('Attempting to connect to database...');
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Test query
    console.log('Attempting to count users...');
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users`);
    
    // Test fetch
    const sampleUser = await prisma.user.findFirst({
      select: {
        id: true,
        username: true,
        createdAt: true
      }
    });
    
    return NextResponse.json({
      success: true,
      message: '✅ Database connection is working!',
      data: {
        databaseUrlSet: true,
        userCount: userCount,
        sampleUser: sampleUser ? {
          id: sampleUser.id,
          username: sampleUser.username,
          createdAt: sampleUser.createdAt
        } : null,
        serverTime: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform
      }
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      errorCode: error.code,
      errorName: error.name,
      databaseUrlSet: !!process.env.DATABASE_URL,
      diagnosis: getDiagnosis(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
    
  } finally {
    await prisma.$disconnect();
  }
}

function getDiagnosis(error) {
  if (error.message.includes("Can't reach database server")) {
    return {
      issue: 'Database server is not reachable',
      possibleCauses: [
        'MySQL server is down at 148.222.53.5:3306',
        'Firewall is blocking Vercel IP addresses',
        'DATABASE_URL is incorrect',
        'Network connectivity issue'
      ],
      solutions: [
        'Verify MySQL server is running',
        'Whitelist Vercel IP addresses in hosting firewall',
        'Check DATABASE_URL format in Vercel environment variables',
        'Contact hosting provider to enable remote MySQL access'
      ]
    };
  }
  
  if (error.message.includes('Access denied')) {
    return {
      issue: 'Authentication failed',
      possibleCauses: [
        'Incorrect username or password',
        'User does not have permission to access database',
        'Password contains unencoded special characters'
      ],
      solutions: [
        'Verify username and password in DATABASE_URL',
        'Check user permissions in MySQL',
        'Encode special characters in password (e.g., @ → %40)'
      ]
    };
  }
  
  if (error.message.includes('Unknown database')) {
    return {
      issue: 'Database does not exist',
      possibleCauses: [
        'Database name is incorrect in DATABASE_URL',
        'Database was deleted',
        'Wrong database server'
      ],
      solutions: [
        'Verify database name in DATABASE_URL',
        'Create database on MySQL server',
        'Check if connecting to correct server'
      ]
    };
  }
  
  return {
    issue: 'Unknown database error',
    possibleCauses: ['Various database issues'],
    solutions: ['Check error message above for details']
  };
}

