"use client"

import Link from "next/link"
import {ChangeEvent,useEffect,useState} from "react"
import {AvatarFace,emojiChoices,type AvatarEntry} from "../../components/avatar-face"

async function prepareWebp(file:File):Promise<string>{
  if(!file.type.startsWith("image/")||file.size>10*1024*1024)
    throw new Error("Wybierz zdjęcie o rozmiarze nie większym niż 10 MB.")
  const objectUrl=URL.createObjectURL(file)
  try{
    const img=new Image()
    img.src=objectUrl
    await new Promise<void>((resolve,reject)=>{
      img.onload=()=>resolve()
      img.onerror=()=>reject(new Error("Nie udało się otworzyć tego zdjęcia. Spróbuj JPG lub PNG."))
    })
    const canvas=document.createElement("canvas")
    const ctx=canvas.getContext("2d")
    if(!ctx)throw Error("Nie udało się przetworzyć zdjęcia.")
    let side=256
    for(let attempt=0;attempt<9;attempt++){
      canvas.width=side;canvas.height=side
      const crop=Math.min(img.naturalWidth,img.naturalHeight)
      ctx.clearRect(0,0,side,side)
      ctx.drawImage(img,(img.naturalWidth-crop)/2,(img.naturalHeight-crop)/2,
        crop,crop,0,0,side,side)
      const quality=Math.max(.38,.82-attempt*.06)
      const result=canvas.toDataURL("image/webp",quality)
      if(!result.startsWith("data:image/webp;base64,"))
        throw new Error("Twoja przeglądarka nie obsługuje kompresji WebP.")
      const base64=result.split(",")[1]
      if(base64.length<130000)return base64
      if(attempt===4)side=192
      if(attempt===7)side=160
    }
    throw new Error("To zdjęcie jest zbyt duże po kompresji. Wybierz inne.")
  }finally{URL.revokeObjectURL(objectUrl)}
}
export default function ProfilePage(){
  const [user,setUser]=useState("")
  const [current,setCurrent]=useState<AvatarEntry|null>(null)
  const [emoji,setEmoji]=useState("🦊")
  const [mode,setMode]=useState<"emoji"|"photo">("emoji")
  const [photo,setPhoto]=useState<string|null>(null)
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState("")
  const [message,setMessage]=useState("")
  useEffect(()=>{
    let active=true
    async function init(){
      try{
        const me=await fetch("/api/me",{cache:"no-store"})
        const session=await me.json()
        if(!session.name){window.location.replace("/login");return}
        if(session.mustChangePassword){window.location.replace("/ustaw-haslo");return}
        const res=await fetch("/api/avatars",{cache:"no-store"})
        if(!res.ok)throw new Error("Nie udało się pobrać profilu.")
        const data=await res.json()
        const avatar=Array.isArray(data.avatars)?
          (data.avatars as AvatarEntry[]).find(item=>item.student_name===session.name):null
        if(active){
          setUser(session.name)
          setCurrent(avatar||null)
          if(avatar?.kind==="emoji" && avatar.emoji)setEmoji(avatar.emoji)
          setMode(avatar?.kind==="photo"?"photo":"emoji")
        }
      }catch{if(active)setError("Nie udało się pobrać ustawień profilu.")}
      finally{if(active)setLoading(false)}
    }
    void init()
    return()=>{active=false}
  },[])
  async function save(action:"setEmoji"|"setPhoto"|"clear",value?:string){
    setBusy(true);setMessage("");setError("")
    try{
      const res=await fetch("/api/avatars",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action,...(action==="setEmoji"?{emoji:value}:
          action==="setPhoto"?{base64:value}:{})}),
      })
      const data=await res.json()
      if(!res.ok)throw new Error(data.error||"Nie udało się zapisać awatara.")
      // Zapis zakończony: ekran główny sam odczyta nowy awatar.
      window.location.replace("/")
    }catch(e){setError(e instanceof Error?e.message:"Nie udało się zapisać awatara.")}
    finally{setBusy(false)}
  }
  async function handleFile(event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0]
    event.target.value=""
    if(!file)return
    setBusy(true);setError("");setMessage("")
    try{setPhoto(await prepareWebp(file));setMode("photo")}
    catch(e){setError(e instanceof Error?e.message:"Nie udało się otworzyć zdjęcia.")}
    finally{setBusy(false)}
  }
  const card:React.CSSProperties={background:"white",border:"1px solid #e4e9ef",borderRadius:24,
    padding:23,boxShadow:"0 12px 30px rgba(0,0,0,.06)"}
  return <main className="sb-app-page sb-theme-green" style={{minHeight:"100vh",background:"linear-gradient(180deg,#f8fbfa,#eff5ff)",
    padding:"26px 16px 60px",fontFamily:"Arial,sans-serif",color:"#253347"}}>
    <div style={{maxWidth:720,margin:"0 auto"}}>
      <Link href="/" style={{color:"#386e67",textDecoration:"none"}}>← Strefa B</Link>
      <h1 style={{fontSize:32,margin:"22px 0 8px"}}>Mój profil</h1>
      <p style={{color:"#607286",lineHeight:1.65,margin:"0 0 24px"}}>
        Wybierz swój awatar w Strefie B.
      </p>
      {loading?<div style={card}>Wczytywanie ustawień…</div>:<section id="awatar" style={card}>
        <div style={{display:"flex",alignItems:"center",gap:17,marginBottom:24}}>
          <AvatarFace name={user} avatar={current} size={76}/>
          <div><h2 style={{fontSize:22,margin:"0 0 4px"}}>{user}</h2>
            <span style={{color:"#607286",fontSize:14}}>Twój aktualny awatar</span></div>
        </div>
        <h3 style={{fontSize:19}}>Zmień awatar</h3>
        <div style={{display:"flex",gap:9,flexWrap:"wrap",marginBottom:20}}>
          {(["emoji","photo"] as const).map(item=><button key={item} type="button"
            onClick={()=>{setMode(item);setMessage("");setError("")}}
            style={{padding:"11px 19px",background:mode===item?"#326d4d":"#edf2f3",
              color:mode===item?"white":"#355365",border:0,borderRadius:12,fontWeight:700,cursor:"pointer"}}>
            {item==="emoji"?"🙂 Emoji":"🖼️ Moje zdjęcie"}
          </button>)}
        </div>
        {mode==="emoji"?<div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(6,minmax(0,1fr))",gap:9}}>
            {emojiChoices.map(item=><button key={item} type="button" aria-label={`Wybierz ${item}`}
              aria-pressed={emoji===item} onClick={()=>{setEmoji(item);setMessage("")}}
              style={{fontSize:27,padding:"10px 0",borderRadius:12,cursor:"pointer",
                background:emoji===item?"#d8f3df":"#f4f7f8",
                border:emoji===item?"2px solid #5aa875":"1px solid #e3e8ee"}}>{item}</button>)}
          </div>
          <button type="button" disabled={busy} onClick={()=>void save("setEmoji",emoji)}
            style={{marginTop:22,padding:"13px 20px",border:0,borderRadius:12,
              color:"white",background:"#326d4d",fontWeight:700,cursor:"pointer"}}>
            {busy?"Zapisywanie…":"Zapisz emoji"}
          </button>
        </div>:<div>
          <p style={{color:"#607286",fontSize:14,lineHeight:1.65}}>
            Wybierz zdjęcie z telefonu. Zostanie automatycznie przycięte do kwadratu,
            zmniejszone do maksymalnie 256 × 256 pikseli i zapisane bez danych EXIF.
            Awatar będzie widoczny dla zalogowanych użytkowników Strefy B.
          </p>
          <label style={{display:"inline-block",padding:"12px 16px",background:"#eef5ff",
            border:"1px solid #c3d8ea",borderRadius:12,cursor:"pointer",fontWeight:700}}>
            📱 Wybierz zdjęcie
            <input type="file" accept="image/*" onChange={event=>void handleFile(event)}
              style={{display:"block",marginTop:9,maxWidth:"100%"}}/>
          </label>
          {photo&&<div style={{marginTop:18}}>
            <p style={{fontSize:14,color:"#5b7183"}}>Podgląd wybranego zdjęcia:</p>
            <img alt="Podgląd nowego awatara" src={"data:image/webp;base64,"+photo}
              style={{width:112,height:112,borderRadius:"50%",objectFit:"cover"}}/>
          </div>}
          <div>
            <button type="button" disabled={busy||!photo} onClick={()=>void save("setPhoto",photo||"")}
              style={{marginTop:17,padding:"13px 20px",border:0,borderRadius:12,
                color:"white",background:"#326d4d",fontWeight:700,
                opacity:busy||!photo?.55:1,cursor:busy||!photo?"not-allowed":"pointer"}}>
              {busy?"Zapisywanie…":"Zapisz zdjęcie"}
            </button>
          </div>
        </div>}
        <div style={{borderTop:"1px solid #edf0f2",marginTop:25,paddingTop:19}}>
          <button type="button" disabled={busy} onClick={()=>void save("clear")}
            style={{padding:"9px 0",border:0,background:"transparent",color:"#64748b",
              textDecoration:"underline",cursor:"pointer"}}>Usuń awatar i wróć do domyślnego</button>
        </div>
        {message&&<p role="status" style={{background:"#e8f6ec",padding:13,borderRadius:12,color:"#24653e"}}>{message}</p>}
        {error&&<p role="alert" style={{background:"#fce8e8",padding:13,borderRadius:12,color:"#a32626"}}>{error}</p>}
      </section>}
    </div>
  </main>
}