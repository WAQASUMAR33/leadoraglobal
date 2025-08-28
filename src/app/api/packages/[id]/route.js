// app/api/packages/[id]/route.js
import prisma from '../../../../lib/prisma' // adjust path as needed

export async function GET(req, { params }) {
  const { id } = params
  if (!id) {
    return new Response(JSON.stringify({ message: 'Missing id' }), { status: 400 })
  }

  try {
    const pkg = await prisma.package.findUnique({ where: { id: Number(id) } })
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
      status 
    } = body

    const data = {}
    if (package_name !== undefined) data.title = package_name
    if (package_amount !== undefined) data.amount = parseFloat(package_amount)
    if (package_direct_commission !== undefined || package_indirect_commission !== undefined || d_crages !== undefined || shopping_amount !== undefined) {
      data.package_desc = `Direct: ₨${package_direct_commission || 0}, Indirect: ₨${package_indirect_commission || 0}, D Crages: ₨${d_crages || 0}, Shopping: ₨${shopping_amount || 0}`
    }
    if (status !== undefined) data.status = status

    if (Object.keys(data).length === 0) {
      return new Response(JSON.stringify({ message: 'No fields to update' }), { status: 400 })
    }

    const updated = await prisma.package.update({
      where: { id: Number(id) },
      data,
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
