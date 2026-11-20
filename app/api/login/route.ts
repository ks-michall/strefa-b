import { NextRequest, NextResponse } from "next/server"
import { areCredentialsConfigured, setLoggedInUser, verifyLogin } from "../../../lib/auth"
import { isSessionConfigured } from "../../../lib/session"
import { students } from "../../../lib/students"

export const runtime = "nodejs"

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")
  if (!origin) return false
  try {
    return new URL(origin).host === request.nextUrl.host && new URL(origin).protocol === request.nextUrl.protocol
  } catch { return false }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ success: false, error: "Nieprawidłowe żądanie." }, { status: 403 })
  if (!areCredentialsConfigured() || !isSessionConfigured()) {
    return NextResponse.json({ success: false, error: "Logowanie nie jest jeszcze skonfigurowane. Skontaktuj się z administratorem." }, { status: 503 })
  }
  try {
    const body: unknown = await request.json()
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: "Podaj imię i hasło." }, { status: 400 })
    }
    const { name, password } = body as Record<string, unknown>
    if (typeof name !== "string" || typeof password !== "string" || !name || !password || name.length > 100 || password.length > 256) {
      return NextResponse.json({ success: false, error: "Podaj imię i hasło." }, { status: 400 })
    }
    // Unify invalid-account and invalid-password responses.
    const isValid = await verifyLogin(name, password)
    if (!isValid || !students.some(s => s === name)) {
      return NextResponse.json({ success: false, error: "Nieprawidłowe dane logowania." }, { status: 401 })
    }
    await setLoggedInUser(name as (typeof students)[number])
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ success: false, error: "Wystąpił błąd logowania." }, { status: 500 })
  }
}
