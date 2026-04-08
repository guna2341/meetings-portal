import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // /invite is public: unauthenticated users should see invite page, then be
  // redirected to login with a returnUrl preserved.
  const isInviteRoute = pathname.startsWith('/invite');

  const isProtectedRoute = !isAuthRoute && !isInviteRoute && pathname !== '/';

  // 1. Logged-in users away from auth pages → dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. Logged-out users on protected routes → login (preserve returnUrl)
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Root redirect
  if (pathname === '/' && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|next.svg|vercel.svg).*)',
  ],
};
