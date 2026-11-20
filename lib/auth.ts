import "server-only"
import { cookies } from "next/headers"
import { scrypt as scryptCallback, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"
import { students, type StudentName } from "./students"
import { SESSION_COOKIE, SESSION_TTL_SECONDS, createSession, verifySession } from "./session"

const scrypt = promisify(scryptCallback)
const dummySalt = "not-a-real-user-salt"
const dummyHash = "00".repeat(64)

function credentials(): Record<string, string> | null {
  const value = process.env.STREFA_B_PASSWORD_HASHES
  if (!value) return null
  try {
    const parsed: unknown = JSON.parse(value)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null
    return parsed as Record<string, string>
  } catch { return null }
}

export function areCredentialsConfigured(): boolean {
  const entries = credentials()
  return !!entries && students.every(s => typeof entries[s] === "string" && /^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(entries[s]))
}

export async function verifyLogin(name: string, password: string): Promise<boolean> {
  const entries = credentials()
  const account = students.find(s => s === name)
  const encoded = account ? entries?.[account] : undefined
  const validFormat = typeof encoded === "string" && /^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(encoded)
  const parts = validFormat ? encoded.split(":") : ["scrypt", dummySalt, dummyHash]
  const salt = parts[1]
  const expected = Buffer.from(parts[2], "hex")
  const derived = (await scrypt(password, salt, 64)) as Buffer
  return Boolean(account && validFormat && timingSafeEqual(derived, expected))
}

export async function setLoggedInUser(name: StudentName) {
  const token = await createSession(name)
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  })
}

export async function clearLoggedInUser() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  // Remove the legacy cookie during migration.
  cookieStore.delete("strefa_b_user")
}

export async function getLoggedInUser(): Promise<StudentName | null> {
  const cookieStore = await cookies()
  return verifySession(cookieStore.get(SESSION_COOKIE)?.value)
}
