import "server-only"
import type { StudentName } from "./students"

export type BonsaiTree = {
  id: string
  habitIndex: number
  cue: string
  started: string
  checks: string[]
}

export async function bonsaiRequest(
  action: "read" | "plant" | "check" | "import" | "readReflection" | "saveReflection",
  name: StudentName,
  payload: Record<string, unknown> = {}
): Promise<{trees?: BonsaiTree[]; ok?: boolean; reflection?: {helped:string;nextTime:string}|null}> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret = process.env.STREFA_B_PASSWORD_API_SECRET
  if (!url || !secret) throw new Error("Bonsai storage is not configured")
  const response = await fetch(url.replace(/\/$/,"") + "/functions/v1/bonsai-service", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-strefa-password-secret": secret,
    },
    body: JSON.stringify({action,name,...payload}),
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  })
  const data: unknown = await response.json().catch(()=>null)
  if (!response.ok) {
    const message = data && typeof data === "object" && "error" in data &&
      typeof data.error === "string" ? data.error : "Nie udało się zapisać postępów."
    const error = new Error(message) as Error & {status?:number}
    error.status = response.status >= 400 && response.status < 500 ? response.status : 503
    throw error
  }
  if (!data || typeof data !== "object") throw new Error("Invalid Bonsai response")
  return data as {trees?: BonsaiTree[]; ok?: boolean; reflection?: {helped:string;nextTime:string}|null}
}
