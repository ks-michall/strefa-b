import { redirect } from "next/navigation"
import { getLoggedInSession } from "../../lib/auth"
import { HeroesSessionProvider } from "../../components/heroes-session"

export default async function HeroesLayout({children}:{children:React.ReactNode}){
  const session=await getLoggedInSession()
  if(!session || session.mode!=="full") redirect("/login")
  return <HeroesSessionProvider name={session.name}>{children}</HeroesSessionProvider>
}
