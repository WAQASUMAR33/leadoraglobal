import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function POST(req) {
  try {
    // Get token from cookies
    const token = req.cookies.get('auth-token')?.value;
    
    if (token) {
      // Delete session record from database
      try {
        await prisma.session.deleteMany({
          where: { token: token }
        });
      } catch (sessionError) {
        console.warn('Failed to delete session record:', sessionError);
        // Continue with logout even if session deletion fails
      }
    }

    // Clear the auth cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Remove the auth cookie
    response.cookies.delete('auth-token');

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'An error occurred during logout'
    }, { status: 500 });
  }
}

// Also handle DELETE method for logout
export async function DELETE(req) {
  return POST(req);
}
