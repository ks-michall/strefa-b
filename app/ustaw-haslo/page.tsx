"use client"

import { useState } from "react"

export default function SetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [show, setShow] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    if (password.length < 12 || password.length > 128) {
      setError("Hasło musi mieć od 12 do 128 znaków.")
      return
    }
    if (password !== confirm) {
      setError("Wpisane hasła muszą być identyczne.")
      return
    }
    setLoading(true)
    try {
      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "Nie udało się zmienić hasła.")
        return
      }
      window.location.replace("/")
    } catch {
      setError("Błąd połączenia. Spróbuj jeszcze raz.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{
      minHeight: "100vh", padding: "36px 16px", display: "flex", alignItems: "center",
      justifyContent: "center", background: "linear-gradient(180deg,#f0f9f1,#f7f8ff)",
      fontFamily: "Arial, sans-serif",
    }}>
      <section style={{
        width: "100%", maxWidth: 470, padding: 30, background: "white",
        borderRadius: 28, boxShadow: "0 12px 35px rgba(16,65,39,.09)",
      }}>
        <div style={{ fontSize: 42, marginBottom: 12 }}>🌱</div>
        <h1 style={{ margin: "0 0 12px", color: "#183a2b", fontSize: 27 }}>Ustaw własne hasło</h1>
        <p style={{ color: "#516477", lineHeight: 1.7, marginBottom: 24 }}>
          Witaj w Strefie B! Przy pierwszym wejściu wybierz prywatne hasło.
          Hasło startowe przestanie działać, gdy zapiszesz nowe.
        </p>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <label htmlFor="newPassword" style={{ fontWeight: 700 }}>Nowe hasło</label>
          <input id="newPassword" type={show ? "text" : "password"} value={password}
            minLength={12} maxLength={128} required autoComplete="new-password"
            onChange={e => setPassword(e.target.value)} placeholder="Minimum 12 znaków"
            style={{ border: "1px solid #cbd5e1", borderRadius: 14, fontSize: 16, padding: 14, width: "100%", boxSizing: "border-box" }}/>
          <label htmlFor="confirmPassword" style={{ fontWeight: 700 }}>Powtórz hasło</label>
          <input id="confirmPassword" type={show ? "text" : "password"} value={confirm}
            minLength={12} maxLength={128} required autoComplete="new-password"
            onChange={e => setConfirm(e.target.value)} placeholder="Wpisz ponownie"
            style={{ border: "1px solid #cbd5e1", borderRadius: 14, fontSize: 16, padding: 14, width: "100%", boxSizing: "border-box" }}/>
          <label style={{ fontSize: 14, color: "#334155", display: "flex", alignItems: "center", gap: 10 }}>
            <input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)}/>
            Pokaż hasło
          </label>
          <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            Nie udostępniaj hasła kolegom. Możesz użyć całego długiego zdania jako hasła.
          </p>
          {error && <p role="alert" style={{ padding: 12, borderRadius: 12, background: "#fee2e2", color: "#991b1b", margin: 0 }}>{error}</p>}
          <button disabled={loading || password.length < 12 || password !== confirm}
            style={{
              background: "#246b49", color: "white", border: "none", borderRadius: 14,
              padding: "15px 16px", fontSize: 16, fontWeight: 700,
              cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1,
            }} type="submit">{loading ? "Zapisywanie…" : "Zapisz hasło i wejdź do Strefy B"}</button>
        </form>
      </section>
    </main>
  )
}
