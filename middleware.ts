import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = [
  '/auth/signin',
  '/auth/signup',
  '/api/users/signin',
  '/api/users/signup',
  '/api/users/signout',
];

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/home',
  '/chat',
  '/settings',
  '/profile',
  '/compliance-check',
  '/contract-review',
  '/knowledge-base',
  '/rulebase',
  '/policy-generator',
  '/search',
  '/analytics',
  '/my-tasks',
  '/upload-assets',
  '/users',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route) || pathname === '/'
  );
  
  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Get authentication token from cookies or headers
  const token = request.cookies.get('accessToken')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');

  // If accessing a protected route without token, redirect to signin
  if (isProtectedRoute && !token) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If accessing a public route (signin/signup) with token, redirect to home
  if (isPublicRoute && token && (pathname.includes('/signin') || pathname.includes('/signup'))) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // If accessing root path without token, redirect to signin
  if (pathname === '/' && !token) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // If accessing root path with token, redirect to home
  if (pathname === '/' && token) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets|uploads).*)',
  ],
};
