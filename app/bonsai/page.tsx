"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

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
type Challenge = { habitIndex: number; cue: string; started: string; checks: string[] }
const key = "strefa-b-bonsai-v1"
const dateKey = (d: Date) => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-")
const todayKey = () => dateKey(new Date())
function daysBetween(a: string, b: string) {
  const start = new Date(a + "T12:00:00")
  const end = new Date(b + "T12:00:00")
  return Math.round((end.getTime() - start.getTime()) / 86400000)
}
function Tree({ count }: { count: number }) {
  const stage = count === 0 ? "🌰" : count < 4 ? "🌱" : count < 10 ? "🌿" : count < 20 ? "🪴" : "🌳"
  return <div aria-label={`Drzewko Bonsai, wykonane działania: ${count}`} style={{ fontSize: 100, textAlign: "center", padding: "20px 0", lineHeight: 1.2 }}>{stage}</div>
}
export default function BonsaiPage() {
  const [loaded, setLoaded] = useState(false)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [chosen, setChosen] = useState(6)
  const [cue, setCue] = useState("Po kolacji")
  const [category, setCategory] = useState("Wszystkie")
  const [tab, setTab] = useState<"today" | "catalog" | "progress">("today")
  const [now, setNow] = useState("")
  useEffect(() => {
    setNow(todayKey())
    try {
      const saved = localStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved) as Challenge
        if (Number.isInteger(parsed.habitIndex) && parsed.habitIndex >= 0 && parsed.habitIndex < habits.length && Array.isArray(parsed.checks) && typeof parsed.started === "string" && typeof parsed.cue === "string") {
          setChallenge(parsed)
          setChosen(parsed.habitIndex)
          setCue(parsed.cue)
        }
      }
    } catch { /* Nie blokuj ekranu, jeżeli dane lokalne są nieczytelne. */ }
    setLoaded(true)
  }, [])
  function save(next: Challenge | null) {
    setChallenge(next)
    try {
      if (next) localStorage.setItem(key, JSON.stringify(next))
      else localStorage.removeItem(key)
    } catch { /* Tryb prywatny może blokować zapis lokalny. */ }
  }
  const dayNumber = challenge && now ? daysBetween(challenge.started, now) + 1 : 1
  const active = Boolean(challenge && dayNumber >= 1 && dayNumber <= 30)
  const checkedToday = Boolean(challenge && now && challenge.checks.includes(now))
  const count = challenge?.checks.length ?? 0
  const filtered = useMemo(() => habits.map((h, i) => ({ ...h, i })).filter(h => category === "Wszystkie" || h.category === category), [category])
  const surface: React.CSSProperties = { background: "white", borderRadius: 24, padding: 22, border: "1px solid #dcece1", boxShadow: "0 8px 26px rgba(22,69,40,.05)" }
  const button: React.CSSProperties = { border: 0, padding: "13px 18px", borderRadius: 14, background: "#246b49", color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer" }
  if (!loaded) return <main style={{ padding: 30 }}>Ładowanie Bonsai…</main>
  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#f0f9f1,#f7faf8)", padding: "26px 16px 60px", color: "#193a2b" }}>
      <div style={{ maxWidth: 800, margin: "auto" }}>
        <Link href="/" style={{ color: "#386e4d", textDecoration: "none" }}>← Strefa B</Link>
        <header style={{ margin: "20px 0 24px" }}>
          <h1 style={{ fontSize: 40, margin: "0 0 6px" }}>🌱 Bonsai</h1>
          <p style={{ margin: 0, color: "#537565", fontSize: 17 }}>Wielkie zmiany wyrastają z małych nawyków.</p>
        </header>
        <nav aria-label="Zakładki Bonsai" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {([["today", "Dzisiaj"], ["catalog", "Biblioteka"], ["progress", "Bilans"]] as const).map(([id, label]) =>
            <button key={id} onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined} style={{ ...button, background: tab === id ? "#246b49" : "#e0eee4", color: tab === id ? "white" : "#21533a" }}>{label}</button>
          )}
        </nav>
        {tab === "today" && <section style={surface}>
          {!challenge ? <>
            <h2 style={{ marginTop: 0 }}>Twoje pierwsze ziarenko</h2>
            <p>Wybierz jeden drobny nawyk. Nawet dwie minuty dziennie wystarczą, żeby zacząć.</p>
            <Tree count={0}/>
            <button style={button} onClick={() => setTab("catalog")}>Wybieram nawyk</button>
          </> : <>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", color: "#527460" }}>
              <span>Twoje wyzwanie</span><strong>Dzień {Math.min(30, dayNumber)} z 30</strong>
            </div>
            <Tree count={count}/>
            <h2 style={{ textAlign: "center", margin: "0 0 10px" }}>{habits[challenge.habitIndex].title}</h2>
            <p style={{ textAlign: "center", fontSize: 17 }}>{habits[challenge.habitIndex].action}</p>
            <p style={{ textAlign: "center", color: "#537565" }}>Bodziec: {challenge.cue.toLowerCase()}</p>
            {active ? <button style={{ ...button, width: "100%", background: checkedToday ? "#bcd9c4" : "#246b49", color: checkedToday ? "#1d5133" : "white" }} onClick={() => save({ ...challenge, checks: checkedToday ? challenge.checks.filter(d => d !== now) : [...challenge.checks, now] })}>
              {checkedToday ? "✓ Zrobione! Kliknij, by cofnąć" : "Zrobiłem dziś mały krok"}
            </button> : <p style={{ textAlign: "center" }}>Zakończyłeś 30 dni. Możesz wybrać nowy nawyk w Bibliotece.</p>}
            <p style={{ textAlign: "center", fontSize: 13, color: "#587564" }}>Przerwa nie przekreśla postępu. Ważne, że wracasz.</p>
          </>}
        </section>}
        {tab === "catalog" && <section style={surface}>
          <h2 style={{ marginTop: 0 }}>Biblioteka nawyków</h2>
          <p>Wybierz tylko jeden. Każde wyzwanie trwa 30 dni.</p>
          <label htmlFor="category" style={{ display: "block", marginBottom: 6 }}>Obszar</label>
          <select id="category" value={category} onChange={e => setCategory(e.target.value)} style={{ padding: 12, width: "100%", borderRadius: 12, marginBottom: 14 }}>
            {["Wszystkie", "Rozpoczynanie", "Skuteczna nauka", "Ciekawość", "Wspólnota", "Samodyscyplina"].map(c => <option key={c}>{c}</option>)}
          </select>
          <div style={{ display: "grid", gap: 9, maxHeight: 390, overflowY: "auto" }}>
            {filtered.map(h => <label key={h.i} style={{ display: "flex", gap: 12, border: chosen === h.i ? "2px solid #4a9667" : "1px solid #dcece1", borderRadius: 14, padding: 12, cursor: "pointer" }}>
              <input type="radio" name="habit" checked={chosen === h.i} onChange={() => setChosen(h.i)}/>
              <span><strong>{h.title}</strong><br/><small style={{ color: "#537565" }}>{h.action}</small></span>
            </label>)}
          </div>
          <label htmlFor="cue" style={{ display: "block", margin: "18px 0 6px" }}>Kiedy wykonasz swój mały krok?</label>
          <select id="cue" value={cue} onChange={e => setCue(e.target.value)} style={{ padding: 12, borderRadius: 12, width: "100%", marginBottom: 14 }}>
            {["Po śniadaniu", "Po pierwszej lekcji", "Po powrocie ze szkoły", "Po kolacji", "Przed snem"].map(c => <option key={c}>{c}</option>)}
          </select>
          <button style={button} onClick={() => {
            if (challenge && !window.confirm("Nowe wyzwanie zastąpi obecne i wyzeruje jego kalendarz. Kontynuować?")) return
            save({ habitIndex: chosen, cue, started: todayKey(), checks: [] })
            setTab("today")
          }}>Zasadzam swoje Bonsai</button>
        </section>}
        {tab === "progress" && <section style={surface}>
          <h2 style={{ marginTop: 0 }}>Bilans małych kroków</h2>
          {!challenge ? <p>Najpierw wybierz nawyk w Bibliotece.</p> : <>
            <p><strong>{count}</strong> wykonanych dni • <strong>{Math.max(0, Math.min(30, dayNumber))}</strong> dni od rozpoczęcia</p>
            <div aria-label="Kalendarz wyzwania" style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 }}>
              {Array.from({ length: 30 }, (_, i) => {
                const d = new Date(challenge.started + "T12:00:00")
                d.setDate(d.getDate() + i)
                const checked = challenge.checks.includes(dateKey(d))
                return <div key={i} title={dateKey(d)} style={{ textAlign: "center", padding: "12px 0", borderRadius: 12, background: checked ? "#b4dec0" : "#eef3ef", fontWeight: 700 }}>{checked ? "✓" : i + 1}</div>
              })}
            </div>
            <p style={{ color: "#537565", marginBottom: 0 }}>Nie chodzi o idealną serię. Obserwuj, jak wiele małych kroków udało Ci się wykonać.</p>
          </>}
        </section>}
        <p style={{ color: "#688574", fontSize: 12, marginTop: 20 }}>Wersja testowa: dane są zapisywane wyłącznie w tej przeglądarce, nie synchronizują się z kontem i mogą być widoczne dla innych osób korzystających z tego urządzenia. Nie wpisuj tu prywatnych informacji.</p>
      </div>
    </main>
  )
}
