import prisma from '../../../../lib/prisma';

export async function GET() {
  try {
    const ranks = await prisma.rank.findMany({
      orderBy: {
        required_points: 'asc'
      }
    })
    
    return new Response(JSON.stringify({ ranks }), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 })
  }
}
