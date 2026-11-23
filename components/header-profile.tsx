"use client"

import {useEffect,useState} from "react"
import {ProfileMenu} from "./profile-menu"

/** The header belongs to every page; only an authenticated user sees the account control. */
export function HeaderProfile(){
  const [name,setName]=useState("")
  const [loggingOut,setLoggingOut]=useState(false)

  useEffect(()=>{
    let active=true
    async function load(){
      try{
        const response=await fetch("/api/me",{cache:"no-store"})
        if(!response.ok)return
        const data=await response.json()
        if(active&&typeof data.name==="string")setName(data.name)
      }catch{/* On public pages, simply leave the account area empty. */}
    }
    void load()
    return()=>{active=false}
  },[])

  async function handleLogout(){
    setLoggingOut(true)
    try{
      await fetch("/api/logout",{method:"POST"})
      window.location.href="/login"
    }catch{setLoggingOut(false)}
  }

  if(!name)return null
  return <ProfileMenu name={name} onLogout={handleLogout} loggingOut={loggingOut}/>
}
