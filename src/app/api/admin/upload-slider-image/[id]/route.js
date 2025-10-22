import { NextResponse } from 'next/server';
import { verifyAdminToken } from '../../../../../lib/adminAuth';

// Upload image to external PHP API
async function uploadImageToPHP(base64Data, filename) {
  try {
    const uploadUrl = process.env.UPLOAD_IMAGE_API_URL || 'https://steelblue-cod-355377.hostingersite.com/uploadImage.php';
    
    console.log('Uploading to PHP API:', uploadUrl);
    console.log('Base64 data length:', base64Data.length);
    console.log('Filename:', filename);
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Data,
        filename: filename
      })
    });

    console.log('PHP API Response Status:', response.status);
    console.log('PHP API Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PHP API Error Response:', errorText);
      throw new Error(`Upload failed with status: ${response.status} - ${errorText}`);
    }

    const responseText = await response.text();
    console.log('PHP API Raw Response:', responseText);

    // Check if response is HTML (error page)
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      throw new Error('PHP API returned HTML instead of JSON. Check if the API endpoint is correct and accessible.');
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Response that failed to parse:', responseText);
      throw new Error(`Invalid JSON response from PHP API: ${responseText.substring(0, 200)}...`);
    }
    
    if (result.error) {
      throw new Error(result.error);
    }

    const imageUrl = result.image_url || result.url || result.imageUrl;
    if (!imageUrl) {
      throw new Error('No image URL returned from upload API');
    }

    // Construct full URL using the base upload URL
    const baseUploadUrl = process.env.UPLOAD_IMAGE_BASE_URL || 'https://steelblue-cod-355377.hostingersite.com/uploads/';
    const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUploadUrl}${imageUrl}`;
    
    return fullImageUrl;
  } catch (error) {
    console.error('Error uploading to PHP API:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}


// PUT - Update slider image with new upload
export async function PUT(request, { params }) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('image');
    const title = formData.get('title');
    const description = formData.get('description');
    const linkUrl = formData.get('linkUrl');
    const isActive = formData.get('isActive') === 'true';
    const sortOrder = parseInt(formData.get('sortOrder')) || 0;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'Image file is required' },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Check if slider image exists
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const existingSlider = await prisma.sliderImage.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingSlider) {
      await prisma.$disconnect();
      return NextResponse.json(
        { error: 'Slider image not found' },
        { status: 404 }
      );
    }

    // Convert file to base64 (matching package request format)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64String = buffer.toString('base64');
    const base64Data = `data:${file.type};base64,${base64String}`;
    
    // Generate filename with timestamp
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const filename = `slider_${timestamp}.${fileExtension}`;

    // Upload to PHP API
      const imageUrl = await uploadImageToPHP(base64Data, filename);

    // Update in database
    const updatedSlider = await prisma.sliderImage.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description: description || null,
        imageUrl,
        linkUrl: linkUrl || null,
        isActive,
        sortOrder
      }
    });

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'Slider image updated successfully',
      data: updatedSlider
    });

  } catch (error) {
    console.error('Error updating slider image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update slider image' },
      { status: 500 }
    );
  }
}
