// app/api/users/[id]/route.js
import prisma from '../../../../lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(req, { params }) {
  const { id } = params
  if (!id) {
    return new Response(JSON.stringify({ message: 'Missing user ID' }), { status: 400 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        username: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    if (!user) {
      return new Response(JSON.stringify({ message: 'User not found' }), { status: 404 })
    }
    
    return new Response(JSON.stringify({ user }), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 })
  }
}

export async function PUT(req, { params }) {
  const { id } = params
  if (!id) {
    return new Response(JSON.stringify({ message: 'Missing user ID' }), { status: 400 })
  }

  try {
    const body = await req.json()
    const { firstname, lastname, username, password, role, status } = body

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })
    
    if (!existingUser) {
      return new Response(JSON.stringify({ message: 'User not found' }), { status: 404 })
    }

    // Check if username already exists (excluding current user)
    if (username && username !== existingUser.username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username }
      })
      if (existingUsername) {
        return new Response(JSON.stringify({ message: 'Username already exists' }), { status: 400 })
      }
    }

    // Prepare update data
    const updateData = {}
    if (firstname !== undefined) updateData.firstname = firstname
    if (lastname !== undefined) updateData.lastname = lastname
    if (username !== undefined) updateData.username = username
    if (role !== undefined) updateData.role = role
    if (status !== undefined) updateData.status = status

    // Hash password if provided
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 12)
    }

    if (Object.keys(updateData).length === 0) {
      return new Response(JSON.stringify({ message: 'No fields to update' }), { status: 400 })
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        firstname: true,
        lastname: true,
        username: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return new Response(JSON.stringify({ message: 'User updated successfully', user: updatedUser }), { status: 200 })
  } catch (err) {
    console.error(err)
    if (err.code === 'P2025') {
      return new Response(JSON.stringify({ message: 'User not found' }), { status: 404 })
    }
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  const { id } = params
  if (!id) {
    return new Response(JSON.stringify({ message: 'Missing user ID' }), { status: 400 })
  }

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })
    
    if (!existingUser) {
      return new Response(JSON.stringify({ message: 'User not found' }), { status: 404 })
    }

    // Delete user
    await prisma.user.delete({
      where: { id }
    })

    return new Response(JSON.stringify({ message: 'User deleted successfully' }), { status: 200 })
  } catch (err) {
    console.error(err)
    if (err.code === 'P2025') {
      return new Response(JSON.stringify({ message: 'User not found' }), { status: 404 })
    }
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 })
  }
}
