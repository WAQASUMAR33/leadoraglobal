import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { verifyAdminToken } from '../../../../../lib/adminAuth';

// GET - Fetch single KYC submission for detailed review
export async function GET(request, { params }) {
  try {
    // Verify admin authentication
    const admin = verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const kycId = parseInt(id);

    if (isNaN(kycId)) {
      return NextResponse.json({ error: 'Invalid KYC ID' }, { status: 400 });
    }

    const kycSubmission = await prisma.kYC.findUnique({
      where: { id: kycId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullname: true,
            email: true,
            phoneNumber: true,
            createdAt: true,
            status: true,
            balance: true,
            points: true,
            rank: {
              select: {
                title: true
              }
            }
          }
        }
      }
    });

    if (!kycSubmission) {
      return NextResponse.json({ error: 'KYC submission not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      kycSubmission
    });

  } catch (error) {
    console.error('Error fetching KYC submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update KYC status (approve/reject)
export async function PUT(request, { params }) {
  try {
    // Verify admin authentication
    const admin = verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const kycId = parseInt(id);

    if (isNaN(kycId)) {
      return NextResponse.json({ error: 'Invalid KYC ID' }, { status: 400 });
    }

    const body = await request.json();
    const { status, adminNotes } = body;

    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: pending, approved, or rejected' },
        { status: 400 }
      );
    }

    // Check if KYC submission exists
    const existingKYC = await prisma.kYC.findUnique({
      where: { id: kycId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullname: true
          }
        }
      }
    });

    if (!existingKYC) {
      return NextResponse.json({ error: 'KYC submission not found' }, { status: 404 });
    }

    // Update KYC status
    const updatedKYC = await prisma.kYC.update({
      where: { id: kycId },
      data: {
        kyc_status: status,
        updatedAt: new Date(),
        // You might want to add an admin_notes field to the schema later
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullname: true,
            email: true
          }
        }
      }
    });

    // Log the action for audit trail
    console.log(`Admin ${admin.username} ${status} KYC for user ${existingKYC.user.username} (ID: ${existingKYC.user.id})`);

    return NextResponse.json({
      success: true,
      message: `KYC ${status} successfully`,
      kycSubmission: updatedKYC
    });

  } catch (error) {
    console.error('Error updating KYC status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
