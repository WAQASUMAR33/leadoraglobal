// app/api/products/[id]/route.js
import prisma from '../../../../lib/prisma'; // adjust path as needed

export async function GET(req, { params }) {
  const { id } = params
  if (!id) {
    return new Response(JSON.stringify({ message: 'Missing id' }), { status: 400 })
  }

  try {
    const product = await prisma.product.findUnique({ where: { id: Number(id) } })
    if (!product) {
      return new Response(JSON.stringify({ message: 'Product not found' }), { status: 404 })
    }
    return new Response(JSON.stringify(product), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 })
  }
}

export async function PUT(req, { params }) {
  const { id } = params
  if (!id) {
    return new Response(JSON.stringify({ message: 'Missing id' }), { status: 400 })
  }

  try {
    const body = await req.json()
    const { title, image, price, discount, sale_price, description } = body

    const data = {}
    if (title !== undefined) data.title = title
    if (image !== undefined) data.image = image
    if (price !== undefined) data.price = parseFloat(price)
    if (discount !== undefined) data.discount = discount ? parseFloat(discount) : null
    if (sale_price !== undefined) data.sale_price = sale_price ? parseFloat(sale_price) : null
    if (description !== undefined) data.description = description

    if (Object.keys(data).length === 0) {
      return new Response(JSON.stringify({ message: 'No fields to update' }), { status: 400 })
    }

    const updated = await prisma.product.update({
      where: { id: Number(id) },
      data,
    })

    return new Response(JSON.stringify({ message: 'Product updated', product: updated }), { status: 200 })
  } catch (err) {
    console.error(err)
    // If not found, Prisma throws; translate to 404
    if (err.code === 'P2025') {
      return new Response(JSON.stringify({ message: 'Product not found' }), { status: 404 })
    }
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  const { id } = params
  if (!id) {
    return new Response(JSON.stringify({ message: 'Missing id' }), { status: 400 })
  }

  try {
    await prisma.product.delete({ where: { id: Number(id) } })
    return new Response(JSON.stringify({ message: 'Product deleted' }), { status: 200 })
  } catch (err) {
    console.error(err)
    if (err.code === 'P2025') {
      return new Response(JSON.stringify({ message: 'Product not found' }), { status: 404 })
    }
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 })
  }
}
