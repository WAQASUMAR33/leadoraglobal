import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch active slider images for public use
export async function GET() {
  try {
    const sliderImages = await prisma.sliderImage.findMany({
      where: {
        isActive: true
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        linkUrl: true,
        sortOrder: true
      }
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

