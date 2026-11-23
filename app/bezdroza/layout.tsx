import {redirect} from "next/navigation"
import {getLoggedInSession} from "../../lib/auth"
import {WorldSessionProvider} from "../../components/world-session"
export default async function BezdrozaLayout({children}:{children:React.ReactNode}){
  const session=await getLoggedInSession()
  if(!session||session.mode!=="full")redirect("/login")
  return <WorldSessionProvider name={session.name}>{children}</WorldSessionProvider>
}
