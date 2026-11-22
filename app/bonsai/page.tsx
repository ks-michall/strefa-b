"use client"

import Link from "next/link"
import { habits, availableHabits } from "../../lib/bonsai-habits"
import { BiostationPlot } from "../../components/biostation-plot"
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
const categories = ["Wszystkie", "Rozpoczynanie", "Skuteczna nauka", "Ciekawość", "Wspólnota", "Samodyscyplina"]
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
  const [user, setUser] = useState("")
  const [trees, setTrees] = useState<BonsaiTree[]>([])
  const [legacyAvailable, setLegacyAvailable] = useState(false)
  const [storageWarning, setStorageWarning] = useState(false)
  const [cloudError, setCloudError] = useState("")
  const [busy, setBusy] = useState(false)
  const [chosen, setChosen] = useState(1)
  const [cue, setCue] = useState("Po kolacji")
  const [category, setCategory] = useState("Wszystkie")
  const [tab, setTab] = useState<"today" | "catalog" | "progress">("today")
  const [nowMs, setNowMs] = useState(0)
  const [expandedTree, setExpandedTree] = useState<string|null>(null)
  const [harvestNotice, setHarvestNotice] = useState("")

  useEffect(() => {
    setNowMs(Date.now())
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const response = await fetch("/api/me", { cache: "no-store" })
        if (!response.ok) throw new Error("Sesja wygasła")
        const data = await response.json()
        if (!data.name) { window.location.replace("/login"); return }
        if (data.mustChangePassword) { window.location.replace("/ustaw-haslo"); return }
        if (cancelled) return
        const name = String(data.name)
        setUser(name)
        try {
          const result = await fetch("/api/bonsai", { cache: "no-store" })
          const cloud = await result.json()
          if (!result.ok) throw new Error(cloud.error || "Nie udało się pobrać drzewek.")
          if (cancelled) return
          const forest = Array.isArray(cloud.trees) ? cloud.trees as BonsaiTree[] : []
          setTrees(forest)
          if (forest.length === 0) {
            let old = parseForest(localStorage.getItem(storageKey(name)))
            if (old.length === 0) {
              const legacy: unknown = JSON.parse(localStorage.getItem(LEGACY_KEY) || "null")
              if (validLegacy(legacy)) old = [{ ...legacy,
                id: crypto.randomUUID(), checks: cleanChecks(legacy.checks, legacy.started) }]
            }
            setLegacyAvailable(old.length > 0)
          }
        } catch(error) {
          if (!cancelled) setCloudError(error instanceof Error ? error.message : "Błąd synchronizacji Bonsai.")
        }
      } catch {
        if (!cancelled) window.location.replace("/login")
      } finally {
        if (!cancelled) setLoaded(true)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  async function refresh() {
    const response = await fetch("/api/bonsai", { cache: "no-store" })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || "Nie udało się odświeżyć drzewek.")
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
  const nextOpening = nowMs ? remainingUntilNextOpening(now) : 0
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
    setChosen(habitIndex)
    setCategory("Wszystkie")
    setTab("catalog")
  }
  function chooseNextHabit() {
    setCategory("Wszystkie")
    setTab("catalog")
  }
  const filtered = useMemo(() => availableHabits
    .filter(habit => category === "Wszystkie" || habit.category === category), [category])

  async function plantTree() {
    if (!user || busy || !canPlant) return
    const success = await post("plant",{habitIndex:chosen,cue})
    if (success) { setTab("today"); setCategory("Wszystkie") }
  }

  async function markDone(treeId: string) {
    if (!user || busy || !windowDay) return
    const success=await post("check",{treeId})
    if(success)setHarvestNotice("🌾 Dzisiejszy plon zasilił wspólne zapasy Strefy B!")
  }

  if (!loaded || !nowMs) return <main style={{ padding: 30 }}>Ładowanie Biostacji…</main>
  if (!user) return <main style={{ padding: 30 }}>Nie udało się odczytać konta. <Link href="/login">Zaloguj się</Link>.</main>

  return <main className="sb-app-page sb-theme-green sb-bio-page" style={{
    minHeight: "100vh", background: "linear-gradient(180deg,#f0f9f1,#f7faf8)",
    padding: "26px 16px 60px", color: "#193a2b",
  }}>
    <div style={{ maxWidth: 800, margin: "auto" }}>
      <header className="sb-bio-header" style={{ margin: "0 0 24px" }}>
        <p className="sb-small-label" style={{margin:"0 0 9px"}}>STREFA B / SEKTOR UPRAW</p>
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
      {harvestNotice&&<p role="status" className="sb-bio-harvest-notice">{harvestNotice}</p>}

      {storageWarning && <p role="alert" style={{
        padding: 14, background: "#fff2d7", borderRadius: 12, color: "#71470c",
      }}>Nie udało się odczytać wcześniejszych lokalnych postępów.</p>}

      {cloudError && <p role="alert" style={{padding:14,background:"#fee2e2",color:"#991b1b",borderRadius:12}}>{cloudError}</p>}

      {legacyAvailable && trees.length === 0 && <section className="sb-surface" style={{ ...surface, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0, fontSize: 20 }}>Masz zapisane wcześniejsze drzewko</h2>
        <p>Na tym urządzeniu są starsze postępy. Jeśli należą do Ciebie, przenieś je do swojego konta. Będą widoczne dla wychowawcy.</p>
        <button style={{...button,opacity:busy?.6:1}} disabled={busy} onClick={importLegacy}>{busy?"Przenoszenie…":"Przenieś moje drzewka do konta"}</button>
      </section>}

      <nav className="sb-bonsai-tabs" aria-label="Zakładki Bonsai" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {([["today", "Dzisiaj"], ["progress", "Mój ogród"], ["catalog", "Nawyki"]] as const)
          .map(([id, label]) => <button key={id} onClick={() => setTab(id)}
            aria-current={tab === id ? "page" : undefined}
            style={{ ...button, background: tab === id ? "#246b49" : "#e0eee4",
              color: tab === id ? "white" : "#21533a" }}>{label}</button>)}
      </nav>

      {tab === "today" && activeTrees.length>0 && <section className="sb-bio-missions" aria-label="Twoje aktywne nawyki">
        {activeTrees.map(tree=><div className="sb-bio-active-mission" key={tree.id}>
          <div className="sb-bio-mission-heading">
            <span className="sb-bio-signal">◉ TWOJA AKTYWNA MISJA</span>
            <span>DZIEŃ {Math.min(28,daysBetween(tree.started,plantingDay)+1)} / 28</span>
          </div>
          <h2>{habits[tree.habitIndex].title}</h2>
          <p className="sb-bio-action">{habits[tree.habitIndex].action}</p>
          <p className="sb-bio-cue">⌁ Twój sygnał: {tree.cue.toLowerCase()}</p>
          <div className="sb-bio-mission-bottom">
            <span>{tree.checks.length} potwierdzonych dni</span>
            <span>{windowDay?"Okno potwierdzeń otwarte":"Potwierdzanie od 20:00"}</span>
          </div>
        </div>)}
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
        {activeTrees.map((tree, index) => {
          const dayIndex = daysBetween(tree.started, plantingDay) + 1
          const eligible = !!windowDay &&
            daysBetween(tree.started, windowDay) >= 0 &&
            daysBetween(tree.started, windowDay) < GROWTH_DAYS
          const checked = Boolean(windowDay && tree.checks.includes(windowDay))
          return <section key={tree.id} style={surface}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, color: "#527460" }}>
              <strong>Uprawa {trees.indexOf(tree) + 1}</strong>
              <span><strong>Dzień {Math.min(GROWTH_DAYS, dayIndex)} z {GROWTH_DAYS}</strong> · {tree.checks.length} wykonanych dni</span>
            </div>
            <BiostationPlot count={tree.checks.length}/>
            <p className="sb-bio-plot-caption">{habits[tree.habitIndex].title} • {habits[tree.habitIndex].action}</p>
            
            <p style={{ textAlign: "center", color: "#5e7969" }}>Mój sygnał: {tree.cue.toLowerCase()}</p>
            {checked
              ? <div style={{ textAlign: "center", padding: 15, borderRadius: 14, background: "#c7ead2", color: "#205636", fontWeight: 700 }}>
                  ✓ Potwierdzone! Następne potwierdzenie od 20:00
                  <div style={{ fontSize: 20, marginTop: 5, fontVariantNumeric: "tabular-nums" }}>{countdown(nextOpening)}</div>
                </div>
              : eligible
                ? <button onClick={() => markDone(tree.id)} disabled={busy} className="sb-pill-button sb-grow-highlight" style={{ ...button, width: "100%", opacity:busy?.6:1 }}>
                    ✓ Potwierdzam dzisiejszy nawyk (+1 żywność)
                  </button>
                : <div style={{ textAlign: "center", padding: 14, borderRadius: 14, background: "#f1f5f2" }}>
                    <div>Potwierdzenie dostępne od 20:00 za:</div>
                    <strong style={{ fontSize: 23, fontVariantNumeric: "tabular-nums" }}>{countdown(nextOpening)}</strong>
                  </div>}
            <p style={{ textAlign: "center", color: "#5e7969", fontSize: 13, marginBottom: 0 }}>Każde potwierdzenie to kolejny mały krok. Przerwa nie przekreśla postępu.</p>
          </section>
        })}
        {canPlant && trees.length > 0 && <section className="sb-surface" style={{ ...surface, background: "#e6f5e9" }}>
          <h2 style={{ marginTop: 0 }}>🌱 Możesz uruchomić kolejną uprawę!</h2>
          <p>Od ostatniego rozpoczęcia minęły dwa tygodnie. Możesz dodać nowy nawyk i rozwijać dwa poletka równolegle.</p>
          <button className="sb-pill-button" style={button} onClick={() => setTab("catalog")}>Rozpocznij nową uprawę</button>
        </section>}
        {!canPlant && newTreeDay && activeTrees.length < 2 && <section className="sb-surface" style={surface}>
          <strong>Nowa uprawa od {readableDate(newTreeDay)}</strong>
          <p style={{ color: "#527460", marginBottom: 0 }}>
            Jeszcze {daysBetween(plantingDay, newTreeDay)} {daysBetween(plantingDay, newTreeDay) === 1 ? "dzień" : "dni"} do kolejnego sadzenia.
          </p>
        </section>}
      </div>}

      {tab === "catalog" && <section className="sb-surface" style={surface}>
        <h2 style={{ marginTop: 0 }}>Wybierz swój nawyk</h2>
        <p>Jedna uprawa trwa 28 dni. Możesz prowadzić maksymalnie dwa nawyki naraz. Nową uprawę rozpoczniesz po 14 dniach.
          {newTreeDay && !canPlant ? ` Następny start: ${readableDate(newTreeDay)}.` : ""}
        </p>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 750 }}>Obszar rozwoju</label>
        <div className="sb-bio-categories" role="group" aria-label="Kategorie nawyków">
          {categories.map(value=><button type="button" key={value} onClick={()=>setCategory(value)}
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
            <span><strong>{habit.title}</strong><span style={{ display: "block", marginTop: 4, color: "#537565", fontSize: 13 }}>{habit.action}</span></span>
          </label>)}
        </div>
        <label htmlFor="bonsaiCue" style={{ display: "block", margin: "18px 0 6px" }}>Kiedy będziesz wykonywać nawyk?</label>
        <select id="bonsaiCue" value={cue} onChange={event => setCue(event.target.value)}
          style={{ padding: 12, borderRadius: 12, width: "100%", marginBottom: 14 }}>
          {cues.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
        <p style={{ color: "#537565", fontSize: 13 }}>Nawyk możesz wykonać o dowolnej porze. Potwierdzasz go dopiero wieczorem.</p>
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

      <p style={{ color: "#688574", fontSize: 12, lineHeight: 1.6, marginTop: 20 }}>
        Drzewka i potwierdzenia zapisują się na Twoim koncie i synchronizują między urządzeniami.
        Wychowawca może zobaczyć wybrane nawyki i dni ich wykonania.
        O godzinie potwierdzenia decyduje zegar serwera.
      </p>
    </div>
  </main>
}
