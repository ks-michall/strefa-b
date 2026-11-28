import {redirect} from "next/navigation"
import {getLoggedInSession} from "../../lib/auth"
import {WorldSessionProvider} from "../../components/world-session"
import {bezdrozaIsLocked} from "../../lib/bezdroza-launch"
import {BezdrozaCountdown} from "../../components/bezdroza-countdown"
export default async function BezdrozaLayout({children}:{children:React.ReactNode}){
  const session=await getLoggedInSession()
  if(!session||session.mode!=="full")redirect("/login")
  if(session.name!=="ks. Michał" && bezdrozaIsLocked())return <BezdrozaCountdown/>
  return <WorldSessionProvider name={session.name}>{children}</WorldSessionProvider>
}
