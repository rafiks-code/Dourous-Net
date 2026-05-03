import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Routes only for NON logged-in users
  const guestOnlyRoutes = ['/', '/level', '/filiere']
  
  // Auth routes
  const authRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/verify-code',
    '/auth/reset-password',
  ]
  
  // Protected routes (need login)
  const protectedRoutes = ['/dashboard', '/modules', '/lessons',
    '/homework', '/grades', '/messages', '/profile', '/settings', '/prof']

  const isGuestOnly = guestOnlyRoutes.some(route => path === route)
  const isAuthRoute = authRoutes.some(route => path.startsWith(route))
  const isProtected = protectedRoutes.some(route => path.startsWith(route))

  // If logged in and tries to access home/level/filiere → go to /modules
  if (user && isGuestOnly) {
    const role = user.user_metadata?.role
    const url = request.nextUrl.clone()
    url.pathname = role === 'professor' ? '/prof/dashboard' : '/modules'
    return NextResponse.redirect(url)
  }

  // If logged in and tries to access auth pages → go to /modules or /prof/dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    const role = user.user_metadata?.role
    url.pathname = role === 'professor' ? '/prof/dashboard' : '/modules'
    return NextResponse.redirect(url)
  }

  // If NOT logged in and tries to access protected routes → go to login
  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
