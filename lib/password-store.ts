import "server-only"
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"
import type { StudentName } from "./students"

const scrypt = promisify(scryptCallback)
const HASH_FORMAT = /^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/

export type StoredCredential = {
  student_name: string
  password_hash: string
  changed_at: string
  must_change_password?: boolean
}

export function isPasswordStoreConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.STREFA_B_PASSWORD_API_SECRET)
}

async function requestPasswordStore(body: Record<string, string>) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret = process.env.STREFA_B_PASSWORD_API_SECRET
  if (!url || !secret) throw new Error("Password storage is not configured")
  const response = await fetch(url.replace(/\/$/, "") + "/functions/v1/student-passwords", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-strefa-password-secret": secret,
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) throw new Error("Password storage operation failed")
  return response.json()
}

export async function getStoredCredential(name: StudentName): Promise<StoredCredential | null> {
  const data = await requestPasswordStore({ action: "get", name })
  if (!data || typeof data !== "object" || !("credential" in data)) {
    throw new Error("Unexpected password store response")
  }
  return data.credential as StoredCredential | null
}

export async function hashNewPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex")
  const hash = (await scrypt(password, salt, 64)) as Buffer
  return `scrypt:${salt}:${hash.toString("hex")}`
}

export async function verifyPasswordHash(
  password: string,
  encoded: string | null | undefined
): Promise<boolean> {
  const valid = typeof encoded === "string" && HASH_FORMAT.test(encoded)
  const parts = valid ? (encoded as string).split(":") : []
  const salt = valid ? parts[1] : "invalid-hash-salt"
  const expected = Buffer.from(valid ? parts[2] : "00".repeat(64), "hex")
  const result = (await scrypt(password, salt, 64)) as Buffer
  return valid && timingSafeEqual(result, expected)
}

export async function setStudentPassword(name: StudentName, newHash: string): Promise<void> {
  if (!HASH_FORMAT.test(newHash)) throw new Error("Invalid password hash")
  await requestPasswordStore({ action: "set", name, passwordHash: newHash })
}
