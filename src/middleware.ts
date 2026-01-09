import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  });

  const { pathname } = request.nextUrl;

  // Rutas públicas
  const publicRoutes = ['/login', '/api/auth'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Si está en una ruta pública, permitir acceso
  if (isPublicRoute) {
    // Si ya está autenticado y trata de ir al login, redirigir al dashboard
    if (pathname === '/login' && token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Si no está autenticado y trata de acceder a una ruta protegida, redirigir al login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verificación de roles para rutas específicas
  const userRole = token.rol as 'ADMIN' | 'COBRADOR' | undefined;

  // Rutas solo para ADMIN
  const adminOnlyRoutes = ['/register', '/users'];
  const isAdminRoute = adminOnlyRoutes.some(route => pathname.startsWith(route));

  if (isAdminRoute && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', request.url));
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
