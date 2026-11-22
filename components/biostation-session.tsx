"use client"
import {createContext,useContext} from "react"
const BiostationSession=createContext("")
export function BiostationSessionProvider({name,children}:{name:string;children:React.ReactNode}){
  return <BiostationSession.Provider value={name}>{children}</BiostationSession.Provider>
}
export function useBiostationSession(){return useContext(BiostationSession)}
