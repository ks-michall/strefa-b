// Private server-to-server password storage endpoint.
// Never call this function directly from the browser.
import { createClient } from "npm:@supabase/supabase-js@2.103.0"

const EXPECTED_SECRET_SHA256 = "5be6c1b74805a1e91ae9680aeaed6b348b9251e079e31647803ab016341b0471"
const encoder = new TextEncoder()
const decoder = new TextDecoder()
const HASH_FORMAT = /^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/

async function authorized(request: Request) {
  const supplied = request.headers.get("x-strefa-password-secret")
  if (!supplied || supplied.length > 256) return false
  const hashBytes = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(supplied)))
  const expectedBytes = Uint8Array.from(EXPECTED_SECRET_SHA256.match(/.{2}/g)!, part => parseInt(part, 16))
  if (hashBytes.length !== expectedBytes.length) return false
  let difference = 0
  for (let i = 0; i < hashBytes.length; i++) difference |= hashBytes[i] ^ expectedBytes[i]
  return difference === 0
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST" || !(await authorized(request))) {
    return new Response("Unauthorized", { status: 401, headers: { "Cache-Control": "no-store" } })
  }
  try {
    if (Number(request.headers.get("content-length") || 0) > 2048) {
      return new Response("Payload too large", { status: 413 })
    }
    const body: unknown = await request.json()
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return new Response("Bad request", { status: 400 })
    }
    const { action, name, passwordHash } = body as Record<string, unknown>
    if ((action !== "get" && action !== "set") || typeof name !== "string" || name.length < 1 || name.length > 100) {
      return new Response("Bad request", { status: 400 })
    }
    if (action === "set" && (typeof passwordHash !== "string" || !HASH_FORMAT.test(passwordHash))) {
      return new Response("Bad request", { status: 400 })
    }
    const url = Deno.env.get("SUPABASE_URL")
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!url || !key) throw new Error("Database server configuration unavailable")
    const db = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
    if (action === "get") {
      const { data, error } = await db
        .from("student_passwords")
        .select("student_name,password_hash,changed_at")
        .eq("student_name", name)
        .maybeSingle()
      if (error) throw error
      return Response.json({ credential: data ?? null }, { headers: { "Cache-Control": "no-store" } })
    }
    const { error } = await db.from("student_passwords").insert({
      student_name: name,
      password_hash: passwordHash as string
    })
    if (error) {
      if (error.code === "23505") {
        return Response.json({ error: "Already set" }, { status: 409, headers: { "Cache-Control": "no-store" } })
      }
      throw error
    }
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("student-passwords: database operation failed", error instanceof Error ? error.message : "unknown")
    return Response.json({ error: "Database operation failed" }, { status: 503, headers: { "Cache-Control": "no-store" } })
  }
})
