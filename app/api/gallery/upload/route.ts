import { NextRequest, NextResponse } from "next/server"
import { getLoggedInSession } from "../../../../lib/auth"
import { galleryMediaService } from "../../../../lib/gallery-media"

export const runtime="nodejs"
export const dynamic="force-dynamic"
function reply(data:unknown,status=200){
  return NextResponse.json(data,{status,headers:{"Cache-Control":"private, no-store"}})
}
export async function POST(request:NextRequest){
  const session=await getLoggedInSession()
  if(!session || session.mode!=="full")return reply({error:"Brak dostępu"},401)
  const origin=request.headers.get("origin")
  try {
    if(!origin || new URL(origin).origin!==request.nextUrl.origin)
      return reply({error:"Nieprawidłowe żądanie"},403)
  }catch{return reply({error:"Nieprawidłowe żądanie"},403)}
  if(Number(request.headers.get("content-length")||0)>2400000)
    return reply({error:"Zdjęcie jest za duże"},413)
  try{
    const body:unknown=await request.json()
    if(!body || typeof body!=="object" || Array.isArray(body))
      return reply({error:"Nieprawidłowe dane"},400)
    const {large,thumb}=body as Record<string,unknown>
    if(typeof large!=="string" || typeof thumb!=="string" ||
      large.length>1650000 || thumb.length>340000)
      return reply({error:"Zdjęcie jest za duże"},413)
    const result=await galleryMediaService({action:"upload",large,thumb})
    if(typeof result.id!=="string")throw Error("Nieoczekiwana odpowiedź")
    return reply({id:result.id})
  }catch(error){
    const status=error && typeof error==="object" && "status" in error
      && typeof error.status==="number"?error.status:503
    return reply({error:error instanceof Error?error.message:"Nie udało się przesłać zdjęcia."},status)
  }
}
