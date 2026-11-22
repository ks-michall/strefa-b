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
    pathname === "/icon" ||
    pathname === "/apple-icon" ||
    pathname === "/icon-192" ||
    pathname === "/icon-512" ||
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


  if ((pathname === "/busola" || pathname.startsWith("/busola/") || pathname === "/b-boss" || pathname.startsWith("/b-boss/")) &&
      user?.name !== "ks. Michał") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (pathname === "/b-boss" || pathname.startsWith("/b-boss/")) {
    return NextResponse.redirect(new URL("/busola", request.url))
  }

  if (user?.mode === "setup") {
    const allowed =
      pathname === "/ustaw-haslo" ||
      pathname === "/api/change-password" ||
      pathname === "/api/me" ||
      pathname === "/api/logout"
    if (!allowed) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Najpierw ustaw własne hasło." }, { status: 403 })
      }
      return NextResponse.redirect(new URL("/ustaw-haslo", request.url))
    }
  }

  if (user?.mode === "full" && pathname === "/ustaw-haslo") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL(user.mode === "setup" ? "/ustaw-haslo" : "/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
}
