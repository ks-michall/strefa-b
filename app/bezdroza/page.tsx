"use client"

import Link from "next/link"
import {useCallback,useEffect,useMemo,useRef,useState} from "react"
import {FrontierMap} from "../../components/frontier-map"
import {useWorldSession} from "../../components/world-session"
import {WORLD_SECTORS,WORLD_TRANSMISSIONS,WORLD_EMPTY,worldEvents,nextExpedition,
  type WorldState,type WorldEvent} from "../../lib/world-story"

const sidequests=[
  {id:"q-pompa",sector:"przepompownia",name:"Dziennik dyżurnego",
    question:"Co wydarzyło się wcześniej?",answers:["Wielka Cisza","Ręczne odłączenie B-03","Odnalezienie mapy"],
    correct:1,reveal:"O godzinie 03:16 ktoś świadomie odłączył lokalną sieć. Katastrofa nastąpiła minutę później. Odłączenie mogło być próbą ratunku."},
  {id:"q-radio",sector:"wieza",name:"Przechwycona rozmowa",
    question:"Jakiego oznaczenia użyła nieznajoma, zanim zerwała połączenie?",
    answers:["B-03","R-99","W-17"],correct:0,
    reveal:"Oznaczenie B-03 jest znane także poza Strefą B. Nieznajoma nie odrzuciła rozmowy przypadkowo — rozpoznała naszą osadę."},
  {id:"q-archiwum",sector:"archiwum",name:"Sprawa KASKADA",
    question:"Jak nazywał się system, którego awarie wywołały reakcję łańcuchową?",
    answers:["LATARNIA","KASKADA","BEZDROŻA"],correct:1,
    reveal:"Usterka węzła KASKADA przenosiła się dalej. Odcięcie B-03 mogło ocalić Strefę B, ale odizolowało inne społeczności."},
] as const

function dateLabel(value:string){
  return new Intl.DateTimeFormat("pl-PL",{
    timeZone:"Europe/Warsaw",day:"numeric",month:"short",year:"numeric",
  }).format(new Date(value))
}

export default function BezdrozaPage(){
  const name=useWorldSession()
  const [state,setState]=useState<WorldState|null>(null)
  const [failed,setFailed]=useState(false)
  const [selected,setSelected]=useState("")
  const [discovery,setDiscovery]=useState<string|null>(null)
  const [openEvent,setOpenEvent]=useState<WorldEvent|null>(null)
  const [seen,setSeen]=useState<string[]>([])
  const [completed,setCompleted]=useState<string[]>([])
  const [quizAnswers,setQuizAnswers]=useState<Record<string,number>>({})
  const discoveryRef=useRef<string|null>(null)
  const logDetails=useRef<HTMLDetailsElement>(null)

  useEffect(()=>{
    try{
      const saved=localStorage.getItem("sb-world-seen:"+name)
      const solved=localStorage.getItem("sb-world-quests:"+name)
      if(saved)setSeen(JSON.parse(saved) as string[])
      if(solved)setCompleted(JSON.parse(solved) as string[])
    }catch{/* Nie blokuje odkrywania mapy. */}
  },[name])
  const load=useCallback(async()=>{
    try{
      const response=await fetch("/api/world",{cache:"no-store"})
      const data:unknown=await response.json()
      if(!response.ok||!data||typeof data!=="object"||Array.isArray(data))
        throw Error("Nie udało się odczytać mapy.")
      const next=data as WorldState
      if(!Array.isArray(next.unlocked)||typeof next.food!=="number")
        throw Error("Nieprawidłowe dane mapy.")
      // Discoveries belong to the whole class, but each pupil can witness
      // the reveal independently on their own device and at their own pace.
      let witnessed:string[]=[]
      try{
        const saved=JSON.parse(localStorage.getItem("sb-world-revealed:"+name)||"[]")
        if(Array.isArray(saved))witnessed=saved.filter((id:unknown):id is string=>typeof id==="string")
      }catch{/* A private-storage failure never blocks the world. */}
      const unseen=next.unlocked
        .filter(item=>!witnessed.includes(item.sector))
        .sort((a,b)=>Date.parse(a.unlocked_at)-Date.parse(b.unlocked_at))
      if(unseen.length>0 && !discoveryRef.current){
        const first=WORLD_SECTORS.find(item=>item.id===unseen[0].sector)
        if(first){
          discoveryRef.current=first.id
          setDiscovery(first.id)
          setSelected(first.id)
        }
      }
      setState(next);setFailed(false)
    }catch{setFailed(true)}
  },[name])
  useEffect(()=>{
    void load()
    const timer=window.setInterval(()=>void load(),45000)
    return ()=>window.clearInterval(timer)
  },[load])
  useEffect(()=>{
    if(window.location.hash==="#dziennik")logDetails.current?.setAttribute("open","")
  },[])

  const world=state??WORLD_EMPTY
  const unlocked=useMemo(()=>new Set(world.unlocked.map(item=>item.sector)),[world])
  const events=useMemo(()=>state?worldEvents(state):[],[state])
  const availableWeekly=events.filter(e=>e.kind==="transmission")
  const unread=events.filter(e=>!seen.includes(e.id)).length
  const next=state?nextExpedition(state):null
  const place=WORLD_SECTORS.find(s=>s.id===selected)??WORLD_SECTORS[0]
  const isOpen=place.id==="baza"||unlocked.has(place.id)
  const isNext=next?.id===place.id
  const foodPercent=next?Math.min(100,Math.floor(world.food/next.food*100)):100
  const moralePercent=next?Math.min(100,Math.floor(world.morale/next.morale*100)):100
  const storyProgress=availableWeekly.length
  const discoveryPlace=WORLD_SECTORS.find(place=>place.id===discovery)

  function showEvent(event:WorldEvent){
    setOpenEvent(event)
    const nextSeen=[...new Set([...seen,event.id])]
    setSeen(nextSeen)
    try{localStorage.setItem("sb-world-seen:"+name,JSON.stringify(nextSeen))}catch{}
  }
  function closeDiscovery(readReport=false){
    if(!discovery)return
    try{
      const stored=JSON.parse(localStorage.getItem("sb-world-revealed:"+name)||"[]")
      const witnessed=Array.isArray(stored)?stored.filter((id:unknown):id is string=>typeof id==="string"):[]
      localStorage.setItem("sb-world-revealed:"+name,JSON.stringify([...new Set([...witnessed,discovery])]))
    }catch{/* A missing local store does not prevent closing. */}
    const report=events.find(event=>event.id==="sector-"+discovery)
    discoveryRef.current=null
    setDiscovery(null)
    if(readReport && report)showEvent(report)
    // Additional discoveries earned while offline appear one by one.
    void load()
  }

  function solve(id:string,choice:number){
    setQuizAnswers(prev=>({...prev,[id]:choice}))
    const quest=sidequests.find(q=>q.id===id)
    if(quest&&choice===quest.correct){
      const solved=[...new Set([...completed,id])]
      setCompleted(solved)
      try{localStorage.setItem("sb-world-quests:"+name,JSON.stringify(solved))}catch{}
    }
  }

  return <main className="sb-world sb-world-expedition">
    <div className="sb-world-container">
      <div className="sb-world-eyebrow">
        <span className="sb-world-live-dot"/> STREFA B / SYSTEM ROZPOZNANIA
        <span className="sb-world-eyebrow-right">SEZON 01 • WIELKA CISZA</span>
      </div>
      <header className="sb-frontier-header">
        <div>
          <p className="sb-world-overline">DZIAŁ OPERACYJNY // 04</p>
          <h1>Bezdroża<span className="sb-green-dot">.</span></h1>
          <p>Wspólnie zdobywamy zasoby, odkrywamy teren i szukamy prawdy o Wielkiej Ciszy.</p>
        </div>
        <div className="sb-world-season"><span>ODCINEK</span><strong>{String(Math.max(1,storyProgress)).padStart(2,"0")}/04</strong><small>Transmisje uwalniane automatycznie</small></div>
      </header>

      <section className="sb-world-resource-bar" aria-label="Wspólne zasoby Strefy B">
        <div className="sb-world-resource"><span className="sb-world-resource-icon">◈</span><div><small>ŻYWNOŚĆ</small><strong>{state?world.food:"—"}</strong><span>z potwierdzeń nawyków</span></div></div>
        <div className="sb-world-resource"><span className="sb-world-resource-icon">✳</span><div><small>MORALE</small><strong>{state?world.morale:"—"}</strong><span>z Biuletynu</span></div></div>
        <div className="sb-world-resource"><span className="sb-world-resource-icon">⌖</span><div><small>STREFA B</small><strong>{1+unlocked.size}<em> / {WORLD_SECTORS.length}</em></strong><span>odkrytych obszarów</span></div></div>
      </section>

      {failed&&<div role="alert" className="sb-world-alert">Nie udało się odświeżyć wspólnych zasobów. <button onClick={()=>void load()}>Spróbuj ponownie</button></div>}

      <div className="sb-frontier-title-row">
        <div><p className="sb-world-overline">KARTOGRAFIA / ZASIĘG ZWIADU</p><h2>Mapa Strefy B</h2></div>
        <span>{1+unlocked.size} ODKRYTYCH SEKTORÓW</span>
      </div>
      <div className="sb-frontier-stage">
        <FrontierMap selected={selected} unlocked={unlocked} onSelect={id=>setSelected(id)}
          revealing={discovery}/>
        {discoveryPlace&&<div className="sb-world-reveal" role="dialog" aria-modal="true"
          aria-labelledby="sb-reveal-title">
          <div className="sb-world-reveal-smoke" aria-hidden="true"/>
          <div className="sb-world-reveal-content">
            <span className="sb-world-reveal-signal">✦ NOWY SYGNAŁ ZE STREFY B</span>
            <span className="sb-world-reveal-icon" aria-hidden="true">⌖</span>
            <h2 id="sb-reveal-title">MGŁA USTĘPUJE</h2>
            <p className="sb-world-reveal-sector">{discoveryPlace.name}</p>
            <p>Zebrane zasoby pozwoliły zwiadowcom poszerzyć granice Strefy B. Odkryto nowy obszar i raport z wyprawy.</p>
            <div className="sb-world-reveal-actions">
              <button type="button" onClick={()=>closeDiscovery(true)}>Odczytaj raport ↗</button>
              <button type="button" onClick={()=>closeDiscovery(false)}>Później</button>
            </div>
          </div>
        </div>}
      </div>

      <section className="sb-world-below-map sb-world-below-map-lean" aria-label="Następna wyprawa i szczegóły sektora">
        {selected&&<div className="sb-world-sector-card">
          <p className="sb-world-overline">{isOpen?place.tag:"NIEZBADANY OBSZAR / BRAK DANYCH"}</p>
          <h2>{isOpen?place.name:"Nieznany sektor"}</h2>
          {isOpen?<>
            <p>{place.description}</p>
            <div className="sb-world-clue"><span>ODKRYCIE</span><p>{place.clue}</p></div>
            {place.id!=="baza"&&<button type="button" className="sb-world-outline-button"
              onClick={()=>{const ev=events.find(e=>e.id==="sector-"+place.id);if(ev)showEvent(ev)}}>
              ◈ Odczytaj raport zwiadowców
            </button>}
          </>:isNext?<>
            <p>Wyprawa zostanie wysłana automatycznie, gdy Strefa B zgromadzi wymagane zasoby. Nie trzeba niczego zatwierdzać.</p>
            <div className="sb-frontier-progress">
              <div><span>ŻYWNOŚĆ</span><strong>{world.food} / {next?.food}</strong></div>
              <div className="sb-frontier-meter"><span style={{width:foodPercent+"%"}}/></div>
              <div><span>MORALE</span><strong>{world.morale} / {next?.morale}</strong></div>
              <div className="sb-frontier-meter morale"><span style={{width:moralePercent+"%"}}/></div>
            </div>
          </>:<p>Ten teren pozostaje pod mgłą. Najpierw trzeba dotrzeć do bliższych obszarów Strefy B.</p>}
        </div>}
        <div className="sb-world-mission-card sb-world-mission-compact">
          <p className="sb-world-overline">AKTUALNA OPERACJA</p>
          <h2>{next?"Cel: następna ekspedycja":"Wszystkie sektory odkryte!"}</h2>
          <p>{next?"Zbierajcie żywność i morale. Wyprawa odblokuje się sama po osiągnięciu obu progów. Dotknij punktu na mapie, aby poznać teren.":"Możecie ponownie odczytać wszystkie zdobyte raporty."}</p>
          {next&&<div className="sb-world-mission-count sb-world-next-goal">
            <div className="sb-world-next-resource">
              <span>🌾 ŻYWNOŚĆ</span><strong>{world.food} / {next.food}</strong>
              <div className="sb-frontier-meter"><span style={{width:foodPercent+"%"}}/></div>
            </div>
            <div className="sb-world-next-resource">
              <span>✳ MORALE</span><strong>{world.morale} / {next.morale}</strong>
              <div className="sb-frontier-meter morale"><span style={{width:moralePercent+"%"}}/></div>
            </div>
          </div>}
          <div className="sb-world-mission-links">
            <Link href="/bonsai">Otwórz Biostację ↗</Link>
            <Link href="/podziekowania">Otwórz Biuletyn ↗</Link>
          </div>
        </div>
      </section>

      <section className="sb-world-log" id="dziennik">
        <div className="sb-world-log-header">
          <div><p className="sb-world-overline">CENTRUM KOMUNIKACJI / ARCHIWUM ZDARZEŃ</p>
            <h2>Dziennik odkryć</h2>
            <p>Komunikaty pojawiają się co tydzień i po odkryciu nowych sektorów. Są wspólne dla całej klasy.</p>
          </div>
          {unread>0&&<span className="sb-world-unread">✦ {unread} nieodczytanych</span>}
        </div>
        {!state?<p className="sb-world-muted">Łączenie z centralą Strefy B…</p>:events.length===0?
          <p className="sb-world-muted">Na razie brak nowych transmisji.</p>:
          <div className="sb-world-log-list">
            {events.map(event=><button type="button" key={event.id} onClick={()=>showEvent(event)}
              className={"sb-world-log-item"+(seen.includes(event.id)?"":" unread")}>
              <span className="sb-world-log-icon">{event.kind==="transmission"?"⌁":"✦"}</span>
              <span><small>{event.eyebrow} • {dateLabel(event.at)}</small><strong>{event.title}</strong></span>
              <span className="sb-world-log-arrow">{seen.includes(event.id)?"→":"NOWE ↗"}</span>
            </button>)}
          </div>
        }
      </section>

      <section className="sb-world-sidequests">
        <div><p className="sb-world-overline">OPERACJE POBOCZNE / DLA CIEKAWYCH</p><h2>Znaleziska i zagadki</h2>
          <p>Dobrowolne zagadki. Nie zmieniają wyniku klasy i nie blokują głównej historii.</p></div>
        <div className="sb-world-quest-grid">
          {sidequests.map(quest=>{
            const ready=unlocked.has(quest.sector)
            const done=completed.includes(quest.id)
            return <article key={quest.id} className={"sb-world-quest"+(!ready?" locked":"")}>
              <div className="sb-world-quest-number">{ready?"◈":"?"}</div>
              <p className="sb-world-overline">{ready?"ZNALEZIONY DOKUMENT":"NIEODKRYTY SEKTOR"}</p>
              <h3>{ready?quest.name:"Zaszyfrowany dokument"}</h3>
              {!ready?<p>Odblokuj odpowiedni sektor Bezdroży, żeby poznać zagadkę.</p>:
              <>
                <p>{quest.question}</p>
                {!done&&<div className="sb-world-quest-options">
                  {quest.answers.map((answer,i)=><button key={answer} type="button"
                    className={quizAnswers[quest.id]===i&&i!==quest.correct?"wrong":""}
                    onClick={()=>solve(quest.id,i)}>{answer}</button>)}
                </div>}
                {done&&<div className="sb-world-quest-reveal"><strong>✦ ODSZYFROWANO</strong><p>{quest.reveal}</p></div>}
                {quizAnswers[quest.id]!==undefined&&!done&&<small className="sb-world-muted">To nie ten trop. Spróbuj ponownie.</small>}
              </>}
            </article>
          })}
        </div>
      </section>
    </div>

    {openEvent&&<div className="sb-world-modal-backdrop" role="presentation" onMouseDown={e=>{
      if(e.target===e.currentTarget)setOpenEvent(null)
    }}>
      <article className="sb-world-modal" role="dialog" aria-modal="true" aria-labelledby="sb-world-event-title">
        <div className="sb-world-modal-top">
          <p className="sb-world-overline">{openEvent.eyebrow}</p>
          <button type="button" onClick={()=>setOpenEvent(null)} aria-label="Zamknij transmisję">✕</button>
        </div>
        <div className="sb-world-signal-icon">⌁</div>
        <h2 id="sb-world-event-title">{openEvent.title}</h2>
        <p className="sb-world-modal-date">{dateLabel(openEvent.at)} • ARCHIWUM STREFY B</p>
        <div className="sb-world-transcript">
          {openEvent.body.map((paragraph,i)=><p key={i} className={paragraph.startsWith("[")?"signal-lost":""}>{paragraph}</p>)}
        </div>
        <button type="button" className="sb-world-modal-close" onClick={()=>setOpenEvent(null)}>Zamknij raport ↗</button>
      </article>
    </div>}
  </main>
}
