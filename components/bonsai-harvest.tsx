"use client"

import { type TreeAchievement, harvestBadges, RECOGNITION_THRESHOLD } from "../lib/bonsai-rewards"
import { BiostationPlot } from "./biostation-plot"
import { habits } from "../lib/bonsai-habits"

export function BonsaiHarvest({
  tree, earlier, today, canPlant, onRepeat, onNew,
}:{
  tree:TreeAchievement
  earlier:TreeAchievement[]
  today:string
  canPlant:boolean
  onRepeat:()=>void
  onNew:()=>void
}) {
  const earned = harvestBadges(tree,earlier,today)
  const count = tree.checks.length
  return <section className="sb-bio-harvest" style={{
    background:"linear-gradient(160deg,#fbfff9,#e8f5e9)",border:"1px solid #b9dec1",
    borderRadius:24,padding:22,boxShadow:"0 9px 28px rgba(33,104,61,.09)",
  }}>
    <p style={{margin:"0 0 8px",fontSize:12,fontWeight:800,letterSpacing:1,color:"#427653"}}>
      🌾 ZBIORY BIOSTACJI • CYKL ZAKOŃCZONY
    </p>
    <h2 style={{fontSize:22,margin:"0 0 8px",color:"#214c31"}}>{habits[tree.habitIndex]?.title ?? "Twój nawyk"}</h2>
    <BiostationPlot count={count}/>
    <div style={{fontSize:25,fontWeight:800,textAlign:"center",color:"#214c31"}}>{count} / 28 dni</div>
    <div style={{height:10,background:"#d5e8d8",borderRadius:99,overflow:"hidden",margin:"12px 0"}}>
      <div style={{height:"100%",width:`${Math.min(count,28)/28*100}%`,background:"#579b6d",borderRadius:99}}/>
    </div>
    <p style={{lineHeight:1.65,color:"#42624c",textAlign:"center"}}>
      {count===0
        ? "To wyzwanie dobiegło końca. Możesz spróbować jeszcze raz — każdy nowy początek się liczy."
        : `${count} razy udało Ci się potwierdzić swój nawyk. To ${count} konkretnych kroków w pracy nad sobą!`}
    </p>
    {earned.length>0 && <div style={{display:"grid",gap:8,margin:"18px 0"}}>
      {earned.map(badge=><div key={badge.id} style={{
        padding:"11px 13px",background:"white",border:"1px solid #c9e5cd",
        borderRadius:13,display:"flex",gap:12,alignItems:"center",
      }}>
        <span aria-hidden="true" style={{fontSize:27}}>{badge.icon}</span>
        <div><strong style={{color:"#295f3f"}}>{badge.title}</strong>
          <div style={{fontSize:13,color:"#5b7865"}}>{badge.description}</div>
        </div>
      </div>)}
    </div>}
    {count>=RECOGNITION_THRESHOLD && <div role="status" style={{
      background:"#fffaf0",border:"1px solid #ead7a6",borderRadius:15,
      padding:"16px",margin:"18px 0",lineHeight:1.65,color:"#5c492b",
    }}>
      <strong>🏅 Zaproszenie do rozmowy z ks. Michałem</strong>
      <p style={{margin:"8px 0 0"}}>
        Osiągnąłeś co najmniej 21 potwierdzeń w 28-dniowym wyzwaniu.
        Zgłoś się do ks. Michała, aby porozmawiać o efektach swojej pracy nad sobą.
        Po rozmowie wychowawca może rozważyć wpisanie pozytywnej uwagi z zachowania.
        Uwaga nie jest przyznawana automatycznie.
      </p>
    </div>}
    <p style={{fontWeight:700,color:"#2c6242",margin:"22px 0 10px"}}>Co dalej?</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
      <button type="button" disabled={!canPlant} onClick={onRepeat} style={{
        background:canPlant?"#276948":"#d8e2d9",color:canPlant?"white":"#52675a",
        padding:"13px 15px",border:0,borderRadius:14,fontWeight:700,cursor:canPlant?"pointer":"not-allowed",
      }}>↻ Utrwalam ten nawyk</button>
      <button type="button" disabled={!canPlant} onClick={onNew} style={{
        background:canPlant?"white":"#e5ece5",color:"#285b3e",
        padding:"13px 15px",border:"1px solid #b4d7bf",borderRadius:14,fontWeight:700,
        cursor:canPlant?"pointer":"not-allowed",
      }}>🌱 Rozpoczynam nową uprawę</button>
    </div>
    {!canPlant && <p style={{fontSize:13,color:"#5c7867",marginBottom:0}}>
      Następną uprawę będzie można rozpocząć po upływie 14 dni od ostatniego sadzenia.
    </p>}
  </section>
}
