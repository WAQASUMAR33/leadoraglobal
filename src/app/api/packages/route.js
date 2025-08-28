// app/api/packages/route.js
import prisma from '../../../lib/prisma' // adjust if your path differs

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
      status 
    } = body

    if (!package_name || package_amount == null) {
      return new Response(JSON.stringify({ message: 'Missing required fields: package_name, package_amount' }), { status: 400 })
    }

    const data = {
      title: package_name,
      amount: parseFloat(package_amount),
      package_desc: `Direct: ₨${package_direct_commission}, Indirect: ₨${package_indirect_commission}, D Crages: ₨${d_crages}, Shopping: ₨${shopping_amount}`,
      status: status || 'active'
    }

    const pkg = await prisma.package.create({ data })

    return new Response(JSON.stringify({ message: 'Package created', package: pkg }), { status: 201 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 })
  }
}

export async function GET() {
  try {
    const packages = await prisma.package.findMany()
    
    // Transform the data to match frontend expectations
    const transformedPackages = packages.map(pkg => {
      // Parse the package_desc to extract individual values
      const desc = pkg.package_desc || '';
      const directMatch = desc.match(/Direct: ₨([\d.]+)/);
      const indirectMatch = desc.match(/Indirect: ₨([\d.]+)/);
      const cragesMatch = desc.match(/D Crages: ₨([\d.]+)/);
      const shoppingMatch = desc.match(/Shopping: ₨([\d.]+)/);
      
      return {
        id: pkg.id,
        package_name: pkg.title,
        package_amount: pkg.amount,
        package_direct_commission: directMatch ? parseFloat(directMatch[1]) : 0,
        package_indirect_commission: indirectMatch ? parseFloat(indirectMatch[1]) : 0,
        d_crages: cragesMatch ? parseFloat(cragesMatch[1]) : 0,
        shopping_amount: shoppingMatch ? parseFloat(shoppingMatch[1]) : 0,
        status: pkg.status,
        createdAt: pkg.createdAt,
        updatedAt: pkg.updatedAt
      }
    })
    
    return new Response(JSON.stringify({ packages: transformedPackages }), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 })
  }
}
