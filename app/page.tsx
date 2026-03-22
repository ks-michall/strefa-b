"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

type Thank = {
  id: string
  author: string
  person: string
  message: string
  date: string
  deleted: boolean
}

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

type GalleryItem = {
  id: string
  title: string
  description: string
  event: string
  image: string
  author: string
  date: string
  deleted: boolean
}

const THANKS_STORAGE_KEY = "thanksList"
const GOOD_WORDS_STORAGE_KEY = "goodWordsEntries"

const GALLERY_DB_NAME = "class-gallery-db"
const GALLERY_STORE_NAME = "galleryItems"
const GALLERY_DB_VERSION = 1

function normalizeMessage(message: string) {
  const trimmed = message.trim()

  if (!trimmed) return ""

  const lower = trimmed.toLowerCase()

  if (lower.startsWith("dziękuję za")) {
    return trimmed
  }

  if (lower.startsWith("za ")) {
    return `dziękuję ${trimmed}`
  }

  return `dziękuję za ${trimmed}`
}

function getGoodWordPreview(entry: GoodWordEntry) {
  if (entry.type === "cytat") {
    return `"${entry.content}"`
  }

  if (entry.type === "piosenka") {
    return `${entry.songTitle} - ${entry.songArtist}`
  }

  if (entry.type === "mysl") {
    return entry.content
  }

  return `${entry.content} (${entry.scriptureSource})`
}

function getGoodWordTypeLabel(type: EntryType) {
  if (type === "cytat") return "Cytat"
  if (type === "piosenka") return "Piosenka"
  if (type === "mysl") return "Własna myśl"
  return "Pismo Święte"
}

function openGalleryDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(GALLERY_DB_NAME, GALLERY_DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(GALLERY_STORE_NAME)) {
        db.createObjectStore(GALLERY_STORE_NAME, { keyPath: "id" })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function getAllGalleryItems(): Promise<GalleryItem[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openGalleryDb()
      const tx = db.transaction(GALLERY_STORE_NAME, "readonly")
      const store = tx.objectStore(GALLERY_STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result as GalleryItem[])
      request.onerror = () => reject(request.error)
    } catch (error) {
      reject(error)
    }
  })
}

export default function Home() {
  const [latestThanks, setLatestThanks] = useState<Thank[]>([])
  const [latestGoodWords, setLatestGoodWords] = useState<GoodWordEntry[]>([])
  const [latestGallery, setLatestGallery] = useState<GalleryItem[]>([])

  useEffect(() => {
    const savedThanks = localStorage.getItem(THANKS_STORAGE_KEY)
    if (savedThanks) {
      try {
        const parsed: Thank[] = JSON.parse(savedThanks)
        const visible = parsed
          .filter((item) => !item.deleted)
          .sort(
            (a, b) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .slice(0, 2)

        setLatestThanks(visible)
      } catch {}
    }

    const savedGoodWords = localStorage.getItem(GOOD_WORDS_STORAGE_KEY)
    if (savedGoodWords) {
      try {
        const parsed: GoodWordEntry[] = JSON.parse(savedGoodWords)
        const visible = parsed
          .filter((item) => !item.deleted)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          )
          .slice(0, 2)

        setLatestGoodWords(visible)
      } catch {}
    }

    async function loadGalleryPreview() {
      try {
        const parsed = await getAllGalleryItems()
        const visible = parsed
          .filter((item) => !item.deleted)
          .sort(
            (a, b) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .slice(0, 2)

        setLatestGallery(visible)
      } catch {}
    }

    loadGalleryPreview()
  }, [])

  const cardBaseStyle = {
    borderRadius: "28px",
    padding: "26px",
    boxShadow: "0 14px 34px rgba(0,0,0,0.07)",
    display: "block",
    textDecoration: "none",
    color: "#111827",
    transition: "transform 0.22s ease, box-shadow 0.22s ease",
    animation: "fadeUp 0.55s ease both",
  } as const

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f9fafb 0%, #eef2ff 50%, #eff6ff 100%)",
        padding: "28px 16px 60px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .home-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 40px rgba(0,0,0,0.10);
        }
      `}</style>

      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <header style={{ marginBottom: "30px" }}>
          <h1
            style={{
              fontSize: "42px",
              marginBottom: "12px",
              color: "#111827",
              lineHeight: 1.1,
            }}
          >
            Strona naszej klasy
          </h1>

          <p
            style={{
              fontSize: "18px",
              color: "#4b5563",
              maxWidth: "760px",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            Miejsce do wzajemnej życzliwości, dobrych słów i wspólnego budowania
            atmosfery. Tu można podziękować, dodać coś inspirującego i rozwijać
            klasową przestrzeń.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "22px",
          }}
        >
          <Link
            href="/podziekowania"
            className="home-card"
            style={{
              ...cardBaseStyle,
              background: "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)",
              border: "1px solid #dbeafe",
              animationDelay: "0.05s",
            }}
          >
            <div
              style={{
                width: "54px",
                height: "54px",
                borderRadius: "18px",
                background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                marginBottom: "16px",
              }}
            >
              💙
            </div>

            <h2
              style={{
                fontSize: "26px",
                marginTop: 0,
                marginBottom: "10px",
              }}
            >
              Podziękowania
            </h2>

            <p
              style={{
                color: "#4b5563",
                lineHeight: 1.65,
                marginBottom: "18px",
              }}
            >
              Doceniaj koleżanki i kolegów za pomoc, wsparcie i życzliwość.
            </p>

            <div
              style={{
                display: "grid",
                gap: "10px",
              }}
            >
              {latestThanks.length === 0 && (
                <div
                  style={{
                    fontSize: "14px",
                    color: "#6b7280",
                    backgroundColor: "rgba(255,255,255,0.82)",
                    borderRadius: "16px",
                    padding: "16px",
                    border: "1px dashed #bfdbfe",
                  }}
                >
                  <div style={{ fontSize: "20px", marginBottom: "6px" }}>💙</div>
                  <div style={{ fontWeight: 700, marginBottom: "4px", color: "#374151" }}>
                    Jeszcze nic tu nie ma
                  </div>
                  <div>Dodaj pierwsze podziękowanie dla kogoś z klasy.</div>
                </div>
              )}

              {latestThanks.map((item) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.86)",
                    borderRadius: "16px",
                    padding: "14px",
                    fontSize: "14px",
                    lineHeight: 1.55,
                    border: "1px solid #e0ecff",
                  }}
                >
                  <strong>{item.person}</strong> - {normalizeMessage(item.message)}
                  <div
                    style={{
                      color: "#6b7280",
                      fontStyle: "italic",
                      marginTop: "4px",
                    }}
                  >
                    {item.author}
                  </div>
                </div>
              ))}
            </div>
          </Link>

          <Link
            href="/galeria"
            className="home-card"
            style={{
              ...cardBaseStyle,
              background: "linear-gradient(135deg, #ffffff 0%, #f3e8ff 100%)",
              border: "1px solid #e9d5ff",
              animationDelay: "0.12s",
            }}
          >
            <div
              style={{
                width: "54px",
                height: "54px",
                borderRadius: "18px",
                background: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                marginBottom: "16px",
              }}
            >
              📷
            </div>

            <h2
              style={{
                fontSize: "26px",
                marginTop: 0,
                marginBottom: "10px",
              }}
            >
              Galeria
            </h2>

            <p
              style={{
                color: "#4b5563",
                lineHeight: 1.65,
                marginBottom: "18px",
              }}
            >
              Miejsce na zdjęcia, grafiki i wspomnienia z życia klasy.
            </p>

            <div
              style={{
                display: "grid",
                gap: "10px",
              }}
            >
              {latestGallery.length === 0 && (
                <div
                  style={{
                    backgroundColor: "rgba(255,255,255,0.84)",
                    borderRadius: "18px",
                    padding: "18px",
                    minHeight: "128px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#8b5cf6",
                    fontWeight: 700,
                    textAlign: "center",
                    border: "1px dashed #d8b4fe",
                    lineHeight: 1.6,
                  }}
                >
                  <div>
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>📷</div>
                    <div style={{ color: "#4b5563" }}>
                      Dodaj pierwsze zdjęcie albo grafikę do klasowej galerii
                    </div>
                  </div>
                </div>
              )}

              {latestGallery.map((item) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.86)",
                    borderRadius: "16px",
                    padding: "10px",
                    border: "1px solid #e9d5ff",
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    style={{
                      width: "100%",
                      height: "120px",
                      objectFit: "cover",
                      borderRadius: "12px",
                      display: "block",
                      marginBottom: "10px",
                    }}
                  />
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#111827",
                      marginBottom: "4px",
                    }}
                  >
                    {item.title}
                  </div>
                  {item.event && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#7c3aed",
                        fontWeight: 600,
                        marginBottom: "4px",
                      }}
                    >
                      {item.event}
                    </div>
                  )}
                  <div
                    style={{
                      color: "#6b7280",
                      fontStyle: "italic",
                      fontSize: "13px",
                    }}
                  >
                    {item.author}
                  </div>
                </div>
              ))}
            </div>
          </Link>

          <Link
            href="/dobre-slowa"
            className="home-card"
            style={{
              ...cardBaseStyle,
              background: "linear-gradient(135deg, #ffffff 0%, #fdf2f8 100%)",
              border: "1px solid #fbcfe8",
              animationDelay: "0.19s",
            }}
          >
            <div
              style={{
                width: "54px",
                height: "54px",
                borderRadius: "18px",
                background: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                marginBottom: "16px",
              }}
            >
              ✨
            </div>

            <h2
              style={{
                fontSize: "26px",
                marginTop: 0,
                marginBottom: "10px",
              }}
            >
              Dobre słowa
            </h2>

            <p
              style={{
                color: "#4b5563",
                lineHeight: 1.65,
                marginBottom: "18px",
              }}
            >
              Cytaty, piosenki, własne myśli i fragmenty Pisma, do których warto
              wracać.
            </p>

            <div
              style={{
                display: "grid",
                gap: "10px",
              }}
            >
              {latestGoodWords.length === 0 && (
                <div
                  style={{
                    fontSize: "14px",
                    color: "#6b7280",
                    backgroundColor: "rgba(255,255,255,0.84)",
                    borderRadius: "16px",
                    padding: "16px",
                    border: "1px dashed #f9a8d4",
                  }}
                >
                  <div style={{ fontSize: "20px", marginBottom: "6px" }}>✨</div>
                  <div style={{ fontWeight: 700, marginBottom: "4px", color: "#374151" }}>
                    Jeszcze nic tu nie ma
                  </div>
                  <div>Dodaj pierwszy cytat, piosenkę albo własną myśl.</div>
                </div>
              )}

              {latestGoodWords.map((item) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.86)",
                    borderRadius: "16px",
                    padding: "14px",
                    fontSize: "14px",
                    lineHeight: 1.55,
                    border: "1px solid #fbcfe8",
                  }}
                >
                  <strong>{getGoodWordTypeLabel(item.type)}</strong>
                  <div style={{ marginTop: "4px", color: "#374151" }}>
                    {getGoodWordPreview(item)}
                  </div>
                  <div
                    style={{
                      color: "#6b7280",
                      fontStyle: "italic",
                      marginTop: "4px",
                    }}
                  >
                    {item.author}
                  </div>
                </div>
              ))}
            </div>
          </Link>
        </section>
      </div>
    </main>
  )
}