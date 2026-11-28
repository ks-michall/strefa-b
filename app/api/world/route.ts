import { NextResponse } from "next/server"
import { getLoggedInSession } from "../../../lib/auth"

export const runtime="nodejs"
export const dynamic="force-dynamic"

export async function GET(){
  const session=await getLoggedInSession()
  if(!session||session.mode!=="full")
    return NextResponse.json({error:"Brak dostępu"},{status:401,headers:{"Cache-Control":"no-store"}})
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret=process.env.STREFA_B_PASSWORD_API_SECRET
  if(!url||!secret)
    return NextResponse.json({error:"Brak konfiguracji świata."},{status:503})
  try{
    const response=await fetch(url.replace(/\/$/,"")+"/functions/v1/strefa-world",{
      method:"POST",headers:{
        "Content-Type":"application/json","x-strefa-password-secret":secret,
      },cache:"no-store",body:"{}",signal:AbortSignal.timeout(12000),
    })
    const data:unknown=await response.json()
    if(!response.ok||!data||typeof data!=="object"||Array.isArray(data))
      throw Error("World service unavailable")
    const obj=data as Record<string,unknown>
    const unlocked=Array.isArray(obj.unlocked)?obj.unlocked.filter(
      (item:unknown):item is {sector:string;unlocked_at:string}=>!!item&&
        typeof item==="object"&&"sector" in item&&"unlocked_at" in item&&
        typeof item.sector==="string"&&typeof item.unlocked_at==="string"
    ):[]
    return NextResponse.json({
      food:typeof obj.food==="number"?Math.max(0,obj.food):0,
      morale:typeof obj.morale==="number"?Math.max(0,obj.morale):0,
      unlocked:Date.now()<Date.parse("2026-12-02T08:30:00Z")?[]:unlocked,serverNow:typeof obj.serverNow==="string"?obj.serverNow:new Date().toISOString(),
    },{headers:{"Cache-Control":"private, no-store"}})
  }catch{
    return NextResponse.json({error:"Nie udało się pobrać świata Strefy B."},
      {status:503,headers:{"Cache-Control":"private, no-store"}})
  }
}
