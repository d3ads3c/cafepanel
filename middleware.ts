import { NextResponse, NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const { pathname } = request.nextUrl

  const isLogin = pathname === '/login'
  const protectedPrefixes = ['/dashboard', '/orders', '/menu', '/box', '/customers', '/settings']
  const isProtected = protectedPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  if (isProtected && !token) {
    const url = new URL('/login', request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (isLogin && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/login',
    '/dashboard/:path*',
    '/orders/:path*',
    '/menu/:path*',
    '/box/:path*',
    '/customers/:path*',
    '/settings/:path*',
  ],
}


