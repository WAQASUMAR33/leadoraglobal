import prisma from '../../../lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      userId, 
      items, 
      shippingInfo, 
      totalAmount 
    } = body;

    if (!userId || !items || !shippingInfo || !totalAmount) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Missing required fields' 
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create shipping address string
    const shippingAddress = JSON.stringify(shippingInfo);

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: parseInt(userId),
        orderNumber,
        totalAmount: parseFloat(totalAmount),
        status: 'pending',
        shippingAddress,
        paymentMethod: 'direct_order',
        paymentStatus: 'pending'
      }
    });

    // Create order items
    const orderItems = await Promise.all(
      items.map(item => 
        prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.id,
            quantity: item.quantity,
            price: parseFloat(item.sale_price || item.price)
          }
        })
      )
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Order created successfully',
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          status: order.status,
          createdAt: order.createdAt,
          items: orderItems
        }
      }), 
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating order:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Failed to create order',
        error: error.message 
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'User ID is required' 
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: parseInt(userId)
      },
      include: {
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        orders 
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching orders:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Failed to fetch orders',
        error: error.message 
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
