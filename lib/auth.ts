import "server-only"
import { cookies } from "next/headers"
import { scrypt as scryptCallback, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"
import { students, type StudentName } from "./students"
import { SESSION_COOKIE, SESSION_TTL_SECONDS, createSession, verifySession, type SessionMode } from "./session"
import { getStoredCredential, verifyPasswordHash } from "./password-store"

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

export async function verifyLogin(name: string, password: string): Promise<{ valid: boolean; mustChangePassword: boolean }> {
  const entries = credentials()
  const account = students.find(s => s === name)
  if (!account) {
    await verifyPasswordHash(password, null)
    return { valid: false, mustChangePassword: false }
  }
  // Fail closed when the password database is inaccessible; never allow an
  // already-replaced temporary password to become valid again.
  const updated = await getStoredCredential(account)
  if (updated) {
    return { valid: await verifyPasswordHash(password, updated.password_hash), mustChangePassword: false }
  }
  return { valid: await verifyPasswordHash(password, entries?.[account]), mustChangePassword: true }
}

export async function setLoggedInUser(name: StudentName, mode: SessionMode = "full") {
  const token = await createSession(name, mode)
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
  const session = await verifySession(cookieStore.get(SESSION_COOKIE)?.value)
  return session?.name ?? null
}

export async function getLoggedInSession() {
  const cookieStore = await cookies()
  return verifySession(cookieStore.get(SESSION_COOKIE)?.value)
}

