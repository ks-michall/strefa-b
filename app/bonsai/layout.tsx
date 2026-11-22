import {redirect} from "next/navigation"
import {getLoggedInSession} from "../../lib/auth"
import {BiostationSessionProvider} from "../../components/biostation-session"
export default async function BiostationLayout({children}:{children:React.ReactNode}){
  const session=await getLoggedInSession()
  if(!session)redirect("/login")
  if(session.mode!=="full")redirect("/ustaw-haslo")
  return <BiostationSessionProvider name={session.name}>{children}</BiostationSessionProvider>
}
