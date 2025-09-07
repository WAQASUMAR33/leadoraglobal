// app/api/packages/[id]/route.js
import prisma from '../../../../lib/prisma' // adjust path as needed

export async function GET(req, { params }) {
  const { id } = params
  if (!id) {
    return new Response(JSON.stringify({ message: 'Missing id' }), { status: 400 })
  }

  try {
    const pkg = await prisma.package.findUnique({ 
      where: { id: Number(id) },
      include: {
        rank: true
      }
    })
    if (!pkg) {
      return new Response(JSON.stringify({ message: 'Package not found' }), { status: 404 })
    }
    return new Response(JSON.stringify(pkg), { status: 200 })
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
    const { 
      package_name, 
      package_amount, 
      package_direct_commission, 
      package_indirect_commission, 
      d_crages, 
      shopping_amount, 
      package_points,
      status,
      rankId
    } = body

    const data = {}
    if (package_name !== undefined) data.package_name = package_name
    if (package_amount !== undefined) data.package_amount = parseFloat(package_amount)
    if (package_direct_commission !== undefined) data.package_direct_commission = parseFloat(package_direct_commission)
    if (package_indirect_commission !== undefined) data.package_indirect_commission = parseFloat(package_indirect_commission)
    if (d_crages !== undefined) data.d_crages = parseFloat(d_crages)
    if (shopping_amount !== undefined) data.shopping_amount = parseFloat(shopping_amount)
    if (package_points !== undefined) data.package_points = parseInt(package_points) || 0
    if (status !== undefined) data.status = status
    if (rankId !== undefined) data.rankId = rankId ? parseInt(rankId) : null

    if (Object.keys(data).length === 0) {
      return new Response(JSON.stringify({ message: 'No fields to update' }), { status: 400 })
    }

    const updated = await prisma.package.update({
      where: { id: Number(id) },
      data,
      include: {
        rank: true
      }
    })

    return new Response(JSON.stringify({ message: 'Package updated', package: updated }), { status: 200 })
  } catch (err) {
    console.error(err)
    // If not found, Prisma throws; translate to 404
    if (err.code === 'P2025') {
      return new Response(JSON.stringify({ message: 'Package not found' }), { status: 404 })
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
    await prisma.package.delete({ where: { id: Number(id) } })
    return new Response(JSON.stringify({ message: 'Package deleted' }), { status: 200 })
  } catch (err) {
    console.error(err)
    if (err.code === 'P2025') {
      return new Response(JSON.stringify({ message: 'Package not found' }), { status: 404 })
    }
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 })
  }
}
