import { NextResponse, NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const token = request.cookies.get('LoggedUser')?.value
  const { pathname } = request.nextUrl

  const isLogin = pathname === '/'
  const protectedPrefixes = ['/dashboard', '/orders', '/menu', '/box', '/customers', '/settings', '/accounting', '/']
  const isProtected = protectedPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  if (isProtected && !token) {
    const url = new URL('http://10.77.119.13:3055/login', request.url)
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
    '/',
    '/dashboard/:path*',
    '/orders/:path*',
    '/menu/:path*',
    '/box/:path*',
    '/customers/:path*',
    '/settings/:path*',
    '/accounting/:path*',
  ],
}


