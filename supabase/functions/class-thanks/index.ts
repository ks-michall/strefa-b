import { createClient } from "npm:@supabase/supabase-js@2.103.0"

const EXPECTED_SECRET_SHA256="5be6c1b74805a1e91ae9680aeaed6b348b9251e079e31647803ab016341b0471"
const enc=new TextEncoder()
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function reply(data:unknown,status=200) {
  return Response.json(data,{status,headers:{"Cache-Control":"private, no-store"}})
}
async function authorized(req:Request) {
  const secret=req.headers.get("x-strefa-password-secret")
  if(!secret||secret.length>256)return false
  const hash=new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(secret)))
  const expected=Uint8Array.from(EXPECTED_SECRET_SHA256.match(/.{2}/g)!,p=>parseInt(p,16))
  let diff=hash.length^expected.length
  for(let i=0;i<Math.min(hash.length,expected.length);i++)diff|=hash[i]^expected[i]
  return diff===0
}

Deno.serve(async req=>{
  if(req.method!=="POST"||!await authorized(req))return reply({error:"Brak dostępu"},401)
  if(Number(req.headers.get("content-length")||0)>2800)return reply({error:"Za duże żądanie"},413)
  try {
    const input:unknown=await req.json()
    if(!input||typeof input!=="object"||Array.isArray(input))return reply({error:"Błędne dane"},400)
    const {action,actor,person,message,id,reason,reviewAction} = input as Record<string,unknown>
    if(typeof actor!=="string"||actor.length<2||actor.length>100)return reply({error:"Brak użytkownika"},403)
    const admin=actor==="ks. Michał"
    const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if(!url||!key)throw Error("Missing Supabase service configuration")
    const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})

    if(action==="summary"){
      const {data,error}=await db.from("thanks").select("id,created_at")
        .eq("person",actor).eq("deleted",false)
        .order("created_at",{ascending:false}).limit(1).maybeSingle()
      if(error)throw error
      return reply({latestReceived:data??null})
    }

    if(action==="list"){
      const {data,error}=await db.from("thanks")
        .select("id,author,person,message,created_at,deleted")
        .eq("deleted",false).order("created_at",{ascending:false}).limit(1000)
      if(error)throw error
      return reply({thanks:data??[]})
    }

    if(action==="add"){
      if(typeof person!=="string"||person.length<2||person.length>100
         ||person===actor||typeof message!=="string"||message.trim().length<5
         ||message.length>600)return reply({error:"Wybierz osobę i opisz konkretny dobry czyn (minimum 5 znaków)."},400)
      const {data,error}=await db.rpc("create_class_thanks",{
        p_author:actor,p_person:person,p_message:message.trim(),
      })
      if(error){
        if(error.message.includes("MONTHLY_LIMIT"))return reply({error:"Możesz dodać maksymalnie 7 wyróżnień w miesiącu."},409)
        if(error.message.includes("PERSON_LIMIT"))return reply({error:"Tej samej osobie możesz podziękować najwyżej 2 razy w miesiącu."},409)
        if(error.message.includes("INVALID_THANK"))return reply({error:"Sprawdź treść i osobę wyróżnienia."},400)
        throw error
      }
      return reply({thank:Array.isArray(data)?data[0]:data},201)
    }

    if(action==="delete"){
      if(typeof id!=="string"||!uuid.test(id))return reply({error:"Nieprawidłowy wpis"},400)
      const {data,error}=await db.from("thanks")
        .select("id,author,created_at,deleted").eq("id",id).maybeSingle()
      if(error)throw error
      if(!data||data.deleted)return reply({error:"Nie znaleziono wpisu"},404)
      if(!admin && (data.author!==actor||Date.now()-new Date(data.created_at).getTime()>86400000))
        return reply({error:"Nie możesz już usunąć tego wyróżnienia."},403)
      const changed=await db.from("thanks").update({deleted:true}).eq("id",id).eq("deleted",false)
      if(changed.error)throw changed.error
      return reply({ok:true})
    }

    if(action==="report"){
      if(typeof id!=="string"||!uuid.test(id)||typeof reason!=="string"||reason.length>500)
        return reply({error:"Nieprawidłowe zgłoszenie"},400)
      const exists=await db.from("thanks").select("id").eq("id",id).eq("deleted",false).maybeSingle()
      if(exists.error)throw exists.error
      if(!exists.data)return reply({error:"Nie znaleziono wpisu"},404)
      const {error}=await db.from("class_thanks_reports").upsert({
        thank_id:id,reporter:actor,reason:reason.trim(),reviewed_at:null,
      },{onConflict:"thank_id,reporter"})
      if(error)throw error
      return reply({ok:true})
    }

    if(action==="listReports" && admin){
      const {data,error}=await db.from("class_thanks_reports")
        .select("id,thank_id,reporter,reason,created_at,reviewed_at")
        .is("reviewed_at",null).order("created_at",{ascending:false}).limit(100)
      if(error)throw error
      return reply({reports:data??[]})
    }
    if(action==="reviewReport" && admin){
      if(typeof id!=="string"||!uuid.test(id)||!["dismiss","hide"].includes(String(reviewAction)))
        return reply({error:"Błędne zgłoszenie"},400)
      const {data,error}=await db.from("class_thanks_reports")
        .select("id,thank_id,reviewed_at").eq("id",id).maybeSingle()
      if(error)throw error
      if(!data||data.reviewed_at)return reply({error:"Zgłoszenie nieaktualne"},404)
      if(reviewAction==="hide"){
        const hidden=await db.from("thanks").update({deleted:true}).eq("id",data.thank_id)
        if(hidden.error)throw hidden.error
      }
      const updated=await db.from("class_thanks_reports").update({reviewed_at:new Date().toISOString()})
        .eq("id",id).is("reviewed_at",null)
      if(updated.error)throw updated.error
      return reply({ok:true})
    }
    return reply({error:"Nieprawidłowa operacja"},400)
  }catch(err){
    console.error("Class thanks service error",err instanceof Error?err.message:"unknown")
    return reply({error:"Nie udało się wykonać operacji. Spróbuj ponownie."},503)
  }
})
