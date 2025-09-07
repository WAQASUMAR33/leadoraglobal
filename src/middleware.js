import { NextResponse } from 'next/server';

// Edge Runtime compatible JWT validation
function validateJWT(token) {
  try {
    // Split the token
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token format' };
    }

    // Decode the payload
    let payload;
    try {
      payload = JSON.parse(atob(parts[1]));
    } catch (e) {
      return { valid: false, error: 'Invalid token payload' };
    }

    // Check if token is expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: 'Token expired' };
    }

    // Check if token has required fields
    if (!payload.userId && !payload.adminId) {
      return { valid: false, error: 'Invalid token payload' };
    }

    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: 'Token validation failed' };
  }
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];
  const adminPublicRoutes = ['/admin/login'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  const isAdminPublicRoute = adminPublicRoutes.some(route => pathname.startsWith(route));

  // Check if it's a dashboard route
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isAdminRoute = pathname.startsWith('/admin');

  // Get tokens from cookies and headers
  const userToken = request.cookies.get('auth-token')?.value;
  let adminToken = request.cookies.get('admin-token')?.value;
  
  // If no admin token in cookies, check Authorization header
  if (!adminToken) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      adminToken = authHeader.substring(7);
    }
  }

  // Handle admin routes
  if (isAdminRoute) {
    // If accessing admin login with valid admin token, redirect to admin dashboard
    if (isAdminPublicRoute && adminToken) {
      const validation = validateJWT(adminToken);
      if (validation.valid && validation.payload.adminId) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
    }

    // If accessing admin routes without admin token, redirect to admin login
    if (!isAdminPublicRoute && !adminToken) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify admin token for admin routes
    if (!isAdminPublicRoute && adminToken) {
      const validation = validateJWT(adminToken);
      
      if (!validation.valid || !validation.payload.adminId) {
        console.log('Admin token validation failed:', validation.error);
        // Invalid token, redirect to admin login
        const loginUrl = new URL('/admin/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Add admin info to headers for API routes
      if (pathname.startsWith('/api/admin/')) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-admin-id', validation.payload.adminId);
        requestHeaders.set('x-admin-username', validation.payload.username);
        requestHeaders.set('x-admin-email', validation.payload.email);
        requestHeaders.set('x-admin-role', validation.payload.role);

        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      }
    }

    return NextResponse.next();
  }

  // Handle user routes
  if (isDashboardRoute && !userToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing login/signup with valid user token, redirect to dashboard
  if (isPublicRoute && userToken) {
    const validation = validateJWT(userToken);
    if (validation.valid && validation.payload.userId) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Verify user token for dashboard routes
  if (isDashboardRoute && userToken) {
    const validation = validateJWT(userToken);
    
    if (!validation.valid || !validation.payload.userId) {
      console.log('User token validation failed:', validation.error);
      // Invalid token, redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Add user info to headers for API routes
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/admin/')) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', validation.payload.userId);
      requestHeaders.set('x-user-email', validation.payload.email);
      requestHeaders.set('x-user-role', validation.payload.role || 'user');

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};

