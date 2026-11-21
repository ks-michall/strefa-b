"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { habits } from "../../lib/bonsai-habits"
import { BonsaiGrowth } from "../../components/bonsai-growth"
import { harvestBadges, RECOGNITION_THRESHOLD } from "../../lib/bonsai-rewards"
import { addDays, currentPlantingDay, daysBetween, readableDate } from "../../lib/bonsai-time"
import { sortedStudents } from "../../lib/students"

type Tree = { id: string; habitIndex: number; cue: string; started: string; checks: string[] }
const pupils = sortedStudents.filter(name => name !== "ks. Michał")
const surface: React.CSSProperties = {
  background: "white", borderRadius: 22, padding: 22,
  border: "1px solid #dce7ee", boxShadow: "0 8px 26px rgba(30,52,72,.04)",
}
function Calendar({tree,cutoff}:{tree:Tree;cutoff:string}) {
  return <div aria-label="Kalendarz 28 dni" style={{display:"grid",gridTemplateColumns:"repeat(7,minmax(0,1fr))",gap:7}}>
    {Array.from({length:28},(_,index)=>{
      const day=addDays(tree.started,index),checked=tree.checks.includes(day),missed=!checked && Boolean(cutoff) && day<cutoff
      return <div key={day} title={readableDate(day)} style={{
        padding:"10px 0",textAlign:"center",borderRadius:10,
        background:checked?"#bee5c7":"#eef2f5",
        color:checked?"#235d39":"#64748b",fontWeight:700,
      }}>{checked?"✓":missed?"0":index+1}</div>
    })}
  </div>
}
export default function BBossPage() {
  const [student,setStudent]=useState("")
  const [trees,setTrees]=useState<Tree[]>([])
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState("")
  const [asOf,setAsOf]=useState("")
  useEffect(()=>{
    const update=()=>setAsOf(currentPlantingDay(new Date()))
    update()
    const timer=window.setInterval(update,30000)
    return ()=>window.clearInterval(timer)
  },[])
  useEffect(()=>{
    if(!student){setTrees([]);setError("");return}
    let active=true
    const controller=new AbortController()
    async function load(){
      setLoading(true);setError("");setTrees([])
      try {
        const response=await fetch("/api/bonsai?student="+encodeURIComponent(student),{
          cache:"no-store",signal:controller.signal,
        })
        const payload=await response.json()
        if(!response.ok) throw new Error(payload.error||"Nie udało się pobrać postępów.")
        if(active) {setTrees(Array.isArray(payload.trees)?payload.trees:[]);setAsOf(currentPlantingDay(new Date()))}
      } catch(e){
        if(active) setError(e instanceof Error?e.message:"Błąd pobierania danych.")
      } finally { if(active)setLoading(false) }
    }
    void load()
    return()=>{active=false;controller.abort()}
  },[student])
  const stats=useMemo(()=>{
    const dates=trees.flatMap(tree=>tree.checks)
    return {checks:dates.length,latest:dates.length?[...dates].sort().at(-1):null,
      active:trees.filter(tree=>asOf && daysBetween(tree.started,asOf)>=0 && daysBetween(tree.started,asOf)<28).length,
      ready:trees.filter(tree=>asOf && asOf>=addDays(tree.started,28) && tree.checks.length>=RECOGNITION_THRESHOLD).length}
  },[trees,asOf])
  return <main style={{
    background:"linear-gradient(180deg,#f4f8fb,#edf6f4)",minHeight:"100vh",
    padding:"26px 16px 64px",color:"#1e3342",
  }}>
    <div style={{maxWidth:820,margin:"0 auto"}}>
      <Link href="/" style={{color:"#376277",textDecoration:"none"}}>← Strefa B</Link>
      <header style={{margin:"22px 0 24px"}}>
        <h1 style={{margin:"0 0 8px",fontSize:38}}>🕵️ Boss</h1>
        <p style={{color:"#617887",fontSize:17,lineHeight:1.65,margin:0}}>
          Wybierz ucznia: zobaczysz jego aktualne nawyki, regularność i zakończone wyzwania wymagające rozmowy.
        </p>
      </header>
      <section style={{...surface,marginBottom:18}}>
        <label htmlFor="student" style={{display:"block",fontWeight:700,marginBottom:10}}>Wybierz ucznia</label>
        <select id="student" value={student} onChange={event=>setStudent(event.target.value)}
          style={{width:"100%",padding:14,borderRadius:14,border:"1px solid #cddbe3",fontSize:16,background:"white"}}>
          <option value="">— Wybierz imię —</option>
          {pupils.map(name=><option key={name} value={name}>{name}</option>)}
        </select>
        <p style={{fontSize:13,color:"#64748b",lineHeight:1.65,marginBottom:0}}>
          Tutaj widać tylko dane Bonsai zapisane na kontach uczniów.
          Starsze, lokalne drzewka pokażą się po przeniesieniu ich przez ucznia.
        </p>
      </section>
      {loading && <section style={surface}>Pobieram drzewka…</section>}
      {error && <p role="alert" style={{background:"#fee2e2",color:"#991b1b",padding:16,borderRadius:14}}>{error}</p>}
      {!loading && !error && student && <>
        <section style={{...surface,marginBottom:18}}>
          <h2 style={{marginTop:0,fontSize:23}}>{student} – podsumowanie Bonsai</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12}}>
            {[
              {label:"Aktywne nawyki",value:stats.active},
              {label:"Potwierdzone dni",value:stats.checks},
              {label:"Do rozmowy (21/28)",value:stats.ready},
            ].map(item=><div key={item.label} style={{padding:14,background:"#eef6f3",borderRadius:14}}>
              <strong style={{fontSize:26,display:"block"}}>{item.value}</strong>
              <span style={{color:"#557267",fontSize:13}}>{item.label}</span>
            </div>)}
          </div>
          <p style={{color:"#607786",marginBottom:0,fontSize:14}}>
            Ostatnie potwierdzenie: <strong>{stats.latest?readableDate(stats.latest):"brak"}</strong>
          </p>
        </section>
        {trees.length===0 ? <section style={surface}>
          <h2 style={{marginTop:0,fontSize:20}}>Brak zapisanych drzewek</h2>
          <p style={{marginBottom:0,color:"#607786",lineHeight:1.65}}>
            Ten uczeń nie ma jeszcze Bonsai zapisanych w bazie. Może dopiero zacząć lub przechowywać wcześniejsze drzewka w swojej przeglądarce.
            Sam brak danych nie oznacza, że nie korzystał z aplikacji.
          </p>
        </section> : <div style={{display:"grid",gap:16}}>
          {[...trees].sort((a,b)=>{
            const aActive=asOf && daysBetween(a.started,asOf)>=0 && daysBetween(a.started,asOf)<28
            const bActive=asOf && daysBetween(b.started,asOf)>=0 && daysBetween(b.started,asOf)<28
            return Number(bActive)-Number(aActive) || b.started.localeCompare(a.started)
          }).map(tree=>{
            const done=asOf && asOf>=addDays(tree.started,28)
            const habit=habits[tree.habitIndex]
            return <section key={tree.id} style={surface}>
              <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"start",flexWrap:"wrap"}}>
                <div>
                  <p style={{fontSize:13,color:"#607786",margin:"0 0 7px"}}>{done?"Zakończone wyzwanie":"Aktywny nawyk"}</p>
                  <h3 style={{margin:"0 0 7px",fontSize:21}}>{habit?.title||"Nieznany nawyk"}</h3>
                  <p style={{margin:"0 0 7px",color:"#546c7c",lineHeight:1.6}}>{habit?.action||""}</p>
                  <p style={{margin:0,fontSize:13,color:"#648273"}}>Sygnał: {tree.cue}</p>
                </div>
                <BonsaiGrowth count={tree.checks.length} compact/>
              </div>
              <div style={{margin:"18px 0 12px",display:"flex",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
                <strong>{tree.checks.length} / 28 dni</strong>
                <span style={{color:"#607786",fontSize:13}}>
                  {readableDate(tree.started)} – {readableDate(addDays(tree.started,27))}
                </span>
              </div>
              <div style={{height:10,background:"#e3ebe8",borderRadius:99,overflow:"hidden",marginBottom:20}}>
                <div style={{height:"100%",width:(tree.checks.length/28*100)+"%",background:"#60ab78",borderRadius:99}}/>
              </div>
              <div style={{fontSize:13,color:"#607786",margin:"0 0 12px"}}>
                  {done ? "Wynik końcowy" : `Dzień ${Math.min(28,daysBetween(tree.started,asOf)+1)} z 28`} · {tree.checks.length} wykonanych dni
                </div>
              <Calendar tree={tree} cutoff={asOf}/>
              {done && <div style={{marginTop:17,padding:14,background:"#eaf5ee",borderRadius:14,color:"#315e43"}}>
                <strong>🌾 Zbiory Bonsai: {tree.checks.length}/28 dni</strong>
                {harvestBadges(tree,trees.filter(other=>other.id!==tree.id && other.started<=tree.started),asOf).map(badge=>
                  <div key={badge.id} style={{fontSize:13,marginTop:7}}>{badge.icon} {badge.title}</div>)}
                {tree.checks.length>=RECOGNITION_THRESHOLD &&
                  <p style={{fontWeight:700,fontSize:13,marginBottom:0}}>
                    🏅 Próg 21/28 osiągnięty — warto zaprosić ucznia na rozmowę o efektach pracy nad sobą.
                    Po rozmowie możesz rozważyć pozytywną uwagę z zachowania.
                  </p>}
              </div>}
            </section>
          })}
        </div>}
      </>}
      {!student && <p style={{textAlign:"center",color:"#6a7d85",marginTop:30}}>Wybierz imię ucznia, żeby zobaczyć jego mały las. 🌳</p>}
    </div>
  </main>
}
