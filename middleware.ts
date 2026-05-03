import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/verify-code',
  '/auth/reset-password',
]

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl

    // Allow static files
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/favicon') ||
      pathname.includes('.')
    ) {
      return NextResponse.next()
    }

    // Allow public routes
    const isPublic = PUBLIC_ROUTES.some(
      route => pathname === route || pathname.startsWith(route + '/')
    )
    if (isPublic) return NextResponse.next()

    // Read session cookie
    const sessionCookie =
      request.cookies.get('sb-access-token') ||
      request.cookies.get('supabase-auth-token') ||
      request.cookies.getAll().find(c => c.name.includes('auth-token'))

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    return NextResponse.next()

  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
