import { NextResponse } from "next/server"
import { setLoggedInUser, verifyLogin } from "../../../lib/auth"
import { students } from "../../../lib/students"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const password =
      typeof body.password === "string" ? body.password.trim() : ""

    if (!name || !password) {
      return NextResponse.json(
        { success: false, error: "Wybierz imię i wpisz hasło." },
        { status: 400 }
      )
    }

    if (!students.includes(name as (typeof students)[number])) {
      return NextResponse.json(
        { success: false, error: "Nieprawidłowe imię." },
        { status: 400 }
      )
    }

    const isValid = verifyLogin(name, password)

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Nieprawidłowe hasło." },
        { status: 401 }
      )
    }

    await setLoggedInUser(name as (typeof students)[number])

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { success: false, error: "Wystąpił błąd logowania." },
      { status: 500 }
    )
  }
}