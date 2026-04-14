import { NextResponse } from "next/server"
import { getLoggedInUser } from "../../../lib/auth"

export async function GET() {
  const user = await getLoggedInUser()

  return NextResponse.json({
    loggedIn: Boolean(user),
    name: user || null,
  })
}