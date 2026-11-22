import { NextRequest, NextResponse } from "next/server"
import { getLoggedInSession } from "../../../../lib/auth"
import { galleryMediaService } from "../../../../lib/gallery-media"

export const runtime="nodejs"
export const dynamic="force-dynamic"
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i
export async function GET(request:NextRequest){
  const session=await getLoggedInSession()
  if(!session || session.mode!=="full")
    return NextResponse.json({error:"Brak dostępu"},{status:401})
  const id=request.nextUrl.searchParams.get("id")
  const size=request.nextUrl.searchParams.get("size")
  if(!id || !uuid.test(id) || (size!=="large"&&size!=="thumb"))
    return NextResponse.json({error:"Nieprawidłowy adres"},{status:400})
  try{
    const file=await galleryMediaService({action:"read",id,size})
    if(typeof file.base64!=="string")throw Error("Brak obrazu")
    const bytes=Buffer.from(file.base64,"base64")
    if(bytes.length<20 || bytes.length>1200000)throw Error("Błędny obraz")
    return new NextResponse(new Uint8Array(bytes),{headers:{
      "Content-Type":"image/webp","Cache-Control":"private, max-age=300",
      "X-Content-Type-Options":"nosniff","Vary":"Cookie",
    }})
  }catch(error){
    const status=error && typeof error==="object" && "status" in error
      && error.status===404?404:503
    return NextResponse.json({error:"Nie udało się wczytać zdjęcia"},{status,headers:{"Cache-Control":"no-store"}})
  }
}
