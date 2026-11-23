import { redirect } from "next/navigation"
import { getLoggedInSession } from "../../lib/auth"

// Defence in depth: the middleware blocks direct navigation too, but this
// server layout also refuses to render pupil-progress data for any pupil.
export default async function BusolaLayout({children}:{children:React.ReactNode}){
  const session=await getLoggedInSession()
  if(!session)redirect("/login")
  if(session.mode!=="full")redirect("/ustaw-haslo")
  if(session.name!=="ks. Michał")redirect("/")
  return children
}
