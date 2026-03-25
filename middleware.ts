import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Define route types
  const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // Protected routes - everything else under (home)
  // We'll exclude static assets and api routes via the config matcher,
  // so we can assume other routes are protected or auth-related.
  const isProtectedRoute = !isAuthRoute && pathname !== '/';

  // 1. Redirect logged-in users away from auth pages to dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. Redirect logged-out users away from protected pages to login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Handle root path redirect for logged-out users explicitly if needed
  if (pathname === '/' && !token) {
     return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// Ensure middleware runs on all relevant paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - next.svg, vercel.svg (logo files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|next.svg|vercel.svg).*)',
  ],
};
