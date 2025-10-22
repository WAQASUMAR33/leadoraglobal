import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAdminToken } from '../../../../../lib/adminAuth';

const prisma = new PrismaClient();

// GET - Fetch single slider image
export async function GET(request, { params }) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const sliderImage = await prisma.sliderImage.findUnique({
      where: { id: parseInt(id) }
    });

    if (!sliderImage) {
      return NextResponse.json(
        { error: 'Slider image not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: sliderImage
    });

  } catch (error) {
    console.error('Error fetching slider image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch slider image' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update slider image
export async function PUT(request, { params }) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { title, description, imageUrl, linkUrl, isActive, sortOrder } = body;

    // Check if slider image exists
    const existingSlider = await prisma.sliderImage.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingSlider) {
      return NextResponse.json(
        { error: 'Slider image not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!title || !imageUrl) {
      return NextResponse.json(
        { error: 'Title and image URL are required' },
        { status: 400 }
      );
    }

    const updatedSlider = await prisma.sliderImage.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description: description || null,
        imageUrl,
        linkUrl: linkUrl || null,
        isActive: isActive !== undefined ? isActive : existingSlider.isActive,
        sortOrder: sortOrder !== undefined ? sortOrder : existingSlider.sortOrder
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Slider image updated successfully',
      data: updatedSlider
    });

  } catch (error) {
    console.error('Error updating slider image:', error);
    return NextResponse.json(
      { error: 'Failed to update slider image' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Delete slider image
export async function DELETE(request, { params }) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if slider image exists
    const existingSlider = await prisma.sliderImage.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingSlider) {
      return NextResponse.json(
        { error: 'Slider image not found' },
        { status: 404 }
      );
    }

    await prisma.sliderImage.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({
      success: true,
      message: 'Slider image deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting slider image:', error);
    return NextResponse.json(
      { error: 'Failed to delete slider image' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

