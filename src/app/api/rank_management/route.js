// app/api/ranks/route.js
import prisma from '../../../lib/prisma' // adjust path if needed

export async function POST(req) {
  try {
    const body = await req.json()
    const { title, required_points, details } = body

    if (!title || required_points == null) {
      return new Response(JSON.stringify({ message: 'Missing required fields: title, required_points' }), { status: 400 })
    }

    const data = {
      title,
      required_points,
      details: details ?? undefined,
    }

    const rank = await prisma.rank.create({ data })

    return new Response(JSON.stringify({ message: 'Rank created', rank }), { status: 201 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 })
  }
}

export async function GET() {
  try {
    const ranks = await prisma.rank.findMany()
    return new Response(JSON.stringify(ranks), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 })
  }
}
