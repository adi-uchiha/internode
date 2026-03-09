import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

const authRoutes = ['/login', '/register'];
const publicRoutes = ['/']; // Add any public routes here

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthRoute = authRoutes.includes(pathname);
  const isPublicRoute = publicRoutes.includes(pathname);

  // Optimistic session check using getSessionCookie
  const sessionCookie = getSessionCookie(request);
  const isAuthenticated = !!sessionCookie;

  if (isAuthRoute) {
    if (isAuthenticated) {
      // Redirect logged in users away from auth pages
      return NextResponse.redirect(new URL('/tasks', request.url));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated && !isPublicRoute && !pathname.startsWith('/api/auth')) {
    // Protect all other routes
    const redirectUrl = new URL('/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // NOTE: For RBAC or full session validation, we'll continue to rely on Server Components
  // or API routes as direct DB/Fetch in proxy/middleware is discouraged for performance.
  // However, we can still perform path-based protection here if needed.

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
