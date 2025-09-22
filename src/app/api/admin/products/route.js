import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';

// GET - Fetch all products for admin
export async function GET(request) {
  try {
    // Verify admin authentication
    const admin = verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = (page - 1) * limit;

    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.product.count();

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new product
export async function POST(request) {
  try {
    // Verify admin authentication
    const admin = verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, image, price, discount, sale_price, description } = body;

    // Validate required fields
    if (!title || price == null) {
      return NextResponse.json(
        { error: 'Missing required fields: title, price' },
        { status: 400 }
      );
    }

    const data = {
      title,
      image: image || '',
      price: parseFloat(price),
      discount: discount ? parseFloat(discount) : null,
      sale_price: sale_price ? parseFloat(sale_price) : null,
      description: description || null
    };

    const product = await prisma.product.create({ data });

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      product
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
