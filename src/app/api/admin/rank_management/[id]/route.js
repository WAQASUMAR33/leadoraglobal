// app/api/admin/rank_management/[id]/route.js
import prisma from '../../../../../lib/prisma';

export async function GET(req, { params }) {
  const { id } = params
  if (!id) {
    return new Response(JSON.stringify({ message: 'Missing id' }), { status: 400 })
  }

  try {
    const rank = await prisma.rank.findUnique({ where: { id: Number(id) } })
    if (!rank) {
      return new Response(JSON.stringify({ message: 'Rank not found' }), { status: 404 })
    }
    return new Response(JSON.stringify(rank), { status: 200 })
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
    const { title, required_points, details } = body

    const data = {}
    if (title !== undefined) data.title = title
    if (required_points !== undefined) data.required_points = Number(required_points)
    if (details !== undefined) data.details = details

    if (Object.keys(data).length === 0) {
      return new Response(JSON.stringify({ message: 'No fields to update' }), { status: 400 })
    }

    const updated = await prisma.rank.update({
      where: { id: Number(id) },
      data,
    })

    return new Response(JSON.stringify({ message: 'Rank updated', rank: updated }), { status: 200 })
  } catch (err) {
    console.error(err)
    if (err.code === 'P2025') {
      return new Response(JSON.stringify({ message: 'Rank not found' }), { status: 404 })
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
    await prisma.rank.delete({ where: { id: Number(id) } })
    return new Response(JSON.stringify({ message: 'Rank deleted' }), { status: 200 })
  } catch (err) {
    console.error(err)
    if (err.code === 'P2025') {
      return new Response(JSON.stringify({ message: 'Rank not found' }), { status: 404 })
    }
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 })
  }
}
