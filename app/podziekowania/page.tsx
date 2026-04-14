"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Thank = {
  id: string
  author: string
  person: string
  message: string
  date: string
  deleted: boolean
}

function normalizeMessage(message: string) {
  const trimmed = message.trim()
  if (!trimmed) return ""

  const lower = trimmed.toLowerCase()

  if (lower.startsWith("dziękuję za")) return trimmed
  if (lower.startsWith("za ")) return `dziękuję ${trimmed}`

  return `dziękuję za ${trimmed}`
}

function canDeleteThank(dateString: string) {
  const createdAt = new Date(dateString).getTime()
  const now = Date.now()
  return now - createdAt <= 24 * 60 * 60 * 1000
}

function isSameMonth(dateString: string, now: Date) {
  const date = new Date(dateString)
  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  )
}

function isSameYear(dateString: string, now: Date) {
  const date = new Date(dateString)
  return date.getFullYear() === now.getFullYear()
}

function buildRanking(
  thanks: Thank[],
  mode: "received" | "given",
  period: "month" | "year",
  now: Date
) {
  const filtered = thanks.filter((item) => {
    if (item.deleted) return false
    return period === "month"
      ? isSameMonth(item.date, now)
      : isSameYear(item.date, now)
  })

  const counts: Record<string, number> = {}

  filtered.forEach((item) => {
    const key = mode === "received" ? item.person : item.author
    counts[key] = (counts[key] || 0) + 1
  })

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("pl-PL")
}

const students = [
  "Ada","Amelia","Anna","Ewa","Gabriela","Hanna","Hubert","Julia",
  "Kamila","Karina","Kinga","Laura","Liliana","Miłosz","Natalia",
  "Nikola","Oleksandr","Stanisław","Szczepan","Weronika","Zuzanna","ks. Michał"
]

export default function Page() {
  const [currentUser, setCurrentUser] = useState("")
  const [thanksList, setThanksList] = useState<Thank[]>([])
  const [person, setPerson] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const now = new Date()
  const isAdmin = currentUser === "ks. Michał"

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setCurrentUser(data.name || ""))
  }, [])

  async function loadThanks() {
    const { data, error } = await supabase
      .from("thanks")
      .select("*")
      .order("date", { ascending: false })

    if (!error && data) setThanksList(data)
  }

  useEffect(() => {
    loadThanks()
  }, [])

  async function addThank() {
    setError("")
    setSuccess("")

    if (!person || !message) {
      setError("Uzupełnij dane")
      return
    }

    const newItem = {
      author: currentUser,
      person,
      message,
      date: new Date().toISOString(),
      deleted: false,
    }

    const { error } = await supabase.from("thanks").insert([newItem])

    if (error) {
      setError("Błąd zapisu")
      return
    }

    setSuccess("Dodano")
    setPerson("")
    setMessage("")
    loadThanks()
  }

  async function deleteThank(id: string) {
    await supabase.from("thanks").update({ deleted: true }).eq("id", id)
    loadThanks()
  }

  const visible = useMemo(
    () => thanksList.filter((t) => !t.deleted),
    [thanksList]
  )

  const monthlyHelpful = buildRanking(visible, "received", "month", now)
  const monthlyBuilders = buildRanking(visible, "given", "month", now)
  const yearlyHelpful = buildRanking(visible, "received", "year", now)
  const yearlyBuilders = buildRanking(visible, "given", "year", now)

  return (
    <main style={{ padding: 20 }}>
      <h1>Bohaterowie</h1>

      <p>
        Nikt na nich nie zasługuje, ale wszyscy ich potrzebujemy. Obok nich są
        także <b>Budowniczowie</b> — ci, którzy dostrzegają dobro i pomagają je
        pomnażać.
      </p>

      <div style={{ display: "grid", gap: 20 }}>
        <h2 style={{ color: "#111827" }}>Bohaterowie miesiąca</h2>
        {monthlyHelpful.map((i) => (
          <div key={i.name}>{i.name} ({i.count})</div>
        ))}

        <h2 style={{ color: "#111827" }}>Budowniczowie miesiąca</h2>
        {monthlyBuilders.map((i) => (
          <div key={i.name}>{i.name} ({i.count})</div>
        ))}

        <h2 style={{ color: "#111827" }}>Bohaterowie roku</h2>
        {yearlyHelpful.map((i) => (
          <div key={i.name}>{i.name} ({i.count})</div>
        ))}

        <h2 style={{ color: "#111827" }}>Budowniczowie roku</h2>
        {yearlyBuilders.map((i) => (
          <div key={i.name}>{i.name} ({i.count})</div>
        ))}
      </div>

      <hr style={{ margin: "20px 0" }} />

      <select
        value={person}
        onChange={(e) => setPerson(e.target.value)}
        style={{
          padding: 10,
          marginBottom: 10,
          background: "white",
          color: "#111827",
        }}
      >
        <option value="">Wybierz osobę</option>
        {students.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Za co?"
        style={{
          display: "block",
          padding: 10,
          marginBottom: 10,
          background: "white",
          color: "#111827",
        }}
      />

      <button onClick={addThank}>Dodaj</button>

      {error && <div style={{ color: "red" }}>{error}</div>}
      {success && <div style={{ color: "green" }}>{success}</div>}

      <hr style={{ margin: "20px 0" }} />

      {visible.map((item) => (
        <div key={item.id}>
          <b>{item.person}</b> — {normalizeMessage(item.message)} ({item.author})
          {(item.author === currentUser || isAdmin) && (
            <button onClick={() => deleteThank(item.id)}>Usuń</button>
          )}
        </div>
      ))}
    </main>
  )
}