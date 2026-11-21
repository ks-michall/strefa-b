"use client"
import {useState} from "react"

export type AvatarEntry={
  student_name:string
  kind:"emoji"|"photo"
  emoji:string|null
  updated_at:string
}
export const emojiChoices=["🦊","🐱","🐼","🦁","🐸","🐧","🦋","🐢","🦄","🐻","🌻","⭐","🚀","⚡","🍀","🎸","🐶","🐨","🐯","🐰","🌈","🌙","🎨","🏀"]
export function AvatarFace({name,avatar,size=44}:{name:string;avatar?:AvatarEntry|null;size?:number}){
  const [failed,setFailed]=useState(false)
  const emoji=avatar?.kind==="emoji"?avatar.emoji:null
  const image=avatar?.kind==="photo"&&!failed?
    "/api/avatars?photo="+encodeURIComponent(name)+"&v="+encodeURIComponent(avatar.updated_at):null
  const shared:React.CSSProperties={
    width:size,height:size,minWidth:size,borderRadius:"50%",objectFit:"cover",
    border:"2px solid #fff",boxShadow:"0 3px 11px rgba(0,0,0,.09)",
  }
  if(image)return <img key={image} src={image} alt={`Awatar: ${name}`}
    onError={()=>setFailed(true)} style={shared}/>
  return <span role="img" aria-label={`Awatar: ${name}`}
    style={{...shared,display:"inline-flex",alignItems:"center",justifyContent:"center",
      background:"linear-gradient(135deg,#ecf9ef,#e6edff)",
      fontSize:size*.53,overflow:"hidden",fontWeight:700,color:"#3b5371"}}>
      {emoji||"🙂"}
    </span>
}
