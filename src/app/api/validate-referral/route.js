import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function POST(request) {
  try {
    const { referralCode } = await request.json();

    if (!referralCode) {
      return NextResponse.json({ 
        valid: false, 
        message: 'Referral code is required' 
      }, { status: 400 });
    }

    // Find user by username (referral code)
    const referrer = await prisma.user.findUnique({
      where: { 
        username: referralCode,
        status: 'active' // Only active users can be referrers
      },
      select: {
        id: true,
        fullname: true,
        username: true,
        status: true
      }
    });

    if (!referrer) {
      return NextResponse.json({ 
        valid: false, 
        message: 'Invalid referral code. Please check and try again.' 
      }, { status: 404 });
    }

    if (referrer.status !== 'active') {
      return NextResponse.json({ 
        valid: false, 
        message: 'Referral code is not active. Please use a different code.' 
      }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      referrer: {
        id: referrer.id,
        fullname: referrer.fullname,
        username: referrer.username
      },
      message: `Valid referral code! You will be referred by ${referrer.fullname}`
    });

  } catch (error) {
    console.error('Referral validation error:', error);
    return NextResponse.json({
      valid: false,
      message: 'Error validating referral code. Please try again.'
    }, { status: 500 });
  }
}

