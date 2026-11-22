"use client"

import { useEffect, useMemo, useState } from "react"
import { AvatarFace, type AvatarEntry } from "../../components/avatar-face"
import { useHeroesSession } from "../../components/heroes-session"
import { sortedStudents } from "../../lib/students"

type Recognition = {
  id:string;author:string;person:string;message:string;created_at:string;deleted:boolean
}
type Report = {
  id:string;thank_id:string;reporter:string;reason:string;created_at:string;reviewed_at:string|null
}
type FeedView = "recent"|"received"|"given"

const monthParts = new Intl.DateTimeFormat("pl-PL",{
  timeZone:"Europe/Warsaw",year:"numeric",month:"2-digit",
})
function monthKey(date:Date){
  const p=monthParts.formatToParts(date)
  return p.find(v=>v.type==="year")!.value+"-"+p.find(v=>v.type==="month")!.value
}
function monthLabel(date:Date){
  return new Intl.DateTimeFormat("pl-PL",{timeZone:"Europe/Warsaw",month:"long"}).format(date)
}
function formatDate(raw:string){
  return new Intl.DateTimeFormat("pl-PL",{
    timeZone:"Europe/Warsaw",day:"numeric",month:"short",year:"numeric",
  }).format(new Date(raw))
}
function canDelete(row:Recognition,name:string){
  return name==="ks. Michał" || (row.author===name &&
    Date.now()-new Date(row.created_at).getTime()<=86400000)
}
function isRecent(row:Recognition){
  return Date.now()-new Date(row.created_at).getTime()<86400000
}

export default function BohaterowiePage(){
  const currentUser=useHeroesSession()
  const isAdmin=currentUser==="ks. Michał"
  const [items,setItems]=useState<Recognition[]>([])
  const [avatars,setAvatars]=useState<Record<string,AvatarEntry>>({})
  const [loading,setLoading]=useState(true)
  const [loadError,setLoadError]=useState("")
  const [attempt,setAttempt]=useState(0)
  const [view,setView]=useState<FeedView>("recent")
  const [dialog,setDialog]=useState(false)
  const [person,setPerson]=useState("")
  const [message,setMessage]=useState("")
  const [busy,setBusy]=useState(false)
  const [formError,setFormError]=useState("")
  const [notice,setNotice]=useState("")
  const [reports,setReports]=useState<Report[]>([])
  const [showReports,setShowReports]=useState(false)

  useEffect(()=>{
    const choice=new URLSearchParams(window.location.search).get("widok")
    if(choice==="dla-mnie")setView("received")
    if(choice==="ode-mnie")setView("given")
  },[])
  useEffect(()=>{
    let active=true
    const controller=new AbortController()
    const timeout=window.setTimeout(()=>controller.abort(),8500)
    async function read(){
      setLoading(true)
      setLoadError("")
      try{
        const response=await fetch("/api/thanks",{cache:"no-store",signal:controller.signal})
        const data=await response.json()
        if(!response.ok)throw Error(data.error||"Nie udało się pobrać wyróżnień.")
        if(!active)return
        const rows=Array.isArray(data.thanks)?data.thanks as Recognition[]:[]
        setItems(rows)
        // Wyróżnienia stają się przeczytane dopiero po wejściu do Bohaterów.
        const newest=rows.filter(row=>row.person===currentUser)
          .sort((a,b)=>b.created_at.localeCompare(a.created_at))[0]
        if(newest)try{
          localStorage.setItem("sb_heroes_seen:"+currentUser,newest.created_at)
        }catch{/* Brak pamięci urządzenia nie blokuje modułu. */}
      }catch(error){
        if(active)setLoadError(controller.signal.aborted?
          "Połączenie trwa zbyt długo. Spróbuj ponownie.":
          error instanceof Error?error.message:"Nie udało się pobrać Bohaterów.")
      }finally{
        window.clearTimeout(timeout)
        if(active)setLoading(false)
      }
    }
    void read()
    return()=>{active=false;controller.abort();window.clearTimeout(timeout)}
  },[attempt,currentUser])
  useEffect(()=>{
    let active=true
    void (async()=>{
      try{
        const r=await fetch("/api/avatars",{cache:"no-store"})
        if(!r.ok)return
        const data=await r.json()
        if(!active||!Array.isArray(data.avatars))return
        const map:Record<string,AvatarEntry>={}
        for(const row of data.avatars as AvatarEntry[])map[row.student_name]=row
        setAvatars(map)
      }catch{/* Awatary emoji działają także bez połączenia. */}
    })()
    return()=>{active=false}
  },[])
  useEffect(()=>{
    if(!notice)return
    const timer=window.setTimeout(()=>setNotice(""),4000)
    return()=>window.clearTimeout(timer)
  },[notice])

  const now=new Date()
  const thisMonth=monthKey(now)
  const prevDate=new Date(Date.UTC(now.getFullYear(),now.getMonth()-1,15,12))
  const lastMonth=monthKey(prevDate)
  const thisMonthRows=useMemo(()=>items.filter(row=>monthKey(new Date(row.created_at))===thisMonth),
    [items,thisMonth])
  const previousCount=useMemo(()=>items.filter(row=>monthKey(new Date(row.created_at))===lastMonth).length,
    [items,lastMonth])
  const currentCount=thisMonthRows.length
  const aim=previousCount+1
  const toRecord=Math.max(0,aim-currentCount)
  const uniquePeople=new Set(thisMonthRows.map(item=>item.person)).size
  const ownCount=thisMonthRows.filter(item=>item.author===currentUser).length
  const receivedCount=items.filter(item=>item.person===currentUser).length
  const shown=useMemo(()=>items.filter(item=>view==="received"?item.person===currentUser:
    view==="given"?item.author===currentUser:true),[items,view,currentUser])
  const weeklyStory=useMemo(()=>{
    const recent=items.filter(item=>Date.now()-new Date(item.created_at).getTime()<90*86400000)
    if(recent.length===0)return null
    const week=Math.floor(Date.now()/604800000)
    return recent[week%recent.length]
  },[items])

  async function post(payload:Record<string,unknown>){
    const response=await fetch("/api/thanks",{
      method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),
    })
    const data=await response.json()
    if(!response.ok)throw Error(data.error||"Nie udało się zapisać zmian.")
    return data
  }
  async function add(){
    if(busy)return
    setFormError("")
    if(!person||message.trim().length<5){
      setFormError("Wybierz osobę i opisz konkretnie, co zrobiła (co najmniej 5 znaków).")
      return
    }
    setBusy(true)
    try{
      const data=await post({action:"add",person,message:message.trim()})
      if(!data.thank||typeof data.thank.id!=="string")throw Error("Nie udało się potwierdzić zapisu.")
      setItems(old=>[data.thank as Recognition,...old])
      void fetch("/api/world",{cache:"no-store"}).catch(()=>{})
      setDialog(false);setPerson("");setMessage("")
      setNotice("Dobry czyn trafił do Biuletynu. +1 morale dla Strefy B! ✳")
      setView("recent")
    }catch(error){
      setFormError(error instanceof Error?error.message:"Nie udało się zapisać wyróżnienia.")
    }finally{setBusy(false)}
  }
  async function remove(row:Recognition){
    if(!window.confirm("Usunąć to wyróżnienie?"))return
    try{
      await post({action:"delete",id:row.id})
      setItems(old=>old.filter(item=>item.id!==row.id))
      setNotice("Wyróżnienie usunięte.")
    }catch(error){
      setNotice(error instanceof Error?error.message:"Nie udało się usunąć wyróżnienia.")
    }
  }
  async function report(row:Recognition){
    const reason=window.prompt("Co jest nieodpowiednie w tym wpisie? Zgłoszenie zobaczy tylko wychowawca.","")
    if(reason===null)return
    try{
      await post({action:"report",id:row.id,reason:reason.trim()})
      setNotice("Zgłoszenie przesłane wychowawcy. Dziękujemy.")
    }catch(error){
      setNotice(error instanceof Error?error.message:"Nie udało się wysłać zgłoszenia.")
    }
  }
  async function loadReports(){
    setShowReports(v=>!v)
    if(showReports)return
    try{
      const response=await fetch("/api/thanks?reports=1",{cache:"no-store"})
      const data=await response.json()
      if(!response.ok)throw Error(data.error||"Nie udało się pobrać zgłoszeń.")
      setReports(Array.isArray(data.reports)?data.reports:[])
    }catch(error){setNotice(error instanceof Error?error.message:"Nie udało się pobrać zgłoszeń.")}
  }
  async function reviewReport(row:Report,action:"hide"|"dismiss"){
    if(action==="hide"&&!window.confirm("Ukryć zgłoszone wyróżnienie?"))return
    try{
      await post({action:"reviewReport",id:row.id,reviewAction:action})
      setReports(old=>old.filter(item=>item.id!==row.id))
      if(action==="hide")setItems(old=>old.filter(item=>item.id!==row.thank_id))
      setNotice(action==="hide"?"Wpis został ukryty.":"Zgłoszenie zamknięte.")
    }catch(error){setNotice(error instanceof Error?error.message:"Nie udało się rozpatrzyć zgłoszenia.")}
  }

  return <main className="sb-app-page sb-theme-blue sb-heroes-page">
    <div className="sb-heroes-inner">
      <header className="sb-heroes-header">
        <div>
          <p className="sb-small-label" style={{margin:"0 0 10px"}}>STREFA B / BIULETYN OCALAŁYCH</p>
          <h1>✳ Biuletyn</h1>
          <p>Doceniamy konkretną pomoc i budujemy morale Strefy B. Każde wyróżnienie to +1 morale dla naszej wspólnoty.</p>
        </div>
        <button className="sb-heroes-primary" type="button"
          onClick={()=>{setFormError("");setDialog(true)}} disabled={ownCount>=7}>
          + Zauważ czyjeś dobro
        </button>
      </header>

      <section className="sb-heroes-stats" aria-label="Wspólny wynik klasy">
        <div className="sb-heroes-stat">
          <span>W poprzednim miesiącu</span>
          <strong>{previousCount}</strong>
          <small>zauważonych dobrych czynów</small>
        </div>
        <div className="sb-heroes-stat sb-heroes-current">
          <span>W tym miesiącu</span>
          <strong>{currentCount}</strong>
          <small>zauważonych dobrych czynów</small>
        </div>
        <div className="sb-heroes-goal">
          <p className="sb-small-label">NASZ WSPÓLNY CEL</p>
          <h2>{toRecord===0?"Pobiliśmy wynik! 🎉":
            `Jeszcze ${toRecord} do nowego rekordu! 🌟`}</h2>
          <p>{`Spróbujmy razem dostrzec więcej dobra niż w ${monthLabel(prevDate)}.`}
            {" "}Nie ma podium — liczy się każdy zauważony czyn.</p>
          <div className="sb-heroes-progress" aria-label={`Postęp: ${currentCount} z ${aim} do rekordu`}>
            <span style={{width:`${Math.min(100,currentCount/aim*100)}%`}}/>
          </div>
          <small>{uniquePeople} {uniquePeople===1?"osoba została":"osób zostało"} wyróżnionych w tym miesiącu</small>
        </div>
      </section>

      {notice&&<div className="sb-heroes-notice" role="status">{notice}</div>}

      {weeklyStory&&<section className="sb-heroes-story">
        <div>
          <p className="sb-small-label">✨ DOBRA HISTORIA TYGODNIA</p>
          <p className="sb-heroes-story-text">„{weeklyStory.message}”</p>
          <span>{weeklyStory.person} <span aria-hidden="true">·</span> zauważone przez {weeklyStory.author}</span>
        </div>
        <AvatarFace name={weeklyStory.person} avatar={avatars[weeklyStory.person]} size={62}/>
      </section>}

      <div className="sb-heroes-tabs" role="group" aria-label="Filtruj dobre historie">
        {([
          {id:"recent",title:"Ostatnie"},
          {id:"received",title:"Dla mnie"},
          {id:"given",title:"Ode mnie"},
        ] as const).map(tab=><button key={tab.id} type="button"
          className={view===tab.id?"active":""} aria-pressed={view===tab.id}
          onClick={()=>setView(tab.id)}>{tab.title}{tab.id==="received"&&receivedCount>0?
          ` · ${receivedCount}`:""}</button>)}
      </div>

      {view==="received"&&<div className="sb-heroes-personal">
        <h2>Moje dobre historie 💙</h2>
        <p>Tu zbierają się chwile, w których ktoś zauważył Twoje dobre działanie. Bez punktów i porównywania z innymi.</p>
      </div>}

      {loading?<div className="sb-heroes-empty" role="status">Odbieramy raporty z Biuletynu…</div>:
        loadError?<div className="sb-heroes-empty" role="alert">
          <p>{loadError}</p>
          <button type="button" onClick={()=>setAttempt(i=>i+1)}>Spróbuj ponownie</button>
        </div>:
        shown.length===0?<div className="sb-heroes-empty">
          <span aria-hidden="true">💙</span>
          <h2>{view==="received"?"Twoja kolekcja dopiero czeka na pierwszą historię.":
            view==="given"?"Jeszcze nie zauważyłeś tu czyjegoś dobra.":"Tu pojawią się nasze dobre historie."}</h2>
          <p>Możesz zacząć od jednej konkretnej sytuacji, w której ktoś zrobił coś wartościowego.</p>
        </div>:
        <section className="sb-heroes-feed" aria-label="Historie dobrych czynów">
          {shown.map(item=><article className="sb-heroes-card" key={item.id}>
            <AvatarFace name={item.person} avatar={avatars[item.person]} size={52}/>
            <div className="sb-heroes-card-body">
              <div className="sb-heroes-card-top">
                <h2>{item.person}</h2>
                {isRecent(item)&&<span className="sb-heroes-new">Nowe</span>}
              </div>
              <p className="sb-heroes-card-message">{item.message}</p>
              <p className="sb-heroes-card-details">Zauważył(a): {item.author} · {formatDate(item.created_at)}</p>
              <div className="sb-heroes-actions">
                {canDelete(item,currentUser)&&<button type="button" onClick={()=>void remove(item)}>Usuń</button>}
                {item.author!==currentUser && !isAdmin &&
                  <button type="button" onClick={()=>void report(item)}>Zgłoś wpis</button>}
              </div>
            </div>
          </article>)}
        </section>
      }

      <div className="sb-heroes-bottom">
        <p>W tym miesiącu dostrzegłeś(-aś) dobro {ownCount} razy. Limit: 7 wyróżnień, maksymalnie 2 dla tej samej osoby.</p>
        {isAdmin&&<button type="button" onClick={()=>void loadReports()}>
          {showReports?"Ukryj zgłoszenia":"Zgłoszenia do wychowawcy"} {reports.length>0?`(${reports.length})`:""}
        </button>}
      </div>

      {isAdmin&&showReports&&<section className="sb-heroes-moderation">
        <h2>Zgłoszenia do rozpatrzenia</h2>
        {reports.length===0?<p>Brak nierozpatrzonych zgłoszeń.</p>:
          reports.map(row=><div key={row.id} className="sb-heroes-report">
            <p>Wpis: {items.find(item=>item.id===row.thank_id)?.message||"Wpis nie jest już widoczny"}</p>
            <small>Zgłosił(a) {row.reporter} · {formatDate(row.created_at)}</small>
            {row.reason&&<p>Powód: {row.reason}</p>}
            <div className="sb-heroes-actions">
              <button type="button" onClick={()=>void reviewReport(row,"dismiss")}>Zamknij zgłoszenie</button>
              <button type="button" onClick={()=>void reviewReport(row,"hide")}>Ukryj wpis</button>
            </div>
          </div>)}
      </section>}
    </div>

    {dialog&&<div className="sb-heroes-modal-backdrop" role="presentation" onMouseDown={event=>{
      if(event.target===event.currentTarget&&!busy)setDialog(false)
    }}>
      <section className="sb-heroes-modal" role="dialog" aria-modal="true" aria-labelledby="hero-add-title">
        <div className="sb-heroes-modal-title">
          <h2 id="hero-add-title">Zauważ czyjeś dobro 💙</h2>
          <button type="button" onClick={()=>setDialog(false)} disabled={busy} aria-label="Zamknij">✕</button>
        </div>
        <label htmlFor="hero-person">Kogo chcesz wyróżnić?</label>
        <select id="hero-person" value={person} onChange={event=>setPerson(event.target.value)}>
          <option value="">Wybierz osobę</option>
          {sortedStudents.filter(name=>name!==currentUser).map(name=>
            <option value={name} key={name}>{name}</option>)}
        </select>
        <label htmlFor="hero-message">Co godnego uwagi zrobiła ta osoba?</label>
        <textarea id="hero-message" value={message} onChange={event=>setMessage(event.target.value)}
          maxLength={600} rows={4}
          placeholder="np. pomoc w zadaniu, wsparcie w trudnej chwili, zaangażowanie w życie klasy"/>
        <p className="sb-heroes-tip">Napisz konkretnie, co się wydarzyło. Twoje słowa pojawią się dokładnie tak, jak je napiszesz.</p>
        {formError&&<p className="sb-heroes-error" role="alert">{formError}</p>}
        <div className="sb-heroes-modal-actions">
          <button type="button" onClick={()=>setDialog(false)} disabled={busy}>Anuluj</button>
          <button className="sb-heroes-primary" type="button" onClick={()=>void add()} disabled={busy}>
            {busy?"Zapisuję…":"Wyróżnij"}
          </button>
        </div>
      </section>
    </div>}
  </main>
}
