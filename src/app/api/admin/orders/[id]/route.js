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

    // Check if order exists - fetch paymentProof to check if order was placed with payment proof
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        paymentProof: true,
        paymentDetails: true,
        totalAmount: true,
        userId: true
      }
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
            email: true,
            balance: true,
            currentPackageId: true
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

    // NEW LOGIC: Add shopping amount ONLY when:
    // 1. Order was placed with payment proof (paymentProof field exists)
    // 2. Order status is changed to 'completed' OR payment status is 'paid'
    // 3. This ensures shopping amount is only added for orders placed using payment proof
    
    const wasPending = existingOrder.status === 'pending';
    const isNowCompleted = status === 'completed' || (status && status !== 'pending' && status !== 'cancelled');
    const isPaymentApproved = paymentStatus === 'paid' || (paymentStatus && paymentStatus !== 'pending');
    
    // Check if order was placed with payment proof
    const hasPaymentProof = existingOrder.paymentProof && existingOrder.paymentProof.trim() !== '';
    
    // Only add shopping amount if:
    // - Order was placed with payment proof
    // - Order is being approved/completed
    // - Payment is approved
    if (hasPaymentProof && wasPending && (isNowCompleted || isPaymentApproved)) {
      const user = updatedOrder.user;
      
      // Get user's package info to check shopping eligibility
      const userWithPackage = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          username: true,
          currentPackageId: true,
          packageExpiryDate: true,
          shoppingAmount: true
        }
      });
      
      // Check if user has no active package OR has consumed shopping limit
      // (both cases require payment proof, so both should get shopping amount)
      const hasActivePackage = userWithPackage.currentPackageId && 
                              userWithPackage.packageExpiryDate && 
                              new Date(userWithPackage.packageExpiryDate) > new Date();

      // Add shopping amount for orders placed with payment proof
      // This applies to:
      // 1. Users without active packages
      // 2. Users with active packages whose shopping limit is consumed
      const orderAmount = parseFloat(updatedOrder.totalAmount);
      const currentShoppingAmount = parseFloat(userWithPackage.shoppingAmount || 0);
      const newShoppingAmount = currentShoppingAmount + orderAmount;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          shoppingAmount: newShoppingAmount,
          updatedAt: new Date()
        }
      });

      console.log(`✅ Order Approved (Payment Proof): Added PKR ${orderAmount} to shopping_amount for user ${userWithPackage.username}`);
      console.log(`   Previous shopping amount: PKR ${currentShoppingAmount}`);
      console.log(`   New shopping amount: PKR ${newShoppingAmount}`);
      console.log(`   User has active package: ${hasActivePackage}`);
      
      return NextResponse.json({
        success: true,
        message: `Order updated successfully. Added PKR ${orderAmount} to user's shopping amount (payment proof order).`,
        order: updatedOrder,
        shoppingAmountAdded: orderAmount,
        previousShoppingAmount: currentShoppingAmount,
        newShoppingAmount: newShoppingAmount
      });
    }

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
