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
      <div className="sb-intro-warning"><span className="sb-world-live-dot"/> KOMUNIKAT AWARYJNY / SEZON 01</div>
      <h1 id="intro-title">Wielka Cisza<span className="sb-green-dot">.</span></h1>
      <p>Globalny konflikt i użycie broni biologicznej doprowadziły do zagłady ludzkości.</p>
      <p>Ostatnia grupa ocalałych znalazła schronienie w Strefie B.</p>
      <p>Nie wiemy, czy poza jej granicami ktokolwiek jeszcze żyje.</p>
      <p className="sb-intro-last">Jesteście tu razem. To, co wydarzy się dalej, zależy od Was.</p>
      {error&&<p role="alert" className="sb-intro-error">{error}</p>}
      <button type="button" onClick={()=>void enter()} disabled={loading}>
        {loading?"Otwieranie Centrum…":"Wejdź do Strefy B"} <span aria-hidden="true">↗</span>
      </button>
    </section>
  </main>
}
