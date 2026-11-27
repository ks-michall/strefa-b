import {cookies} from "next/headers"
import {NextRequest,NextResponse} from "next/server"
import {getLoggedInSession} from "../../../lib/auth"

export async function POST(request:NextRequest){
  const origin=request.headers.get("origin")
  if(!origin)return NextResponse.json({error:"Nieprawidłowe żądanie."},{status:403})
  try{
    const url=new URL(origin)
    if(url.host!==request.nextUrl.host||url.protocol!==request.nextUrl.protocol)
      return NextResponse.json({error:"Nieprawidłowe żądanie."},{status:403})
  }catch{return NextResponse.json({error:"Nieprawidłowe żądanie."},{status:403})}
  const session=await getLoggedInSession()
  if(!session||session.mode!=="full")
    return NextResponse.json({error:"Brak dostępu."},{status:403})
  const cookieStore=await cookies()
  cookieStore.delete("sb_first_story_pending")
  return NextResponse.json({success:true},{headers:{"Cache-Control":"no-store"}})
}
