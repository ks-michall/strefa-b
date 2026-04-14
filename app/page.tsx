"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState("")
  const [userLoaded, setUserLoaded] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

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

  async function handleLogout() {
    setLoggingOut(true)

    try {
      await fetch("/api/logout", {
        method: "POST",
      })
      window.location.href = "/login"
    } catch {
      setLoggingOut(false)
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
          "linear-gradient(180deg, #f9fafb 0%, #eef2ff 50%, #eff6ff 100%)",
        padding: "28px 16px 60px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <header
          style={{
            marginBottom: "30px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            

            <p
              style={{
                fontSize: "18px",
                color: "#4b5563",
                maxWidth: "760px",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Nasza przestrzeń. Nasze historie. Nasze momenty.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span
              style={{
                backgroundColor: "white",
                padding: "10px 14px",
                borderRadius: "999px",
                fontWeight: 700,
                color: "#374151",
                boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
              }}
            >
              Witaj {currentUser}
            </span>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                border: "none",
                background: "#111827",
                color: "white",
                borderRadius: "999px",
                padding: "10px 16px",
                fontWeight: 700,
                cursor: loggingOut ? "default" : "pointer",
                opacity: loggingOut ? 0.7 : 1,
              }}
            >
              {loggingOut ? "Wylogowanie..." : "Wyloguj"}
            </button>
          </div>
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
            style={{
              borderRadius: "28px",
              padding: "26px",
              boxShadow: "0 14px 34px rgba(0,0,0,0.07)",
              display: "block",
              textDecoration: "none",
              color: "#111827",
              background: "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)",
              border: "1px solid #dbeafe",
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
              🦸
            </div>

            <h2
              style={{
                fontSize: "28px",
                marginTop: 0,
                marginBottom: "10px",
              }}
            >
              Bohaterowie
            </h2>

            <p
              style={{
                color: "#4b5563",
                lineHeight: 1.7,
                margin: 0,
                fontSize: "17px",
              }}
            >
              Nikt na nich nie zasługuje, ale wszyscy ich potrzebujemy.
            </p>
          </Link>

          <Link
            href="/galeria"
            style={{
              borderRadius: "28px",
              padding: "26px",
              boxShadow: "0 14px 34px rgba(0,0,0,0.07)",
              display: "block",
              textDecoration: "none",
              color: "#111827",
              background: "linear-gradient(135deg, #ffffff 0%, #f3e8ff 100%)",
              border: "1px solid #e9d5ff",
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
                fontSize: "28px",
                marginTop: 0,
                marginBottom: "10px",
              }}
            >
              Bajki
            </h2>

            <p
              style={{
                color: "#4b5563",
                lineHeight: 1.7,
                margin: 0,
                fontSize: "17px",
              }}
            >
              Podobno życie to nie bajka... ale jak nazwać nasze przygody?
            </p>
          </Link>
        </section>
      </div>
    </main>
  )
}