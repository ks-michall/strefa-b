import { createClient } from "npm:@supabase/supabase-js@2.103.0"

// Internal service; only Next.js server routes supply the shared secret.
const EXPECTED_SECRET_SHA256="5be6c1b74805a1e91ae9680aeaed6b348b9251e079e31647803ab016341b0471"
const enc=new TextEncoder()
const bucket="strefa-b-avatars"
const emojis=["🦊","🐱","🐼","🦁","🐸","🐧","🦋","🐢","🦄","🐻","🌻","⭐","🚀","⚡","🍀","🎸","🐶","🐨","🐯","🐰","🌵","🌙","🎨","🏀"]
function reply(data:unknown,status=200) {
  return Response.json(data,{status,headers:{"Cache-Control":"private, no-store"}})
}
async function authorized(request:Request) {
  const value=request.headers.get("x-strefa-password-secret")
  if(!value || value.length>256)return false
  const hash=new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(value)))
  const expected=Uint8Array.from(EXPECTED_SECRET_SHA256.match(/.{2}/g)!,part=>parseInt(part,16))
  let mismatch=hash.length^expected.length
  for(let i=0;i<Math.min(hash.length,expected.length);i++)mismatch|=hash[i]^expected[i]
  return mismatch===0
}
async function pathFor(name:string) {
  const bytes=new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(name)))
  return Array.from(bytes).map(b=>b.toString(16).padStart(2,"0")).join("")+".webp"
}
Deno.serve(async(request:Request)=>{
  if(request.method!=="POST" || !await authorized(request))return reply({error:"Unauthorized"},401)
  if(Number(request.headers.get("content-length")||0)>160000)return reply({error:"Za duży plik."},413)
  try {
    const input:unknown=await request.json()
    if(!input || typeof input!=="object" || Array.isArray(input))return reply({error:"Invalid input"},400)
    const {action,name,emoji,base64}=input as Record<string,unknown>
    if(!["list","photo","setEmoji","setPhoto","clear"].includes(String(action)))return reply({error:"Invalid action"},400)
    if(action!=="list" && (typeof name!=="string" || name.length<1 || name.length>100))return reply({error:"Invalid account"},400)
    const dbUrl=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if(!dbUrl || !key)throw Error("Missing environment configuration")
    const db=createClient(dbUrl,key,{auth:{persistSession:false,autoRefreshToken:false}})
    if(action==="list"){
      const {data,error}=await db.from("student_avatars").select("student_name,kind,emoji,updated_at")
      if(error)throw error
      return reply({avatars:data??[]})
    }
    const student=name as string
    const path=await pathFor(student)
    if(action==="photo"){
      const {data,error}=await db.from("student_avatars").select("kind")
        .eq("student_name",student).maybeSingle()
      if(error)throw error
      if(data?.kind!=="photo")return reply({error:"Brak zdjęcia"},404)
      const {data:file,error:downloadError}=await db.storage.from(bucket).download(path)
      if(downloadError || !file)return reply({error:"Brak zdjęcia"},404)
      const buffer=new Uint8Array(await file.arrayBuffer())
      let binary=""
      for(const byte of buffer)binary+=String.fromCharCode(byte)
      return reply({base64:btoa(binary)})
    }
    if(action==="setEmoji") {
      if(typeof emoji!=="string" || !emojis.includes(emoji))return reply({error:"Nieprawidłowy emoji"},400)
      const {error}=await db.from("student_avatars").upsert({
        student_name:student,kind:"emoji",emoji,updated_at:new Date().toISOString(),
      },{onConflict:"student_name"})
      if(error)throw error
      await db.storage.from(bucket).remove([path])
      return reply({ok:true})
    }
    if(action==="clear"){
      const {error}=await db.from("student_avatars").delete().eq("student_name",student)
      if(error)throw error
      await db.storage.from(bucket).remove([path])
      return reply({ok:true})
    }
    if(action==="setPhoto"){
      if(typeof base64!=="string" || base64.length>140000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64))
        return reply({error:"Nieprawidłowe zdjęcie"},400)
      let bytes:Uint8Array
      try{
        const raw=atob(base64)
        bytes=Uint8Array.from(raw,c=>c.charCodeAt(0))
      }catch{return reply({error:"Nieprawidłowe zdjęcie"},400)}
      if(bytes.length<20 || bytes.length>100000 ||
        String.fromCharCode(...bytes.slice(0,4))!=="RIFF" ||
        String.fromCharCode(...bytes.slice(8,12))!=="WEBP") {
        return reply({error:"Zdjęcie musi być małym plikiem WebP"},400)
      }
      const {error:uploadError}=await db.storage.from(bucket).upload(path,bytes,{
        contentType:"image/webp",upsert:true,cacheControl:"60",
      })
      if(uploadError)throw uploadError
      const {error}=await db.from("student_avatars").upsert({
        student_name:student,kind:"photo",emoji:null,updated_at:new Date().toISOString(),
      },{onConflict:"student_name"})
      if(error)throw error
      return reply({ok:true})
    }
    return reply({error:"Invalid action"},400)
  }catch(error){
    console.error("student-avatars operation failed",error instanceof Error?error.message:"unknown")
    return reply({error:"Nie udało się zapisać awatara."},503)
  }
})