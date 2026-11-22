import { createClient } from "npm:@supabase/supabase-js@2.103.0"

// Internal-only data service. Next.js validates Strefa B sessions before proxying.
const EXPECTED_SECRET_SHA256="5be6c1b74805a1e91ae9680aeaed6b348b9251e079e31647803ab016341b0471"
const enc=new TextEncoder()
const thresholds=[
  {id:"przepompownia",food:10,morale:1},
  {id:"obwodnica",food:25,morale:2},
  {id:"wieza",food:45,morale:3},
  {id:"latarnia",food:70,morale:4},
  {id:"archiwum",food:100,morale:6},
  {id:"wezel",food:140,morale:8},
]
function response(body:unknown,status=200){
  return Response.json(body,{status,headers:{"Cache-Control":"private, no-store"}})
}
async function authorized(req:Request){
  const secret=req.headers.get("x-strefa-password-secret")
  if(!secret||secret.length>256)return false
  const hash=new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(secret)))
  const expected=Uint8Array.from(EXPECTED_SECRET_SHA256.match(/.{2}/g)!,x=>parseInt(x,16))
  let mismatch=hash.length^expected.length
  for(let i=0;i<Math.min(hash.length,expected.length);i++)mismatch|=hash[i]^expected[i]
  return mismatch===0
}
Deno.serve(async req=>{
  if(req.method!=="POST"||!await authorized(req))return response({error:"Unauthorized"},401)
  try{
    const url=Deno.env.get("SUPABASE_URL")
    const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if(!url||!key)throw Error("Service configuration missing")
    const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
    // Only the two class-wide totals are retrieved. No student's progress is transmitted.
    const [checks,thanks,discoveries]=await Promise.all([
      db.from("bonsai_checkins").select("tree_id",{count:"exact",head:true}),
      db.from("thanks").select("id",{count:"exact",head:true}).eq("deleted",false),
      db.from("strefa_b_world_unlocks").select("sector,unlocked_at"),
    ])
    if(checks.error||thanks.error||discoveries.error)
      throw Error(checks.error?.message||thanks.error?.message||discoveries.error?.message)
    const food=checks.count??0
    const morale=thanks.count??0
    const known=new Set<string>((discoveries.data??[]).map(x=>x.sector))
    // Monotone milestones: discovered land does not disappear if a mistaken
    // recognition is later moderated. Upsert is concurrency-safe and idempotent.
    for(const sector of thresholds){
      if(food>=sector.food&&morale>=sector.morale&&!known.has(sector.id)){
        const {error}=await db.from("strefa_b_world_unlocks").upsert({
          sector:sector.id,food_at_unlock:food,morale_at_unlock:morale
        },{onConflict:"sector",ignoreDuplicates:true})
        if(error)throw error
        known.add(sector.id)
      }
    }
    const final=await db.from("strefa_b_world_unlocks").select("sector,unlocked_at")
    if(final.error)throw final.error
    return response({food,morale,unlocked:final.data??[],serverNow:new Date().toISOString()})
  }catch(error){
    console.error("strefa-world:",error instanceof Error?error.message:"unknown")
    return response({error:"Nie udało się odczytać wspólnych zasobów."},503)
  }
})
