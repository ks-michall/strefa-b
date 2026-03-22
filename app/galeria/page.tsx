"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"

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

const DB_NAME = "class-gallery-db"
const STORE_NAME = "galleryItems"
const DB_VERSION = 1
const ADMIN_EMAIL = "michal.radziwill@radosnanowina.pl"

function getFirstNameFromEmail(email: string) {
  const login = email.split("@")[0]
  const first = login.split(".")[0]

  if (!first) return "Uczeń"

  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
}

function canDelete(date: string) {
  const created = new Date(date).getTime()
  const now = Date.now()

  return now - created <= 24 * 60 * 60 * 1000
}

function isNewItem(date: string) {
  return canDelete(date)
}

function isSameDay(date: string) {
  const d = new Date(date)
  const now = new Date()

  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  )
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("pl-PL")
}

function openGalleryDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" })
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
      const tx = db.transaction(STORE_NAME, "readonly")
      const store = tx.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result as GalleryItem[])
      request.onerror = () => reject(request.error)
    } catch (error) {
      reject(error)
    }
  })
}

function putGalleryItem(item: GalleryItem): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openGalleryDb()
      const tx = db.transaction(STORE_NAME, "readwrite")
      const store = tx.objectStore(STORE_NAME)

      store.put(item)

      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    } catch (error) {
      reject(error)
    }
  })
}

function seedGalleryIfEmpty(): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const items = await getAllGalleryItems()

      if (items.length > 0) {
        resolve()
        return
      }

      const starterItems: GalleryItem[] = [
        {
          id: "seed-1",
          title: "Nasza klasa - wspólny moment",
          description: "Pierwsze zdjęcie w klasowej galerii.",
          event: "Start galerii",
          image:
            "data:image/svg+xml;utf8," +
            encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900">
                <defs>
                  <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stop-color="#dbeafe"/>
                    <stop offset="50%" stop-color="#ede9fe"/>
                    <stop offset="100%" stop-color="#dcfce7"/>
                  </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#g1)"/>
                <circle cx="230" cy="190" r="90" fill="#ffffff" opacity="0.55"/>
                <circle cx="1000" cy="160" r="70" fill="#ffffff" opacity="0.45"/>
                <circle cx="940" cy="760" r="100" fill="#ffffff" opacity="0.35"/>
                <text x="50%" y="44%" dominant-baseline="middle" text-anchor="middle"
                  font-family="Arial" font-size="92" font-weight="700" fill="#1f2937">
                  Galeria klasy
                </text>
                <text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle"
                  font-family="Arial" font-size="42" fill="#4b5563">
                  Tu pojawią się Wasze zdjęcia i wspomnienia
                </text>
              </svg>
            `),
          author: "Jan",
          date: new Date().toISOString(),
          deleted: false,
        },
      ]

      for (const item of starterItems) {
        await putGalleryItem(item)
      }

      resolve()
    } catch (error) {
      reject(error)
    }
  })
}

export default function GaleriaPage() {
  const currentUserEmail = "jan.kowalski@radosnanowina.pl"
  const currentUser = getFirstNameFromEmail(currentUserEmail)
  const isAdmin = currentUserEmail === ADMIN_EMAIL

  const [items, setItems] = useState<GalleryItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [event, setEvent] = useState("")
  const [image, setImage] = useState("")
  const [selectedFileName, setSelectedFileName] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [newEntryId, setNewEntryId] = useState("")

  const [feedFilter, setFeedFilter] = useState<"all" | "mine">("all")

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    async function load() {
      try {
        await seedGalleryIfEmpty()
        const loadedItems = await getAllGalleryItems()
        setItems(loadedItems)
      } catch (e) {
        console.error("Błąd ładowania galerii:", e)
      } finally {
        setIsLoaded(true)
      }
    }

    load()
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

  const visibleItems = useMemo(() => {
    return items
      .filter((i) => !i.deleted)
      .filter((i) => (feedFilter === "mine" ? i.author === currentUser : true))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [items, feedFilter, currentUser])

  const todaysUploadsCount = items.filter(
    (i) => !i.deleted && i.author === currentUser && isSameDay(i.date)
  ).length

  const dailyPercent = Math.min((todaysUploadsCount / 3) * 100, 100)

  function resetForm() {
    setTitle("")
    setDescription("")
    setEvent("")
    setImage("")
    setSelectedFileName("")
    setError("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function openModal() {
    resetForm()
    setModalOpen(true)
  }

  function closeModal() {
    resetForm()
    setModalOpen(false)
  }

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFileName(file.name)

    const reader = new FileReader()

    reader.onload = (event) => {
      const result = event.target?.result
      if (typeof result === "string") {
        setImage(result)
      }
    }

    reader.readAsDataURL(file)
  }

  async function addImage() {
    setError("")
    setSuccess("")

    if (!image || !title.trim()) {
      setError("Dodaj obraz i wpisz tytuł.")
      return
    }

    if (todaysUploadsCount >= 3) {
      setError("Możesz dodać maksymalnie 3 zdjęcia dziennie.")
      return
    }

    const newItem: GalleryItem = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      event: event.trim(),
      image,
      author: currentUser,
      date: new Date().toISOString(),
      deleted: false,
    }

    try {
      await putGalleryItem(newItem)
      setItems((prev) => [newItem, ...prev])
      setNewEntryId(newItem.id)
      setSuccess("Zdjęcie dodane")
      closeModal()
    } catch (e) {
      console.error(e)
      setError("Nie udało się zapisać zdjęcia.")
    }
  }

  async function deleteItem(id: string) {
    const confirmed = window.confirm("Czy na pewno chcesz usunąć ten wpis?")
    if (!confirmed) return

    const found = items.find((i) => i.id === id)
    if (!found) return

    const updated = { ...found, deleted: true }

    try {
      await putGalleryItem(updated)
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)))
      if (previewIndex !== null) {
        setPreviewIndex(null)
      }
    } catch (e) {
      console.error(e)
    }
  }

  function openPreview(id: string) {
    const index = visibleItems.findIndex((i) => i.id === id)
    if (index >= 0) setPreviewIndex(index)
  }

  function closePreview() {
    setPreviewIndex(null)
  }

  function goPrev() {
    if (previewIndex === null) return
    const next = previewIndex === 0 ? visibleItems.length - 1 : previewIndex - 1
    setPreviewIndex(next)
  }

  function goNext() {
    if (previewIndex === null) return
    const next = previewIndex === visibleItems.length - 1 ? 0 : previewIndex + 1
    setPreviewIndex(next)
  }

  const previewItem = previewIndex !== null ? visibleItems[previewIndex] : null

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "28px 16px 80px",
        background:
          "linear-gradient(180deg,#f9fafb 0%,#eef2ff 60%,#eff6ff 100%)",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            color: "#2563eb",
            textDecoration: "none",
            fontWeight: 600,
            display: "inline-block",
            marginBottom: "20px",
          }}
        >
          ← Powrót
        </Link>

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
                Galeria
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
                Wspomnienia i ważne chwile klasy - w formie nowoczesnej,
                młodzieżowej galerii zdjęć i grafik.
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
                      width: `${dailyPercent}%`,
                      height: "100%",
                      background:
                        "linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%)",
                      borderRadius: "999px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>

                <div style={{ fontSize: "13px", color: "#6b7280" }}>
                  Dzisiejszy limit zdjęć (max. 3)
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
            marginBottom: "20px",
          }}
        >
          <button
            onClick={() => setFeedFilter("all")}
            style={{
              border: feedFilter === "all" ? "none" : "1px solid #d1d5db",
              background:
                feedFilter === "all"
                  ? "linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%)"
                  : "white",
              color: feedFilter === "all" ? "white" : "#374151",
              borderRadius: "999px",
              padding: "10px 16px",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "14px",
              boxShadow:
                feedFilter === "all"
                  ? "0 8px 20px rgba(79,70,229,0.22)"
                  : "none",
            }}
          >
            Wszystkie
          </button>

          <button
            onClick={() => setFeedFilter("mine")}
            style={{
              border: feedFilter === "mine" ? "none" : "1px solid #d1d5db",
              background:
                feedFilter === "mine"
                  ? "linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%)"
                  : "white",
              color: feedFilter === "mine" ? "white" : "#374151",
              borderRadius: "999px",
              padding: "10px 16px",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "14px",
              boxShadow:
                feedFilter === "mine"
                  ? "0 8px 20px rgba(79,70,229,0.22)"
                  : "none",
            }}
          >
            Moje
          </button>
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
            Ładowanie galerii...
          </div>
        ) : visibleItems.length === 0 ? (
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.85)",
              borderRadius: "22px",
              padding: "38px 26px",
              color: "#6b7280",
              textAlign: "center",
              boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontSize: "44px", marginBottom: "10px" }}>📷</div>
            <div
              style={{
                fontWeight: 700,
                color: "#374151",
                marginBottom: "6px",
                fontSize: "18px",
              }}
            >
              Galeria jest jeszcze pusta
            </div>
            <div style={{ fontSize: "14px" }}>
              Dodaj pierwsze zdjęcie albo grafikę klasy.
            </div>
          </div>
        ) : (
          <section
            style={{
              columnWidth: "260px",
              columnGap: "16px",
            }}
          >
            {visibleItems.map((item) => (
              <article
                key={item.id}
                style={{
                  breakInside: "avoid",
                  marginBottom: "16px",
                  background: "white",
                  border:
                    item.id === newEntryId
                      ? "2px solid #60a5fa"
                      : "1px solid #e5e7eb",
                  borderRadius: "22px",
                  overflow: "hidden",
                  boxShadow:
                    item.id === newEntryId
                      ? "0 14px 30px rgba(96,165,250,0.28)"
                      : "0 10px 26px rgba(0,0,0,0.06)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    cursor: "pointer",
                  }}
                  onClick={() => openPreview(item.id)}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    style={{
                      width: "100%",
                      display: "block",
                      objectFit: "cover",
                    }}
                  />

                  {item.event && (
                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        left: "12px",
                        backgroundColor: "rgba(17,24,39,0.78)",
                        color: "white",
                        padding: "6px 10px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        fontWeight: 700,
                        backdropFilter: "blur(6px)",
                      }}
                    >
                      {item.event}
                    </div>
                  )}

                  {isNewItem(item.date) && (
                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        background:
                          "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
                        color: "white",
                        padding: "6px 10px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        fontWeight: 800,
                      }}
                    >
                      Nowe
                    </div>
                  )}

                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      padding: "14px 14px 12px",
                      background:
                        "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.72) 100%)",
                      color: "white",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: "16px",
                        marginBottom: "4px",
                        lineHeight: 1.35,
                      }}
                    >
                      {item.title}
                    </div>

                    <div style={{ fontSize: "13px", opacity: 0.92 }}>
                      {item.author} • {formatDateTime(item.date)}
                    </div>
                  </div>
                </div>

                {(item.description ||
                  ((item.author === currentUser && canDelete(item.date)) ||
                    isAdmin)) && (
                  <div style={{ padding: "14px" }}>
                    {item.description && (
                      <div
                        style={{
                          color: "#4b5563",
                          fontSize: "14px",
                          lineHeight: 1.55,
                          marginBottom:
                            (item.author === currentUser && canDelete(item.date)) ||
                            isAdmin
                              ? "12px"
                              : "0",
                        }}
                      >
                        {item.description}
                      </div>
                    )}

                    {((item.author === currentUser && canDelete(item.date)) ||
                      isAdmin) && (
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => deleteItem(item.id)}
                          style={{
                            backgroundColor: "#fee2e2",
                            color: "#991b1b",
                            border: "none",
                            borderRadius: "12px",
                            padding: "10px 14px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: 600,
                          }}
                        >
                          Usuń
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))}
          </section>
        )}
      </div>

      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(17,24,39,0.45)",
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
              maxWidth: "620px",
              background: "linear-gradient(180deg, #ffffff 0%, #eef2ff 100%)",
              borderRadius: "28px",
              padding: "28px",
              boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
              maxHeight: "90vh",
              overflowY: "auto",
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
                Dodaj zdjęcie
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
                  Zdjęcie lub grafika
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                  style={{ display: "none" }}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: "100%",
                    border: "2px dashed #c7d2fe",
                    background: "#f8fafc",
                    borderRadius: "16px",
                    padding: "18px 16px",
                    textAlign: "center",
                    cursor: "pointer",
                    fontWeight: 700,
                    color: "#4338ca",
                    fontSize: "16px",
                  }}
                >
                  📷 Kliknij, aby wybrać zdjęcie
                </button>

                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "13px",
                    color: "#6b7280",
                  }}
                >
                  {selectedFileName
                    ? `Wybrany plik: ${selectedFileName}`
                    : "Nie wybrano jeszcze żadnego pliku"}
                </div>
              </div>

              {image && (
                <div
                  style={{
                    borderRadius: "18px",
                    overflow: "hidden",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                  }}
                >
                  <img
                    src={image}
                    alt="Podgląd"
                    style={{
                      width: "100%",
                      maxHeight: "280px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
              )}

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 700,
                    color: "#374151",
                  }}
                >
                  Tytuł
                </label>

                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Np. Wycieczka do Krakowa"
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "16px",
                    border: "1px solid #d1d5db",
                    fontSize: "16px",
                    boxSizing: "border-box",
                    backgroundColor: "white",
                  }}
                />
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
                  Wydarzenie - opcjonalnie
                </label>

                <input
                  value={event}
                  onChange={(e) => setEvent(e.target.value)}
                  placeholder="Np. Rekolekcje, wycieczka, dzień sportu"
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "16px",
                    border: "1px solid #d1d5db",
                    fontSize: "16px",
                    boxSizing: "border-box",
                    backgroundColor: "white",
                  }}
                />
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
                  Opis - opcjonalnie
                </label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Np. Jedno z najlepszych wspomnień z tego dnia."
                  rows={4}
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
                  onClick={addImage}
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
                  Dodaj zdjęcie
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewItem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.88)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 1100,
          }}
        >
          <button
            onClick={closePreview}
            style={{
              position: "absolute",
              top: "18px",
              right: "18px",
              border: "none",
              backgroundColor: "rgba(255,255,255,0.16)",
              color: "white",
              borderRadius: "12px",
              padding: "10px 14px",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "16px",
            }}
          >
            Zamknij
          </button>

          {visibleItems.length > 1 && (
            <>
              <button
                onClick={goPrev}
                style={{
                  position: "absolute",
                  left: "18px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  backgroundColor: "rgba(255,255,255,0.16)",
                  color: "white",
                  borderRadius: "999px",
                  width: "46px",
                  height: "46px",
                  cursor: "pointer",
                  fontSize: "24px",
                  fontWeight: 700,
                }}
              >
                ‹
              </button>

              <button
                onClick={goNext}
                style={{
                  position: "absolute",
                  right: "18px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  backgroundColor: "rgba(255,255,255,0.16)",
                  color: "white",
                  borderRadius: "999px",
                  width: "46px",
                  height: "46px",
                  cursor: "pointer",
                  fontSize: "24px",
                  fontWeight: 700,
                }}
              >
                ›
              </button>
            </>
          )}

          <div
            style={{
              maxWidth: "95vw",
              maxHeight: "90vh",
              display: "grid",
              gap: "14px",
              justifyItems: "center",
            }}
          >
            <img
              src={previewItem.image}
              alt={previewItem.title}
              style={{
                maxWidth: "100%",
                maxHeight: "72vh",
                objectFit: "contain",
                borderRadius: "18px",
                boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
              }}
            />

            <div
              style={{
                width: "100%",
                maxWidth: "780px",
                backgroundColor: "rgba(17,24,39,0.72)",
                color: "white",
                padding: "16px 18px",
                borderRadius: "18px",
                backdropFilter: "blur(8px)",
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  fontSize: "22px",
                  marginBottom: "6px",
                }}
              >
                {previewItem.title}
              </div>

              {previewItem.event && (
                <div
                  style={{
                    color: "#bfdbfe",
                    fontWeight: 700,
                    marginBottom: "6px",
                    fontSize: "14px",
                  }}
                >
                  {previewItem.event}
                </div>
              )}

              {previewItem.description && (
                <div
                  style={{
                    color: "#e5e7eb",
                    lineHeight: 1.6,
                    marginBottom: "8px",
                  }}
                >
                  {previewItem.description}
                </div>
              )}

              <div style={{ color: "#d1d5db", fontSize: "14px" }}>
                {previewItem.author} • {formatDateTime(previewItem.date)}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}