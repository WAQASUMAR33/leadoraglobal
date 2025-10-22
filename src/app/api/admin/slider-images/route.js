import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAdminToken } from '../../../../lib/adminAuth';

const prisma = new PrismaClient();

// GET - Fetch all slider images
export async function GET(request) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sliderImages = await prisma.sliderImage.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      data: sliderImages
    });

  } catch (error) {
    console.error('Error fetching slider images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch slider images' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create new slider image
export async function POST(request) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, imageUrl, linkUrl, isActive, sortOrder } = body;

    // Validate required fields
    if (!title || !imageUrl) {
      return NextResponse.json(
        { error: 'Title and image URL are required' },
        { status: 400 }
      );
    }

    const sliderImage = await prisma.sliderImage.create({
      data: {
        title,
        description: description || null,
        imageUrl,
        linkUrl: linkUrl || null,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Slider image created successfully',
      data: sliderImage
    });

  } catch (error) {
    console.error('Error creating slider image:', error);
    return NextResponse.json(
      { error: 'Failed to create slider image' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

