// app/api/verify-email/route.js
import prisma from '../../../lib/prisma';

export async function POST(req) {
  try {
    const body = await req.json()
    const { token } = body

    if (!token) {
      return new Response(JSON.stringify({ 
        message: 'Verification token is required' 
      }), { status: 400 })
    }

    // Find user with this verification token
    const user = await prisma.user.findFirst({
      where: { 
        emailVerificationToken: token,
        emailVerified: false
      }
    })

    if (!user) {
      return new Response(JSON.stringify({ 
        message: 'Invalid or expired verification token' 
      }), { status: 400 })
    }

    // Update user to mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null // Clear the token after verification
      }
    })

    return new Response(JSON.stringify({ 
      message: 'Email verified successfully! You can now log in to your account.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    }), { status: 200 })

  } catch (err) {
    console.error('Email verification error:', err)
    return new Response(JSON.stringify({ 
      message: 'Server error. Please try again later.' 
    }), { status: 500 })
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return new Response(JSON.stringify({ 
        message: 'Verification token is required' 
      }), { status: 400 })
    }

    // Find user with this verification token
    const user = await prisma.user.findFirst({
      where: { 
        emailVerificationToken: token,
        emailVerified: false
      }
    })

    if (!user) {
      return new Response(JSON.stringify({ 
        message: 'Invalid or expired verification token' 
      }), { status: 400 })
    }

    // Update user to mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null // Clear the token after verification
      }
    })

    return new Response(JSON.stringify({ 
      message: 'Email verified successfully! You can now log in to your account.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    }), { status: 200 })

  } catch (err) {
    console.error('Email verification error:', err)
    return new Response(JSON.stringify({ 
      message: 'Server error. Please try again later.' 
    }), { status: 500 })
  }
}

