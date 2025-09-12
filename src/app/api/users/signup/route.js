// app/api/users/signup/route.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(req) {
  try {
    const body = await req.json()
    const { 
      fullName, 
      username, 
      email,
      phoneNumber,
      password, 
      referralCode 
    } = body

    // Validate required fields
    if (!fullName || !username || !email || !phoneNumber || !password || !referralCode) {
      return new Response(JSON.stringify({ 
        message: 'Missing required fields: fullName, username, email, phoneNumber, password, and referralCode are required' 
      }), { status: 400 })
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username }
    })
    
    if (existingUsername) {
      return new Response(JSON.stringify({ 
        message: 'Username already exists. Please choose a different username.' 
      }), { status: 400 })
    }

    // Note: Email uniqueness check removed to allow multiple accounts with same email
    // Users can now use the same email for multiple accounts

    // Note: Phone number uniqueness check removed to allow multiple accounts with same phone number
    // Users can now use the same phone number for multiple accounts

    // Validate referral code exists and is active
    const referrer = await prisma.user.findUnique({
      where: { 
        username: referralCode,
        status: 'active'
      }
    })
    
    if (!referrer) {
      return new Response(JSON.stringify({ 
        message: 'Invalid referral code. Please check and try again.' 
      }), { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate email verification token
    const emailVerificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    // Prepare user data with new schema
    const userData = {
      fullname: fullName,
      username,
      email,
      phoneNumber,
      password: hashedPassword,
      emailVerified: false,
      emailVerificationToken,
      status: 'active',
      referredBy: referralCode || null // Set referredBy if referral code provided
    }

    // Create user
    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        fullname: true,
        username: true,
        email: true,
        phoneNumber: true,
        emailVerified: true,
        referredBy: true,
        referralCount: true,
        totalEarnings: true,
        packageId: true,
        rankId: true,
        balance: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // If user was referred, update referrer's referral count
    if (referralCode) {
      try {
        await prisma.user.updateMany({
          where: { username: referralCode },
          data: {
            referralCount: {
              increment: 1
            }
          }
        })
      } catch (updateError) {
        console.warn('Failed to update referrer referral count:', updateError)
        // Continue with signup even if referral update fails
      }
    }

    // TODO: Send verification email here
    // For now, we'll just log the verification token
    console.log(`Email verification token for ${user.email}: ${emailVerificationToken}`)

    return new Response(JSON.stringify({ 
      message: 'Account created successfully! Please check your email for verification instructions.', 
      user: {
        id: user.id,
        fullName: user.fullname,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        emailVerified: user.emailVerified,
        referredBy: user.referredBy
      }
    }), { status: 201 })

  } catch (err) {
    console.error('Signup error:', err)
    
    // Handle specific Prisma errors
    if (err.code === 'P2002') {
      if (err.meta?.target?.includes('username')) {
        return new Response(JSON.stringify({ 
          message: 'Username already exists. Please try a different one.' 
        }), { status: 400 })
      }
      return new Response(JSON.stringify({ 
        message: 'A user with this information already exists. Please try different details.' 
      }), { status: 400 })
    }
    
    return new Response(JSON.stringify({ 
      message: 'Server error. Please try again later.' 
    }), { status: 500 })
  }
}
