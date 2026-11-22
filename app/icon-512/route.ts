import { makeStrefaBIcon } from "../../lib/pwa-icon"

export const runtime = "nodejs"

export function GET(){
  return makeStrefaBIcon(512)
}
