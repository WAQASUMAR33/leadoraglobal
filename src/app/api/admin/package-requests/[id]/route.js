import jwt from 'jsonwebtoken';
import prisma from '../../../../../lib/prisma.js';
import { approvePackageRequest } from '../../../../../lib/packageApproval.js';

export async function PUT(request, { params }) {
  try {
    // Get admin token from cookie
    const adminToken = request.cookies.get('admin-token')?.value;
    
    if (!adminToken) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Admin authentication required - no token found'
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    
    let decoded;
    try {
      decoded = jwt.verify(adminToken, jwtSecret);
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid admin token'
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if it's an admin token
    if (!decoded.adminId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Admin access required'
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id } = await params;
    const packageRequestId = parseInt(id);
    const body = await request.json();
    const { status, adminNotes } = body;

    if (!status) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Status is required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If approved, use the comprehensive approval system
    if (status === 'approved') {
      try {
        const approvalResult = await approvePackageRequest(packageRequestId);
        
        // Get updated package request
        const updatedRequest = await prisma.packageRequest.findUnique({
          where: { id: packageRequestId },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullname: true
              }
            },
            package: {
              select: {
                id: true,
                package_name: true,
                package_amount: true
              }
            }
          }
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Package request approved successfully with commission distribution',
            packageRequest: updatedRequest,
            approvalResult
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (approvalError) {
        console.error('Package approval failed:', approvalError);
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Failed to approve package request',
            error: approvalError.message
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // For other statuses (rejected, pending), use simple update
    const updatedRequest = await prisma.packageRequest.update({
      where: { id: packageRequestId },
      data: {
        status,
        adminNotes: adminNotes || '',
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullname: true
          }  
        },
        package: {
          select: {
            id: true,
            package_name: true,
            package_amount: true
          }
        }
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Package request updated successfully',
        packageRequest: updatedRequest
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error updating package request:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to update package request',
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function GET(request, { params }) {
  try {
    // Get admin token from cookie
    const adminToken = request.cookies.get('admin-token')?.value;
    
    if (!adminToken) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Admin authentication required - no token found'
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    
    let decoded;
    try {
      decoded = jwt.verify(adminToken, jwtSecret);
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid admin token'
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if it's an admin token
    if (!decoded.adminId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Admin access required'
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id } = await params;
    const packageRequestId = parseInt(id);

    const packageRequest = await prisma.packageRequest.findUnique({
      where: { id: packageRequestId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullname: true
          }
        },
        package: {
          select: {
            id: true,
            package_name: true,
            package_amount: true
          }
        }
        // transactionReceipt is included for individual request view
      }
    });

    if (!packageRequest) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Package request not found'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        packageRequest
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching package request:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to fetch package request',
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
