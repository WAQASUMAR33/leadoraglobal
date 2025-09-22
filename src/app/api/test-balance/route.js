import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '1';
    const username = searchParams.get('username') || 'waqasumar33';

    console.log('🔍 Checking user balance...');

    // Check by user ID
    const userById = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        username: true,
        fullname: true,
        balance: true,
        totalEarnings: true,
        points: true
      }
    });

    // Check by username
    const userByUsername = await prisma.user.findUnique({
      where: { username: username },
      select: {
        id: true,
        username: true,
        fullname: true,
        balance: true,
        totalEarnings: true,
        points: true
      }
    });

    // Get first 5 users for reference
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullname: true,
        balance: true
      },
      orderBy: { id: 'asc' },
      take: 5
    });

    return NextResponse.json({
      success: true,
      data: {
        userById,
        userByUsername,
        allUsers
      }
    });
  } catch (error) {
    console.error('❌ Error checking user balance:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
