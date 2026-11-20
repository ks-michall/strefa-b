import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SESSION_COOKIE, verifySession } from "./lib/session"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublicRoute =
    pathname === "/login" ||
    pathname === "/api/login" ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.png" ||
    pathname === "/icon-192.png" ||
    pathname === "/icon-512.png" ||
    pathname.startsWith("/profiles/") ||
    pathname.startsWith("/images/") ||
    pathname === "/manifest.json"

  if (isPublicRoute && pathname !== "/login") return NextResponse.next()

  const user = await verifySession(request.cookies.get(SESSION_COOKIE)?.value)

  if (!user && !isPublicRoute) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Brak ważnej sesji." }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
}
