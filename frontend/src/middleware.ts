import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/api/')) {
    console.log(`[proxy] ${request.method} ${pathname}`)
  }

  let response = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return response

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    })

    const { data: { user } } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl
    const isLoginPage = pathname.startsWith('/login')
    const isAuthRoute = pathname.startsWith('/auth/')
    const isLandingPage = pathname === '/'

    if (!user && !isLoginPage && !isAuthRoute && !isLandingPage) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (user && isLoginPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    if (user && isLandingPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } catch {
    const { pathname } = request.nextUrl
    const isLoginPage = pathname.startsWith('/login')
    const isAuthRoute = pathname.startsWith('/auth/')
    const isLandingPage = pathname === '/'
    if (!isLoginPage && !isAuthRoute && !isLandingPage) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw\\.js|workbox-.*).*)'],
}
