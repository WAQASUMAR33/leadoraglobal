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

    // Get user's cart items
    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId: parseInt(userId)
      },
      include: {
        product: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ cartItems });
  } catch (error) {
    console.error('Error fetching user cart:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { userId, productId, quantity } = await request.json();

    if (!userId || !productId || !quantity) {
      return NextResponse.json({ error: 'User ID, product ID, and quantity are required' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if item already exists in cart
    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: parseInt(userId),
          productId: parseInt(productId)
        }
      }
    });

    if (existingCartItem) {
      // Update quantity
      const updatedCartItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: existingCartItem.quantity + parseInt(quantity),
          updatedAt: new Date()
        },
        include: {
          product: true
        }
      });

      return NextResponse.json({ 
        message: 'Cart item updated successfully',
        cartItem: updatedCartItem 
      });
    } else {
      // Create new cart item
      const newCartItem = await prisma.cartItem.create({
        data: {
          userId: parseInt(userId),
          productId: parseInt(productId),
          quantity: parseInt(quantity),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          product: true
        }
      });

      return NextResponse.json({ 
        message: 'Item added to cart successfully',
        cartItem: newCartItem 
      });
    }
  } catch (error) {
    console.error('Error managing cart item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { cartItemId, quantity } = await request.json();

    if (!cartItemId || quantity === undefined) {
      return NextResponse.json({ error: 'Cart item ID and quantity are required' }, { status: 400 });
    }

    // Update cart item quantity
    const updatedCartItem = await prisma.cartItem.update({
      where: { id: parseInt(cartItemId) },
      data: {
        quantity: parseInt(quantity),
        updatedAt: new Date()
      },
      include: {
        product: true
      }
    });

    return NextResponse.json({ 
      message: 'Cart item updated successfully',
      cartItem: updatedCartItem 
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get('cartItemId');

    if (!cartItemId) {
      return NextResponse.json({ error: 'Cart item ID is required' }, { status: 400 });
    }

    // Delete cart item
    await prisma.cartItem.delete({
      where: { id: parseInt(cartItemId) }
    });

    return NextResponse.json({ 
      message: 'Cart item removed successfully'
    });
  } catch (error) {
    console.error('Error removing cart item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}















