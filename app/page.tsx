"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ProfileMenu } from "../components/profile-menu"
import { BonsaiGrowth } from "../components/bonsai-growth"

type BonsaiSummary = { count: number; hasTrees: boolean }

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState("")
  const [userLoaded, setUserLoaded] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [bonsai, setBonsai] = useState<BonsaiSummary>({ count: 0, hasTrees: false })

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const response = await fetch("/api/me", { cache: "no-store" })
        const user = await response.json()
        if (!active) return
        if (user.mustChangePassword) {
          window.location.replace("/ustaw-haslo")
          return
        }
        setCurrentUser(user.name || "")
        if (user.name) {
          try {
            const treesResponse = await fetch("/api/bonsai", { cache: "no-store" })
            if (treesResponse.ok) {
              const data = await treesResponse.json()
              if (active && Array.isArray(data.trees) && data.trees.length > 0) {
                const latest = [...data.trees].sort((a: {started:string},b:{started:string}) =>
                  b.started.localeCompare(a.started))[0] as {checks?:unknown[]}
                setBonsai({count:Array.isArray(latest.checks)?latest.checks.length:0,hasTrees:true})
              }
            }
          } catch { /* Na stronie głównej pozostaje ilustracja Bonsai. */ }
        }
      } catch { /* Pokaż link do logowania. */ }
      finally { if (active) setUserLoaded(true) }
    }
    void load()
    return () => { active = false }
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch("/api/logout", { method: "POST" })
      window.location.href = "/login"
    } catch {
      setLoggingOut(false)
    }
  }

  if (!userLoaded) {
    return <main className="sb-home" aria-busy="true">
      <div className="sb-home-inner" style={{paddingTop:32,color:"#66758e"}}>Otwieramy Strefę B…</div>
    </main>
  }

  if (!currentUser) {
    return <main className="sb-home">
      <div className="sb-home-inner" style={{paddingTop:40,textAlign:"center"}}>
        <h1 className="sb-home-title">Twoja Strefa B czeka.</h1>
        <p className="sb-home-subtitle">Zaloguj się, aby zobaczyć swoją przestrzeń.</p>
        <Link className="sb-hero-cta" style={{marginTop:22}} href="/login">Przejdź do logowania <span aria-hidden="true">↗</span></Link>
      </div>
    </main>
  }

  return <main className="sb-home">
    <div className="sb-home-inner">
      <div className="sb-home-top">
        <div>
          <p className="sb-eyebrow">TWOJE MIEJSCE W KLASIE</p>
          <h1 className="sb-home-title">Hej, {currentUser}! <span aria-hidden="true">✳</span></h1>
          <p className="sb-home-subtitle">Dobrze, że jesteś. Co dzisiaj zrobimy dobrego?</p>
        </div>
        <ProfileMenu name={currentUser} onLogout={handleLogout} loggingOut={loggingOut}/>
      </div>

      <section className="sb-hero" aria-labelledby="sb-bonsai-title">
        <div className="sb-hero-copy">
          <p className="sb-hero-kicker">🌱 TWOJE MAŁE KROKI</p>
          <h2 className="sb-hero-title" id="sb-bonsai-title">Wielkie rzeczy<br/>rosną powoli.</h2>
          <p className="sb-hero-desc">
            Jeden nawyk. Jeden dzień. Twój własny rytm.
            {bonsai.hasTrees ? ` Ostatnie drzewko: ${bonsai.count} potwierdzonych dni.` : " Każdy początek się liczy."}
          </p>
          <Link className="sb-hero-cta" href="/bonsai">
            {bonsai.hasTrees ? "Zajrzyj do Bonsai" : "Zasadź swoje Bonsai"}
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="sb-hero-art" aria-hidden="true">
          <div className="sb-hero-bonsai">
            <BonsaiGrowth count={bonsai.count} compact />
          </div>
          <span className="sb-hero-figcaption">MAŁE KROKI, WŁASNA DROGA</span>
        </div>
      </section>

      <section className="sb-module-grid" aria-label="Moduły klasy">
        <Link href="/podziekowania" className="sb-module-card sb-module-blue">
          <div className="sb-module-top">
            <span className="sb-module-icon" aria-hidden="true">💙</span>
            <span className="sb-module-arrow" aria-hidden="true">↗</span>
          </div>
          <div>
            <h2 className="sb-module-title">Bohaterowie</h2>
            <p className="sb-module-description">Zauważ dobro. Powiedz komuś, że ma znaczenie.</p>
          </div>
        </Link>
        <Link href="/galeria" className="sb-module-card sb-module-peach">
          <div className="sb-module-top">
            <span className="sb-module-icon" aria-hidden="true">📸</span>
            <span className="sb-module-arrow" aria-hidden="true">↗</span>
          </div>
          <div>
            <h2 className="sb-module-title">Bajki</h2>
            <p className="sb-module-description">Nasze historie. Zdjęcia, do których chce się wracać.</p>
          </div>
        </Link>
      </section>

      {currentUser === "ks. Michał" && <Link href="/busola" className="sb-teacher-link">
        <span className="sb-teacher-link-icon" aria-hidden="true">🧭</span>
        <span style={{flex:1}}><strong>Busola</strong><small>Twoja przestrzeń wychowawcy</small></span>
        <span aria-hidden="true" style={{fontWeight:900,fontSize:20}}>↗</span>
      </Link>}

      <p className="sb-home-footer">Strefa B • Nasze miejsce. Nasze historie. Nasze małe kroki.</p>
    </div>
  </main>
