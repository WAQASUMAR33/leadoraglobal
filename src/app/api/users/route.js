// app/api/users/route.js
import prisma from '../../../lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(req) {
  try {
    const users = await prisma.user.findMany({
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
    
    return new Response(JSON.stringify({ users }), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { firstname, lastname, username, password, role, status } = body

    // Validate required fields
    if (!firstname || !lastname || !username || !password) {
      return new Response(JSON.stringify({ message: 'Missing required fields' }), { status: 400 })
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })
    if (existingUser) {
      return new Response(JSON.stringify({ message: 'Username already exists' }), { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        firstname,
        lastname,
        username,
        password: hashedPassword,
        role: role || 'user',
        status: status || 'active'
      },
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

    return new Response(JSON.stringify({ message: 'User created successfully', user }), { status: 201 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 })
  }
}
