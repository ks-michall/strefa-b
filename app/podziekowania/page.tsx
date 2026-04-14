"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../lib/supabase"

type Thank = {
  id: string
  author: string
  person: string
  message: string
  date: string
  deleted: boolean
}

type ThankRow = {
  id: string
  author: string
  person: string
  message: string
  created_at: string
  deleted: boolean
}

function mapRowToThank(row: ThankRow): Thank {
  return {
    id: row.id,
    author: row.author,
    person: row.person,
    message: row.message,
    date: row.created_at,
    deleted: row.deleted,
  }
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
  const hours24 = 24 * 60 * 60 * 1000
  return now - createdAt <= hours24
}

function isNewThank(dateString: string) {
  return canDeleteThank(dateString)
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
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pl"))
    .map(([name, count]) => ({ name, count }))
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("pl-PL")
}

const students = [
  "Ada",
  "Amelia",
  "Anna",
  "Ewa",
  "Gabriela",
  "Hanna",
  "Hubert",
  "Julia",
  "Kamila",
  "Karina",
  "Kinga",
  "Laura",
  "Liliana",
  "Miłosz",
  "Natalia",
  "Nikola",
  "Oleksandr",
  "Stanisław",
  "Szczepan",
  "Weronika",
  "Zuzanna",
  "ks. Michał",
]

const sortedStudents = [...students].sort((a, b) => {
  if (a === "ks. Michał") return 1
  if (b === "ks. Michał") return -1
  return a.localeCompare(b, "pl")
})

const profileImages: Record<string, string> = {
  Ada: "/profiles/ada.jpg",
  Amelia: "/profiles/amelia.jpg",
  Anna: "/profiles/anna.jpg",
  Ewa: "/profiles/ewa.jpg",
  Gabriela: "/profiles/gabriela.jpg",
  Hanna: "/profiles/hanna.jpg",
  Hubert: "/profiles/hubert.jpg",
  Julia: "/profiles/julia.jpg",
  Kamila: "/profiles/kamila.jpg",
  Karina: "/profiles/karina.jpg",
  Kinga: "/profiles/kinga.jpg",
  Laura: "/profiles/laura.jpg",
  Liliana: "/profiles/liliana.jpg",
  Miłosz: "/profiles/milosz.jpg",
  Natalia: "/profiles/natalia.jpg",
  Nikola: "/profiles/nikola.jpg",
  Oleksandr: "/profiles/oleksandr.jpg",
  Stanisław: "/profiles/stanislaw.jpg",
  Szczepan: "/profiles/szczepan.jpg",
  Weronika: "/profiles/weronika.jpg",
  Zuzanna: "/profiles/zuzanna.jpg",
  "ks. Michał": "/profiles/ks-michal.jpg",
}

function Avatar({
  person,
  size = 64,
}: {
  person: string
  size?: number
}) {
  const [imageError, setImageError] = useState(false)
  const imageSrc = profileImages[person]

  if (!imageSrc || imageError) {
    return (
      <div
        style={{
          width: size,
          height: size,
          minWidth: size,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #dbeafe 0%, #e9d5ff 100%)",
          color: "#1e3a8a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: size * 0.28,
          border: "2px solid #ffffff",
          boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
        }}
      >
        {person.slice(0, 2).toUpperCase()}
      </div>
    )
  }

  return (
    <img
      src={imageSrc}
      alt={person}
      onError={() => setImageError(true)}
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: "50%",
        objectFit: "cover",
        border: "2px solid #ffffff",
        boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
      }}
    />
  )
}

function RankingCard({
  title,
  items,
}: {
  title: string
  items: { name: string; count: number }[]
}) {
  return (
    <div
      style={{
        backgroundColor: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "22px",
        padding: "22px",
        boxShadow: "0 10px 26px rgba(0,0,0,0.06)",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: "16px", fontSize: "22px" }}>
        {title}
      </h2>

      <div style={{ display: "grid", gap: "12px" }}>
        {items.length === 0 && (
          <div
            style={{
              color: "#6b7280",
              backgroundColor: "#f8fafc",
              borderRadius: "14px",
              padding: "14px",
            }}
          >
            Brak danych.
          </div>
        )}

        {items.map((item, index) => (
          <div
            key={item.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px",
              borderRadius: "14px",
              backgroundColor: index === 0 ? "#eff6ff" : "#f9fafb",
              border:
                index === 0 ? "2px solid #60a5fa" : "1px solid transparent",
            }}
          >
            <div
              style={{
                width: "28px",
                textAlign: "center",
                fontWeight: 800,
                color: "#1f2937",
              }}
            >
              {index + 1}.
            </div>

            <Avatar person={item.name} size={42} />

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{item.name}</div>
              <div style={{ color: "#6b7280", fontSize: "14px" }}>
                {item.count}{" "}
                {item.count === 1
                  ? "punkt"
                  : item.count < 5
                    ? "punkty"
                    : "punktów"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FilterButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border: active ? "none" : "1px solid #d1d5db",
        background: active
          ? "linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%)"
          : "white",
        color: active ? "white" : "#374151",
        borderRadius: "999px",
        padding: "10px 16px",
        cursor: "pointer",
        fontWeight: 700,
        fontSize: "14px",
        boxShadow: active ? "0 8px 20px rgba(79,70,229,0.22)" : "none",
      }}
    >
      {label}
    </button>
  )
}

export default function PodziekowaniaPage() {
  const [currentUser, setCurrentUser] = useState("")
  const [userLoaded, setUserLoaded] = useState(false)

  const [person, setPerson] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoaded, setIsLoaded] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newEntryId, setNewEntryId] = useState("")
  const [feedFilter, setFeedFilter] = useState<"all" | "mine" | "forme">("all")
  const [selectedPersonFilter, setSelectedPersonFilter] = useState("")
  const [thanksList, setThanksList] = useState<Thank[]>([])

  const isAdmin = currentUser === "ks. Michał"

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        setCurrentUser(data.name || "")
        setUserLoaded(true)
      })
      .catch(() => {
        setUserLoaded(true)
      })
  }, [])

  useEffect(() => {
    async function loadThanks() {
      try {
        const { data, error } = await supabase
          .from("thanks")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Błąd pobierania Bohaterów:", error)
          return
        }

        setThanksList((data as ThankRow[]).map(mapRowToThank))
      } catch (e) {
        console.error("Błąd pobierania Bohaterów:", e)
      } finally {
        setIsLoaded(true)
      }
    }

    loadThanks()
  }, [])

  useEffect(() => {
    if (!success) return
    const timer = setTimeout(() => setSuccess(""), 2500)
    return () => clearTimeout(timer)
  }, [success])

  useEffect(() => {
    if (!newEntryId) return
    const timer = setTimeout(() => setNewEntryId(""), 2200)
    return () => clearTimeout(timer)
  }, [newEntryId])

  const visibleThanks = useMemo(() => {
    let items = thanksList
      .filter((item) => !item.deleted)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    if (feedFilter === "mine") {
      items = items.filter((item) => item.author === currentUser)
    }

    if (feedFilter === "forme") {
      items = items.filter((item) => item.person === currentUser)
    }

    if (selectedPersonFilter) {
      items = items.filter((item) => item.person === selectedPersonFilter)
    }

    return items
  }, [thanksList, feedFilter, selectedPersonFilter, currentUser])

  const monthlyHelpfulRanking = useMemo(() => {
    return buildRanking(thanksList, "received", "month", new Date())
  }, [thanksList])

  const monthlyGratefulRanking = useMemo(() => {
    return buildRanking(thanksList, "given", "month", new Date())
  }, [thanksList])

  const yearlyHelpfulRanking = useMemo(() => {
    return buildRanking(thanksList, "received", "year", new Date())
  }, [thanksList])

  const yearlyGratefulRanking = useMemo(() => {
    return buildRanking(thanksList, "given", "year", new Date())
  }, [thanksList])

  const currentUserMonthlyCount = useMemo(() => {
    const now = new Date()
    return thanksList.filter(
      (item) => !item.deleted && item.author === currentUser && isSameMonth(item.date, now)
    ).length
  }, [thanksList, currentUser])

  const monthlyPercent = Math.min((currentUserMonthlyCount / 7) * 100, 100)

  function resetForm() {
    setPerson("")
    setMessage("")
    setError("")
  }

  function openModal() {
    resetForm()
    setIsModalOpen(true)
  }

  function closeModal() {
    resetForm()
    setIsModalOpen(false)
  }

  async function addThank() {
    setError("")
    setSuccess("")

    if (!person.trim() || !message.trim()) {
      setError("Wybierz osobę i wpisz treść podziękowania.")
      return
    }

    if (person === currentUser) {
      setError("Nie możesz podziękować samemu sobie.")
      return
    }

    const now = new Date()

    const monthlyThanksByAuthor = thanksList.filter(
      (item) =>
        !item.deleted &&
        item.author === currentUser &&
        isSameMonth(item.date, now)
    )

    if (monthlyThanksByAuthor.length >= 7) {
      setError("W tym miesiącu możesz dodać maksymalnie 7 podziękowań.")
      return
    }

    const monthlyThanksForThisPerson = monthlyThanksByAuthor.filter(
      (item) => item.person === person
    )

    if (monthlyThanksForThisPerson.length >= 2) {
      setError(
        "W tym miesiącu możesz podziękować tej osobie maksymalnie 2 razy."
      )
      return
    }

    try {
      const { data, error } = await supabase
        .from("thanks")
        .insert({
          author: currentUser,
          person: person.trim(),
          message: message.trim(),
          deleted: false,
        })
        .select()
        .single()

      if (error) {
        console.error(error)
        setError("Nie udało się dodać wpisu.")
        return
      }

      const newThank = mapRowToThank(data as ThankRow)

      setThanksList((prev) => [newThank, ...prev])
      setNewEntryId(newThank.id)
      setSuccess("Podziękowanie dodane")
      closeModal()
    } catch (e) {
      console.error(e)
      setError("Nie udało się dodać wpisu.")
    }
  }

  async function deleteThank(id: string) {
    const confirmed = window.confirm(
      "Czy na pewno chcesz usunąć to podziękowanie?"
    )
    if (!confirmed) return

    try {
      const { error } = await supabase
        .from("thanks")
        .update({ deleted: true })
        .eq("id", id)

      if (error) {
        console.error(error)
        return
      }

      setThanksList((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, deleted: true } : item
        )
      )
    } catch (e) {
      console.error(e)
    }
  }

  if (!userLoaded) {
    return null
  }

  if (!currentUser) {
    return (
      <main style={{ padding: "40px", textAlign: "center" }}>
        <h1>Musisz się zalogować</h1>
        <a href="/login">Przejdź do logowania</a>
      </main>
    )
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #eff6ff 0%, #f8fafc 45%, #eef2ff 100%)",
        padding: "28px 16px 80px",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <section
          style={{
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(10px)",
            borderRadius: "28px",
            padding: "28px",
            boxShadow: "0 18px 50px rgba(0,0,0,0.08)",
            border: "1px solid rgba(255,255,255,0.85)",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "20px",
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <div style={{ maxWidth: "620px" }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: "42px",
                  lineHeight: 1.1,
                  color: "#111827",
                }}
              >
                Bohaterowie
              </h1>

              <p
                style={{
                  marginTop: "14px",
                  marginBottom: "16px",
                  fontSize: "18px",
                  lineHeight: 1.7,
                  color: "#4b5563",
                }}
              >
                Nikt na nich nie zasługuje, ale wszyscy ich potrzebujemy. Ale to dzięki Budowniczym zmienia się atmosfera Strefy B, bo dobre rzeczy zostają z nami na dłużej. 
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  color: "#374151",
                  fontSize: "14px",
                  marginBottom: "1px",
                }}
              >
                
              </div>

              <div style={{ maxWidth: "360px" }}>
                <div
                  style={{
                    width: "100%",
                    height: "12px",
                    borderRadius: "999px",
                    backgroundColor: "#dbeafe",
                    overflow: "hidden",
                    marginBottom: "6px",
                  }}
                >
                  <div
                    style={{
                      width: `${monthlyPercent}%`,
                      height: "100%",
                      background:
                        "linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%)",
                      borderRadius: "999px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>

                <div style={{ fontSize: "13px", color: "#6b7280" }}>
                  Limit miesięczny podziękowań (max. 7)
                </div>
              </div>
            </div>

            <button
              onClick={openModal}
              style={{
                border: "none",
                background:
                  "linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%)",
                color: "white",
                borderRadius: "18px",
                padding: "16px 24px",
                fontSize: "16px",
                fontWeight: 800,
                letterSpacing: "0.04em",
                cursor: "pointer",
                boxShadow: "0 14px 30px rgba(79,70,229,0.35)",
              }}
            >
              DODAJ
            </button>
          </div>
        </section>

        {success && (
          <div
            style={{
              marginBottom: "18px",
              backgroundColor: "#dcfce7",
              color: "#166534",
              padding: "14px 16px",
              borderRadius: "16px",
              fontWeight: 700,
              boxShadow: "0 8px 20px rgba(0,0,0,0.04)",
            }}
          >
            {success}
          </div>
        )}

        <section
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "18px",
          }}
        >
          <FilterButton
            active={feedFilter === "all"}
            label="Wszystkie"
            onClick={() => setFeedFilter("all")}
          />
          <FilterButton
            active={feedFilter === "mine"}
            label="Moje"
            onClick={() => setFeedFilter("mine")}
          />
          <FilterButton
            active={feedFilter === "forme"}
            label="Dla mnie"
            onClick={() => setFeedFilter("forme")}
          />

          <select
            value={selectedPersonFilter}
            onChange={(e) => setSelectedPersonFilter(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: "999px",
              border: "1px solid #d1d5db",
              backgroundColor: "white",
              fontSize: "14px",
              color: "#374151",
              fontWeight: 600,
            }}
          >
            <option value="">Wszystkie osoby</option>
            {sortedStudents.map((student) => (
              <option key={student} value={student}>
                {student}
              </option>
            ))}
          </select>
        </section>

        {!isLoaded ? (
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.85)",
              borderRadius: "22px",
              padding: "34px 26px",
              color: "#6b7280",
              textAlign: "center",
              boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
            }}
          >
            Ładowanie Bohaterów...
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "24px",
              alignItems: "start",
            }}
          >
            <section style={{ display: "grid", gap: "16px" }}>
              {visibleThanks.length === 0 && (
                <div
                  style={{
                    backgroundColor: "rgba(255,255,255,0.85)",
                    borderRadius: "22px",
                    padding: "34px 26px",
                    color: "#6b7280",
                    textAlign: "center",
                    boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
                  }}
                >
                  <div style={{ fontSize: "34px", marginBottom: "10px" }}>
                    💙
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#374151",
                      marginBottom: "6px",
                    }}
                  >
                    Nie ma jeszcze bohaterów w tym widoku
                  </div>
                  <div style={{ fontSize: "14px" }}>
                    Dodaj pierwsze podziękowanie albo zmień filtry.
                  </div>
                </div>
              )}

              {visibleThanks.map((item) => (
                <article
                  key={item.id}
                  style={{
                    background:
                      "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)",
                    border:
                      item.id === newEntryId
                        ? "2px solid #60a5fa"
                        : "1px solid #e5e7eb",
                    borderRadius: "22px",
                    padding: "18px",
                    boxShadow:
                      item.id === newEntryId
                        ? "0 14px 30px rgba(96,165,250,0.28)"
                        : "0 10px 26px rgba(0,0,0,0.06)",
                    position: "relative",
                    transition: "all 0.3s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      alignItems: "flex-start",
                      paddingRight:
                        (item.author === currentUser &&
                          canDeleteThank(item.date)) ||
                        isAdmin
                          ? "90px"
                          : "0",
                    }}
                  >
                    <Avatar person={item.person} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexWrap: "wrap",
                          marginBottom: "8px",
                        }}
                      >
                        <span style={{ fontSize: "18px" }}>💙</span>

                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: "22px",
                            lineHeight: 1.35,
                            color: "#111827",
                          }}
                        >
                          {item.person} - {normalizeMessage(item.message)}
                        </span>

                        {isNewThank(item.date) && (
                          <span
                            style={{
                              background:
                                "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
                              color: "white",
                              borderRadius: "999px",
                              padding: "4px 10px",
                              fontSize: "12px",
                              fontWeight: 800,
                            }}
                          >
                            Nowe
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          color: "#6b7280",
                          fontStyle: "italic",
                          fontSize: "16px",
                          marginBottom: "4px",
                        }}
                      >
                        {item.author}
                      </div>

                      <div style={{ color: "#9ca3af", fontSize: "13px" }}>
                        {formatDate(item.date)}
                      </div>
                    </div>
                  </div>

                  {((item.author === currentUser && canDeleteThank(item.date)) ||
                    isAdmin) && (
                    <button
                      onClick={() => deleteThank(item.id)}
                      style={{
                        position: "absolute",
                        right: "16px",
                        bottom: "16px",
                        backgroundColor: "#fee2e2",
                        color: "#991b1b",
                        border: "none",
                        borderRadius: "12px",
                        padding: "10px 14px",
                        cursor: "pointer",
                        fontSize: "14px",
                        minWidth: "80px",
                        fontWeight: 600,
                      }}
                    >
                      Usuń
                    </button>
                  )}
                </article>
              ))}
            </section>

            <div style={{ display: "grid", gap: "20px" }}>
              <RankingCard
                title="Bohaterowie miesiąca"
                items={monthlyHelpfulRanking}
              />
              <RankingCard
                title="Budowniczowie miesiąca"
                items={monthlyGratefulRanking}
              />
              <RankingCard title="Bohaterowie roku" items={yearlyHelpfulRanking} />
              <RankingCard
                title="Budowniczowie roku"
                items={yearlyGratefulRanking}
              />
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(17,24,39,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "680px",
              background: "linear-gradient(180deg, #ffffff 0%, #eef2ff 100%)",
              borderRadius: "28px",
              padding: "28px",
              boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "16px",
                alignItems: "center",
                marginBottom: "18px",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "30px", color: "#111827" }}>
                Dodaj bohatera
              </h2>

              <button
                onClick={closeModal}
                style={{
                  border: "none",
                  backgroundColor: "#f3f4f6",
                  borderRadius: "12px",
                  padding: "10px 14px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Zamknij
              </button>
            </div>

            <div style={{ display: "grid", gap: "16px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 700,
                    color: "#374151",
                  }}
                >
                  Dla kogo?
                </label>

                <select
                  value={person}
                  onChange={(e) => setPerson(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "16px",
                    border: "1px solid #d1d5db",
                    fontSize: "16px",
                    backgroundColor: "white",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Wybierz osobę</option>
                  {sortedStudents.map((student) => (
                    <option key={student} value={student}>
                      {student}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 700,
                    color: "#374151",
                  }}
                >
                  Za co chcesz podziękować?
                </label>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Np. za pomoc w matematyce albo dziękuję za dobre słowo"
                  rows={5}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "16px",
                    border: "1px solid #d1d5db",
                    fontSize: "16px",
                    resize: "vertical",
                    boxSizing: "border-box",
                    backgroundColor: "white",
                  }}
                />
              </div>

              {error && (
                <div
                  style={{
                    backgroundColor: "#fee2e2",
                    color: "#991b1b",
                    padding: "12px 14px",
                    borderRadius: "14px",
                    fontSize: "14px",
                  }}
                >
                  {error}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                  marginTop: "8px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={closeModal}
                  style={{
                    border: "1px solid #d1d5db",
                    backgroundColor: "white",
                    color: "#374151",
                    borderRadius: "14px",
                    padding: "12px 18px",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Anuluj
                </button>

                <button
                  onClick={addThank}
                  style={{
                    border: "none",
                    background:
                      "linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%)",
                    color: "white",
                    borderRadius: "14px",
                    padding: "12px 18px",
                    cursor: "pointer",
                    fontWeight: 800,
                  }}
                >
                  Dodaj bohatera
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}