import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // 1 & 2. Allow these student and professor routes without redirecting (if logged in)
  const studentRoutes = ['/dashboard', '/lessons', '/homework', '/grades', '/messages', '/module']
  const profRoutes = ['/prof/dashboard', '/prof/lessons', '/prof/homework', '/prof/corrections', '/prof/grades', '/prof/messages']
  
  // 5. Public routes that anyone can access without login
  const publicRoutes = ['/', '/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password', '/modules']

  // Helper to check if a route matches
  const isProtectedRoute = [...studentRoutes, ...profRoutes].some(route => path.startsWith(route))
  const isAuthRoute = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'].some(route => path.startsWith(route))

  // 3. Only redirect to /auth/login if user is NOT logged in and tries to access protected routes
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // 4. If user IS logged in and tries to access /auth/login or /auth/register, redirect them to /dashboard
  if (isAuthRoute && user) {
    // Optionally: check role and redirect to /prof/dashboard if prof
    const role = user.user_metadata?.role
    const url = request.nextUrl.clone()
    url.pathname = role === 'professor' ? '/prof/dashboard' : '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
