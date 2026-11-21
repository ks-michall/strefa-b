import { NextRequest, NextResponse } from "next/server"
import { getLoggedInSession } from "../../../../lib/auth"
import { bonsaiRequest } from "../../../../lib/bonsai-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
const respond=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"private, no-store"}})
const uuid=(value:string|null)=>Boolean(value && /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value))
function errorStatus(error:unknown){
  return error && typeof error==="object" && "status" in error && typeof error.status==="number" ? error.status : 503
}
export async function GET(request:NextRequest) {
  const session=await getLoggedInSession()
  if(!session || session.mode!=="full") return respond({error:"Brak dostępu."},401)
  const treeId=request.nextUrl.searchParams.get("tree")
  if(!uuid(treeId)) return respond({error:"Nieprawidłowe drzewko."},400)
  try {
    const result=await bonsaiRequest("readReflection",session.name,{treeId})
    return respond(result)
  } catch(error){return respond({error:"Nie udało się pobrać refleksji."},errorStatus(error))}
}
export async function POST(request:NextRequest){
  const session=await getLoggedInSession()
  if(!session || session.mode!=="full") return respond({error:"Brak dostępu."},401)
  const origin=request.headers.get("origin")
  if(!origin) return respond({error:"Nieprawidłowe żądanie."},403)
  try {
    const url=new URL(origin)
    if(url.host!==request.nextUrl.host || url.protocol!==request.nextUrl.protocol) return respond({error:"Nieprawidłowe żądanie."},403)
  }catch{return respond({error:"Nieprawidłowe żądanie."},403)}
  if(Number(request.headers.get("content-length")||0)>2000)return respond({error:"Zbyt długa odpowiedź."},413)
  try {
    const body:unknown=await request.json()
    if(!body || typeof body!=="object" || Array.isArray(body))return respond({error:"Nieprawidłowe dane."},400)
    const {treeId,helped,nextTime}=body as Record<string,unknown>
    if(typeof treeId!=="string" || !uuid(treeId) || typeof helped!=="string" || typeof nextTime!=="string" ||
      helped.length>500 || nextTime.length>500)return respond({error:"Odpowiedzi mogą mieć maksymalnie 500 znaków."},400)
    await bonsaiRequest("saveReflection",session.name,{treeId,helped,nextTime})
    return respond({ok:true})
  }catch(error){return respond({error:"Nie udało się zapisać refleksji."},errorStatus(error))}
}
