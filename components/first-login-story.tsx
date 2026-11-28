"use client"

import {useState} from "react"

export function FirstLoginStory(){
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState("")
  async function enter(){
    setLoading(true)
    setError("")
    try{
      const response=await fetch("/api/intro-complete",{method:"POST"})
      if(!response.ok)throw Error("Nie udało się potwierdzić odbioru komunikatu.")
      window.location.replace("/")
    }catch{
      setError("Nie udało się otworzyć Centrum operacyjnego. Spróbuj ponownie.")
      setLoading(false)
    }
  }
  return <main className="sb-intro-page">
    <section className="sb-intro-board" aria-labelledby="intro-title">
      <svg viewBox="0 0 80 74" width="64" height="59" aria-label="Zagrożenie biologiczne" role="img" style={{marginBottom:20}}><path d="M35 6Q40 -2 45 6L77 62Q82 72 71 72H9Q-2 72 3 62Z" fill="#edce43"/><text x="40" y="52" textAnchor="middle" fontSize="44" fill="#161a16">☣</text></svg>
      <div className="sb-intro-warning"><span className="sb-world-live-dot"/> KOMUNIKAT AWARYJNY / SEZON 01</div>
      <h1 id="intro-title">Wielka Cisza<span className="sb-green-dot">.</span></h1>
      <p>Wycieczka klasowa na Mazurach. Nad lasem rozlega się huk, ziemia drży, a telefony odbierają ostatni alert o zagrożeniu biologicznym.</p>
      <p>Razem z panem Kacprem i księdzem Michałem znajdujecie opuszczony bunkier. Na ścianie widnieje napis STREFA B. Zamykacie ciężkie drzwi.</p>
      <p>Łączność ze światem zanikła. Nie wiecie, co się stało ani czy ktoś poza wami przeżył.</p>
      <p className="sb-intro-last">Jesteście tu razem. To, co wydarzy się dalej, zależy od Was.</p>
      {error&&<p role="alert" className="sb-intro-error">{error}</p>}
      <button type="button" onClick={()=>void enter()} disabled={loading}>
        {loading?"Otwieranie Centrum…":"Wejdź do Strefy B"} <span aria-hidden="true">↗</span>
      </button>
    </section>
  </main>
}
