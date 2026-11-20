"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  addDays, countdown, currentCheckInDay, currentPlantingDay, daysBetween,
  isValidDay, readableDate, remainingUntilNextOpening,
} from "../../lib/bonsai-time"

type Habit = { title: string; action: string; category: string }
const habits: Habit[] = [
  { title: "Zasada dwóch minut", action: "Otwórz zeszyt na dwie minuty.", category: "Rozpoczynanie" },
  { title: "Telefon poza zasięgiem", action: "Odłóż telefon poza zasięg ręki przed nauką.", category: "Rozpoczynanie" },
  { title: "Jedno zadanie na start", action: "Zapisz jedno konkretne zadanie do zrobienia.", category: "Rozpoczynanie" },
  { title: "Stały sygnał", action: "Zacznij naukę od tego samego małego rytuału.", category: "Rozpoczynanie" },
  { title: "Przygotowanie wieczorem", action: "Połóż materiały na jutro na biurku.", category: "Rozpoczynanie" },
  { title: "Jeden przykład", action: "Gdy nie masz ochoty, rozwiąż jeden przykład.", category: "Rozpoczynanie" },
  { title: "Pytanie z pamięci", action: "Zamknij zeszyt i odpowiedz na jedno pytanie.", category: "Skuteczna nauka" },
  { title: "Powtórka tego samego dnia", action: "Przypomnij sobie jedną rzecz z dzisiejszej lekcji.", category: "Skuteczna nauka" },
  { title: "Jedna fiszka", action: "Zapisz jedną fiszkę: pytanie i odpowiedź.", category: "Skuteczna nauka" },
  { title: "Wytłumacz na głos", action: "Wyjaśnij jedno pojęcie własnymi słowami.", category: "Skuteczna nauka" },
  { title: "Zeszyt błędów", action: "Zapisz jeden błąd i poprawne rozwiązanie.", category: "Skuteczna nauka" },
  { title: "Przed nowym tematem", action: "Przypomnij sobie jedną rzecz z poprzedniego tematu.", category: "Skuteczna nauka" },
  { title: "Jedno pytanie", action: "Zapisz pytanie, które przyszło Ci do głowy.", category: "Ciekawość" },
  { title: "Dwie strony książki", action: "Przeczytaj dwie strony wybranej książki.", category: "Ciekawość" },
  { title: "Słowo dnia", action: "Zapisz jedno poznane dziś słowo lub pojęcie.", category: "Ciekawość" },
  { title: "Sprawdź, zamiast zgadywać", action: "Znajdź wyjaśnienie jednej nieznanej rzeczy.", category: "Ciekawość" },
  { title: "Połączenie z życiem", action: "Znajdź praktyczny przykład tematu z lekcji.", category: "Ciekawość" },
  { title: "Codzienne dlaczego", action: "Zadaj jedno pytanie: dlaczego tak jest?", category: "Ciekawość" },
  { title: "Minuta pomocy", action: "Poświęć chwilę, by pomóc koledze coś zrozumieć.", category: "Wspólnota" },
  { title: "Docenianie wysiłku", action: "Doceń konkretny wysiłek drugiej osoby.", category: "Wspólnota" },
  { title: "Podziel się odkryciem", action: "Opowiedz komuś jedną ciekawostkę.", category: "Wspólnota" },
  { title: "Pytanie zamiast odpowiedzi", action: "Pomagając, zadaj pytanie naprowadzające.", category: "Wspólnota" },
  { title: "Szanuj pytania", action: "Potraktuj poważnie czyjeś proste pytanie.", category: "Wspólnota" },
  { title: "Sprawdźcie się nawzajem", action: "Zadaj koledze pytanie powtórkowe.", category: "Wspólnota" },
  { title: "Małe zwycięstwo", action: "Zapisz jedną rzecz, której się nauczyłeś.", category: "Samodyscyplina" },
  { title: "Zaznaczony dzień", action: "Zaznacz wykonanie wybranego nawyku.", category: "Samodyscyplina" },
  { title: "Powrót po przerwie", action: "Wróć do nawyku po dniu przerwy.", category: "Samodyscyplina" },
  { title: "Jedna poprawka", action: "Nazwij jedną zmianę, która pomoże Ci się uczyć.", category: "Samodyscyplina" },
  { title: "Plan na jutro", action: "Zapisz jeden priorytet na następny dzień.", category: "Samodyscyplina" },
  { title: "Przygotowanie do snu", action: "Ustaw przypomnienie o wieczornym wyciszeniu.", category: "Samodyscyplina" },
]

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

function Tree({ count }: { count: number }) {
  const stage = count === 0 ? "🌰" : count < 4 ? "🌱" : count < 10 ? "🌿" : count < 20 ? "🪴" : "🌳"
  return <div aria-label={`Bonsai: ${count} wykonanych dni`} style={{ fontSize: 82, textAlign: "center", lineHeight: 1.2, padding: "8px 0" }}>{stage}</div>
}

function ProgressCalendar({ tree }: { tree: BonsaiTree }) {
  return <div aria-label="Kalendarz 28 dni" style={{
    display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 7,
  }}>
    {Array.from({ length: GROWTH_DAYS }, (_, index) => {
      const day = addDays(tree.started, index)
      const marked = tree.checks.includes(day)
      return <div key={day} title={readableDate(day)} style={{
        borderRadius: 10, padding: "11px 0", textAlign: "center", fontWeight: 700,
        background: marked ? "#bbdfc6" : "#eef3ef",
        color: marked ? "#205636" : "#6d8575",
      }}>{marked ? "✓" : index + 1}</div>
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
  const [chosen, setChosen] = useState(6)
  const [cue, setCue] = useState("Po kolacji")
  const [category, setCategory] = useState("Wszystkie")
  const [tab, setTab] = useState<"today" | "catalog" | "progress">("today")
  const [nowMs, setNowMs] = useState(0)

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
        if (!response.ok) throw new Error("Session unavailable")
        const data = await response.json()
        if (!data.name) { window.location.replace("/login"); return }
        if (data.mustChangePassword) { window.location.replace("/ustaw-haslo"); return }
        if (cancelled) return
        const name = String(data.name)
        setUser(name)
        try {
          const saved = localStorage.getItem(storageKey(name))
          const forest = parseForest(saved)
          setTrees(forest)
          if (forest.length === 0) {
            const legacy = localStorage.getItem(LEGACY_KEY)
            setLegacyAvailable(Boolean(legacy && validLegacy(JSON.parse(legacy))))
          }
        } catch { setStorageWarning(true) }
      } catch {
        if (!cancelled) window.location.replace("/login")
      } finally { if (!cancelled) setLoaded(true) }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!user) return
    const sync = (event: StorageEvent) => {
      if (event.key === storageKey(user)) setTrees(parseForest(event.newValue))
    }
    window.addEventListener("storage", sync)
    return () => window.removeEventListener("storage", sync)
  }, [user])

  function save(next: BonsaiTree[]): boolean {
    if (!user) return false
    try {
      localStorage.setItem(storageKey(user), JSON.stringify(next))
      setTrees(next)
      return true
    } catch {
      setStorageWarning(true)
      return false
    }
  }

  function importLegacy() {
    if (!user || trees.length !== 0) return
    try {
      const raw = localStorage.getItem(LEGACY_KEY)
      const parsed: unknown = JSON.parse(raw || "null")
      if (!validLegacy(parsed)) return
      const converted: BonsaiTree = {
        id: crypto.randomUUID(), habitIndex: parsed.habitIndex, cue: parsed.cue,
        started: parsed.started, checks: cleanChecks(parsed.checks, parsed.started),
      }
      if (save([converted])) {
        localStorage.removeItem(LEGACY_KEY)
        setLegacyAvailable(false)
      }
    } catch { setStorageWarning(true) }
  }

  const now = new Date(nowMs || 0)
  const plantingDay = nowMs ? currentPlantingDay(now) : ""
  const windowDay = nowMs ? currentCheckInDay(now) : null
  const nextOpening = nowMs ? remainingUntilNextOpening(now) : 0
  const latest = trees[trees.length - 1]
  const newTreeDay = latest ? addDays(latest.started, PLANTING_INTERVAL) : null
  const canPlant = !!nowMs && (!newTreeDay || plantingDay >= newTreeDay)
  const activeTrees = trees.filter(tree => plantingDay >= tree.started &&
    daysBetween(tree.started, plantingDay) < GROWTH_DAYS)
  const completedTrees = trees.filter(tree => plantingDay >= addDays(tree.started, GROWTH_DAYS))
  const filtered = useMemo(() => habits.map((habit, index) => ({ ...habit, index }))
    .filter(habit => category === "Wszystkie" || habit.category === category), [category])

  function plantTree() {
    if (!user) return
    const current = new Date()
    const day = currentPlantingDay(current)
    let stored: BonsaiTree[] = trees
    try { stored = parseForest(localStorage.getItem(storageKey(user))) } catch { setStorageWarning(true); return }
    const last = stored[stored.length - 1]
    if (last && day < addDays(last.started, PLANTING_INTERVAL)) return
    const next: BonsaiTree = { id: crypto.randomUUID(), habitIndex: chosen, cue, started: day, checks: [] }
    if (save([...stored, next])) {
      setTab("today")
      setCategory("Wszystkie")
    }
  }

  function markDone(treeId: string) {
    if (!user) return
    const current = new Date()
    const day = currentCheckInDay(current)
    if (!day) return
    let stored: BonsaiTree[] = trees
    try { stored = parseForest(localStorage.getItem(storageKey(user))) } catch { setStorageWarning(true); return }
    const target = stored.find(tree => tree.id === treeId)
    if (!target || daysBetween(target.started, day) < 0 ||
      daysBetween(target.started, day) >= GROWTH_DAYS || target.checks.includes(day)) return
    save(stored.map(tree => tree.id === treeId
      ? { ...tree, checks: [...tree.checks, day].sort() }
      : tree))
  }

  if (!loaded || !nowMs) return <main style={{ padding: 30 }}>Ładowanie Bonsai…</main>
  if (!user) return <main style={{ padding: 30 }}>Nie udało się odczytać konta. <Link href="/login">Zaloguj się</Link>.</main>

  return <main style={{
    minHeight: "100vh", background: "linear-gradient(180deg,#f0f9f1,#f7faf8)",
    padding: "26px 16px 60px", color: "#193a2b",
  }}>
    <div style={{ maxWidth: 800, margin: "auto" }}>
      <Link href="/" style={{ color: "#386e4d", textDecoration: "none" }}>← Strefa B</Link>
      <header style={{ margin: "20px 0 24px" }}>
        <h1 style={{ fontSize: 40, margin: "0 0 6px" }}>🌱 Bonsai</h1>
        <p style={{ margin: 0, color: "#537565", fontSize: 17 }}>
          Jedno drzewko, jeden nawyk, cztery tygodnie małych kroków.
        </p>
      </header>

      <section style={{ ...surface, marginBottom: 18, background: "#edf8ef" }}>
        <strong style={{ fontSize: 17 }}>Jak działa Bonsai?</strong>
        <p style={{ lineHeight: 1.7, margin: "10px 0" }}>
          Wybierasz mały nawyk i realizujesz go codziennie przez <strong>28 dni</strong>.
          Każdego wieczoru <strong>od 20:00</strong> możesz potwierdzić, że udało Ci się go wykonać.
          Jeden dzień = jedno nieodwracalne potwierdzenie dla każdego drzewka.
          Co <strong>14 dni</strong> możesz zasadzić następne drzewko, nie kończąc poprzedniego.
        </p>
        <div style={{ padding: "13px 16px", background: "white", borderRadius: 14 }}>
          {windowDay
            ? <strong style={{ color: "#246b49" }}>✓ Wieczorne potwierdzanie jest już dostępne!</strong>
            : <><span style={{ display: "block", color: "#527460", fontSize: 13 }}>Do kolejnego potwierdzania od 20:00 pozostało:</span>
              <strong aria-live="off" style={{ fontSize: 27, fontVariantNumeric: "tabular-nums" }}>{countdown(nextOpening)}</strong></>}
        </div>
      </section>

      {storageWarning && <p role="alert" style={{
        padding: 14, background: "#fff2d7", borderRadius: 12, color: "#71470c",
      }}>Przeglądarka blokuje zapis postępów. Sprawdź ustawienia pamięci przeglądarki.</p>}

      {legacyAvailable && trees.length === 0 && <section style={{ ...surface, marginBottom: 18 }}>
        <h2 style={{ marginTop: 0, fontSize: 20 }}>Masz zapisane wcześniejsze drzewko</h2>
        <p>Na tym urządzeniu znaleziono postępy ze starszej wersji Bonsai. Jeśli są Twoje, możesz je przenieść do tego konta. Stare wyzwanie zostanie skrócone do 28 dni.</p>
        <button style={button} onClick={importLegacy}>Przenieś moje wcześniejsze drzewko</button>
      </section>}

      <nav aria-label="Zakładki Bonsai" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {([["today", "Moje drzewka"], ["catalog", "Biblioteka"], ["progress", "Bilans"]] as const)
          .map(([id, label]) => <button key={id} onClick={() => setTab(id)}
            aria-current={tab === id ? "page" : undefined}
            style={{ ...button, background: tab === id ? "#246b49" : "#e0eee4",
              color: tab === id ? "white" : "#21533a" }}>{label}</button>)}
      </nav>

      {tab === "today" && <div style={{ display: "grid", gap: 16 }}>
        {trees.length === 0 && <section style={surface}>
          <h2 style={{ marginTop: 0 }}>Zasadź swoje pierwsze drzewko</h2>
          <p>Wybierz nawyk z biblioteki. Wieczorem sprawdzisz, czy udało Ci się go wykonać.</p>
          <Tree count={0}/>
          <button style={button} onClick={() => setTab("catalog")}>Przejdź do biblioteki</button>
        </section>}
        {trees.length > 0 && activeTrees.length === 0 && <section style={surface}>
          <h2 style={{ marginTop: 0 }}>Twoje dotychczasowe drzewka zakończyły wzrost</h2>
          <p>Wszystkie znajdziesz w Bilansie. Możesz wybrać kolejne wyzwanie, gdy miną dwa tygodnie od ostatniego sadzenia.</p>
        </section>}
        {activeTrees.map((tree, index) => {
          const dayIndex = daysBetween(tree.started, plantingDay) + 1
          const eligible = !!windowDay &&
            daysBetween(tree.started, windowDay) >= 0 &&
            daysBetween(tree.started, windowDay) < GROWTH_DAYS
          const checked = Boolean(windowDay && tree.checks.includes(windowDay))
          return <section key={tree.id} style={surface}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, color: "#527460" }}>
              <strong>Drzewko {trees.indexOf(tree) + 1}</strong>
              <span>Dzień {Math.min(GROWTH_DAYS, dayIndex)} z {GROWTH_DAYS}</span>
            </div>
            <Tree count={tree.checks.length}/>
            <h2 style={{ textAlign: "center", margin: "2px 0 10px" }}>{habits[tree.habitIndex].title}</h2>
            <p style={{ textAlign: "center", lineHeight: 1.65 }}>{habits[tree.habitIndex].action}</p>
            <p style={{ textAlign: "center", color: "#5e7969" }}>Mój sygnał: {tree.cue.toLowerCase()}</p>
            {checked
              ? <div style={{ textAlign: "center", padding: 15, borderRadius: 14, background: "#c7ead2", color: "#205636", fontWeight: 700 }}>
                  ✓ Potwierdzone! Następne potwierdzenie od 20:00
                  <div style={{ fontSize: 20, marginTop: 5, fontVariantNumeric: "tabular-nums" }}>{countdown(nextOpening)}</div>
                </div>
              : eligible
                ? <button onClick={() => markDone(tree.id)} style={{ ...button, width: "100%" }}>
                    ✓ Wykonałem dziś swój nawyk
                  </button>
                : <div style={{ textAlign: "center", padding: 14, borderRadius: 14, background: "#f1f5f2" }}>
                    <div>Potwierdzenie dostępne od 20:00 za:</div>
                    <strong style={{ fontSize: 23, fontVariantNumeric: "tabular-nums" }}>{countdown(nextOpening)}</strong>
                  </div>}
            <p style={{ textAlign: "center", color: "#5e7969", fontSize: 13, marginBottom: 0 }}>
              Wykonane dni: {tree.checks.length} / {GROWTH_DAYS}. Raz potwierdzonego dnia nie można odkliknąć.
            </p>
          </section>
        })}
        {canPlant && trees.length > 0 && <section style={{ ...surface, background: "#e6f5e9" }}>
          <h2 style={{ marginTop: 0 }}>🌱 Czas na następne drzewko!</h2>
          <p>Od ostatniego sadzenia minęły dwa tygodnie. Możesz rozpocząć kolejny nawyk, a poprzedni nadal pielęgnować.</p>
          <button style={button} onClick={() => setTab("catalog")}>Zasadź następne Bonsai</button>
        </section>}
        {!canPlant && newTreeDay && <section style={surface}>
          <strong>Kolejne drzewko od {readableDate(newTreeDay)}</strong>
          <p style={{ color: "#527460", marginBottom: 0 }}>
            Jeszcze {daysBetween(plantingDay, newTreeDay)} {daysBetween(plantingDay, newTreeDay) === 1 ? "dzień" : "dni"} do kolejnego sadzenia.
          </p>
        </section>}
      </div>}

      {tab === "catalog" && <section style={surface}>
        <h2 style={{ marginTop: 0 }}>Biblioteka nawyków</h2>
        <p>Jedno drzewko rośnie przez 28 dni. Po 14 dniach możesz zasadzić kolejne.
          {newTreeDay && !canPlant ? ` Najbliższe sadzenie: ${readableDate(newTreeDay)}.` : ""}
        </p>
        <label htmlFor="bonsaiCategory" style={{ display: "block", marginBottom: 6 }}>Obszar</label>
        <select id="bonsaiCategory" value={category} onChange={event => setCategory(event.target.value)}
          style={{ padding: 12, width: "100%", borderRadius: 12, marginBottom: 14 }}>
          {categories.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
        <div style={{ display: "grid", gap: 9, maxHeight: 390, overflowY: "auto" }}>
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
        <button disabled={!canPlant} style={{ ...button, opacity: canPlant ? 1 : .55, cursor: canPlant ? "pointer" : "not-allowed" }}
          onClick={plantTree}>{trees.length === 0 ? "Zasadzam pierwsze Bonsai" : "Zasadzam kolejne Bonsai"}</button>
        {!canPlant && newTreeDay && <p style={{ color: "#527460" }}>Możesz zasadzić następne drzewko od {readableDate(newTreeDay)}.</p>}
      </section>}

      {tab === "progress" && <div style={{ display: "grid", gap: 16 }}>
        <section style={surface}>
          <h2 style={{ marginTop: 0 }}>Twój mały las</h2>
          <p style={{ marginBottom: 0 }}><strong>{trees.length}</strong> zasadzonych drzewek • <strong>{completedTrees.length}</strong> zakończonych wyzwań • <strong>{trees.reduce((sum, tree) => sum + tree.checks.length, 0)}</strong> potwierdzonych dni łącznie.</p>
        </section>
        {trees.length === 0 && <section style={surface}>Zasadź pierwsze drzewko, żeby zobaczyć swój bilans.</section>}
        {trees.map((tree, index) => {
          const finished = plantingDay >= addDays(tree.started, GROWTH_DAYS)
          return <section key={tree.id} style={surface}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <strong>Drzewko {index + 1}: {habits[tree.habitIndex].title}</strong>
                <p style={{ color: "#627b6b", fontSize: 13, margin: "6px 0" }}>
                  {readableDate(tree.started)} – {readableDate(addDays(tree.started, GROWTH_DAYS - 1))}
                </p>
              </div>
              <span style={{ color: finished ? "#285b3e" : "#62806a", fontWeight: 700 }}>
                {finished ? "Zakończone" : "W trakcie"}
              </span>
            </div>
            <Tree count={tree.checks.length}/>
            <p style={{ textAlign: "center" }}><strong>{tree.checks.length}</strong> z {GROWTH_DAYS} dni</p>
            <ProgressCalendar tree={tree}/>
          </section>
        })}
        <p style={{ color: "#5c7966", fontSize: 13 }}>Nie musisz mieć idealnego wyniku. Ważne, że wracasz do swoich nawyków.</p>
      </div>}

      <p style={{ color: "#688574", fontSize: 12, lineHeight: 1.6, marginTop: 20 }}>
        Postępy są zapisywane tylko w tej przeglądarce, osobno dla każdego zalogowanego imienia.
        Nie synchronizują się między urządzeniami. Zmiana zegara urządzenia lub usunięcie danych przeglądarki może wpłynąć na zapisane wyniki.
      </p>
    </div>
  </main>
}
