// app/api/products/route.js
import prisma from '../../../lib/prisma';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        // Only show active/available products
        // You can add more filters here if needed
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    // Transform the data to match frontend expectations
    const transformedProducts = products.map(product => ({
      id: product.id,
      title: product.title,
      price: product.price,
      discount: product.discount,
      sale_price: product.sale_price,
      image: product.image,
      description: product.description,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }))
    
    return new Response(JSON.stringify(transformedProducts), { status: 200 })
  } catch (err) {
    console.error('Error fetching products:', err)
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 })
  }
}
