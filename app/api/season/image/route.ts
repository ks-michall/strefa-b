import {NextRequest,NextResponse} from "next/server"
import {getLoggedInSession} from "../../../../lib/auth"
import {seasonRequest} from "../../../../lib/season-server"

export const runtime="nodejs"
export const dynamic="force-dynamic"
export async function GET(request:NextRequest){
 const session=await getLoggedInSession()
 if(!session||session.mode!=="full")return NextResponse.json({error:"Brak dostępu"},{status:401,headers:{"Cache-Control":"no-store"}})
 const asset=request.nextUrl.searchParams.get("asset")??""
 if(!/^[a-z0-9-]{1,60}$/.test(asset))return NextResponse.json({error:"Nieprawidłowa grafika"},{status:400})
 try{
  const response=await seasonRequest(session.name,{action:"image",asset})
  if(!response.ok||!response.headers.get("content-type")?.startsWith("image/webp"))return NextResponse.json({error:"Grafika niedostępna"},{status:response.status===403?403:404})
  return new NextResponse(await response.arrayBuffer(),{headers:{"Content-Type":"image/webp","Cache-Control":"private, max-age=3600","X-Content-Type-Options":"nosniff"}})
 }catch{return NextResponse.json({error:"Nie udało się pobrać grafiki"},{status:503})}
}
