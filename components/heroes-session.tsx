"use client"

import { createContext, useContext } from "react"

const HeroesSession = createContext<string>("")

export function HeroesSessionProvider({
  name, children,
}: {name:string;children:React.ReactNode}) {
  return <HeroesSession.Provider value={name}>{children}</HeroesSession.Provider>
}

export function useHeroesSession() {
  return useContext(HeroesSession)
}
