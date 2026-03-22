"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

type EntryType = "cytat" | "piosenka" | "mysl" | "pismo"

type GoodWordEntry = {
  id: string
  type: EntryType
  author: string
  createdAt: string
  deleted: boolean

  content: string

  quoteAuthor?: string

  songTitle?: string
  songArtist?: string
  youtubeUrl?: string
  dedication?: string

  scriptureSource?: string
}

const STORAGE_KEY = "goodWordsEntries"
const ADMIN_EMAIL = "michal.radziwill@radosnanowina.pl"
const QUOTE_MAX_LENGTH = 300

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
  "Karyna",
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
]

const dedicationOptions = [...students, "ks. Michał"]

function getFirstNameFromEmail(email: string) {
  const loginPart = email.split("@")[0]
  const firstName = loginPart.split(".")[0]

  if (!firstName) return "Uczeń"

  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString("pl-PL")
}

function isSameDay(dateString: string, now: Date) {
  const date = new Date(dateString)

  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  )
}

function canDeleteEntry(
  entry: GoodWordEntry,
  currentUser: string,
  isAdmin: boolean
) {
  if (isAdmin) return true
  if (entry.author !== currentUser) return false

  const createdAt = new Date(entry.createdAt).getTime()
  const now = Date.now()
  const hours24 = 24 * 60 * 60 * 1000

  return now - createdAt <= hours24
}

function getTypeLabel(type: EntryType) {
  switch (type) {
    case "cytat":
      return "Cytat"
    case "piosenka":
      return "Piosenka"
    case "mysl":
      return "Własna myśl"
    case "pismo":
      return "Pismo Święte"
  }
}

function getTypeIcon(type: EntryType) {
  switch (type) {
    case "cytat":
      return "❝"
    case "piosenka":
      return "♪"
    case "mysl":
      return "💭"
    case "pismo":
      return "📖"
  }
}

function getTypeColors(type: EntryType) {
  switch (type) {
    case "cytat":
      return {
        bg: "linear-gradient(135deg, #fdf2f8 0%, #ede9fe 100%)",
        badge: "#db2777",
      }
    case "piosenka":
      return {
        bg: "linear-gradient(135deg, #ecfeff 0%, #dbeafe 100%)",
        badge: "#2563eb",
      }
    case "mysl":
      return {
        bg: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
        badge: "#16a34a",
      }
    case "pismo":
      return {
        bg: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
        badge: "#ea580c",
      }
  }
}

function isValidYoutubeUrl(url: string) {
  const trimmed = url.trim().toLowerCase()
  return trimmed.includes("youtube.com/") || trimmed.includes("youtu.be/")
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
        background: active ? "#111827" : "white",
        color: active ? "white" : "#374151",
        borderRadius: "999px",
        padding: "10px 16px",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: "14px",
      }}
    >
      {label}
    </button>
  )
}

function SongCardBody({
  entry,
  badgeColor,
}: {
  entry: GoodWordEntry
  badgeColor: string
}) {
  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "88px 1fr",
          gap: "16px",
          alignItems: "center",
          backgroundColor: "rgba(255,255,255,0.55)",
          borderRadius: "20px",
          padding: "16px",
        }}
      >
        <div
          style={{
            width: "88px",
            height: "88px",
            borderRadius: "22px",
            background:
              "linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(59,130,246,0.26) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "40px",
            color: "#1d4ed8",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
          }}
        >
          ♪
        </div>

        <div
          style={{
            minWidth: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: "30px",
                fontWeight: 800,
                color: "#1f2937",
                lineHeight: 1.15,
                marginBottom: "8px",
                wordBreak: "break-word",
              }}
            >
              {entry.songTitle}
            </div>

            <div
              style={{
                color: "#4b5563",
                fontSize: "18px",
                fontWeight: 500,
              }}
            >
              {entry.songArtist}
            </div>
          </div>

          {entry.youtubeUrl && (
            <a
              href={entry.youtubeUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-block",
                textDecoration: "none",
                backgroundColor: "#111827",
                color: "white",
                padding: "11px 16px",
                borderRadius: "14px",
                fontWeight: 700,
                width: "fit-content",
                whiteSpace: "nowrap",
              }}
            >
              ▶ Posłuchaj
            </a>
          )}
        </div>
      </div>

      {entry.dedication && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            width: "fit-content",
            backgroundColor: "rgba(255,255,255,0.85)",
            color: badgeColor,
            fontWeight: 700,
            fontSize: "14px",
            padding: "10px 14px",
            borderRadius: "999px",
          }}
        >
          🎧 dla {entry.dedication}
        </div>
      )}

      {entry.content && (
        <div
          style={{
            color: "#374151",
            lineHeight: 1.7,
            backgroundColor: "rgba(255,255,255,0.68)",
            padding: "14px 16px",
            borderRadius: "18px",
            fontSize: "16px",
          }}
        >
          {entry.content}
        </div>
      )}

      <div
        style={{
          paddingTop: "8px",
          borderTop: "1px solid rgba(255,255,255,0.8)",
        }}
      />
    </div>
  )
}

function QuoteCardBody({
  entry,
}: {
  entry: GoodWordEntry
}) {
  return (
    <div
      style={{
        position: "relative",
        display: "grid",
        gap: "14px",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-14px",
          left: "-2px",
          fontSize: "84px",
          lineHeight: 1,
          color: "rgba(219,39,119,0.13)",
          fontWeight: 800,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        ❝
      </div>

      <div
        style={{
          fontSize: "26px",
          lineHeight: 1.65,
          fontWeight: 700,
          fontStyle: "italic",
          color: "#1f2937",
          whiteSpace: "pre-wrap",
          position: "relative",
          paddingLeft: "8px",
        }}
      >
        "{entry.content}"
      </div>

      <div
        style={{
          textAlign: "right",
          color: "#4b5563",
          fontSize: "17px",
          fontWeight: 700,
        }}
      >
        - {entry.quoteAuthor}
      </div>
    </div>
  )
}

function ThoughtCardBody({
  entry,
}: {
  entry: GoodWordEntry
}) {
  return (
    <div
      style={{
        position: "relative",
        display: "grid",
        gap: "12px",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-16px",
          left: "-4px",
          fontSize: "76px",
          lineHeight: 1,
          color: "rgba(22,163,74,0.14)",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        💭
      </div>

      <div
        style={{
          fontSize: "30px",
          lineHeight: 1.7,
          fontWeight: 700,
          fontStyle: "italic",
          color: "#1f2937",
          whiteSpace: "pre-wrap",
          position: "relative",
          paddingLeft: "8px",
        }}
      >
        {entry.content}
      </div>
    </div>
  )
}

function ScriptureCardBody({
  entry,
}: {
  entry: GoodWordEntry
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: "16px",
      }}
    >
      <div
        style={{
          fontSize: "26px",
          lineHeight: 1.8,
          fontWeight: 700,
          color: "#1f2937",
          whiteSpace: "pre-wrap",
          textAlign: "center",
          padding: "8px 4px",
        }}
      >
        {entry.content}
      </div>

      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.78)",
          paddingTop: "12px",
          textAlign: "center",
          color: "#9a3412",
          fontWeight: 700,
          fontSize: "16px",
        }}
      >
        {entry.scriptureSource}
      </div>
    </div>
  )
}

function EntryCard({
  entry,
  currentUser,
  isAdmin,
  onDelete,
}: {
  entry: GoodWordEntry
  currentUser: string
  isAdmin: boolean
  onDelete: (id: string) => void
}) {
  const colors = getTypeColors(entry.type)
  const canDelete = canDeleteEntry(entry, currentUser, isAdmin)

  return (
    <article
      style={{
        background: colors.bg,
        borderRadius: "24px",
        padding: "22px",
        boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
        border: "1px solid rgba(255,255,255,0.7)",
        display: "grid",
        gap: "18px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <span
          style={{
            backgroundColor: "rgba(255,255,255,0.9)",
            color: colors.badge,
            fontWeight: 700,
            fontSize: "13px",
            padding: "8px 12px",
            borderRadius: "999px",
          }}
        >
          {getTypeIcon(entry.type)} {getTypeLabel(entry.type)}
        </span>

        {canDelete && (
          <button
            onClick={() => onDelete(entry.id)}
            style={{
              border: "none",
              backgroundColor: "rgba(255,255,255,0.95)",
              color: "#991b1b",
              borderRadius: "12px",
              padding: "8px 12px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Usuń
          </button>
        )}
      </div>

      {entry.type === "cytat" && <QuoteCardBody entry={entry} />}

      {entry.type === "piosenka" && (
        <SongCardBody entry={entry} badgeColor={colors.badge} />
      )}

      {entry.type === "mysl" && <ThoughtCardBody entry={entry} />}

      {entry.type === "pismo" && <ScriptureCardBody entry={entry} />}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
          color: "#6b7280",
          fontSize: "14px",
          paddingTop: "8px",
          borderTop: "1px solid rgba(255,255,255,0.8)",
        }}
      >
        <span>
          {getAddedLabel(entry.author)}: <strong>{entry.author}</strong>
        </span>
        <span>{formatDateTime(entry.createdAt)}</span>
      </div>
    </article>
  )
}

function getAddedLabel(author: string) {
  const femaleNames = [
    "Ada",
    "Amelia",
    "Anna",
    "Ewa",
    "Gabriela",
    "Hanna",
    "Julia",
    "Kamila",
    "Karyna",
    "Kinga",
    "Laura",
    "Liliana",
    "Natalia",
    "Nikola",
    "Weronika",
    "Zuzanna",
  ]

  return femaleNames.includes(author) ? "dodała" : "dodał"
}

export default function DobreSlowaPage() {
  const currentUserEmail = "jan.kowalski@radosnanowina.pl"
  const currentUser = getFirstNameFromEmail(currentUserEmail)
  const isAdmin = currentUserEmail === ADMIN_EMAIL
  const now = new Date()

  const [entries, setEntries] = useState<GoodWordEntry[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<EntryType | "">("")
  const [filter, setFilter] = useState<"wszystko" | EntryType>("wszystko")
  const [error, setError] = useState("")

  const [content, setContent] = useState("")
  const [quoteAuthor, setQuoteAuthor] = useState("")
  const [songTitle, setSongTitle] = useState("")
  const [songArtist, setSongArtist] = useState("")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [dedication, setDedication] = useState("")
  const [scriptureSource, setScriptureSource] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved) {
      try {
        setEntries(JSON.parse(saved))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    } else {
      const starterData: GoodWordEntry[] = [
        {
          id: "1",
          type: "cytat",
          author: "Jan",
          createdAt: new Date().toISOString(),
          deleted: false,
          content: "To, co robisz codziennie, buduje to, kim się stajesz.",
          quoteAuthor: "Nieznany autor",
        },
        {
          id: "2",
          type: "piosenka",
          author: "Amelia",
          createdAt: new Date().toISOString(),
          deleted: false,
          content: "Na gorszy dzień i na spacer po lekcjach.",
          songTitle: "Oceans",
          songArtist: "Hillsong UNITED",
          youtubeUrl: "https://www.youtube.com/watch?v=dy9nwe9_xzw",
          dedication: "Julia",
        },
        {
          id: "3",
          type: "mysl",
          author: "Hubert",
          createdAt: new Date().toISOString(),
          deleted: false,
          content:
            "Nie musisz robić wszystkiego od razu. Wystarczy, że zrobisz pierwszy krok.",
        },
        {
          id: "4",
          type: "pismo",
          author: "Natalia",
          createdAt: new Date().toISOString(),
          deleted: false,
          content: "Wszystko mogę w Tym, który mnie umacnia.",
          scriptureSource: "Flp 4,13",
        },
      ]

      setEntries(starterData)
    }

    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  }, [entries, isLoaded])

  const dailyEntriesCount = entries.filter(
    (entry) =>
      entry.author === currentUser &&
      !entry.deleted &&
      isSameDay(entry.createdAt, now)
  ).length

  const dailyPercent = Math.min((dailyEntriesCount / 2) * 100, 100)

  const visibleEntries = useMemo(() => {
    const activeEntries = entries
      .filter((entry) => !entry.deleted)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

    if (filter === "wszystko") return activeEntries

    return activeEntries.filter((entry) => entry.type === filter)
  }, [entries, filter])

  function resetForm() {
    setSelectedType("")
    setError("")
    setContent("")
    setQuoteAuthor("")
    setSongTitle("")
    setSongArtist("")
    setYoutubeUrl("")
    setDedication("")
    setScriptureSource("")
  }

  function openModal() {
    setIsModalOpen(true)
    resetForm()
  }

  function closeModal() {
    setIsModalOpen(false)
    resetForm()
  }

  function handleDelete(id: string) {
    const confirmed = window.confirm("Czy na pewno chcesz usunąć ten wpis?")
    if (!confirmed) return

    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, deleted: true } : entry
      )
    )
  }

  function handleAddEntry() {
    setError("")

    if (dailyEntriesCount >= 2) {
      setError("Możesz dodać maksymalnie 2 wpisy dziennie.")
      return
    }

    if (!selectedType) {
      setError("Wybierz typ wpisu.")
      return
    }

    if (selectedType === "cytat") {
      if (!content.trim() || !quoteAuthor.trim()) {
        setError("Wpisz treść cytatu i autora.")
        return
      }

      if (content.trim().length > QUOTE_MAX_LENGTH) {
        setError(`Cytat może mieć maksymalnie ${QUOTE_MAX_LENGTH} znaków.`)
        return
      }

      const newEntry: GoodWordEntry = {
        id: crypto.randomUUID(),
        type: "cytat",
        author: currentUser,
        createdAt: new Date().toISOString(),
        deleted: false,
        content: content.trim(),
        quoteAuthor: quoteAuthor.trim(),
      }

      setEntries((prev) => [newEntry, ...prev])
      closeModal()
      return
    }

    if (selectedType === "piosenka") {
      if (!songTitle.trim() || !songArtist.trim() || !youtubeUrl.trim()) {
        setError("Uzupełnij tytuł, wykonawcę i link do YouTube.")
        return
      }

      if (!isValidYoutubeUrl(youtubeUrl)) {
        setError("Wpisz poprawny link do YouTube.")
        return
      }

      const newEntry: GoodWordEntry = {
        id: crypto.randomUUID(),
        type: "piosenka",
        author: currentUser,
        createdAt: new Date().toISOString(),
        deleted: false,
        content: content.trim(),
        songTitle: songTitle.trim(),
        songArtist: songArtist.trim(),
        youtubeUrl: youtubeUrl.trim(),
        dedication: dedication.trim() || undefined,
      }

      setEntries((prev) => [newEntry, ...prev])
      closeModal()
      return
    }

    if (selectedType === "mysl") {
      if (!content.trim()) {
        setError("Wpisz treść własnej myśli.")
        return
      }

      const newEntry: GoodWordEntry = {
        id: crypto.randomUUID(),
        type: "mysl",
        author: currentUser,
        createdAt: new Date().toISOString(),
        deleted: false,
        content: content.trim(),
      }

      setEntries((prev) => [newEntry, ...prev])
      closeModal()
      return
    }

    if (selectedType === "pismo") {
      if (!content.trim() || !scriptureSource.trim()) {
        setError("Wpisz treść fragmentu i źródło.")
        return
      }

      const newEntry: GoodWordEntry = {
        id: crypto.randomUUID(),
        type: "pismo",
        author: currentUser,
        createdAt: new Date().toISOString(),
        deleted: false,
        content: content.trim(),
        scriptureSource: scriptureSource.trim(),
      }

      setEntries((prev) => [newEntry, ...prev])
      closeModal()
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #fdf4ff 0%, #eff6ff 45%, #f0fdf4 100%)",
        padding: "28px 16px 80px",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            textDecoration: "none",
            color: "#2563eb",
            display: "inline-block",
            marginBottom: "20px",
            fontWeight: 600,
          }}
        >
          ← Powrót na stronę główną
        </Link>

        <section
          style={{
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(10px)",
            borderRadius: "30px",
            padding: "28px",
            boxShadow: "0 18px 50px rgba(0,0,0,0.08)",
            border: "1px solid rgba(255,255,255,0.85)",
            marginBottom: "28px",
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
            <div style={{ maxWidth: "760px" }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: "42px",
                  lineHeight: 1.1,
                  color: "#111827",
                }}
              >
                Dobre słowa
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
                Cytaty, piosenki, własne myśli i fragmenty Pisma, do których chce
                się wracać. Taki trochę klasowy feed dobra.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  color: "#374151",
                  fontSize: "14px",
                  marginBottom: "14px",
                }}
              >

              </div>

              <div style={{ maxWidth: "360px", marginTop: "12px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px",
                    color: "#374151",
                    marginBottom: "6px",
                    fontWeight: 600,
                  }}
                >
                  
                </div>

                <div
                  style={{
                    width: "100%",
                    height: "12px",
                    borderRadius: "999px",
                    backgroundColor: "#e5e7eb",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${dailyPercent}%`,
                      height: "100%",
                      background:
                        "linear-gradient(135deg,#ec4899,#8b5cf6,#6366f1)",
                      borderRadius: "999px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>

                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "13px",
                    color: "#6b7280",
                  }}
                >
                  Limit dobrych słów dziennie (max. 2)
                </div>
              </div>
            </div>

            <button
              onClick={openModal}
              style={{
                border: "none",
                background:
                  "linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)",
                color: "white",
                borderRadius: "18px",
                padding: "16px 24px",
                fontSize: "16px",
                fontWeight: 800,
                letterSpacing: "0.04em",
                cursor: "pointer",
                boxShadow: "0 14px 30px rgba(139,92,246,0.35)",
              }}
            >
              DODAJ
            </button>
          </div>
        </section>

        <section
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "24px",
          }}
        >
          <FilterButton
            active={filter === "wszystko"}
            label="Wszystko"
            onClick={() => setFilter("wszystko")}
          />
          <FilterButton
            active={filter === "cytat"}
            label="Cytaty"
            onClick={() => setFilter("cytat")}
          />
          <FilterButton
            active={filter === "piosenka"}
            label="Piosenki"
            onClick={() => setFilter("piosenka")}
          />
          <FilterButton
            active={filter === "mysl"}
            label="Własne myśli"
            onClick={() => setFilter("mysl")}
          />
          <FilterButton
            active={filter === "pismo"}
            label="Pismo Święte"
            onClick={() => setFilter("pismo")}
          />
        </section>

        <section
          style={{
            display: "grid",
            gap: "18px",
          }}
        >
          {visibleEntries.length === 0 && (
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.8)",
                borderRadius: "22px",
                padding: "30px",
                color: "#6b7280",
                textAlign: "center",
                boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
              }}
            >
              Nie ma jeszcze wpisów w tej kategorii.
            </div>
          )}

          {visibleEntries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              currentUser={currentUser}
              isAdmin={isAdmin}
              onDelete={handleDelete}
            />
          ))}
        </section>
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
              maxWidth: "760px",
              maxHeight: "90vh",
              overflowY: "auto",
              background:
                "linear-gradient(180deg, #ffffff 0%, #faf5ff 100%)",
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
                Dodaj dobre słowo
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

            <div style={{ marginBottom: "18px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  fontWeight: 700,
                  color: "#374151",
                }}
              >
                Typ wpisu
              </label>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {(["cytat", "piosenka", "mysl", "pismo"] as EntryType[]).map(
                  (type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      style={{
                        border:
                          selectedType === type
                            ? "none"
                            : "1px solid #d1d5db",
                        background:
                          selectedType === type ? "#111827" : "white",
                        color: selectedType === type ? "white" : "#374151",
                        borderRadius: "14px",
                        padding: "12px 16px",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      {getTypeLabel(type)}
                    </button>
                  )
                )}
              </div>
            </div>

            {selectedType === "cytat" && (
              <div style={{ display: "grid", gap: "14px" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                    }}
                  >
                    Treść cytatu
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={6}
                    maxLength={QUOTE_MAX_LENGTH}
                    placeholder="A niechaj narodowie wżdy postronni znają, iż Polacy nie gęsi, iż swój język mają."
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "14px",
                      borderRadius: "16px",
                      border: "1px solid #d1d5db",
                      fontSize: "16px",
                      resize: "vertical",
                    }}
                  />
                  <div
                    style={{
                      marginTop: "6px",
                      color: "#6b7280",
                      fontSize: "13px",
                    }}
                  >
                    {content.length}/{QUOTE_MAX_LENGTH}
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                    }}
                  >
                    Autor cytatu
                  </label>
                  <input
                    value={quoteAuthor}
                    onChange={(e) => setQuoteAuthor(e.target.value)}
                    placeholder="Mikołaj Rej"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "14px",
                      borderRadius: "16px",
                      border: "1px solid #d1d5db",
                      fontSize: "16px",
                    }}
                  />
                </div>
              </div>
            )}

            {selectedType === "piosenka" && (
              <div style={{ display: "grid", gap: "14px" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                    }}
                  >
                    Tytuł piosenki
                  </label>
                  <input
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    placeholder="Np. Oceans"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "14px",
                      borderRadius: "16px",
                      border: "1px solid #d1d5db",
                      fontSize: "16px",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                    }}
                  >
                    Wykonawca
                  </label>
                  <input
                    value={songArtist}
                    onChange={(e) => setSongArtist(e.target.value)}
                    placeholder="Np. Hillsong UNITED"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "14px",
                      borderRadius: "16px",
                      border: "1px solid #d1d5db",
                      fontSize: "16px",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                    }}
                  >
                    Link do YouTube
                  </label>
                  <input
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/..."
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "14px",
                      borderRadius: "16px",
                      border: "1px solid #d1d5db",
                      fontSize: "16px",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                    }}
                  >
                    Dedykacja dla kogoś z klasy - opcjonalnie
                  </label>
                  <select
                    value={dedication}
                    onChange={(e) => setDedication(e.target.value)}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "14px",
                      borderRadius: "16px",
                      border: "1px solid #d1d5db",
                      fontSize: "16px",
                      backgroundColor: "white",
                    }}
                  >
                    <option value="">Bez dedykacji</option>
                    {dedicationOptions.map((student) => (
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
                      fontWeight: 600,
                    }}
                  >
                    Krótki komentarz - opcjonalnie
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    placeholder="Np. na gorszy dzień albo przed sprawdzianem"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "14px",
                      borderRadius: "16px",
                      border: "1px solid #d1d5db",
                      fontSize: "16px",
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>
            )}

            {selectedType === "mysl" && (
              <div style={{ display: "grid", gap: "14px" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                    }}
                  >
                    Własna myśl
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={5}
                    placeholder="Napisz coś, co może komuś dodać siły."
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "14px",
                      borderRadius: "16px",
                      border: "1px solid #d1d5db",
                      fontSize: "16px",
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>
            )}

            {selectedType === "pismo" && (
              <div style={{ display: "grid", gap: "14px" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                    }}
                  >
                    Fragment
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={5}
                    placeholder="Wszystko mogę w Tym, który mnie umacnia."
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "14px",
                      borderRadius: "16px",
                      border: "1px solid #d1d5db",
                      fontSize: "16px",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: 600,
                    }}
                  >
                    Źródło
                  </label>
                  <input
                    value={scriptureSource}
                    onChange={(e) => setScriptureSource(e.target.value)}
                    placeholder="Np. Flp 4,13"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "14px",
                      borderRadius: "16px",
                      border: "1px solid #d1d5db",
                      fontSize: "16px",
                    }}
                  />
                </div>
              </div>
            )}

            {error && (
              <div
                style={{
                  marginTop: "16px",
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
                marginTop: "24px",
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
                onClick={handleAddEntry}
                style={{
                  border: "none",
                  background:
                    "linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)",
                  color: "white",
                  borderRadius: "14px",
                  padding: "12px 18px",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                Dodaj wpis
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}