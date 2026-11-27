import {cookies} from "next/headers"
import {redirect} from "next/navigation"
import {getLoggedInSession} from "../../lib/auth"
import {FirstLoginStory} from "../../components/first-login-story"

export const dynamic="force-dynamic"

export default async function FirstLoginIntroduction(){
  const session=await getLoggedInSession()
  if(!session)redirect("/login")
  if(session.mode!=="full")redirect("/ustaw-haslo")
  const cookieStore=await cookies()
  if(cookieStore.get("sb_first_story_pending")?.value!=="1")redirect("/")
  return <FirstLoginStory/>
}
