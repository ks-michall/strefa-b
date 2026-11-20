import { students, type StudentName } from "./students"

export const SESSION_COOKIE = "strefa_b_session"
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7
const encoder = new TextEncoder()

type SessionPayload = { name: StudentName; exp: number; v: 1 }

function encodeBase64Url(input: Uint8Array): string {
  // Available in Node.js and the Next.js middleware runtime.
  let binary = ""
  for (const byte of input) binary += String.fromCharCode(byte)
  return btoa(binary).split("+").join("-").split("/").join("_").replace(/=+$/g, "")
}

function decodeBase64Url(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null
  try {
    const raw = atob(value.replace(/-/g, "+").replace(/_/g, "/"))
    return Uint8Array.from(raw, char => char.charCodeAt(0))
  } catch { return null }
}

function getSecret(): string | null {
  const secret = process.env.STREFA_B_SESSION_SECRET
  return secret && secret.length >= 32 ? secret : null
}

async function sign(data: string): Promise<string | null> {
  const secret = getSecret()
  if (!secret) return null
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data))
  return encodeBase64Url(new Uint8Array(signature))
}

export function isSessionConfigured() {
  return Boolean(getSecret())
}

export async function createSession(name: StudentName): Promise<string> {
  if (!students.includes(name)) throw new Error("Unknown account")
  const payload: SessionPayload = { name, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS, v: 1 }
  const body = encodeBase64Url(encoder.encode(JSON.stringify(payload)))
  const signature = await sign(body)
  if (!signature) throw new Error("STREFA_B_SESSION_SECRET is not configured")
  return body + "." + signature
}

export async function verifySession(token: string | undefined | null): Promise<StudentName | null> {
  if (!token || token.length > 1200) return null
  const parts = token.split(".")
  if (parts.length !== 2) return null
  const [body, signature] = parts
  const secret = getSecret()
  const signatureBytes = decodeBase64Url(signature)
  const payloadBytes = decodeBase64Url(body)
  if (!secret || !signatureBytes || !payloadBytes || signatureBytes.length !== 32) return null
  try {
    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"])
    if (!await crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(body))) return null
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as Partial<SessionPayload>
    if (payload.v !== 1 || typeof payload.name !== "string" || !students.some(s => s === payload.name)) return null
    if (!Number.isSafeInteger(payload.exp) || (payload.exp as number) <= Math.floor(Date.now() / 1000)) return null
    return payload.name as StudentName
  } catch { return null }
}
