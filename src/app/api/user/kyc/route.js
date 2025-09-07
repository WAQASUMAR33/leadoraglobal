import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Helper function to verify JWT token
const verifyToken = (request) => {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    return decoded;
  } catch (error) {
    return null;
  }
};

// GET - Fetch KYC data for a user
export async function GET(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const kyc = await prisma.kYC.findUnique({
      where: { userId: decoded.userId },
      include: {
        user: {
          select: {
            username: true,
            fullname: true
          }
        }
      }
    });

    return NextResponse.json({ kyc });
  } catch (error) {
    console.error('Error fetching KYC data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new KYC data
export async function POST(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      fullname,
      father_name,
      email,
      phoneNumber,
      city,
      country,
      current_address,
      permanent_address,
      gender,
      cnic_number,
      cnic_expiry_date,
      profile_image,
      id_card_front,
      id_card_back,
      beneficiary_name,
      beneficiary_phone_mobile,
      beneficiary_relation,
      beneficiary_address
    } = body;

    // Validate required fields
    if (!fullname || !father_name || !email || !phoneNumber || !city || !country || 
        !current_address || !permanent_address || !gender || !cnic_number || 
        !cnic_expiry_date || !beneficiary_name || !beneficiary_phone_mobile || 
        !beneficiary_relation || !beneficiary_address) {
      return NextResponse.json({ 
        error: 'All fields are required' 
      }, { status: 400 });
    }

    // Check if KYC already exists for this user
    const existingKYC = await prisma.kYC.findUnique({
      where: { userId: decoded.userId }
    });

    if (existingKYC) {
      return NextResponse.json({ 
        error: 'KYC data already exists for this user. Use PUT to update.' 
      }, { status: 400 });
    }

    // Check if CNIC number is already used
    const existingCNIC = await prisma.kYC.findUnique({
      where: { cnic_number }
    });

    if (existingCNIC) {
      return NextResponse.json({ 
        error: 'CNIC number already registered' 
      }, { status: 400 });
    }

    // Create KYC record
    const kyc = await prisma.kYC.create({
      data: {
        userId: decoded.userId,
        fullname,
        father_name,
        email,
        phoneNumber,
        city,
        country,
        current_address,
        permanent_address,
        gender,
        cnic_number,
        cnic_expiry_date: new Date(cnic_expiry_date),
        profile_image: profile_image || null,
        id_card_front: id_card_front || null,
        id_card_back: id_card_back || null,
        beneficiary_name,
        beneficiary_phone_mobile,
        beneficiary_relation,
        beneficiary_address,
        kyc_status: 'pending'
      },
      include: {
        user: {
          select: {
            username: true,
            fullname: true
          }
        }
      }
    });

    return NextResponse.json({ 
      message: 'KYC data created successfully',
      kyc 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating KYC data:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'CNIC number already registered' 
      }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update existing KYC data
export async function PUT(request) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      fullname,
      father_name,
      email,
      phoneNumber,
      city,
      country,
      current_address,
      permanent_address,
      gender,
      cnic_number,
      cnic_expiry_date,
      profile_image,
      id_card_front,
      id_card_back,
      beneficiary_name,
      beneficiary_phone_mobile,
      beneficiary_relation,
      beneficiary_address
    } = body;

    // Validate required fields
    if (!fullname || !father_name || !email || !phoneNumber || !city || !country || 
        !current_address || !permanent_address || !gender || !cnic_number || 
        !cnic_expiry_date || !beneficiary_name || !beneficiary_phone_mobile || 
        !beneficiary_relation || !beneficiary_address) {
      return NextResponse.json({ 
        error: 'All fields are required' 
      }, { status: 400 });
    }

    // Check if KYC exists for this user
    const existingKYC = await prisma.kYC.findUnique({
      where: { userId: decoded.userId }
    });

    if (!existingKYC) {
      return NextResponse.json({ 
        error: 'KYC data not found. Use POST to create.' 
      }, { status: 404 });
    }

    // Check if CNIC number is being changed and if it's already used by another user
    if (cnic_number !== existingKYC.cnic_number) {
      const existingCNIC = await prisma.kYC.findFirst({
        where: {
          cnic_number,
          userId: { not: decoded.userId }
        }
      });

      if (existingCNIC) {
        return NextResponse.json({ 
          error: 'CNIC number already registered by another user' 
        }, { status: 400 });
      }
    }

    // Update KYC record
    const updatedKYC = await prisma.kYC.update({
      where: { userId: decoded.userId },
      data: {
        fullname,
        father_name,
        email,
        phoneNumber,
        city,
        country,
        current_address,
        permanent_address,
        gender,
        cnic_number,
        cnic_expiry_date: new Date(cnic_expiry_date),
        profile_image: profile_image || existingKYC.profile_image,
        id_card_front: id_card_front || existingKYC.id_card_front,
        id_card_back: id_card_back || existingKYC.id_card_back,
        beneficiary_name,
        beneficiary_phone_mobile,
        beneficiary_relation,
        beneficiary_address,
        kyc_status: 'pending', // Reset to pending when updated
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            username: true,
            fullname: true
          }
        }
      }
    });

    return NextResponse.json({ 
      message: 'KYC data updated successfully',
      kyc: updatedKYC 
    });

  } catch (error) {
    console.error('Error updating KYC data:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'CNIC number already registered by another user' 
      }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

