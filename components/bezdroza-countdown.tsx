"use client"

import {useEffect,useState} from "react"
import {BEZDROZA_LAUNCH_MS} from "../lib/bezdroza-launch"

function remaining(now:number){
  const seconds=Math.max(0,Math.ceil((BEZDROZA_LAUNCH_MS-now)/1000))
  const days=Math.floor(seconds/86400)
  const hours=Math.floor((seconds%86400)/3600)
  const minutes=Math.floor((seconds%3600)/60)
  const secs=seconds%60
  return {days,hours,minutes,secs,expired:seconds===0}
}
function number(value:number){return String(value).padStart(2,"0")}

export function BezdrozaCountdown(){
  const [now,setNow]=useState<number|null>(null)
  useEffect(()=>{
    const update=()=>setNow(Date.now())
    update()
    const timer=window.setInterval(update,1000)
    return()=>window.clearInterval(timer)
  },[])
  const left=remaining(now??0)
  useEffect(()=>{
    if(now!==null&&left.expired)window.location.reload()
  },[now,left.expired])
  return <main className="sb-world sb-bezdroza-locked">
    <section className="sb-bezdroza-lock-board" aria-labelledby="lock-title">
      <div className="sb-bezdroza-lock-scan" aria-hidden="true"/>
      <p className="sb-bezdroza-lock-label"><span className="sb-world-live-dot"/> SYGNAŁ Z ZEWNĄTRZ</p>
      <h1 id="lock-title">Bezdroża<span className="sb-green-dot">.</span></h1>
      <p className="sb-bezdroza-lock-headline">Granice Strefy B pozostają zamknięte.</p>
      <p className="sb-bezdroza-lock-message">Odkrywanie świata rozpocznie się w środę <strong>2 grudnia o 9:30</strong>.</p>
      <p className="sb-bezdroza-lock-count-label">DO OTWARCIA SZLAKU</p>
      <div className="sb-bezdroza-lock-clock" role="timer" aria-label="Czas pozostały do startu Bezdroży">
        {[
          {value:left.days,label:"DNI"},
          {value:left.hours,label:"GODZ."},
          {value:left.minutes,label:"MIN."},
          {value:left.secs,label:"SEK."},
        ].map((part,i)=><div key={part.label} className="sb-bezdroza-lock-unit">
          <strong>{now===null?"··":i===0?part.value:number(part.value)}</strong>
          <span>{part.label}</span>
        </div>)}
      </div>
      <p className="sb-bezdroza-lock-foot">Do tego czasu dbajcie o zapasy i morale. Przyszłość zaczyna się w Strefie B.</p>
    </section>
  </main>
}
