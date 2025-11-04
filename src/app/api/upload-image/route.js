import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Try external upload service first (same as KYC and other pages)
    try {
      console.log('Attempting to upload image to external service...');
      
      const response = await fetch('https://steelblue-cod-355377.hostingersite.com/uploadImage.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: image
        })
      });

      if (!response.ok) {
        throw new Error(`External server error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      const imageUrl = result.url || result.imageUrl || result.image_url;
      
      // If the response is just a filename, construct the full URL
      if (imageUrl && !imageUrl.startsWith('http')) {
        const fullUrl = `https://steelblue-cod-355377.hostingersite.com/uploads/${imageUrl}`;
        console.log('External upload successful:', fullUrl);
        return NextResponse.json({
          success: true,
          url: fullUrl,
          filename: imageUrl
        });
      }
      
      console.log('External upload successful:', imageUrl);
      return NextResponse.json({
        success: true,
        url: imageUrl,
        filename: imageUrl
      });
      
    } catch (externalError) {
      console.warn('External upload service failed:', externalError);
      
      // Fallback: Return base64 data URL directly (can be stored in database)
      // This works in serverless environments where filesystem is read-only
      console.log('Using base64 fallback - storing directly in database');
      return NextResponse.json({
        success: true,
        url: image, // Return the base64 data URL directly
        filename: `payment_proof_${Date.now()}.jpg`,
        note: 'Stored as base64 in database (external upload failed)'
      });
    }

  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ 
      error: 'Failed to upload image',
      details: error.message 
    }, { status: 500 });
  }
}
