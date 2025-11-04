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
  
  // Skip middleware for static files and favicon
  if (pathname === '/favicon.ico' || pathname.startsWith('/_next/') || pathname.startsWith('/public/')) {
    return NextResponse.next();
  }
  
  // Debug: Log all requests
  console.log('🔍 Middleware called for:', pathname, request.method);

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
  
  // Debug logging for admin routes
  if (isAdminRoute) {
    console.log('Admin route accessed:', pathname);
    console.log('Admin token from cookie:', adminToken ? 'exists' : 'missing');
    console.log('All cookies:', request.cookies.getAll().map(c => c.name));
  }
  
  // If no admin token in cookies, check Authorization header
  if (!adminToken) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      adminToken = authHeader.substring(7);
      console.log('Admin token from Authorization header:', adminToken ? 'exists' : 'missing');
    }
  }

  // Handle admin routes - CRITICAL SECURITY FIX
  if (isAdminRoute) {
    // If accessing admin login with valid admin token, redirect to admin dashboard
    if (isAdminPublicRoute && adminToken) {
      const validation = validateJWT(adminToken);
      if (validation.valid && validation.payload.adminId) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
    }

    // CRITICAL: Check if regular user token is trying to access admin routes
    if (userToken && !adminToken) {
      console.log('SECURITY: Regular user token detected on admin route:', pathname);
      const userValidation = validateJWT(userToken);
      if (userValidation.valid && userValidation.payload.userId) {
        console.log('SECURITY: Blocking regular user from admin route');
        // Clear user token and redirect to admin login
        const response = NextResponse.redirect(new URL('/admin/login', request.url));
        response.cookies.delete('auth-token');
        return response;
      }
    }

    // CRITICAL: If accessing admin routes without admin token, redirect to admin login
    if (!isAdminPublicRoute && !adminToken) {
      console.log('SECURITY: Admin route accessed without admin token:', pathname);
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // CRITICAL: Verify admin token for ALL admin routes
    if (!isAdminPublicRoute && adminToken) {
      console.log('Validating admin token for route:', pathname);
      const validation = validateJWT(adminToken);
      console.log('JWT validation result:', validation);
      
      if (!validation.valid || !validation.payload.adminId) {
        console.log('SECURITY: Admin token validation failed:', validation.error);
        // Clear invalid admin token
        const response = NextResponse.redirect(new URL('/admin/login', request.url));
        response.cookies.delete('admin-token');
        return response;
      }
      
      console.log('JWT validation successful, payload:', validation.payload);

      // Add admin info to headers for API routes
      if (pathname.startsWith('/api/admin/')) {
        console.log('Setting admin headers for API route:', pathname);
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-admin-id', validation.payload.adminId);
        requestHeaders.set('x-admin-username', validation.payload.username);
        requestHeaders.set('x-admin-email', validation.payload.email);
        requestHeaders.set('x-admin-role', validation.payload.role);
        
        console.log('Admin headers set:', {
          'x-admin-id': validation.payload.adminId,
          'x-admin-username': validation.payload.username,
          'x-admin-email': validation.payload.email,
          'x-admin-role': validation.payload.role
        });

        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      }
    }

    // CRITICAL: If no admin token and not public route, redirect to login
    if (!isAdminPublicRoute && !adminToken) {
      console.log('SECURITY: Admin route accessed without token:', pathname);
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // CRITICAL: Handle conflicting sessions when switching roles
  if (isAdminRoute && userToken && !adminToken) {
    // User trying to access admin routes - redirect to admin login
    console.log('SECURITY: User session detected on admin route, redirecting to admin login');
    const response = NextResponse.redirect(new URL('/admin/login', request.url));
    response.cookies.delete('auth-token');
    return response;
  }

  if (isDashboardRoute && adminToken && !userToken) {
    // Admin trying to access user routes - redirect to admin dashboard
    console.log('SECURITY: Admin session detected on user route, redirecting to admin dashboard');
    const response = NextResponse.redirect(new URL('/admin/dashboard', request.url));
    response.cookies.delete('admin-token');
    return response;
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
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|api/).*)',
  ],
};

