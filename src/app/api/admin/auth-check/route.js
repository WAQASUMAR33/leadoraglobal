import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Check if admin token exists in cookies
    const adminToken = request.cookies.get('admin-token')?.value;
    
    // Check if admin token exists in Authorization header
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    // Get admin info from middleware headers
    const adminId = request.headers.get('x-admin-id');
    const adminUsername = request.headers.get('x-admin-username');
    const adminEmail = request.headers.get('x-admin-email');
    const adminRole = request.headers.get('x-admin-role');
    
    return new Response(
      JSON.stringify({
        success: true,
        debug: {
          hasCookieToken: !!adminToken,
          hasBearerToken: !!bearerToken,
          hasMiddlewareHeaders: !!adminId,
          adminId,
          adminUsername,
          adminEmail,
          adminRole,
          cookieTokenLength: adminToken ? adminToken.length : 0,
          bearerTokenLength: bearerToken ? bearerToken.length : 0
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
