import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const hasAuthCookie = request.cookies.getAll().some(
    (cookie) => cookie.name.includes('auth-token') || cookie.name.includes('sb-')
  )

  // Allow dev mode bypass cookie
  const isDevMode = request.cookies.get('dev-mode')?.value === 'true'

  if (!hasAuthCookie && !isDevMode) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}