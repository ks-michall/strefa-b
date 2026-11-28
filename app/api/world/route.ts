import {NextResponse} from "next/server"
import {getLoggedInSession} from "../../../lib/auth"
import {seasonRequest} from "../../../lib/season-server"
import type {SeasonView} from "../../../lib/season-view"
export const runtime="nodejs"
export const dynamic="force-dynamic"
export async function GET(){
 const session=await getLoggedInSession()
 if(!session||session.mode!=="full")return NextResponse.json({error:"Brak dostępu"},{status:401})
 try{const r=await seasonRequest(session.name);if(!r.ok)throw Error();const v=await r.json() as SeasonView;return NextResponse.json({food:v.totals.food,morale:v.totals.morale,unlocked:[],serverNow:new Date().toISOString()},{headers:{"Cache-Control":"private, no-store"}})}catch{return NextResponse.json({error:"Nie udało się pobrać zasobów."},{status:503})}
}
