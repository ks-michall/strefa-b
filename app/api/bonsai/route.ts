import { NextRequest, NextResponse } from "next/server"
import { getLoggedInSession } from "../../../lib/auth"
import { bonsaiRequest } from "../../../lib/bonsai-store"
import { students, type StudentName } from "../../../lib/students"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function noStore(data: unknown, status=200) {
  return NextResponse.json(data, {status,headers:{"Cache-Control":"private, no-store"}})
}

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin")
  if (!origin) return false
  try {
    const url = new URL(origin)
    return url.protocol === request.nextUrl.protocol && url.host === request.nextUrl.host
  } catch { return false }
}

export async function GET(request: NextRequest) {
  const session = await getLoggedInSession()
  if (!session || session.mode !== "full") return noStore({error:"Brak dostępu."},401)
  if(request.nextUrl.searchParams.get("summary")==="1"){
    if(session.name!=="ks. Michał")return noStore({error:"Brak dostępu."},403)
    try{
      const result=await bonsaiRequest("stats",session.name)
      return noStore({stats:result.stats??null})
    }catch{return noStore({error:"Nie udało się pobrać statystyk klasy."},503)}
  }
  const requested = request.nextUrl.searchParams.get("student")
  if (requested && (!students.some(student => student === requested) ||
      (requested !== session.name && session.name !== "ks. Michał"))) {
    return noStore({error:"Brak dostępu do danych tego ucznia."},403)
  }
  const student = (requested || session.name) as StudentName
  try {
    const result = await bonsaiRequest("read",student)
    return noStore({trees:result.trees || []})
  } catch {
    return noStore({error:"Nie udało się pobrać drzewek. Spróbuj ponownie."},503)
  }
}

export async function POST(request: NextRequest) {
  const session = await getLoggedInSession()
  if (!session || session.mode !== "full") return noStore({error:"Brak dostępu."},401)
  if (!sameOrigin(request)) return noStore({error:"Nieprawidłowe żądanie."},403)
  if (Number(request.headers.get("content-length") || "0") > 36000) {
    return noStore({error:"Przesłano zbyt dużo danych."},413)
  }
  try {
    const body: unknown = await request.json()
    if (!body || typeof body !== "object" || Array.isArray(body)) return noStore({error:"Nieprawidłowe dane."},400)
    const input = body as Record<string,unknown>
    if (input.action !== "plant" && input.action !== "check" && input.action !== "import") {
      return noStore({error:"Nieprawidłowa operacja."},400)
    }
    let payload: Record<string,unknown>
    if (input.action === "plant") payload = {habitIndex:input.habitIndex,cue:input.cue}
    else if (input.action === "check") payload = {treeId:input.treeId}
    else {
      if (!Array.isArray(input.trees) || input.trees.length > 50 ||
          JSON.stringify(input.trees).length > 32000) return noStore({error:"Zbyt duży import."},413)
      payload = {trees:input.trees}
    }
    const result = await bonsaiRequest(input.action,session.name,payload)
    return noStore(result,201)
  } catch (error) {
    const status = error && typeof error === "object" && "status" in error &&
      typeof error.status === "number" ? error.status : 503
    const message = error instanceof Error ? error.message : "Operacja się nie udała."
    return noStore({error:message},status)
  }
}
