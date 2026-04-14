"use client"

import { useState } from "react"
import { sortedStudents } from "../../lib/students"

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
        body: JSON.stringify({ name, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Nie udało się zalogować.")
        setLoading(false)
        return
      }

      window.location.href = "/"
    } catch {
      setError("Wystąpił błąd połączenia.")
      setLoading(false)
    }
  }

  return (
    <main
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
          

            <select
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              <option value="">Wybierz swoje imię</option>
              {sortedStudents.map((student) => (
                <option key={student} value={student}>
                  {student}
                </option>
              ))}
            </select>
          </div>

          <div>


            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Wpisz hasło"
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "16px",
                border: "1px solid #d1d5db",
                fontSize: "16px",
                backgroundColor: "white",
                boxSizing: "border-box",
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