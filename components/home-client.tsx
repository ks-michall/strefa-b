"use client"

import Link from "next/link"
import { useEffect,useMemo,useState } from "react"
import { habits } from "../lib/bonsai-habits"
import { currentPlantingDay,daysBetween } from "../lib/bonsai-time"
import { WORLD_EMPTY,worldEvents,nextExpedition,type WorldState } from "../lib/world-story"

type TreeBrief={started:string;habitIndex:number;checks?:string[]}
type BioBrief={hasTrees:boolean;active:boolean;doneToday:boolean;habit:string;action:string}

export default function HomeClient({teacherAccess}:{teacherAccess:boolean}){
  const [currentUser,setCurrentUser]=useState("")
  const [userLoaded,setUserLoaded]=useState(false)
  const [bio,setBio]=useState<BioBrief>({hasTrees:false,active:false,doneToday:false,habit:"",action:""})
  const [bioLoaded,setBioLoaded]=useState(false)
  const [showWelcome,setShowWelcome]=useState(false)
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
              const checked=Array.isArray(latest.checks)?latest.checks:[]
              setBio({hasTrees:true,active:!!current,
                doneToday:checked.includes(today),habit:habit?.title||"Twoja uprawa",action:habit?.action||""})
            }else if(me.name!=="ks. Michał"){
              try{setShowWelcome(localStorage.getItem("sb-intro-seen:"+me.name)!=="1")}catch{}
            }
          }catch{/* Nie blokujemy strony głównej. */}
          finally{if(active)setBioLoaded(true)}
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

  function dismissWelcome(){
    setShowWelcome(false)
    try{localStorage.setItem("sb-intro-seen:"+currentUser,"1")}catch{}
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
      <header className="sb-world-home-top sb-module-heading">
        <div>
          <h1 className="sb-bio-title">Centrum operacyjne<span className="sb-green-dot">.</span></h1>
          <p>Strefa B trwa. Jej przyszłość zależy od naszej codziennej pracy.</p>
        </div>
      </header>

      {showWelcome&&<section className="sb-world-welcome" aria-label="Szybki start w Strefie B">
        <p className="sb-world-overline">PIERWSZA MISJA / 30 SEKUND</p>
        <h2>Witaj w Strefie B. Zaczynamy?</h2>
        <p>① Wybierz nawyk w Biostacji. ② Dostrzegaj dobro w Biuletynie.
          ③ Wspólnie zbierajcie zasoby i odkrywajcie Bezdroża.</p>
        <div className="sb-world-welcome-actions">
          <Link href="/bonsai?start=1" onClick={dismissWelcome}>Wybierz pierwszy nawyk ↗</Link>
          <button type="button" onClick={dismissWelcome}>Pomiń wprowadzenie</button>
        </div>
      </section>}
      {bioLoaded&&<section className="sb-world-daily" aria-label="Twoja misja na dziś">
        <div>
          <p className="sb-world-overline">TWÓJ DZISIEJSZY KROK</p>
          <h2>{bio.active?bio.habit:bio.hasTrees?"Nowa uprawa czeka":"Rozpocznij pierwszą uprawę"}</h2>
          <p>{bio.active?bio.action:
            bio.hasTrees?"Twoje dotychczasowe uprawy już się zakończyły. Możesz podjąć kolejne wyzwanie.":
            "Wybierz jeden niewielki nawyk, który chcesz rozwijać przez 28 dni."}</p>
        </div>
        <div className="sb-world-daily-action">
          {bio.active&&<span className={bio.doneToday?"sb-world-daily-status done":"sb-world-daily-status"}>
            {bio.doneToday?"✓ Potwierdzono dzisiaj":"◉ Do potwierdzenia"}
          </span>}
          <Link href={bio.active?"/bonsai":"/bonsai?start=1"}>
            {bio.active?(bio.doneToday?"Zobacz uprawę ↗":"Potwierdź nawyk ↗"):"Wybierz nawyk ↗"}
          </Link>
        </div>
      </section>}

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
        <div><strong>{world?.food??"…"}</strong><span><small>ŻYWNOŚĆ</small><br/>Z upraw Biostacji</span></div>
        <div><strong>{world?.morale??"…"}</strong><span><small>MORALE</small><br/>Z wpisów Biuletynu</span></div>
        <div><strong>{world?world.unlocked.length+1:"…"}</strong><span><small>ODKRYCIA</small><br/>{expedition?"Następny sektor czeka":"Strefa B poszerzona"}</span></div>
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
