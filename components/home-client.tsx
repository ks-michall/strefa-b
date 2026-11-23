"use client"

import Link from "next/link"
import { useEffect,useMemo,useState } from "react"
import { ProfileMenu } from "../components/profile-menu"
import { BiostationPlot } from "../components/biostation-plot"
import { habits } from "../lib/bonsai-habits"
import { currentPlantingDay,daysBetween } from "../lib/bonsai-time"
import { WORLD_EMPTY,worldEvents,nextExpedition,type WorldState } from "../lib/world-story"

type TreeBrief={started:string;habitIndex:number;checks?:string[]}
type BioBrief={count:number;hasTrees:boolean;habit:string;action:string}

export default function HomeClient({teacherAccess}:{teacherAccess:boolean}){
  const [currentUser,setCurrentUser]=useState("")
  const [userLoaded,setUserLoaded]=useState(false)
  const [loggingOut,setLoggingOut]=useState(false)
  const [newRecognition,setNewRecognition]=useState(false)
  const [bio,setBio]=useState<BioBrief>({count:0,hasTrees:false,habit:"",action:""})
  const [world,setWorld]=useState<WorldState|null>(null)
  const [worldUnread,setWorldUnread]=useState(0)

  useEffect(()=>{
    let active=true
    async function load(){
      try{
        const response=await fetch("/api/me",{cache:"no-store"})
        const me=await response.json()
        if(!active)return
        if(me.mustChangePassword){window.location.replace("/ustaw-haslo");return}
        if(typeof me.name!=="string"||!me.name){setUserLoaded(true);return}
        setCurrentUser(me.name)
        setUserLoaded(true)
        // Start the two independent class modules without blocking the welcome view.
        void (async()=>{
          try{
            const r=await fetch("/api/bonsai",{cache:"no-store"})
            if(!r.ok)return
            const data=await r.json()
            if(!active||!Array.isArray(data.trees))return
            const trees=(data.trees as TreeBrief[])
              .filter(t=>typeof t.started==="string"&&typeof t.habitIndex==="number")
              .sort((a,b)=>b.started.localeCompare(a.started))
            const today=currentPlantingDay(new Date())
            const current=trees.find(t=>daysBetween(t.started,today)>=0&&daysBetween(t.started,today)<28)
            const latest=current??trees[0]
            if(latest){
              const habit=habits[latest.habitIndex]
              setBio({count:Array.isArray(latest.checks)?latest.checks.length:0,hasTrees:true,
                habit:habit?.title||"Twoja uprawa",action:habit?.action||""})
            }
          }catch{/* Nie blokujemy strony głównej. */}
        })()
      }catch{if(active)setUserLoaded(true)}
    }
    void load()
    return()=>{active=false}
  },[])

  useEffect(()=>{
    if(!currentUser)return
    let active=true
    async function updateWorld(){
      try{
        const r=await fetch("/api/world",{cache:"no-store"})
        if(!r.ok)return
        const data=await r.json() as WorldState
        if(!active||!Array.isArray(data.unlocked))return
        setWorld(data)
        const events=worldEvents(data)
        let seen:string[]=[]
        try{seen=JSON.parse(localStorage.getItem("sb-world-seen:"+currentUser)||"[]")}catch{}
        if(active)setWorldUnread(events.filter(e=>!seen.includes(e.id)).length)
      }catch{/* Wyświetl podgląd mapy bez licznika. */}
    }
    void updateWorld()
    const timer=window.setInterval(()=>void updateWorld(),60000)
    return()=>{active=false;window.clearInterval(timer)}
  },[currentUser])

  useEffect(()=>{
    if(!currentUser)return
    let active=true
    async function checkRecognition(){
      try{
        const response=await fetch("/api/thanks?summary=1",{cache:"no-store"})
        if(!response.ok)return
        const data=await response.json()
        if(!active||!data.latestReceived?.created_at)return
        const latest=Date.parse(data.latestReceived.created_at)
        let seen=0
        try{const stored=localStorage.getItem("sb_heroes_seen:"+currentUser);seen=stored?Date.parse(stored):0}catch{}
        if(Number.isFinite(latest)&&latest>Date.now()-30*86400000&&latest>seen)
          setNewRecognition(true)
      }catch{/* Odczyt powiadomień nie blokuje strony. */}
    }
    void checkRecognition()
    return()=>{active=false}
  },[currentUser])

  async function handleLogout(){
    setLoggingOut(true)
    try{
      await fetch("/api/logout",{method:"POST"})
      window.location.href="/login"
    }catch{setLoggingOut(false)}
  }

  const available=world?worldEvents(world):[]
  const latestTransmission=available.find(event=>event.kind==="transmission")
  const expedition=world?nextExpedition(world):null

  if(!userLoaded)return <main className="sb-world-home"><div className="sb-world-container" style={{paddingTop:40}}>Łączymy się ze Strefą B…</div></main>
  if(!currentUser)return <main className="sb-world-home"><div className="sb-world-container" style={{paddingTop:40,textAlign:"center"}}>
    <h1 style={{fontSize:40,letterSpacing:"-1.5px"}}>Strefa B czeka na sygnał.</h1>
    <p style={{color:"#b2c6b8"}}>Zaloguj się, żeby wrócić do swojej osady.</p>
    <Link className="sb-world-home-cta" href="/login">Przejdź do logowania ↗</Link>
  </div></main>

  return <main className="sb-world-home">
    <div className="sb-world-container">
      <div className="sb-world-eyebrow">
        <span className="sb-world-live-dot"/> STREFA B / CENTRUM OPERACYJNE
        <span className="sb-world-eyebrow-right">SEZON 01 • WIELKA CISZA</span>
      </div>
      <header className="sb-world-home-top">
        <div>
          <p className="sb-world-overline">ŁĄCZNOŚĆ NAWIĄZANA</p>
          <h1>Witaj, {currentUser}<span className="sb-green-dot">.</span></h1>
          <p>Strefa B trwa. Jej przyszłość zależy od naszej codziennej pracy.</p>
        </div>
        <ProfileMenu name={currentUser} onLogout={handleLogout} loggingOut={loggingOut}/>
      </header>

      <section className="sb-world-home-hero" aria-labelledby="sb-frontier-home-title">
        <div>
          <p className="sb-world-overline">BEZDROŻA // ODKRYWANIE NIEZNANEGO</p>
          <h2 id="sb-frontier-home-title">Poza granicami<br/>Strefy B.</h2>
          <p>{latestTransmission?
            `Ostatnia transmisja: „${latestTransmission.title}”. Każde odkrycie może przybliżyć nas do prawdy o Wielkiej Ciszy.`:
            "Z radiostacji dociera sygnał. Odkrywaj otoczenie i poszerzaj Strefę B razem z klasą."}</p>
          <Link className="sb-world-home-cta" href="/bezdroza">Otwórz mapę Bezdroży <span aria-hidden="true">↗</span></Link>
          {worldUnread>0&&<Link href="/bezdroza#dziennik" className="sb-world-home-new">
            ✦ {worldUnread} {worldUnread===1?"nowy komunikat":"nowe komunikaty"} do odczytania
          </Link>}
        </div>
        <div className="sb-world-home-hero-art" aria-hidden="true"><div className="sb-world-home-radar"><span>⌖</span></div></div>
      </section>

      <section className="sb-world-home-supplies" aria-label="Wspólny dorobek Strefy B">
        <div><strong>{world?.food??"—"}</strong><span><small>ŻYWNOŚĆ</small><br/>Z upraw Biostacji</span></div>
        <div><strong>{world?.morale??"—"}</strong><span><small>MORALE</small><br/>Z wpisów Biuletynu</span></div>
        <div><strong>{world?world.unlocked.length+1:"—"}</strong><span><small>ODKRYCIA</small><br/>{expedition?"Następny sektor czeka":"Strefa B poszerzona"}</span></div>
      </section>

      <p className="sb-world-overline" style={{margin:"29px 0 12px"}}>CZTERY FILARY STREFY B</p>
      <section className="sb-world-module-grid" aria-label="Moduły Strefy B">
        <Link href="/bonsai" className="sb-world-module sb-world-module-bio">
          <div className="sb-world-module-top"><span className="sb-world-module-num">01 / WYTRWAŁOŚĆ</span><span className="sb-world-module-symbol">✺</span></div>
          <BiostationPlot count={bio.count} compact/>
          <div><h2>Biostacja</h2><p>{bio.hasTrees?`Aktywna uprawa: ${bio.habit}. ${bio.action}`:
            "Zbuduj pierwszy nawyk. Każdy potwierdzony dzień dostarcza żywność całej Strefie B."}</p></div>
        </Link>
        <Link href={newRecognition?"/podziekowania?widok=dla-mnie":"/podziekowania"}
          className="sb-world-module sb-world-module-bulletin">
          <div className="sb-world-module-top"><span className="sb-world-module-num">02 / WSPÓLNOTA</span><span className="sb-world-module-symbol">✳</span></div>
          <div><h2>Biuletyn</h2><p>{newRecognition?"Ktoś zauważył Twoje dobro! Otwórz nowy wpis.":
            "Zobacz, kto pomógł innym. Każde wyróżnienie wzmacnia morale społeczności."}</p></div>
        </Link>
        <Link href="/galeria" className="sb-world-module sb-world-module-archive">
          <div className="sb-world-module-top"><span className="sb-world-module-num">03 / PAMIĘĆ</span><span className="sb-world-module-symbol">▤</span></div>
          <div><h2>Baza Archiwalna</h2><p>Fotografie i zapiski ze wspólnego życia. Dowody, że Strefa B to ludzie, a nie tylko mury.</p></div>
        </Link>
        <Link href="/bezdroza" className="sb-world-module sb-world-module-frontier">
          <div className="sb-world-module-top"><span className="sb-world-module-num">04 / EKSPEDYCJE</span><span className="sb-world-module-symbol">⌖</span></div>
          <div><h2>Bezdroża</h2><p>Mapa zakrytego świata, zasoby całej klasy, transmisje i odkrycia.</p></div>
        </Link>
      </section>
      {teacherAccess && currentUser==="ks. Michał"&&<Link href="/busola" className="sb-teacher-link"
        style={{background:"#223c3c",borderColor:"#446657",color:"#e3f2db",marginTop:20}}>
        <span className="sb-teacher-link-icon" aria-hidden="true">🧭</span>
        <span style={{flex:1}}><strong>Busola</strong><small style={{color:"#b3cdbc"}}>Twoje narzędzia wychowawcy</small></span>
        <span aria-hidden="true">↗</span>
      </Link>}
      <p className="sb-world-home-foot">STREFA B / JEDNA SPOŁECZNOŚĆ • WSPÓLNA PRZYSZŁOŚĆ</p>
    </div>
  </main>
}
