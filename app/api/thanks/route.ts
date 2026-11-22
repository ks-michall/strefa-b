import { NextRequest,NextResponse } from "next/server"
import {getLoggedInSession} from "../../../lib/auth"
import {students} from "../../../lib/students"
import {classThanksService} from "../../../lib/class-thanks-store"

export const runtime="nodejs"
export const dynamic="force-dynamic"
const roster=new Set<string>(students)
const idPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
function json(data:unknown,status=200) {
  return NextResponse.json(data,{status,headers:{"Cache-Control":"private, no-store"}})
}
function statusOf(error:unknown) {
  return error&&typeof error==="object"&&"status" in error&&
    typeof error.status==="number"?error.status:503
}

export async function GET(request:NextRequest){
  const session=await getLoggedInSession()
  if(!session||session.mode!=="full")return json({error:"Brak dostępu"},401)
  try{
    if(request.nextUrl.searchParams.get("reports")==="1"){
      if(session.name!=="ks. Michał")return json({error:"Brak dostępu"},403)
      const data=await classThanksService({action:"listReports",actor:session.name})
      return json({reports:Array.isArray(data.reports)?data.reports:[]})
    }
    if(request.nextUrl.searchParams.get("summary")==="1"){
      const data=await classThanksService({action:"summary",actor:session.name})
      return json({latestReceived:data.latestReceived??null})
    }
    const data=await classThanksService({action:"list",actor:session.name})
    const all=Array.isArray(data.thanks)?data.thanks:[]
    const visible=all.filter((item:unknown):item is {
      id:string;author:string;person:string;message:string;created_at:string;deleted:boolean
    }=>!!item&&typeof item==="object"&&"author" in item&&"person" in item&&
      "id" in item&&"message" in item&&"created_at" in item&&
      typeof item.id==="string"&&typeof item.author==="string"&&typeof item.person==="string"&&
      typeof item.message==="string"&&typeof item.created_at==="string"&&
      roster.has(item.author)&&roster.has(item.person))
    return json({thanks:visible})
  }catch(error){
    return json({error:error instanceof Error?error.message:"Nie udało się pobrać Bohaterów."},statusOf(error))
  }
}

export async function POST(request:NextRequest){
  const session=await getLoggedInSession()
  if(!session||session.mode!=="full")return json({error:"Brak dostępu"},401)
  const origin=request.headers.get("origin")
  try{
    if(!origin||new URL(origin).origin!==request.nextUrl.origin)
      return json({error:"Nieprawidłowe żądanie"},403)
  }catch{return json({error:"Nieprawidłowe żądanie"},403)}
  if(Number(request.headers.get("content-length")||0)>2400)
    return json({error:"Za duże żądanie"},413)
  try{
    const input:unknown=await request.json()
    if(!input||typeof input!=="object"||Array.isArray(input))
      return json({error:"Nieprawidłowe dane"},400)
    const {action,person,message,id,reason,reviewAction}=input as Record<string,unknown>
    if(action==="add"){
      if(typeof person!=="string"||!roster.has(person)||person===session.name||
         typeof message!=="string"||message.trim().length<5||message.length>600)
        return json({error:"Wybierz osobę i opisz konkretnie, co zrobiła (minimum 5 znaków)."},400)
      const data=await classThanksService({action,actor:session.name,person,message:message.trim()})
      return json({thank:data.thank},201)
    }
    if(action==="delete"||action==="report"){
      if(typeof id!=="string"||!idPattern.test(id))return json({error:"Błędny wpis"},400)
      if(action==="report"&&(typeof reason!=="string"||reason.length>500))
        return json({error:"Nieprawidłowe zgłoszenie"},400)
      const data=await classThanksService({action,actor:session.name,id,
        ...(action==="report"?{reason}:{}),
      })
      return json(data)
    }
    if(action==="reviewReport"){
      if(session.name!=="ks. Michał")return json({error:"Brak dostępu"},403)
      if(typeof id!=="string"||!idPattern.test(id)||!["dismiss","hide"].includes(String(reviewAction)))
        return json({error:"Błędne zgłoszenie"},400)
      const data=await classThanksService({action,actor:session.name,id,reviewAction})
      return json(data)
    }
    return json({error:"Nieprawidłowa operacja"},400)
  }catch(error){
    return json({error:error instanceof Error?error.message:"Nie udało się wykonać operacji."},statusOf(error))
  }
}
