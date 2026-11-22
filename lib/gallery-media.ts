import "server-only"

export async function galleryMediaService(payload: Record<string, unknown>):
  Promise<Record<string, unknown>> {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret=process.env.STREFA_B_PASSWORD_API_SECRET
  if(!url||!secret)throw Error("Gallery media service not configured")
  const response=await fetch(url.replace(/\/$/,"")+"/functions/v1/gallery-media",{
    method:"POST",
    headers:{"Content-Type":"application/json","x-strefa-password-secret":secret},
    body:JSON.stringify(payload),cache:"no-store",signal:AbortSignal.timeout(25000),
  })
  const result:unknown=await response.json().catch(()=>null)
  if(!response.ok){
    const error=new Error(
      result && typeof result==="object" && "error" in result && typeof result.error==="string"
        ? result.error : "Nie udało się przetworzyć zdjęcia."
    ) as Error & {status?:number}
    error.status=response.status>=400 && response.status<500?response.status:503
    throw error
  }
  return result && typeof result==="object" && !Array.isArray(result)
    ? result as Record<string,unknown>:{}
}
