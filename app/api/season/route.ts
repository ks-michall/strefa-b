import {NextRequest,NextResponse} from "next/server"
import {getLoggedInSession} from "../../../lib/auth"
import {seasonRequest} from "../../../lib/season-server"

export const runtime="nodejs"
export const dynamic="force-dynamic"
const headers={"Cache-Control":"private, no-store"}
function error(message:string,status:number){return NextResponse.json({error:message},{status,headers})}

async function serve(action:Record<string,unknown>){
  const session=await getLoggedInSession()
  if(!session||session.mode!=="full")return error("Brak dostępu.",401)
  if(action.action==="threshold"&&session.name!=="ks. Michał")return error("Brak dostępu.",403)
  try{
    const response=await seasonRequest(session.name,action)
    const data=await response.json()
    return NextResponse.json(data,{status:response.status,headers})
  }catch{return error("Nie można nawiązać łączności ze Strefą B.",503)}
}
export async function GET(){return serve({action:"view"})}
export async function POST(request:NextRequest){
  const origin=request.headers.get("origin")
  if(!origin||origin!==request.nextUrl.origin)return error("Brak dostępu.",403)
  let data:Record<string,unknown>
  try{const b=await request.json();if(!b||typeof b!=="object"||Array.isArray(b))throw Error();data=b}catch{return error("Nieprawidłowe dane.",400)}
  const action=data.action
  if(action==="vote"&&typeof data.stage==="string"&&typeof data.option==="string")
    return serve({action,stage:data.stage,option:data.option})
  if(action==="personal"&&Number.isInteger(data.round)&&typeof data.option==="string")
    return serve({action,round:data.round,option:data.option})
  if(action==="share"&&typeof data.clue==="string")return serve({action,clue:data.clue})
  if(action==="threshold"&&typeof data.stage==="string"&&Number.isSafeInteger(data.food)&&Number.isSafeInteger(data.morale))
    return serve({action,stage:data.stage,food:data.food,morale:data.morale})
  return error("Nieprawidłowa akcja.",400)
}
