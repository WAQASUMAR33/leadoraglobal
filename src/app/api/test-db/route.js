// Test database connection and products
import prisma from '../../../lib/prisma'

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('Database connected successfully');
    
    // Count products
    const productCount = await prisma.product.count();
    console.log('Total products in database:', productCount);
    
    // Get a few sample products
    const sampleProducts = await prisma.product.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        price: true
      }
    });
    
    console.log('Sample products:', sampleProducts);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Database connection successful',
      productCount,
      sampleProducts
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (err) {
    console.error('Database test error:', err);
    return new Response(JSON.stringify({
      success: false,
      message: 'Database connection failed',
      error: err.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await prisma.$disconnect();
  }
}
