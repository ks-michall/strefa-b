import { NextRequest, NextResponse } from "next/server"
import { getLoggedInSession, setLoggedInUser, verifyLogin } from "../../../lib/auth"
import { getStoredCredential, hashNewPassword, setStudentPassword } from "../../../lib/password-store"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin")
  if (!origin) return NextResponse.json({ error: "Nieprawidłowe żądanie." }, { status: 403 })
  try {
    const url = new URL(origin)
    if (url.host !== request.nextUrl.host || url.protocol !== request.nextUrl.protocol) {
      return NextResponse.json({ error: "Nieprawidłowe żądanie." }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe żądanie." }, { status: 403 })
  }

  const session = await getLoggedInSession()
  if (!session || session.mode !== "setup") {
    return NextResponse.json({ error: "Brak uprawnienia do pierwszej zmiany hasła." }, { status: 403 })
  }

  try {
    const body: unknown = await request.json()
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Wprowadź nowe hasło." }, { status: 400 })
    }
    const { password } = body as Record<string, unknown>
    if (typeof password !== "string" || password.length < 12 || password.length > 128 || password.trim().length < 12) {
      return NextResponse.json({ error: "Hasło powinno mieć od 12 do 128 znaków." }, { status: 400 })
    }
    if (await getStoredCredential(session.name)) {
      return NextResponse.json({ error: "Hasło zostało już zmienione. Zaloguj się ponownie." }, { status: 409 })
    }
    const check = await verifyLogin(session.name, password)
    if (check.valid) {
      return NextResponse.json({ error: "Nowe hasło musi różnić się od hasła startowego." }, { status: 400 })
    }
    const hash = await hashNewPassword(password)
    await setStudentPassword(session.name, hash)
    await setLoggedInUser(session.name, "full")
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json(
      { error: "Nie udało się zapisać hasła. Spróbuj ponownie lub skontaktuj się z wychowawcą." },
      { status: 503 }
    )
  }
}
