import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware to protect routes.
 * All routes except '/' (login page) require authentication.
 * In development mode (no Supabase configured), auth is bypassed.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow login page and static assets
  if (
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check for Supabase auth cookie
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    // No Supabase configured — dev mode, allow all routes
    return NextResponse.next()
  }

  // Look for any supabase auth token cookie
  const hasAuthCookie = request.cookies.getAll().some(
    (cookie) => cookie.name.includes('auth-token') || cookie.name.includes('sb-')
  )

  if (!hasAuthCookie) {
    // Redirect to login
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
