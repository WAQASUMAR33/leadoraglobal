import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAdminToken } from '../../../../../lib/adminAuth';

const prisma = new PrismaClient();

// GET - Fetch single order by ID
export async function GET(request, { params }) {
  try {
    const admin = verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullname: true,
            email: true,
            phoneNumber: true
          }
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                image: true,
                price: true,
                sale_price: true,
                description: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update order status
export async function PUT(request, { params }) {
  try {
    const admin = verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { status, paymentStatus, notes } = body;

    // Validate status if provided
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return NextResponse.json(
        { error: 'Invalid payment status' },
        { status: 400 }
      );
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData = {
      updatedAt: new Date()
    };

    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullname: true,
            email: true
          }
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                image: true,
                price: true,
                sale_price: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel/Delete order (soft delete by setting status to cancelled)
export async function DELETE(request, { params }) {
  try {
    const admin = verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Soft delete by setting status to cancelled
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'cancelled',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
