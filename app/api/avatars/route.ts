import { NextRequest,NextResponse } from "next/server"
import { getLoggedInSession } from "../../../lib/auth"
import { students } from "../../../lib/students"
import { avatarService } from "../../../lib/avatar-store"

export const runtime="nodejs"
export const dynamic="force-dynamic"
function json(data:unknown,status=200){
  return NextResponse.json(data,{status,headers:{"Cache-Control":"private, no-store"}})
}
export async function GET(request:NextRequest){
  const session=await getLoggedInSession()
  if(!session||session.mode!=="full")return json({error:"Brak dostępu"},401)
  const photo=request.nextUrl.searchParams.get("photo")
  try {
    if(photo!==null){
      if(!students.some(name=>name===photo))return json({error:"Nie znaleziono użytkownika"},404)
      const result=await avatarService({action:"photo",name:photo})
      if(typeof result.base64!=="string")return json({error:"Brak zdjęcia"},404)
      const bytes=Buffer.from(result.base64,"base64")
      if(bytes.length>100000||bytes.length<20)return json({error:"Błędne zdjęcie"},503)
      return new NextResponse(new Uint8Array(bytes),{
        headers:{"Content-Type":"image/webp","Cache-Control":"private, max-age=60",
          "X-Content-Type-Options":"nosniff"},
      })
    }
    const data=await avatarService({action:"list"})
    const rows=Array.isArray(data.avatars)?data.avatars:[]
    const allowed=new Set<string>(students)
    return json({avatars:rows.filter(item=>item&&typeof item==="object"&&
      "student_name" in item&&typeof item.student_name==="string"&&allowed.has(item.student_name))})
  }catch(error){
    const status=error&&typeof error==="object"&&"status" in error&&error.status===404?404:503
    return json({error:"Nie udało się pobrać awatarów."},status)
  }
}
export async function POST(request:NextRequest){
  const session=await getLoggedInSession()
  if(!session||session.mode!=="full")return json({error:"Brak dostępu"},401)
  const origin=request.headers.get("origin")
  try{
    if(!origin || new URL(origin).host!==request.nextUrl.host || new URL(origin).protocol!==request.nextUrl.protocol)
      return json({error:"Nieprawidłowe żądanie"},403)
  }catch{return json({error:"Nieprawidłowe żądanie"},403)}
  if(Number(request.headers.get("content-length")||0)>150000)
    return json({error:"Zdjęcie jest za duże"},413)
  try{
    const body:unknown=await request.json()
    if(!body||typeof body!=="object"||Array.isArray(body))return json({error:"Nieprawidłowe dane"},400)
    const {action,emoji,base64}=body as Record<string,unknown>
    if(action!=="setEmoji"&&action!=="setPhoto"&&action!=="clear")return json({error:"Nieprawidłowa operacja"},400)
    if(action==="setPhoto"&&(typeof base64!=="string"||base64.length>140000))return json({error:"Za duże zdjęcie"},413)
    const result=await avatarService({action,name:session.name,
      ...(action==="setEmoji"?{emoji}:{ }),
      ...(action==="setPhoto"?{base64}:{}),
    })
    return json(result)
  }catch(error){
    const status=error&&typeof error==="object"&&"status" in error&&
      typeof error.status==="number"?error.status:503
    return json({error:error instanceof Error?error.message:"Nie udało się zapisać awatara"},status)
  }
}
