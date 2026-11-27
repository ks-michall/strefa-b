import { NextResponse } from "next/server"
import {cookies} from "next/headers"
import { clearLoggedInUser } from "../../../lib/auth"

export async function POST() {
  await clearLoggedInUser()
  const cookieStore=await cookies()
  cookieStore.delete("sb_first_story_pending")
  return NextResponse.json({ success: true })
}