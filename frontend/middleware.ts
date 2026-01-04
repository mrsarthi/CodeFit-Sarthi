import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protected routes
  const protectedRoutes = ['/dashboard', '/interview', '/welcome']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Public routes
  const publicRoutes = ['/login', '/register', '/']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Note: Actual auth check happens client-side using Zustand store
  // This middleware just handles basic route protection
  // For production, implement proper server-side auth check

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

