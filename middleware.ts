import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Define public routes that don't require authentication
const publicRoutes = [
  '/auth/signin',
  '/auth/signup',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Update session and get user
  const { supabaseResponse, user } = await updateSession(request);

  // If accessing a protected route without authentication, redirect to signin
  if (!isPublicRoute && !user) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('redirect', pathname);
    return Response.redirect(signInUrl);
  }

  // If accessing signin/signup while authenticated, redirect to home
  if (isPublicRoute && user) {
    return Response.redirect(new URL('/home', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|assets|uploads).*)',
  ],
};

