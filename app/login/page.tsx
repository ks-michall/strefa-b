"use client"

import { useState } from "react"

export default function LoginPage() {
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name.trim(), password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Nie udało się zalogować.")
        setLoading(false)
        return
      }

      window.location.href = data.mustChangePassword ? "/ustaw-haslo" : "/"
    } catch {
      setError("Wystąpił błąd połączenia.")
      setLoading(false)
    }
  }

  return (
    <main className="sb-app-page sb-theme-blue"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background:
          "linear-gradient(180deg, #eff6ff 0%, #f8fafc 45%, #eef2ff 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(10px)",
          borderRadius: "28px",
          padding: "28px",
          boxShadow: "0 18px 50px rgba(0,0,0,0.08)",
          border: "1px solid rgba(255,255,255,0.85)",
        }}
      >
      

        <p className="sb-small-label" style={{margin:"0 0 10px"}}>WITAJ W STREFIE B</p>
        <h1 style={{fontSize:33,fontWeight:900,letterSpacing:"-1.2px",color:"#17243b",margin:"0 0 11px"}}>
          Fajnie, że jesteś.
        </h1>
        <p
          style={{
            marginTop: 0,
            marginBottom: "22px",
            fontSize: "17px",
            lineHeight: 1.65,
            color: "#4b5563",
          }}
        >
          Nie każdy może wejść do Strefy B.
        </p>

        <form onSubmit={handleLogin} style={{ display: "grid", gap: "16px" }}>
          <div>
          

            <label htmlFor="login-name" style={{display:"block",fontWeight:750,color:"#24364b",marginBottom:8}}>
              Imię
            </label>
            <input
              id="login-name"
              type="text"
              name="username"
              autoComplete="username"
              autoCapitalize="words"
              spellCheck={false}
              maxLength={100}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Wpisz pełne imię"
              style={{
                width:"100%",
                padding:"14px",
                borderRadius:"16px",
                border:"1px solid #d1d5db",
                fontSize:"16px",
                boxSizing:"border-box",
                backgroundColor:"white",
                color:"#111827",
                opacity:1,
              }}
            />
          </div>

          <div>


            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Wpisz hasło"
              style={{
  width: "100%",
  padding: "14px",
  borderRadius: "16px",
  border: "1px solid #d1d5db",
  fontSize: "16px",
  boxSizing: "border-box",
  backgroundColor: "white",
  color: "#111827",
  opacity: 1,
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

          <button
            type="submit"
            disabled={loading}
            style={{
              border: "none",
              background:
                "linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%)",
              color: "white",
              borderRadius: "16px",
              padding: "14px 18px",
              cursor: loading ? "default" : "pointer",
              fontWeight: 800,
              fontSize: "16px",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Logowanie..." : "Zaloguj"}
          </button>
        </form>
      </div>
    </main>
  )
}