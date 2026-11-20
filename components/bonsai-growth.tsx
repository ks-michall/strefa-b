"use client"

import { growthStage, nextGrowthStage } from "../lib/bonsai-rewards"

export function BonsaiGrowth({count,compact=false}:{count:number;compact?:boolean}) {
  const stage = growthStage(count)
  const next = nextGrowthStage(count)
  return <div style={{textAlign:"center",padding:compact?"8px 0":"16px 0"}}>
    <div role="img" aria-label={`Etap drzewka: ${stage.name}, ${count} potwierdzeń`}
      style={{fontSize:compact?64:94,lineHeight:1.25,transition:"transform .3s ease"}}>
      {stage.symbol}
    </div>
    <div style={{fontWeight:800,fontSize:compact?14:16,color:"#2e6746",marginTop:6}}>
      {stage.name}
    </div>
    <div style={{fontSize:12,color:"#678070",marginTop:4}}>
      {next ? `Następny etap po ${next.at} potwierdzeniach (${Math.max(0,next.at-count)} do końca etapu)`
        : "Najwyższy etap rozwoju!"}
    </div>
  </div>
}
