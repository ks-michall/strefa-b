import { NextResponse } from "next/server"
import { getLoggedInSession } from "../../../lib/auth"

export async function GET() {
  const user = await getLoggedInUser()
  return NextResponse.json(
    { loggedIn: Boolean(session), name: session?.name ?? null, mustChangePassword: session?.mode === "setup" },
    { headers: { "Cache-Control": "no-store" } }
  )
}
