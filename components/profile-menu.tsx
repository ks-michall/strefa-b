"use client"

import Link from "next/link"
import {useEffect,useState} from "react"
import {AvatarFace,type AvatarEntry} from "./avatar-face"

export function ProfileMenu({name,onLogout,loggingOut}:{
  name:string
  onLogout:()=>void
  loggingOut:boolean
}){
  const [open,setOpen]=useState(false)
  const [avatar,setAvatar]=useState<AvatarEntry|null>(null)
  useEffect(()=>{
    let active=true
    async function fetchAvatar(){
      try{
        const response=await fetch("/api/avatars",{cache:"no-store"})
        if(!response.ok)return
        const data=await response.json()
        const entry=Array.isArray(data.avatars)?
          data.avatars.find((item:AvatarEntry)=>item.student_name===name):null
        if(active)setAvatar(entry||null)
      }catch{/* fallback emoji remains visible */}
    }
    void fetchAvatar()
    return()=>{active=false}
  },[name])
  return <div style={{position:"relative",zIndex:30}}>
    <button type="button" aria-expanded={open} aria-haspopup="menu"
      onClick={()=>setOpen(prev=>!prev)}
      style={{
        display:"flex",gap:9,alignItems:"center",padding:"5px 11px 5px 5px",
        border:"1px solid #e2e8f0",background:"white",borderRadius:999,
        boxShadow:"0 8px 20px rgba(0,0,0,.06)",cursor:"pointer",
        fontWeight:700,color:"#374151",fontSize:15,
      }}>
      <AvatarFace name={name} avatar={avatar} size={37}/>
      <span>Witaj {name}</span>
      <span style={{color:"#64748b",fontSize:12}}>{open?"▲":"▼"}</span>
    </button>
    {open && <>
      <button type="button" aria-label="Zamknij menu" onClick={()=>setOpen(false)}
        style={{position:"fixed",inset:0,background:"transparent",border:0,cursor:"default",zIndex:29}}/>
      <div role="menu" style={{
        position:"absolute",right:0,top:"calc(100% + 9px)",zIndex:30,
        minWidth:215,background:"white",border:"1px solid #e2e8f0",borderRadius:17,
        boxShadow:"0 14px 38px rgba(15,23,42,.16)",padding:8,
      }}>
        <Link role="menuitem" href="/profil" onClick={()=>setOpen(false)}
          style={{display:"block",padding:12,color:"#253a55",textDecoration:"none",fontWeight:700}}>
          👤 Mój profil
        </Link>
        <Link role="menuitem" href="/profil#awatar" onClick={()=>setOpen(false)}
          style={{display:"block",padding:12,color:"#253a55",textDecoration:"none"}}>
          🖼️ Zmień awatar
        </Link>
        <div style={{height:1,background:"#e2e8f0",margin:"5px 0"}}/>
        <button role="menuitem" type="button" disabled={loggingOut} onClick={onLogout}
          style={{width:"100%",border:0,background:"white",textAlign:"left",padding:12,
            color:"#374151",cursor:"pointer",fontSize:15}}>
          {loggingOut?"Wylogowywanie…":"🚪 Wyloguj się"}
        </button>
      </div>
    </>}
  </div>
}
