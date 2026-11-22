import { createClient } from "npm:@supabase/supabase-js@2.103.0"

const EXPECTED_SECRET_SHA256="5be6c1b74805a1e91ae9680aeaed6b348b9251e079e31647803ab016341b0471"
const enc=new TextEncoder()
const BUCKET="strefa-b-gallery"
const uuidPattern=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i
function reply(value:unknown,status=200) {
  return Response.json(value,{status,headers:{"Cache-Control":"private, no-store"}})
}
async function authorized(request:Request) {
  const secret=request.headers.get("x-strefa-password-secret")
  if(!secret || secret.length>256)return false
  const digest=new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(secret)))
  const expected=Uint8Array.from(EXPECTED_SECRET_SHA256.match(/.{2}/g)!,v=>parseInt(v,16))
  let mismatch=digest.length^expected.length
  for(let i=0;i<Math.min(digest.length,expected.length);i++)mismatch|=digest[i]^expected[i]
  return mismatch===0
}
function webp(base64:unknown,limit:number):Uint8Array|null {
  if(typeof base64!=="string"||base64.length<32||base64.length>Math.ceil(limit*4/3)+8
     || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64))return null
  try{
    const decoded=atob(base64)
    if(decoded.length<20||decoded.length>limit
       ||decoded.slice(0,4)!=="RIFF"||decoded.slice(8,12)!=="WEBP")return null
    return Uint8Array.from(decoded,c=>c.charCodeAt(0))
  }catch{return null}
}
function objectName(id:string,size:"thumb"|"large") {
  return id+"/"+size+".webp"
}
Deno.serve(async(request:Request)=>{
  if(request.method!=="POST"||!await authorized(request))return reply({error:"Brak dostępu"},401)
  if(Number(request.headers.get("content-length")||0)>2700000)return reply({error:"Plik jest za duży"},413)
  try{
    const input:unknown=await request.json()
    if(!input||typeof input!=="object"||Array.isArray(input))return reply({error:"Nieprawidłowe dane"},400)
    const {action,id,size,large,thumb}=input as Record<string,unknown>
    const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if(!url||!key)throw Error("Missing Supabase configuration")
    const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
    if(action==="read"){
      if(typeof id!=="string"||!uuidPattern.test(id)||(size!=="large"&&size!=="thumb"))
        return reply({error:"Nieprawidłowe zdjęcie"},400)
      const {data,error}=await db.storage.from(BUCKET).download(objectName(id,size))
      if(error||!data)return reply({error:"Nie znaleziono zdjęcia"},404)
      const bytes=new Uint8Array(await data.arrayBuffer())
      if(bytes.length>1200000)return reply({error:"Nieprawidłowy obraz"},500)
      let binary=""
      for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192))
      return reply({base64:btoa(binary)})
    }
    if(action!=="upload")return reply({error:"Nieprawidłowa operacja"},400)
    const big=webp(large,1200000)
    const small=webp(thumb,250000)
    if(!big||!small)return reply({error:"Nieprawidłowe zdjęcie. Spróbuj inne."},400)
    const newId=crypto.randomUUID()
    const largeName=objectName(newId,"large"),thumbName=objectName(newId,"thumb")
    const {error:largeError}=await db.storage.from(BUCKET).upload(largeName,big,{
      upsert:false,contentType:"image/webp",cacheControl:"31536000"
    })
    if(largeError)throw largeError
    const {error:thumbError}=await db.storage.from(BUCKET).upload(thumbName,small,{
      upsert:false,contentType:"image/webp",cacheControl:"31536000"
    })
    if(thumbError){
      await db.storage.from(BUCKET).remove([largeName])
      throw thumbError
    }
    return reply({id:newId})
  }catch(error){
    console.error("Gallery media failed",error instanceof Error?error.message:"unknown")
    return reply({error:"Nie udało się zapisać lub pobrać zdjęcia."},503)
  }
})
