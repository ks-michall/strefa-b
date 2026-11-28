"use client"

import Link from "next/link"
import { useEffect,useMemo,useState } from "react"
import { habits } from "../lib/bonsai-habits"
import { currentPlantingDay,daysBetween } from "../lib/bonsai-time"
import {loadSeason,type SeasonView} from "../lib/season-view"

type TreeBrief={started:string;habitIndex:number;checks?:string[]}
type BioBrief={hasTrees:boolean;active:boolean;doneToday:boolean;habit:string;action:string}

export default function HomeClient({teacherAccess}:{teacherAccess:boolean}){
  const [currentUser,setCurrentUser]=useState("")
  const [userLoaded,setUserLoaded]=useState(false)
  const [bio,setBio]=useState<BioBrief>({hasTrees:false,active:false,doneToday:false,habit:"",action:""})
  const [bioLoaded,setBioLoaded]=useState(false)
  const [world,setWorld]=useState<SeasonView|null>(null)

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
        // Start the two independent class modules without blocking the main view.
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
        const data=await loadSeason()
        if(active)setWorld(data)
      }catch{/* Wyświetl podgląd mapy bez licznika. */}
    }
    void updateWorld()
    const timer=window.setInterval(()=>void updateWorld(),60000)
    return()=>{active=false;window.clearInterval(timer)}
  },[currentUser])

  const latestEvent=world?.events.at(-1)

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
          <p>Świat zamilkł. Strefa B jest naszym jedynym znanym schronieniem.</p>
        </div>
      </header>

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
          <p>{latestEvent?
            `Ostatnie wydarzenie: „${latestEvent.title}”. Każde odkrycie może przybliżyć nas do prawdy o Wielkiej Ciszy.`:
            "Zbierajcie siły i zapasy. Odkrywanie Bezdroży rozpocznie się 2 grudnia o 9:30."}</p>
          <Link className="sb-world-home-cta" href="/bezdroza">Otwórz Bezdroża <span aria-hidden="true">↗</span></Link>
          {latestEvent&&<Link href="/bezdroza" className="sb-world-home-new">✦ Zobacz bieżący rozdział</Link>}
        </div>
        <div className="sb-world-home-hero-art" aria-hidden="true"><div className="sb-world-home-radar"><span>⌖</span></div></div>
      </section>

      <section className="sb-world-home-supplies" aria-label="Wspólny dorobek Strefy B">
        <div><strong>{world?.totals.food??"…"}</strong><span><small>ŻYWNOŚĆ</small><br/>Z upraw Biostacji</span></div>
        <div><strong>{world?.totals.morale??"…"}</strong><span><small>MORALE</small><br/>Z wpisów Biuletynu</span></div>
        <div><strong>{world?world.locations.length:"…"}</strong><span><small>ODKRYCIA</small><br/>Odkryte miejsca</span></div>
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
