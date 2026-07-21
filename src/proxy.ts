import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnLogin = req.nextUrl.pathname.startsWith('/login')
  const isInvite = req.nextUrl.pathname.startsWith('/invite')
  
  if (!isLoggedIn && !isOnLogin && !isInvite) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isLoggedIn && isOnLogin) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
