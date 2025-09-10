// app/api/products/route.js
import prisma from '../../../lib/prisma'; // adjust path if needed

export async function POST(req) {
  try {
    const body = await req.json()
    const { title, image, price, discount, sale_price, description } = body

    if (!title || price == null) {
      return new Response(JSON.stringify({ message: 'Missing required fields: title, price' }), { status: 400 })
    }

    const data = {
      title,
      image: image || '', // Provide default empty string if image is not provided
      price: parseFloat(price),
      discount: discount ? parseFloat(discount) : null,
      sale_price: sale_price ? parseFloat(sale_price) : null,
      description: description ?? undefined,
    }

    const product = await prisma.product.create({ data })

    return new Response(JSON.stringify({ message: 'Product created', product }), { status: 201 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 })
  }
}

export async function GET(req) {
  try {
    console.log('Product management API called');
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    const products = await prisma.product.findMany()
    console.log('Found products in database:', products.length);
    console.log('Products:', products);
    
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
    
    console.log('Transformed products:', transformedProducts);
    return new Response(JSON.stringify({ products: transformedProducts }), { status: 200 })
  } catch (err) {
    console.error('Error in product management API:', err)
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 })
  }
}
