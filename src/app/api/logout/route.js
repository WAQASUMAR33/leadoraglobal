import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function POST(request) {
  try {
    // Get tokens from cookies
    const userToken = request.cookies.get('auth-token')?.value;
    const adminToken = request.cookies.get('admin-token')?.value;

    // Clear user session if exists
    if (userToken) {
      try {
        await prisma.session.deleteMany({
          where: { token: userToken }
        });
      } catch (error) {
        console.warn('Failed to delete user session:', error);
      }
    }

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
      message: 'Logged out successfully'
    });

    // Clear all authentication cookies
    response.cookies.delete('auth-token');
    response.cookies.delete('admin-token');

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if there's an error, clear the cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    response.cookies.delete('auth-token');
    response.cookies.delete('admin-token');

    return response;
  }
}