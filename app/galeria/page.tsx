"use client"

import { isActiveStudent } from "../../lib/active-students"
import { AvatarFace, type AvatarEntry } from "../../components/avatar-face"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { supabase } from "../../lib/supabase"

type GalleryItem = {
  id: string
  title: string
  description: string
  event: string
  image: string
  author: string
  date: string
  takenAt: string
  deleted: boolean
}

type GalleryRow = {
  id: string
  title: string
  description: string | null
  event: string | null
  image: string
  author: string
  created_at: string
  taken_at: string | null
  deleted: boolean
}

function mapRowToGalleryItem(row: GalleryRow): GalleryItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    event: row.event ?? "",
    image: row.image,
    author: row.author,
    date: row.created_at,
    takenAt: row.taken_at ?? row.created_at.slice(0, 10),
    deleted: row.deleted,
  }
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

function formatDateOnly(date: string) {
  return new Date(date).toLocaleDateString("pl-PL")
}

async function compressGalleryPhoto(file:File):Promise<{large:string;thumb:string}> {
  if(!file.type.startsWith("image/") || file.size>15*1024*1024)
    throw new Error("Wybierz zdjęcie o rozmiarze do 15 MB.")
  const url=URL.createObjectURL(file)
  try{
    const picture=new Image()
    picture.src=url
    await new Promise<void>((resolve,reject)=>{
      picture.onload=()=>resolve()
      picture.onerror=()=>reject(new Error("Nie można otworzyć zdjęcia. Spróbuj JPG lub PNG."))
    })
    function render(maxSize:number,quality:number){
      const ratio=Math.min(1,maxSize/Math.max(picture.naturalWidth,picture.naturalHeight))
      const canvas=document.createElement("canvas")
      canvas.width=Math.max(1,Math.round(picture.naturalWidth*ratio))
      canvas.height=Math.max(1,Math.round(picture.naturalHeight*ratio))
      const ctx=canvas.getContext("2d")
      if(!ctx)throw new Error("Nie można przetworzyć zdjęcia.")
      ctx.drawImage(picture,0,0,canvas.width,canvas.height)
      const encoded=canvas.toDataURL("image/webp",quality)
      if(!encoded.startsWith("data:image/webp;base64,"))
        throw new Error("Twoja przeglądarka nie obsługuje formatu WebP.")
      return encoded
    }
    let large=""
    for(const [pixels,quality] of [[1600,.78],[1400,.72],[1200,.68],[1000,.64],[800,.60]]){
      large=render(pixels,quality)
      if(large.length<1450000)break
    }
    let thumb=render(520,.73)
    if(thumb.length>300000)thumb=render(400,.64)
    if(large.length>1450000||thumb.length>300000)
      throw new Error("Nie udało się wystarczająco zmniejszyć zdjęcia.")
    return {large,thumb}
  }finally{URL.revokeObjectURL(url)}
}

function galleryPhotoSrc(source:string,size:"thumb"|"large"){
  if(source.startsWith("legacy:")){
    const id=source.slice(7)
    return /^[a-f0-9-]{36}$/i.test(id)
      ? "/api/gallery/legacy?id="+encodeURIComponent(id)+"&size="+size : ""
  }
  if(!source.startsWith("gallery:"))return source
  const id=source.slice(8)
  return /^[a-f0-9-]{36}$/i.test(id)
    ? "/api/gallery/image?id="+encodeURIComponent(id)+"&size="+size : ""
}

export default function GaleriaPage() {
  const [currentUser, setCurrentUser] = useState("")
  const [avatars, setAvatars] = useState<Record<string, AvatarEntry>>({})
  const [userLoaded, setUserLoaded] = useState(false)
  const isAdmin = currentUser === "ks. Michał"

  const [items, setItems] = useState<GalleryItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [event, setEvent] = useState("")
  const [image, setImage] = useState("")
  const [thumbnail, setThumbnail] = useState("")
  const [uploading, setUploading] = useState(false)
  const [takenAt, setTakenAt] = useState("")
  const [selectedFileName, setSelectedFileName] = useState("")
  const [processingImage, setProcessingImage] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [newEntryId, setNewEntryId] = useState("")

  const [feedFilter, setFeedFilter] = useState<"all" | "mine">("all")
  const [sortMode, setSortMode] = useState<"added" | "taken">("added")

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const previewTouchX = useRef<number | null>(null)

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
    let active = true
    async function loadAvatars() {
      try {
        const response = await fetch("/api/avatars", { cache: "no-store" })
        if (!response.ok) return
        const data = await response.json()
        if (!active || !Array.isArray(data.avatars)) return
        const entries: Record<string, AvatarEntry> = {}
        for (const avatar of data.avatars as AvatarEntry[]) {
          if (typeof avatar.student_name === "string") entries[avatar.student_name] = avatar
        }
        setAvatars(entries)
      } catch { /* Fallback emoji is always available */ }
    }
    void loadAvatars()
    return () => { active = false }
  }, [])

  useEffect(() => {
    async function loadGallery() {
      try {
        const { data, error } = await supabase
          .from("gallery_feed")
          .select("id,title,description,event,image,author,created_at,taken_at,deleted")
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Błąd ładowania Bajek:", error)
          return
        }

        setItems((data as GalleryRow[]).filter(item => isActiveStudent(item.author)).map(mapRowToGalleryItem))
      } catch (e) {
        console.error("Błąd ładowania Bajek:", e)
      } finally {
        setIsLoaded(true)
      }
    }

    loadGallery()
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
  const filtered = items
    .filter((i) => !i.deleted)
    .filter((i) => (feedFilter === "mine" ? i.author === currentUser : true))

  if (sortMode === "taken") {
    return [...filtered].sort(
      (a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime()
    )
  }

  return [...filtered].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}, [items, feedFilter, currentUser, sortMode])

  // Klawisze i gesty ułatwiają przeglądanie fotografii na telefonie.
  useEffect(() => {
    if (previewIndex === null) return
    function handleKeys(event: KeyboardEvent) {
      if (event.key === "Escape") setPreviewIndex(null)
      if (event.key === "ArrowLeft") setPreviewIndex(index =>
        index === null || visibleItems.length === 0 ? null :
          (index - 1 + visibleItems.length) % visibleItems.length)
      if (event.key === "ArrowRight") setPreviewIndex(index =>
        index === null || visibleItems.length === 0 ? null :
          (index + 1) % visibleItems.length)
    }
    window.addEventListener("keydown", handleKeys)
    return () => window.removeEventListener("keydown", handleKeys)
  }, [previewIndex, visibleItems.length])

  const todaysUploadsCount = useMemo(() => {
    return items.filter(
      (i) => !i.deleted && i.author === currentUser && isSameDay(i.date)
    ).length
  }, [items, currentUser])

  const dailyPercent = Math.min((todaysUploadsCount / 3) * 100, 100)

  function resetForm() {
    setTitle("")
    setDescription("")
    setEvent("")
    setImage("")
    setThumbnail("")
    setTakenAt("")
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

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError("")
    setImage("")
    setThumbnail("")
    setSelectedFileName(file.name)
    setProcessingImage(true)
    try {
      const compressed = await compressGalleryPhoto(file)
      setImage(compressed.large)
      setThumbnail(compressed.thumb)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nie udało się przygotować zdjęcia.")
      setSelectedFileName("")
    } finally {
      setProcessingImage(false)
    }
  }

  async function addImage() {
    setError("")
    setSuccess("")

    if (processingImage || uploading) return
    if (!image || !thumbnail || !title.trim()) {
      setError("Dodaj obraz i wpisz tytuł.")
      return
    }

    if (!takenAt) {
      setError("Wybierz datę zrobienia zdjęcia.")
      return
    }

    if (todaysUploadsCount >= 3) {
      setError("Możesz dodać maksymalnie 3 zdjęcia dziennie.")
      return
    }

    setUploading(true)
    try {
      const uploaded=await fetch("/api/gallery/upload",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          large:image.slice("data:image/webp;base64,".length),
          thumb:thumbnail.slice("data:image/webp;base64,".length),
        }),
      })
      const prepared=await uploaded.json()
      if(!uploaded.ok||typeof prepared.id!=="string")
        throw new Error(prepared.error||"Nie udało się przesłać zdjęcia.")
      const storedImage="gallery:"+prepared.id
      const { data, error } = await supabase
        .from("gallery_items")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          event: event.trim() || null,
          image:storedImage,
          author: currentUser,
          taken_at: takenAt,
          deleted: false,
        })
        .select()
        .single()

      if (error) {
        console.error(error)
        setError("Nie udało się zapisać zdjęcia.")
        return
      }

      const newItem = mapRowToGalleryItem(data as GalleryRow)

      setItems((prev) => [newItem, ...prev])
      setNewEntryId(newItem.id)
      setSuccess("Zdjęcie dodane")
      closeModal()
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : "Nie udało się zapisać zdjęcia.")
    } finally {
      setUploading(false)
    }
  }

  async function deleteItem(id: string) {
    const confirmed = window.confirm("Czy na pewno chcesz usunąć ten wpis?")
    if (!confirmed) return

    try {
      const { error } = await supabase
        .from("gallery_items")
        .update({ deleted: true })
        .eq("id", id)

      if (error) {
        console.error(error)
        return
      }

      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, deleted: true } : i))
      )

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
    const next =
      previewIndex === visibleItems.length - 1 ? 0 : previewIndex + 1
    setPreviewIndex(next)
  }

  const previewItem = previewIndex !== null ? visibleItems[previewIndex] : null

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
    <main className="sb-app-page sb-archive-page"
      style={{
        minHeight: "100vh",
        padding: "28px 16px 80px",
        background:
          "radial-gradient(ellipse at 12% 10%,rgba(66,108,85,.25),transparent 40%),linear-gradient(180deg,#0b1622 0%,#10242a 100%)",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <section className="sb-archive-header"
          style={{
            background: "linear-gradient(125deg,#182d38,#203e38)",
            borderRadius: "24px",
            padding: "28px",
            boxShadow: "0 18px 50px rgba(0,0,0,0.2)",
            border: "1px solid #426354",
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
              <p className="sb-small-label" style={{margin:"0 0 10px"}}>STREFA B / ARCHIWUM WSPOMNIEŃ</p>
              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(30px, 5vw, 42px)",
                  lineHeight: 1.1,
                  color: "#f2f8e9",
                }}
              >
                Baza Archiwalna
              </h1>

              <p
                style={{
                  marginTop: "14px",
                  marginBottom: "16px",
                  fontSize: "16px",
                  lineHeight: 1.7,
                  color: "#c1d4c5",
                }}
              >
                Ślady naszego życia. Fotografie, wspomnienia i dowody, że Strefa B to przede wszystkim ludzie.
              </p>

              <div style={{ maxWidth: "360px" }}>
                <div
                  style={{
                    width: "100%",
                    height: "12px",
                    borderRadius: "999px",
                    backgroundColor: "#34534b",
                    overflow: "hidden",
                    marginBottom: "6px",
                  }}
                >
                  <div
                    style={{
                      width: `${dailyPercent}%`,
                      height: "100%",
                      background:
                        "linear-gradient(125deg,#4f896a,#295d4e)",
                      borderRadius: "999px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>

                <div style={{ fontSize: "13px", color: "#bdd2be" }}>
                  Dzisiejszy limit zdjęć: maksymalnie 3
                </div>
              </div>
            </div>

            <button
              onClick={openModal}
              className="sb-pill-button"
              style={{
                border: "none",
                background:
                  "linear-gradient(125deg,#4f896a,#295d4e)",
                color: "white",
                borderRadius: "18px",
                padding: "16px 24px",
                fontSize: "16px",
                fontWeight: 800,
                letterSpacing: "0.04em",
                cursor: "pointer",
                boxShadow: "0 14px 30px rgba(12,50,34,0.3)",
              }}
            >
              + Dodaj zdjęcie
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
              border: feedFilter === "all" ? "1px solid #94c88a" : "1px solid #41665b",
              background:
                feedFilter === "all"
                  ? "linear-gradient(125deg,#4f896a,#295d4e)"
                  : "#1a3337",
              color: feedFilter === "all" ? "#f5fbea" : "#d3e5d5",
              borderRadius: "999px",
              padding: "10px 16px",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "14px",
              boxShadow:
                feedFilter === "all"
                  ? "0 8px 20px rgba(16,49,38,0.25)"
                  : "none",
            }}
          >
            Wszystkie
          </button>

          <button
            onClick={() => setFeedFilter("mine")}
            style={{
              border: feedFilter === "mine" ? "1px solid #94c88a" : "1px solid #41665b",
              background:
                feedFilter === "mine"
                  ? "linear-gradient(125deg,#4f896a,#295d4e)"
                  : "#1a3337",
              color: feedFilter === "mine" ? "#f5fbea" : "#d3e5d5",
              borderRadius: "999px",
              padding: "10px 16px",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "14px",
              boxShadow:
                feedFilter === "mine"
                  ? "0 8px 20px rgba(16,49,38,0.25)"
                  : "none",
            }}
          >
            Moje
          </button>

          <button
  onClick={() => setSortMode("added")}
  style={{
    border: sortMode === "added" ? "1px solid #94c88a" : "1px solid #41665b",
    background:
      sortMode === "added"
        ? "linear-gradient(125deg,#4f896a,#295d4e)"
        : "#1a3337",
    color: sortMode === "added" ? "#f5fbea" : "#d3e5d5",
    borderRadius: "999px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "14px",
    boxShadow:
      sortMode === "added"
        ? "0 8px 20px rgba(16,49,38,0.25)"
        : "none",
  }}
>
  Ostatnio dodane
</button>

<button
  onClick={() => setSortMode("taken")}
  style={{
    border: sortMode === "taken" ? "1px solid #94c88a" : "1px solid #41665b",
    background:
      sortMode === "taken"
        ? "linear-gradient(125deg,#4f896a,#295d4e)"
        : "#1a3337",
    color: sortMode === "taken" ? "#f5fbea" : "#d3e5d5",
    borderRadius: "999px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "14px",
    boxShadow:
      sortMode === "taken"
        ? "0 8px 20px rgba(16,49,38,0.25)"
        : "none",
  }}
>
  Według daty
</button>

        </section>

        {!isLoaded ? (
          <div
            style={{
              backgroundColor: "#1a3236",
              borderRadius: "22px",
              padding: "34px 26px",
              color: "#b6ccbd",
               textAlign: "center",
              boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
            }}
          >
            Ładowanie archiwum…
          </div>
        ) : visibleItems.length === 0 ? (
          <div
            style={{
              backgroundColor: "#1a3236",
              borderRadius: "22px",
              padding: "38px 26px",
              color: "#b6ccbd",
               textAlign: "center",
              boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontSize: "44px", marginBottom: "10px" }}>📷</div>
            <div
              style={{
                fontWeight: 700,
                color: "#e8f4e5",
                 marginBottom: "6px",
                fontSize: "18px",
              }}
            >
              Archiwum jest jeszcze puste
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
                className="sb-archive-photo-card"
                key={item.id}
                style={{
                  breakInside: "avoid",
                  marginBottom: "16px",
                  background: "#1a3236",
                   border:
                     item.id === newEntryId
                      ? "2px solid #b7e38c"
                      : "1px solid #395b52",
                   borderRadius: "22px",
                  overflow: "hidden",
                  boxShadow:
                    item.id === newEntryId
                      ? "0 14px 30px rgba(166,220,136,0.18)"
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
                  className="sb-card-pressable"
                  role="button" tabIndex={0} aria-label={`Otwórz zdjęcie: ${item.title}`}
                  onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openPreview(item.id) } }}
                >
                  <img
                    src={galleryPhotoSrc(item.image,"thumb")}
                    alt={item.title}
                    loading="lazy" decoding="async" className="sb-gallery-image"
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
                          "linear-gradient(125deg,#477957,#234a3f)",
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

                    <div style={{ fontSize: "13px", opacity: 0.92, display: "flex", alignItems: "center", gap: 5 }}>
                      <AvatarFace name={item.author} avatar={avatars[item.author]} size={14}/>
                      <span>{item.author} • {formatDateOnly(item.takenAt)}</span>
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
                          color: "#d3e0d3",
                          fontSize: "14px",
                          lineHeight: 1.55,
                          marginBottom:
                            (item.author === currentUser &&
                              canDelete(item.date)) ||
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
                      <div
                        style={{ display: "flex", justifyContent: "flex-end" }}
                      >
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
          <div className="sb-archive-upload-modal"
            style={{
              width: "100%",
              maxWidth: "620px",
              background: "linear-gradient(145deg,#183039,#233e3b)",
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
              <h2 style={{ margin: 0, fontSize: "30px", color: "#f1f8ea" }}>
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
                    border: "2px dashed #779e82",
                    background: "#dceadc",
                    borderRadius: "16px",
                    padding: "18px 16px",
                    textAlign: "center",
                    cursor: "pointer",
                    fontWeight: 700,
                    color: "#234d3c",
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
                  Data zrobienia zdjęcia
                </label>

                <input
                  type="date"
                  value={takenAt}
                  onChange={(e) => setTakenAt(e.target.value)}
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
                  disabled={processingImage || uploading}
                  style={{
                    border: "none",
                    background:
                      "linear-gradient(125deg,#4f896a,#295d4e)",
                    color: "white",
                    borderRadius: "14px",
                    padding: "12px 18px",
                    cursor: "pointer",
                    fontWeight: 800,
                  }}
                >
                  {uploading ? "Zapisywanie…" : "Dodaj zdjęcie"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewItem && (
        <div
          role="dialog" aria-modal="true" aria-label="Podgląd zdjęcia"
          onTouchStart={event => { previewTouchX.current = event.changedTouches[0]?.clientX ?? null }}
          onTouchEnd={event => {
            const start = previewTouchX.current
            previewTouchX.current = null
            if (start === null || visibleItems.length < 2) return
            const shift = event.changedTouches[0]?.clientX - start
            if (Math.abs(shift) > 48) { if (shift > 0) goPrev(); else goNext() }
          }}
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
              src={galleryPhotoSrc(previewItem.image,"large")}
              decoding="async"
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

              <div style={{ color: "#d1d5db", fontSize: "14px", display: "flex", alignItems: "center", gap: 5 }}>
                <AvatarFace name={previewItem.author} avatar={avatars[previewItem.author]} size={15}/>
                <span>{previewItem.author} • {formatDateOnly(previewItem.takenAt)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}