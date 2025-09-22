import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { verifyAdminToken } from '../../../../../lib/adminAuth';

// GET - Fetch single product
export async function GET(request, { params }) {
  try {
    // Verify admin authentication
    const admin = verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      product
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update product
export async function PUT(request, { params }) {
  try {
    // Verify admin authentication
    const admin = verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const body = await request.json();
    const { title, image, price, discount, sale_price, description } = body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData = {};
    if (title) updateData.title = title;
    if (image !== undefined) updateData.image = image;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (discount !== undefined) updateData.discount = discount ? parseFloat(discount) : null;
    if (sale_price !== undefined) updateData.sale_price = sale_price ? parseFloat(sale_price) : null;
    if (description !== undefined) updateData.description = description;

    // Update product
    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product
    });

  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete product
export async function DELETE(request, { params }) {
  try {
    // Verify admin authentication
    const admin = verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delete product
    await prisma.product.delete({
      where: { id: productId }
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
