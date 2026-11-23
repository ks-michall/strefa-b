import { redirect } from "next/navigation"
import { getLoggedInSession } from "../lib/auth"
import HomeClient from "../components/home-client"

// The server decides whether Busola exists in the visible home UI.
// Students never receive a teacher navigation card, irrespective of client state.
export default async function HomePage(){
  const session=await getLoggedInSession()
  if(!session)redirect("/login")
  if(session.mode!=="full")redirect("/ustaw-haslo")
  return <HomeClient teacherAccess={session.name==="ks. Michał"}/>
}
