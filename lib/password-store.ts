import "server-only"
import { createClient } from "@supabase/supabase-js"
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"
import type { StudentName } from "./students"

const scrypt = promisify(scryptCallback)
const HASH_FORMAT = /^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/

export type StoredCredential = {
  student_name: string
  password_hash: string
  changed_at: string
}

function adminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error("Password database is not configured")
  }
  // Service role only on the server. Never export this client to the browser.
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function isPasswordStoreConfigured(): boolean {
  return Boolean(
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function getStoredCredential(
  name: StudentName
): Promise<StoredCredential | null> {
  const { data, error } = await adminClient()
    .from("student_passwords")
    .select("student_name,password_hash,changed_at")
    .eq("student_name", name)
    .maybeSingle()
  if (error) throw new Error("Unable to read password record")
  return data as StoredCredential | null
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
  // Even if the hash is invalid, still execute scrypt.
  const salt = valid ? parts[1] : "invalid-hash-salt"
  const expected = Buffer.from(valid ? parts[2] : "00".repeat(64), "hex")
  const result = (await scrypt(password, salt, 64)) as Buffer
  return valid && timingSafeEqual(result, expected)
}

export async function setStudentPassword(
  name: StudentName,
  newHash: string
): Promise<void> {
  if (!HASH_FORMAT.test(newHash)) throw new Error("Invalid password hash")
  // An existing record means the first-login password was already replaced.
  // Do not allow the setup flow to silently reset it.
  const { error } = await adminClient()
    .from("student_passwords")
    .insert({ student_name: name, password_hash: newHash })
  if (error) throw new Error("Unable to save new password")
}
