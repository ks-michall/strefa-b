"use client"

import Link from "next/link"
import { habits, availableHabits } from "../../lib/bonsai-habits"
import { BiostationPlot } from "../../components/biostation-plot"
import { useBiostationSession } from "../../components/biostation-session"
import { nextExpedition,type WorldState } from "../../lib/world-story"
import { BonsaiHarvest } from "../../components/bonsai-harvest"
import { BonsaiReflection } from "../../components/bonsai-reflection"
import { useEffect, useMemo, useState } from "react"
import {
  addDays, countdown, currentCheckInDay, currentPlantingDay, daysBetween,
  isValidDay, readableDate, remainingUntilNextOpening,
} from "../../lib/bonsai-time"

type BonsaiTree = { id: string; habitIndex: number; cue: string; started: string; checks: string[] }
type LegacyTree = Omit<BonsaiTree, "id">
const LEGACY_KEY = "strefa-b-bonsai-v1"
const storageKey = (name: string) => "strefa-b-bonsai-v2:" + encodeURIComponent(name)
const GROWTH_DAYS = 28
const PLANTING_INTERVAL = 14
const categories = ["Polecane na start", "Wszystkie", "Rozpoczynanie działania", "Skuteczna nauka", "Ciekawość i myślenie naukowe", "Samodzielność i sprawczość", "Energia i zdrowie", "Relacje i współpraca"]
const cues = ["Po śniadaniu", "Po pierwszej lekcji", "Po powrocie ze szkoły", "Po kolacji", "Przed snem"]

function validLegacy(value: unknown): value is LegacyTree {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const tree = value as Partial<LegacyTree>
  return Number.isInteger(tree.habitIndex) && (tree.habitIndex as number) >= 0 &&
    (tree.habitIndex as number) < habits.length && typeof tree.cue === "string" &&
    tree.cue.length < 200 && isValidDay(tree.started) &&
    Array.isArray(tree.checks) && tree.checks.every(isValidDay)
}

function cleanChecks(checks: string[], started: string): string[] {
  return [...new Set(checks)].filter(day => daysBetween(started, day) >= 0 &&
    daysBetween(started, day) < GROWTH_DAYS).sort()
}

function parseForest(value: string | null): BonsaiTree[] {
  if (!value) return []
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    const ids = new Set<string>()
    return parsed.slice(0, 200).filter((item): item is BonsaiTree => {
      if (!validLegacy(item)) return false
      const id = (item as BonsaiTree).id
      if (typeof id !== "string" || id.length < 1 || id.length > 120 || ids.has(id)) return false
      ids.add(id)
      return true
    }).map(tree => ({ ...tree, checks: cleanChecks(tree.checks, tree.started) }))
      .sort((a, b) => a.started.localeCompare(b.started))
  } catch { return [] }
}

function ProgressCalendar({ tree, cutoff }: { tree: BonsaiTree; cutoff: string }) {
  return <div aria-label="Kalendarz 28 dni" style={{
    display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 7,
  }}>
    {Array.from({ length: GROWTH_DAYS }, (_, index) => {
      const day = addDays(tree.started, index)
      const marked = tree.checks.includes(day)
      const missed = !marked && Boolean(cutoff) && day < cutoff
      return <div key={day} title={readableDate(day)} aria-label={`${readableDate(day)}: ${marked?"potwierdzono":missed?"bez potwierdzenia":"oczekuje"}`} style={{
        borderRadius: 10, padding: "11px 0", textAlign: "center", fontWeight: 700,
        background: marked ? "#bbdfc6" : "#eef3ef",
        color: marked ? "#205636" : "#6d8575",
      }}>{marked ? "✓" : missed ? "—" : index + 1}</div>
    })}
  </div>
}

const surface: React.CSSProperties = {
  background: "white", borderRadius: 24, padding: 22, border: "1px solid #dcece1",
  boxShadow: "0 8px 26px rgba(22,69,40,.05)",
}
const button: React.CSSProperties = {
  border: 0, padding: "13px 18px", borderRadius: 14, background: "#246b49",
  color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer",
}

export default function BonsaiPage() {
  const [loaded, setLoaded] = useState(false)
  const user = useBiostationSession()
  const [trees, setTrees] = useState<BonsaiTree[]>([])
  const [legacyAvailable, setLegacyAvailable] = useState(false)
  const [storageWarning, setStorageWarning] = useState(false)
  const [cloudError, setCloudError] = useState("")
  const [busy, setBusy] = useState(false)
  const [chosen, setChosen] = useState(30)
  const [cue, setCue] = useState("Po kolacji")
  const [category, setCategory] = useState("Polecane na start")
  const [tab, setTab] = useState<"today" | "catalog" | "progress">("today")
  const [nowMs, setNowMs] = useState(0)
  const [expandedTree, setExpandedTree] = useState<string|null>(null)
  const [harvestNotice, setHarvestNotice] = useState("")
  const [impact,setImpact]=useState<{food:number;morale:number;targetFood:number;targetMorale:number;name:string}|null>(null)

  useEffect(() => {
    setNowMs(Date.now())
    const timer = window.setInterval(() => setNowMs(Date.now()), 60000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(()=>{
    if(new URLSearchParams(window.location.search).get("start")==="1")setTab("catalog")
  },[])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const response = await fetch("/api/bonsai", {cache:"no-store"})
        const cloud = await response.json()
        if (!response.ok) throw new Error(cloud.error || "Nie udało się pobrać upraw.")
        if (cancelled) return
        const forest = Array.isArray(cloud.trees) ? cloud.trees as BonsaiTree[] : []
        setTrees(forest)
        if(forest.length===0) {
          try {
            let old = parseForest(localStorage.getItem(storageKey(user)))
            if(old.length===0){
              const legacy:unknown=JSON.parse(localStorage.getItem(LEGACY_KEY)||"null")
              if(validLegacy(legacy))old=[{...legacy,id:crypto.randomUUID(),checks:cleanChecks(legacy.checks,legacy.started)}]
            }
            setLegacyAvailable(old.length>0)
          }catch{setStorageWarning(true)}
        }
      }catch(error){
        if(!cancelled)setCloudError(error instanceof Error?error.message:"Błąd synchronizacji Biostacji.")
      }finally{
        if(!cancelled)setLoaded(true)
      }
    }
    void load()
    return ()=>{cancelled=true}
  }, [user])

  async function refresh() {
    const response = await fetch("/api/bonsai", { cache: "no-store" })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || "Nie udało się odświeżyć upraw.")
    setTrees(Array.isArray(data.trees) ? data.trees as BonsaiTree[] : [])
    setCloudError("")
  }

  async function post(action: "plant" | "check" | "import", payload: Record<string,unknown>) {
    setBusy(true)
    setCloudError("")
    try {
      const response = await fetch("/api/bonsai", {
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action,...payload}),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Nie udało się zapisać postępu.")
      await refresh()
      // Triggers idempotent shared sector-unlock evaluation without delaying the pupil.
      void fetch("/api/world",{cache:"no-store"}).catch(()=>{})
      return true
    } catch(error) {
      setCloudError(error instanceof Error ? error.message : "Nie udało się zapisać postępu.")
      return false
    } finally { setBusy(false) }
  }

  async function importLegacy() {
    if (!user || trees.length || busy) return
    try {
      let old = parseForest(localStorage.getItem(storageKey(user)))
      let fromOldKey = false
      if (!old.length) {
        const legacy: unknown = JSON.parse(localStorage.getItem(LEGACY_KEY) || "null")
        if (!validLegacy(legacy)) return
        old = [{...legacy,id:crypto.randomUUID(),checks:cleanChecks(legacy.checks,legacy.started)}]
        fromOldKey = true
      }
      const success = await post("import",{trees:old.map(tree=>({
        habitIndex:tree.habitIndex,cue:tree.cue,started:tree.started,checks:tree.checks,
      }))})
      if (success) {
        setLegacyAvailable(false)
        if (fromOldKey) localStorage.removeItem(LEGACY_KEY)
      }
    } catch { setStorageWarning(true) }
  }

  const now = new Date(nowMs || 0)
  const plantingDay = nowMs ? currentPlantingDay(now) : ""
  const windowDay = nowMs ? currentCheckInDay(now) : null
  const latest = trees[trees.length - 1]
  const newTreeDay = latest ? addDays(latest.started, PLANTING_INTERVAL) : null
  const canPlantByDate = !!nowMs && (!newTreeDay || plantingDay >= newTreeDay)
  const activeTrees = trees.filter(tree => plantingDay >= tree.started &&
    daysBetween(tree.started, plantingDay) < GROWTH_DAYS)
  const canPlant = canPlantByDate && activeTrees.length < 2
  const completedTrees = trees.filter(tree => plantingDay >= addDays(tree.started, GROWTH_DAYS))
  const latestFinished = completedTrees.length ? completedTrees[completedTrees.length-1] : null
  const recentlyFinished = latestFinished &&
    daysBetween(latestFinished.started, plantingDay) < GROWTH_DAYS + 14
  function repeatHabit(habitIndex: number) {
    const selectable=availableHabits.some(habit=>habit.index===habitIndex)
    setChosen(selectable?habitIndex:30)
    setCategory(selectable?"Wszystkie":"Polecane na start")
    setTab("catalog")
  }
  function chooseNextHabit() {
    setChosen(30)
    setCategory("Polecane na start")
    setTab("catalog")
  }
  const filtered = useMemo(() => availableHabits
    .filter(habit => category === "Wszystkie" ||
      (category === "Polecane na start" ? habit.recommended : habit.category === category)), [category])

  async function plantTree() {
    if (!user || busy || !canPlant) return
    const success = await post("plant",{habitIndex:chosen,cue})
    if (success) { setTab("today"); setCategory("Polecane na start") }
  }

  async function markDone(treeId: string) {
    if (!user || busy || !windowDay) return
    const success=await post("check",{treeId})
    if(!success)return
    setHarvestNotice("🌾 Dzisiejszy plon zasilił wspólne zapasy Strefy B!")
    try{
      const response=await fetch("/api/world",{cache:"no-store"})
      if(!response.ok)return
      const data=await response.json() as WorldState
      const expedition=nextExpedition(data)
      if(expedition)setImpact({food:data.food,morale:data.morale,
        targetFood:expedition.food,targetMorale:expedition.morale,name:expedition.name})
      else setImpact({food:data.food,morale:data.morale,
        targetFood:data.food,targetMorale:data.morale,name:"Wszystkie sektory odkryte"})
    }catch{/* Nie utrudniamy potwierdzenia, jeśli mapa chwilowo nie odpowiada. */}
  }

  if (!loaded || !nowMs) return <main style={{ padding: 30 }}>Ładowanie Biostacji…</main>
  if (!user) return <main style={{ padding: 30 }}>Nie udało się odczytać konta. <Link href="/login">Zaloguj się</Link>.</main>

  return <main className="sb-app-page sb-theme-green sb-bio-page" style={{
    minHeight: "100vh", background: "linear-gradient(180deg,#f0f9f1,#f7faf8)",
    padding: "26px 16px 60px", color: "#193a2b",
  }}>
    <div style={{ maxWidth: 800, margin: "auto" }}>
      <header className="sb-bio-header sb-module-heading" style={{ margin: "0 0 24px" }}>
        <h1 className="sb-bio-title">Biostacja<span className="sb-green-dot">.</span></h1>
        <p style={{ margin: 0, color: "#537565", fontSize: 17 }}>
          Twoja uprawa. Twój codzienny nawyk. Wspólne zapasy Strefy B.
        </p>
      </header>

      <div className="sb-bio-info-strip">
        <span className="sb-bio-led"/> SYSTEM UPRAW AKTYWNY
        <span>Każdy potwierdzony dzień = <strong>+1 żywność</strong> dla Strefy B</span>
        <Link href="/bezdroza">Zobacz Bezdroża ↗</Link>
      </div>
      {harvestNotice&&<div role="status" className="sb-bio-impact-card">
        <strong>{harvestNotice}</strong>
        {impact&&<div className="sb-bio-impact-data">
          <span>Następna wyprawa: {impact.name}</span>
          <div className="sb-bio-impact-resource"><span>🌾 Żywność</span>
            <strong>{impact.food} / {impact.targetFood}</strong></div>
          <div className="sb-bio-impact-meter"><span style={{width:Math.min(100,impact.food/Math.max(1,impact.targetFood)*100)+"%"}}/></div>
          <div className="sb-bio-impact-resource"><span>✳ Morale</span>
            <strong>{impact.morale} / {impact.targetMorale}</strong></div>
          <p>Jeszcze {Math.max(0,impact.targetFood-impact.food)} żywności i {Math.max(0,impact.targetMorale-impact.morale)} morale do celu wyprawy.</p>
        </div>}
        <Link href="/bezdroza">Sprawdź Bezdroża ↗</Link>
      </div>}

      {storageWarning && <p role="alert" style={{
        padding: 14, background: "#fff2d7", borderRadius: 12, color: "#71470c",
      }}>Nie udało się odczytać wcześniejszych lokalnych postępów.</p>}

      {cloudError && <p role="alert" style={{padding:14,background:"#fee2e2",color:"#991b1b",borderRadius:12}}>{cloudError}</p>}

      {legacyAvailable && trees.length === 0 && <section className="sb-surface" style={{ ...surface, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0, fontSize: 20 }}>Masz zapisane wcześniejsze uprawy</h2>
        <p>Na tym urządzeniu są starsze postępy. Jeśli należą do Ciebie, przenieś je do swojego konta. Będą widoczne dla wychowawcy.</p>
        <button style={{...button,opacity:busy?.6:1}} disabled={busy} onClick={importLegacy}>{busy?"Przenoszenie…":"Przenieś moje uprawy do konta"}</button>
      </section>}

      <nav className="sb-bonsai-tabs" aria-label="Zakładki Biostacji" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {([["today", "Dzisiaj"], ["progress", "Mój ogród"], ["catalog", "Nawyki"]] as const)
          .map(([id, label]) => <button key={id} onClick={() => setTab(id)}
            aria-current={tab === id ? "page" : undefined}
            style={{ ...button, background: tab === id ? "#246b49" : "#e0eee4",
              color: tab === id ? "white" : "#21533a" }}>{label}</button>)}
      </nav>

      {tab === "today" && activeTrees.length>0 && <section className="sb-bio-missions" aria-label="Twoje aktywne nawyki">
        {activeTrees.map(tree=>{
          const eligible=!!windowDay && daysBetween(tree.started,windowDay)>=0 &&
            daysBetween(tree.started,windowDay)<GROWTH_DAYS
          const checked=Boolean(windowDay && tree.checks.includes(windowDay))
          return <article className="sb-bio-active-mission sb-bio-unified-mission" key={tree.id}>
            <div className="sb-bio-mission-heading">
              <span className="sb-bio-signal">◉ TWOJA AKTYWNA MISJA</span>
              <span>DZIEŃ {Math.min(GROWTH_DAYS,daysBetween(tree.started,plantingDay)+1)} / {GROWTH_DAYS}</span>
            </div>
            <h2>{habits[tree.habitIndex].title}</h2>
            <p className="sb-bio-action">{habits[tree.habitIndex].action}</p>
            <p className="sb-bio-cue">⌁ Twój sygnał: {tree.cue.toLowerCase()}</p>
            {(()=>{
              const last=[...tree.checks].sort().at(-1)
              const since=last?daysBetween(last,plantingDay):daysBetween(tree.started,plantingDay)
              return since>=3&&!checked?<p className="sb-bio-comeback">
                Dobrze, że wracasz do Strefy B! Każdy dzień jest nowym początkiem.
              </p>:null
            })()}
            <BiostationPlot count={tree.checks.length} compact/>
            <div className="sb-bio-mission-progress">
              <strong>{tree.checks.length} / 28 <small>potwierdzonych dni</small></strong>
              <span>Jedno potwierdzenie = +1 żywność</span>
            </div>
            {checked
              ? <div className="sb-bio-mission-complete" role="status">
                  <strong>✓ Dzisiejszy nawyk potwierdzony!</strong>
                  <span>Możesz wrócić do tej misji jutro.</span>
                </div>
              : eligible
                ? <button type="button" onClick={()=>void markDone(tree.id)} disabled={busy}
                    className="sb-bio-mission-confirm">
                    {busy?"Zapisuję plon…":"✓ Potwierdź dzisiejszy nawyk · +1 żywność"}
                  </button>
                : <div className="sb-bio-mission-wait">
                    Dzisiejsze okno potwierdzenia jest niedostępne dla tej uprawy.
                  </div>}
            <p className="sb-bio-mission-encourage">Przerwa nie przekreśla postępu. Liczy się powrót do działania.</p>
          </article>
        })}
      </section>}
      {tab === "today" && <div style={{ display: "grid", gap: 16 }}>
        {recentlyFinished && latestFinished && <BonsaiHarvest
          tree={latestFinished}
          earlier={trees.filter(tree=>tree.id!==latestFinished.id && tree.started<=latestFinished.started)}
          today={plantingDay}
          canPlant={canPlant}
          onRepeat={()=>repeatHabit(latestFinished.habitIndex)}
          onNew={chooseNextHabit}
        />}
        {trees.length === 0 && <section className="sb-surface" style={surface}>
          <h2 style={{ marginTop: 0 }}>Uruchom swoją pierwszą uprawę</h2>
          <p>Wybierz codzienny nawyk. Każde potwierdzenie zasili magazyn żywności Strefy B.</p>
          <BiostationPlot count={0}/>
          <button className="sb-pill-button" style={button} onClick={() => setTab("catalog")}>Wybierz nawyk</button>
        </section>}
        {trees.length > 0 && activeTrees.length === 0 && !recentlyFinished && <section className="sb-surface" style={surface}>
          <h2 style={{ marginTop: 0 }}>Twoje poprzednie uprawy są zakończone</h2>
          <p>Znajdziesz je w Moim ogrodzie. Nową uprawę możesz rozpocząć po 14 dniach od ostatniej.</p>
        </section>}
        {canPlant && trees.length > 0 && <section className="sb-surface" style={{ ...surface, background: "#e6f5e9" }}>
          <h2 style={{ marginTop: 0 }}>🌱 Możesz uruchomić kolejną uprawę!</h2>
          <p>Od ostatniego rozpoczęcia minęły dwa tygodnie. Możesz dodać nowy nawyk i rozwijać dwa poletka równolegle.</p>
          <button className="sb-pill-button" style={button} onClick={() => setTab("catalog")}>Rozpocznij nową uprawę</button>
        </section>}
        {!canPlant && newTreeDay && activeTrees.length < 2 && <section className="sb-surface" style={surface}>
          <strong>Nowa uprawa od {readableDate(newTreeDay)}</strong>
          <p style={{ color: "#527460", marginBottom: 0 }}>
            Jeszcze {daysBetween(plantingDay, newTreeDay)} {daysBetween(plantingDay, newTreeDay) === 1 ? "dzień" : "dni"} do uruchomienia kolejnej uprawy.
          </p>
        </section>}
      </div>}

      {tab === "catalog" && <section className="sb-surface" style={surface}>
        <h2 style={{ marginTop: 0 }}>Wybierz swój nawyk</h2>
        <p>Jedna uprawa trwa 28 dni. Zacznij od jednego małego, rzeczywistego działania. Możesz prowadzić maksymalnie dwa nawyki naraz, a kolejny rozpocząć po 14 dniach.
          {newTreeDay && !canPlant ? ` Następny start: ${readableDate(newTreeDay)}.` : ""}
        </p>
        <p style={{ color: "#426f56", fontSize: 14, lineHeight: 1.6 }}>
           Na start polecamy sześć nawyków. Inne znajdziesz w obszarach rozwoju albo w zakładce „Wszystkie”.
         </p>
         <label style={{ display: "block", marginBottom: 8, fontWeight: 750 }}>Obszar rozwoju</label>
        <div className="sb-bio-categories" role="group" aria-label="Kategorie nawyków">
          {categories.map(value=><button type="button" key={value} onClick={()=>{
             setCategory(value)
             const first=availableHabits.find(habit=>value==="Wszystkie" ||
               (value==="Polecane na start"?habit.recommended:habit.category===value))
             if(first)setChosen(first.index)
           }}
            aria-pressed={category===value}
            className={category===value?"active":""}>{value}</button>)}
        </div>
        <div className="sb-bio-habit-options" style={{ display: "grid", gap: 9, maxHeight: 390, overflowY: "auto" }}>
          {filtered.map(habit => <label key={habit.index} style={{
            display: "flex", gap: 12, border: chosen === habit.index ? "2px solid #4a9667" : "1px solid #dcece1",
            borderRadius: 14, padding: 12, cursor: "pointer",
          }}>
            <input type="radio" name="habit" checked={chosen === habit.index}
              onChange={() => setChosen(habit.index)}/>
            <span><strong>{habit.title}</strong>
               <span style={{display:"block",marginTop:4,color:"#355e48",fontSize:14}}>{habit.action}</span>
               {habit.why&&<span style={{display:"block",marginTop:5,color:"#637f70",fontSize:12,lineHeight:1.45}}>
                 Po co? {habit.why}
               </span>}
             </span>
          </label>)}
        </div>
        <label htmlFor="bonsaiCue" style={{ display: "block", margin: "18px 0 6px" }}>Kiedy będziesz wykonywać nawyk?</label>
        <select id="bonsaiCue" value={cue} onChange={event => setCue(event.target.value)}
          style={{ padding: 12, borderRadius: 12, width: "100%", marginBottom: 14 }}>
          {cues.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
        <p style={{ color: "#537565", fontSize: 13 }}>Wykonaj nawyk o wybranej porze. Potwierdź go raz dziennie, gdy rzeczywiście zrobisz opisane zadanie.</p>
        <button disabled={!canPlant || busy} style={{ ...button, opacity: canPlant && !busy ? 1 : .55, cursor: canPlant && !busy ? "pointer" : "not-allowed" }}
          onClick={plantTree}>{trees.length === 0 ? "Rozpoczynam pierwszą uprawę" : "Rozpoczynam kolejną uprawę"}</button>
        {!canPlant && newTreeDay && activeTrees.length < 2 && <p style={{ color: "#527460" }}>Nową uprawę możesz rozpocząć od {readableDate(newTreeDay)}.</p>}
        {activeTrees.length >= 2 && <p style={{color:"#527460"}}>Prowadzisz teraz dwie uprawy. Kolejną rozpoczniesz po zakończeniu jednej z nich.</p>}
      </section>}

      {tab === "progress" && <div className="sb-bio-garden">
        <section className="sb-bio-garden-intro">
          <p className="sb-small-label">TWOJE UPRAWY / ARCHIWUM POSTĘPÓW</p>
          <h2>Mój ogród</h2>
          <p>Każda uprawa trafia tu po rozpoczęciu. Wybierz poletko, żeby zobaczyć kalendarz, zbiory i dobrowolną refleksję. Przerwa nie przekreśla postępu.</p>
          <div className="sb-bio-garden-numbers">
            <span><strong>{trees.length}</strong> upraw</span>
            <span><strong>{completedTrees.length}</strong> ukończonych cykli</span>
            <span><strong>{trees.reduce((sum,tree)=>sum+tree.checks.length,0)}</strong> potwierdzeń</span>
          </div>
        </section>
        {trees.length===0&&<div className="sb-bio-garden-empty">Wybierz pierwszy nawyk, aby uruchomić Biostację.</div>}
        <div className="sb-bio-garden-grid">
          {trees.map((tree,index)=>{
            const finished=plantingDay>=addDays(tree.started,GROWTH_DAYS)
            const opened=expandedTree===tree.id
            return <section className={"sb-bio-garden-item"+(opened?" expanded":"")} key={tree.id}>
              <button type="button" className="sb-bio-garden-open" onClick={()=>setExpandedTree(opened?null:tree.id)}
                aria-expanded={opened}>
                <div className="sb-bio-garden-preview"><BiostationPlot count={tree.checks.length} compact/></div>
                <div className="sb-bio-garden-description">
                  <span className="sb-bio-garden-index">POLETKO {String(index+1).padStart(2,"0")} / {finished?"ZAKOŃCZONE":"W TRAKCIE"}</span>
                  <h3>{habits[tree.habitIndex].title}</h3>
                  <small>{readableDate(tree.started)} — {readableDate(addDays(tree.started,27))}</small>
                  <span className="sb-bio-garden-count">{tree.checks.length} / 28 potwierdzeń <span>{opened?"−":"+"}</span></span>
                </div>
              </button>
              {opened&&<div className="sb-bio-garden-details">
                <p>Twój codzienny nawyk: <strong>{habits[tree.habitIndex].action}</strong></p>
                <ProgressCalendar tree={tree} cutoff={plantingDay}/>
                {finished&&<BonsaiReflection treeId={tree.id}/>}
                {finished&&<BonsaiHarvest tree={tree}
                  earlier={trees.filter(other=>other.id!==tree.id&&other.started<=tree.started)}
                  today={plantingDay} canPlant={canPlant}
                  onRepeat={()=>repeatHabit(tree.habitIndex)} onNew={chooseNextHabit}/>}
              </div>}
            </section>
          })}
        </div>
      </div>}

      <p className="sb-bio-footer" style={{ fontSize: 12, lineHeight: 1.6, marginTop: 20 }}>
        Uprawy i potwierdzenia zapisują się na Twoim koncie i synchronizują między urządzeniami.
        Wychowawca może zobaczyć wybrane nawyki i dni ich wykonania.
        O godzinie potwierdzenia decyduje zegar serwera.
      </p>
    </div>
  </main>
}
