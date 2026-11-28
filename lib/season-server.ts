import "server-only"
import { students } from "./students"

export async function seasonRequest(player:string, action:Record<string,unknown>={action:"view"}){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret=process.env.STREFA_B_PASSWORD_API_SECRET
  if(!url||!secret)throw new Error("Missing season configuration")
  return await fetch(url.replace(/\/$/,"")+"/functions/v1/strefa-season",{
    method:"POST",headers:{"Content-Type":"application/json","x-strefa-gateway":secret},
    body:JSON.stringify({...action,player,roster:[...students],admin:player==="ks. Michał"}),
    cache:"no-store",signal:AbortSignal.timeout(20000)
  })
}
