// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Define paths that require authentication
const protectedPaths = [
  '/dashboard',
  '/dashboard/keys',
  '/dashboard/redeem',
  '/dashboard/billing',
  '/dashboard/models',
  '/dashboard/usage',
  '/admin',
  '/api/admin',
];

// Define paths that should be excluded from auth protection
const excludedPaths = [
  '/dashboard/billing/success'
];

// Define paths for auth (redirect to dashboard if already authenticated)
const authPaths = [
  '/login',
  '/register'
];

// Cache the JWT secret
let jwtSecret: Uint8Array | null = null;
const getJwtSecret = () => {
  if (!jwtSecret) {
    jwtSecret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key'
    );
  }
  return jwtSecret;
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Add performance headers for static assets
  if (pathname.startsWith('/_next/static/') || pathname.startsWith('/static/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  // Skip middleware for excluded paths (like success page)
  if (excludedPaths.some(path => pathname.startsWith(path))) {
    return response;
  }
  
  const token = req.cookies.get('auth_token')?.value;
  
  // Check if path is protected
  const isProtectedPath = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );
  
  // Check if path is auth path
  const isAuthPath = authPaths.some(path => pathname === path);
  
  // Handle protected paths
  if (isProtectedPath) {
    // Redirect to login if no token on protected path
    if (!token) {
      const url = new URL('/login', req.url);
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
    
    // Validate token
    try {
      await jwtVerify(token, getJwtSecret());
      
      // Add cache headers for dashboard pages
      response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      return response;
    } catch (error) {
      // Token is invalid, clear the cookie
      const url = new URL('/login', req.url);
      url.searchParams.set('from', pathname);
      const redirectResponse = NextResponse.redirect(url);
      redirectResponse.cookies.delete('auth_token');
      return redirectResponse;
    }
  } 
  
  // Handle auth paths
  else if (isAuthPath) {
    // Redirect to dashboard if already logged in
    if (token) {
      try {
        await jwtVerify(token, getJwtSecret());
        return NextResponse.redirect(new URL('/dashboard', req.url));
      } catch (error) {
        // Token is invalid, clear it and continue to auth page
        response.cookies.delete('auth_token');
        return response;
      }
    }
  }
  
  return response;
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};