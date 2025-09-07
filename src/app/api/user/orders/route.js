import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's orders
    const orders = await prisma.order.findMany({
      where: {
        userId: parseInt(userId)
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}








