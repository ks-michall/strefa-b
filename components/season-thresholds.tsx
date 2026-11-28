"use client"
import {useEffect,useState} from "react"
import {loadSeason,type SeasonView} from "../lib/season-view"

export function SeasonThresholds(){
 const [view,setView]=useState<SeasonView|null>(null)
 const [draft,setDraft]=useState<Record<string,{food:string;morale:string}>>({})
 const [busy,setBusy]=useState("")
 const [error,setError]=useState("")
 function apply(v:SeasonView){setView(v);setDraft(Object.fromEntries((v.thresholds??[]).map(t=>[t.id,{food:String(t.food),morale:String(t.morale)}])))}
 useEffect(()=>{let active=true;loadSeason().then(v=>{if(active)apply(v)}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[])
 async function save(id:string){const d=draft[id];if(!d||!/^\d+$/.test(d.food)||!/^\d+$/.test(d.morale)){setError("Podaj całkowite nieujemne liczby.");return}setBusy(id);setError("");try{apply(await loadSeason({action:"threshold",stage:id,food:Number(d.food),morale:Number(d.morale)}))}catch(e){setError(e instanceof Error?e.message:"Błąd zapisu.")}finally{setBusy("")}}
 return <section className="sb-season-admin" style={{marginBottom:20,padding:20,borderRadius:18,background:"#fff",border:"1px solid #dce7ee",color:"#203a2b"}}>
 <h2 style={{marginTop:0}}>Bezdroża • progi sezonu</h2>
 <p>Tylko przyszłe etapy. Zmiana nie odbiera punktów ani odkryć.</p>
 {error&&<p role="alert" style={{color:"#9a2d39"}}>{error}</p>}
 {view&&<p>Żywność: <strong>{view.totals.food}</strong> · Morale: <strong>{view.totals.morale}</strong></p>}
 {view?.thresholds?.map(t=><div key={t.id} style={{padding:"13px 0",borderTop:"1px solid #e0e9e3"}}>
 <strong>Etap {t.id} · {t.title}</strong>
 <div style={{display:"flex",flexWrap:"wrap",alignItems:"end",gap:10,marginTop:8}}>
 {(["food","morale"] as const).map(key=><label key={key} style={{display:"grid",gap:4}}>{key==="food"?"Żywność":"Morale"}<input type="number" min={0} step={1} value={draft[t.id]?.[key]??""} onChange={e=>setDraft(d=>({...d,[t.id]:{...d[t.id],[key]:e.target.value}}))} style={{width:110,padding:8,border:"1px solid #b1c7bb",borderRadius:8}}/></label>)}
 <button disabled={!!busy} onClick={()=>void save(t.id)} style={{padding:"9px 16px",borderRadius:8,border:0,color:"white",background:"#315b49"}}>{busy===t.id?"Zapisuję…":"Zapisz"}</button>
 </div></div>)}
 {view&&view.thresholds?.length===0&&<p>Wszystkie etapy zostały już otwarte.</p>}
 </section>
}
