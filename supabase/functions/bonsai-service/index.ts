// Internal Strefa B Bonsai data service. Accessible only from Next.js server routes.
import { createClient } from "npm:@supabase/supabase-js@2.103.0"

const EXPECTED_SECRET_SHA256 = "5be6c1b74805a1e91ae9680aeaed6b348b9251e079e31647803ab016341b0471"
const encoder = new TextEncoder()
const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", hourCycle: "h23",
})
const CUES = ["Po śniadaniu", "Po pierwszej lekcji", "Po powrocie ze szkoły", "Po kolacji", "Przed snem"]

async function authorized(req: Request): Promise<boolean> {
  const supplied = req.headers.get("x-strefa-password-secret")
  if (!supplied || supplied.length > 256) return false
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(supplied)))
  const expected = Uint8Array.from(EXPECTED_SECRET_SHA256.match(/.{2}/g)!, s => parseInt(s, 16))
  let mismatch = hash.length ^ expected.length
  for (let i = 0; i < Math.min(hash.length, expected.length); i++) mismatch |= hash[i] ^ expected[i]
  return mismatch === 0
}

function parts(now: Date) {
  const p = Object.fromEntries(timeFormatter.formatToParts(now).filter(v => v.type !== "literal")
    .map(v => [v.type, Number(v.value)]))
  return { year: p.year, month: p.month, day: p.day, hour: p.hour }
}
function dayKey(year: number, month: number, day: number) {
  return [year, String(month).padStart(2,"0"), String(day).padStart(2,"0")].join("-")
}
function addDays(day: string, n: number) {
  const [year,month,date] = day.split("-").map(Number)
  const d = new Date(Date.UTC(year,month-1,date+n,12))
  return dayKey(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate())
}
function daysBetween(a: string,b: string) {
  const dt = (s: string) => { const [y,m,d]=s.split("-").map(Number);return Date.UTC(y,m-1,d,12)/86400000 }
  return dt(b)-dt(a)
}
function days(now: Date) {
  const p = parts(now)
  const today = dayKey(p.year,p.month,p.day)
  const active = p.hour >= 20 ? today : p.hour < 3 ? addDays(today,-1) : null
  return { evening: active, planting: active ?? today }
}
function reply(payload: unknown,status=200) {
  return Response.json(payload,{status,headers:{"Cache-Control":"private, no-store"}})
}
function validName(v: unknown): v is string {
  return typeof v === "string" && v.length > 0 && v.length <= 100
}
function validUuid(v: unknown): v is string {
  return typeof v === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v)
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST" || !(await authorized(req))) return reply({error:"Unauthorized"},401)
  try {
    if (Number(req.headers.get("content-length")||"0") > 50000) return reply({error:"Too large"},413)
    const input: unknown = await req.json()
    if (!input || typeof input !== "object" || Array.isArray(input)) return reply({error:"Bad input"},400)
    const { action, name, habitIndex, cue, treeId, trees } = input as Record<string,unknown>
    if (!validName(name) || !["read","plant","check","import"].includes(String(action))) return reply({error:"Bad input"},400)
    const dbUrl = Deno.env.get("SUPABASE_URL")
    const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!dbUrl || !secret) throw new Error("Supabase runtime is not configured")
    const db = createClient(dbUrl, secret, { auth: {persistSession:false, autoRefreshToken:false} })
    const current = days(new Date())

    if (action === "read") {
      const {data: records,error} = await db.from("bonsai_trees")
        .select("id,habit_index,cue,started,created_at")
        .eq("student_name",name).order("started",{ascending:true}).limit(200)
      if (error) throw error
      const ids = (records ?? []).map(item=>item.id)
      if (ids.length === 0) return reply({trees:[]})
      const {data: checkins,error: checkError} = await db.from("bonsai_checkins")
        .select("tree_id,check_day").in("tree_id",ids).order("check_day",{ascending:true})
      if (checkError) throw checkError
      const checksByTree = new Map<string,string[]>()
      for (const check of checkins ?? []) {
        checksByTree.set(check.tree_id,[...(checksByTree.get(check.tree_id)||[]),check.check_day])
      }
      return reply({trees:(records??[]).map(record=>({
        id:record.id, habitIndex:record.habit_index,cue:record.cue,
        started:record.started,checks:checksByTree.get(record.id)??[],
      }))})
    }

    if (action === "plant") {
      if (typeof habitIndex !== "number" || !Number.isInteger(habitIndex) ||
          habitIndex < 0 || habitIndex > 29 || typeof cue !== "string" || !CUES.includes(cue)) {
        return reply({error:"Nieprawidłowy nawyk"},400)
      }
      const { data:previous,error:readError } = await db.from("bonsai_trees")
        .select("started").eq("student_name",name).order("started",{ascending:false}).limit(1).maybeSingle()
      if (readError) throw readError
      if (previous && daysBetween(previous.started,current.planting) < 14) {
        return reply({error:"Kolejne drzewko można zasadzić po 14 dniach."},409)
      }
      const {error} = await db.from("bonsai_trees").insert({
        student_name:name, habit_index:habitIndex,cue,started:current.planting,
      })
      if (error) {
        if (error.code==="23505") return reply({error:"Drzewko zostało już dziś posadzone."},409)
        throw error
      }
      return reply({ok:true},201)
    }

    if (action === "check") {
      if (!current.evening) return reply({error:"Potwierdzanie jest dostępne od 20:00."},409)
      if (!validUuid(treeId)) return reply({error:"Nieprawidłowe drzewko."},400)
      const { data:tree,error:readError } = await db.from("bonsai_trees")
        .select("started").eq("id",treeId).eq("student_name",name).maybeSingle()
      if (readError) throw readError
      if (!tree || daysBetween(tree.started,current.evening) < 0 ||
            daysBetween(tree.started,current.evening) >= 28) {
        return reply({error:"To drzewko nie jest już aktywne."},409)
      }
      const {error} = await db.from("bonsai_checkins").insert({tree_id:treeId,check_day:current.evening})
      if (error) {
        if (error.code==="23505") return reply({error:"Ten dzień jest już potwierdzony."},409)
        throw error
      }
      return reply({ok:true},201)
    }

    if (action === "import") {
      if (!Array.isArray(trees) || trees.length < 1 || trees.length > 50 ||
          JSON.stringify(trees).length > 32000) return reply({error:"Nieprawidłowe dane importu."},400)
      const {error} = await db.rpc("bonsai_import_forest",{p_name:name,p_trees:trees})
      if (error) {
        if (/Already imported/.test(error.message)) return reply({error:"Twoje drzewka są już zapisane."},409)
        throw error
      }
      return reply({ok:true},201)
    }
    return reply({error:"Bad input"},400)
  } catch (error) {
    console.error("bonsai-service failed:", error instanceof Error ? error.message : "unknown")
    return reply({error:"Błąd połączenia z Bonsai. Spróbuj ponownie."},503)
  }
})
