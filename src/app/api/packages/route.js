// app/api/packages/route.js
import prisma from '../../../lib/prisma'; // adjust if your path differs

export async function POST(req) {
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

    if (!package_name || package_amount == null) {
      return new Response(JSON.stringify({ message: 'Missing required fields: package_name, package_amount' }), { status: 400 })
    }

    const data = {
      package_name,
      package_amount: parseFloat(package_amount),
      package_direct_commission: parseFloat(package_direct_commission),
      package_indirect_commission: parseFloat(package_indirect_commission),
      d_crages: parseFloat(d_crages),
      shopping_amount: parseFloat(shopping_amount),
      package_points: parseInt(package_points) || 0,
      status: status || 'active',
      rankId: rankId ? parseInt(rankId) : null
    }

    const pkg = await prisma.package.create({ 
      data,
      include: {
        rank: true
      }
    })

    return new Response(JSON.stringify({ message: 'Package created', package: pkg }), { status: 201 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 })
  }
}

export async function GET() {
  try {
    const packages = await prisma.package.findMany({
      include: {
        rank: true
      }
    })
    
    return new Response(JSON.stringify({ packages }), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 })
  }
}
