"use client"
import {useEffect,useRef,useState} from "react"
import {loadSeason,type SeasonView,type SeasonEvent,type SeasonLocation} from "../../lib/season-view"

const time=(n:number)=>new Intl.DateTimeFormat("pl-PL",{timeZone:"Europe/Warsaw",day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"}).format(new Date(n))
function SceneImage({id,alt}:{id:string;alt:string}){
 const [failed,setFailed]=useState(false)
 if(failed)return null
 return <img className="sb-season-image" src={"/api/season/image?asset="+encodeURIComponent(id)} alt={alt} loading="lazy" onError={()=>setFailed(true)}/>
}
function MapBoard({locations}:{locations:SeasonLocation[]}){
 const [selected,setSelected]=useState("bunker")
 const current=locations.find(l=>l.id===selected)
 const scale=68
 return <section className="sb-season-map">
 <p className="sb-season-kicker">KARTOGRAFIA / TYLKO ZBADANY TEREN</p>
 <h2>Nasza mapa</h2>
 <svg viewBox="0 0 640 460" width="100%" role="img" aria-label="Schemat odkrytych miejsc">
 <defs><radialGradient id="sbmap"><stop offset="0" stopColor="#28443a"/><stop offset="1" stopColor="#101a22"/></radialGradient><pattern id="sbgrid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" stroke="#718a80" strokeOpacity=".15" fill="none"/></pattern></defs>
 <rect width="640" height="460" rx="14" fill="url(#sbmap)"/><rect width="640" height="460" rx="14" fill="url(#sbgrid)"/>
 <g fill="#a5bcae" fontSize="12" fontWeight="bold"><text x="260" y="23">N</text><text x="18" y="245">W</text><text x="620" y="245">E</text><text x="260" y="445">S</text></g>
 {locations.filter(l=>l.id!=="bunker").map(l=><path key={l.id} d={`M260 244 L${260+l.position[0]*scale} ${244+l.position[1]*scale}`} stroke="#a3d6a0" strokeOpacity=".48" strokeDasharray="5 6" fill="none"/>)}
 {locations.map(l=>{const x=260+l.position[0]*scale,y=244+l.position[1]*scale;return <g key={l.id}><circle cx={x} cy={y} r={selected===l.id?25:18} fill="#b9ef9c" opacity=".14"/><circle cx={x} cy={y} r="6" fill="#c5ef9b"/><text x={x} y={y+23} fontSize="12" textAnchor="middle" fill="#e1eddf">{l.name}</text></g>})}
 </svg>
 <div className="sb-season-location-list">{locations.map(l=><button key={l.id} type="button" className={selected===l.id?"selected":""} onClick={()=>setSelected(l.id)}>{l.name}</button>)}</div>
 {current&&<p>Odkryte miejsce: <strong>{current.name}</strong>.</p>}
 <small>Położenie jest orientacyjne, nie jest to gotowa mapa świata.</small>
 </section>
}
function EventCard({e,busy,act,now}:{e:SeasonEvent;busy:boolean;act:(a:Record<string,unknown>)=>void;now:number}){
 const vote=e.vote,p=e.personal
 return <article className="sb-season-card" id={"etap-"+e.id}>
 <SceneImage id={e.asset} alt="Ilustracja wydarzenia"/>
 <div className="sb-season-card-body">
 <p className="sb-season-kicker">ROZDZIAŁ {e.id}</p><h2>{e.title}<span className="sb-green-dot">.</span></h2>
 {e.context.map((t,i)=><p key={"c"+i} className="sb-season-context">{t}</p>)}
 {e.scene.map((t,i)=><p key={i}>{t}</p>)}
 {e.images&&e.images.length>1&&<div className="sb-season-image-strip">{e.images.filter(id=>id!==e.asset).map(id=><SceneImage key={id} id={id} alt="Odkrycie związane z wydarzeniem"/>)}</div>}
 {e.forcedMessage&&<p className="sb-season-note">{e.forcedMessage}</p>}
 {vote&&<section className="sb-season-decision">
 <p className="sb-season-kicker">DECYZJA SPOŁECZNOŚCI</p>
 <h3>{vote.prompt}</h3>
 {vote.winner?<><p><strong>Wynik:</strong> {vote.options.find(o=>o.id===vote.winner)?.label}</p><p>{vote.outcome}</p><p className="sb-season-note">{vote.reason==="fallback"?"Nie oddano głosów. Zastosowano wariant awaryjny.":vote.reason==="tie"?"Remis rozstrzygnięto według ustalonej kolejności.":"Decyzja większości."}</p>{vote.counts&&vote.options.map(o=><div key={o.id} className="sb-season-result"><span>{o.label}</span><strong>{vote.counts?.[o.id]??0}</strong></div>)}</>:<>
 <p className="sb-season-note">Głosowanie do {time(vote.deadline)}. Oddano {vote.submitted} głosów. Każdy ma jeden głos.</p>
 {vote.options.map(o=><button type="button" className={"sb-season-choice"+(vote.myVote===o.id?" chosen":"")} key={o.id} disabled={busy||!!vote.myVote||now>=vote.deadline} onClick={()=>{if(window.confirm("Potwierdzić ten wybór? Nie będzie można go zmienić."))act({action:"vote",stage:e.id,option:o.id})}}>{o.label}{vote.myVote===o.id?" ✓":""}</button>)}
 <details className="sb-season-note"><summary>Zasada rozstrzygania remisu</summary><p>{vote.tiePriority.map(id=>vote.options.find(o=>o.id===id)?.label).join(" → ")}</p></details>
 </>}
 </section>}
 {p&&<section className="sb-season-personal">
 <p className="sb-season-kicker">TYLKO DLA CIEBIE / EPIZOD {p.round}/4</p>
 <h3>{p.title}</h3><p>{p.scene}</p>
 {p.callbacks.map((t,i)=><p key={i} className="sb-season-context">{t}</p>)}
 {p.choice?<><p><strong>Twój wybór:</strong> {p.options.find(o=>o.id===p.choice)?.label}</p><p>{p.outcome}</p></>:p.available?<>{p.options.map(o=><button type="button" key={o.id} className="sb-season-choice" disabled={busy} onClick={()=>{if(window.confirm("Potwierdzić osobistą decyzję?"))act({action:"personal",round:p.round,option:o.id})}}>{o.label}</button>)}</>:<p className="sb-season-note">Najpierw dokończ wcześniejszy epizod. Po finale wybory są zamknięte.</p>}
 </section>}
 {e.cliffhanger&&<p className="sb-season-cliff">{e.cliffhanger}</p>}
 </div></article>
}
export default function BezdrozaPage(){
 const [view,setView]=useState<SeasonView|null>(null)
 const [error,setError]=useState("")
 const [busy,setBusy]=useState(false)
 const [now,setNow]=useState(Date.now())
 const [tab,setTab]=useState<"events"|"map"|"journal">("events")
 const inFlight=useRef(false)
 async function refresh(){if(inFlight.current)return;inFlight.current=true;try{setView(await loadSeason());setError("")}catch(e){setError(e instanceof Error?e.message:"Brak łączności.")}finally{inFlight.current=false}}
 useEffect(()=>{void refresh();const a=window.setInterval(()=>void refresh(),25000);const b=window.setInterval(()=>setNow(Date.now()),1000);return()=>{window.clearInterval(a);window.clearInterval(b)}},[])
 async function action(a:Record<string,unknown>){if(inFlight.current||busy)return;inFlight.current=true;setBusy(true);setError("");try{setView(await loadSeason(a))}catch(e){setError(e instanceof Error?e.message:"Nie udało się zapisać.");}finally{inFlight.current=false;setBusy(false)}}
 const act=(a:Record<string,unknown>)=>void action(a)
 return <main className="sb-season"><div className="sb-season-inner">
 <header><h1>Bezdroża<span className="sb-green-dot">.</span></h1><p>Wielka Cisza / Sezon 01</p></header>
 {error&&<div className="sb-season-error" role="alert">{error} <button type="button" onClick={()=>void refresh()}>Ponów</button></div>}
 {!view?<p>Łączymy się ze Strefą B…</p>:<>
 <div className="sb-season-resources"><div><small>ŻYWNOŚĆ</small><strong>{view.totals.food}</strong></div><div><small>MORALE</small><strong>{view.totals.morale}</strong></div><div><small>ODKRYTE MIEJSCA</small><strong>{view.locations.length}</strong></div></div>
 {!view.prolog?<p>Odprawa rozpocznie się 2 grudnia o 9:30.</p>:<>
 <nav className="sb-season-tabs" aria-label="Widok Bezdroży">{([["events","Wydarzenia"],["map","Mapa"],["journal","Mój dziennik"]] as const).map(([id,label])=><button key={id} type="button" className={tab===id?"active":""} onClick={()=>setTab(id)}>{label}</button>)}</nav>
 {tab==="events"&&<>
 {view.ending&&<article className="sb-season-card"><div className="sb-season-card-body"><p className="sb-season-kicker">KONIEC SEZONU 01</p><h2>{view.ending.title}</h2><p>{view.ending.text}</p>{view.ending.epilogue.map((t,i)=><p key={i}>{t}</p>)}</div></article>}
 {[...view.events].reverse().map(e=><EventCard key={e.id} e={e} busy={busy} act={act} now={now}/>)}
 <article className="sb-season-card"><SceneImage id={view.prolog.image} alt="Wejście do schronienia w lesie"/><div className="sb-season-card-body"><p className="sb-season-kicker">PROLOG</p><h2>{view.prolog.title}</h2>{view.prolog.text.map((t,i)=><p key={i}>{t}</p>)}<p className="sb-season-cliff">{view.prolog.last}</p></div></article>
 </>}
 {tab==="map"&&<MapBoard locations={view.locations}/>}
 {tab==="journal"&&<section className="sb-season-card"><div className="sb-season-card-body"><p className="sb-season-kicker">DZIENNIK ZWIADOWCY / PRYWATNY</p><h2>Twoja historia</h2>
 {view.events.filter(e=>e.personal).map(e=><div className="sb-season-journal-entry" key={e.id}><h3>{e.personal?.title}</h3><p>{e.personal?.choice?e.personal.outcome:"Decyzja oczekuje w wydarzeniach."}</p></div>)}
 {!view.events.some(e=>e.personal)&&<p>Twoje osobiste odkrycia pojawią się po pierwszej wyprawie.</p>}
 <h3>Twoje tropy</h3>{view.myClues.length===0&&<p>Nie masz jeszcze tropów do przekazania.</p>}
 {view.myClues.map(c=><div className="sb-season-journal-entry" key={c.id}><p>{c.label}</p><button className="sb-season-choice" disabled={busy||c.shared||!!view.ending} onClick={()=>act({action:"share",clue:c.id})}>{c.shared?"Przekazano ✓":"Przekaż do wspólnej odprawy"}</button></div>)}
 <h3>Wspólna odprawa</h3>{view.commonClues.length?view.commonClues.map(c=><p key={c.id}>• {c.label}</p>):<p>Nie przekazano jeszcze wspólnych tropów.</p>}
 </div></section>}
 </>}
 </>}
 </div></main>
}
