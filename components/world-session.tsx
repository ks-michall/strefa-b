"use client"
import {createContext,useContext} from "react"
const WorldSession=createContext("")
export function WorldSessionProvider({name,children}:{name:string;children:React.ReactNode}){
  return <WorldSession.Provider value={name}>{children}</WorldSession.Provider>
}
export function useWorldSession(){return useContext(WorldSession)}
