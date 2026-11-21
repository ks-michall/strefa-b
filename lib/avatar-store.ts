import "server-only"

export type AvatarEntry = {
  student_name:string
  kind:"emoji"|"photo"
  emoji:string|null
  updated_at:string
}

export async function avatarService(payload:Record<string,unknown>):Promise<Record<string,unknown>>{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret=process.env.STREFA_B_PASSWORD_API_SECRET
  if(!url||!secret)throw Error("Avatar service is not configured")
  const response=await fetch(url.replace(/\/$/,"")+"/functions/v1/student-avatars",{
    method:"POST",
    headers:{"Content-Type":"application/json","x-strefa-password-secret":secret},
    body:JSON.stringify(payload),
    cache:"no-store",
    signal:AbortSignal.timeout(12000),
  })
  const data:unknown=await response.json().catch(()=>null)
  if(!response.ok){
    const error=new Error(data && typeof data==="object" && "error" in data && typeof data.error==="string"
      ?data.error:"Nie udało się zapisać awatara.") as Error&{status?:number}
    error.status=response.status>=400&&response.status<500?response.status:503
    throw error
  }
  return data && typeof data==="object"&&!Array.isArray(data)?data as Record<string,unknown>:{}
}
