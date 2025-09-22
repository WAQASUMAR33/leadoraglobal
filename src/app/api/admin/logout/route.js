import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function POST(request) {
  try {
    // Get admin token from cookies
    const adminToken = request.cookies.get('admin-token')?.value;

    // Clear admin session if exists
    if (adminToken) {
      try {
        await prisma.adminSession.deleteMany({
          where: { token: adminToken }
        });
      } catch (error) {
        console.warn('Failed to delete admin session:', error);
      }
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Admin logged out successfully'
    });

    // Clear admin authentication cookie
    response.cookies.delete('admin-token');

    return response;

  } catch (error) {
    console.error('Admin logout error:', error);
    
    // Even if there's an error, clear the cookie
    const response = NextResponse.json({
      success: true,
      message: 'Admin logged out successfully'
    });

    response.cookies.delete('admin-token');

    return response;
  }
}
