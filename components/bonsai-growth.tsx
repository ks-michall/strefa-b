"use client"

import { GROWTH_STAGES, growthStage, nextGrowthStage } from "../lib/bonsai-rewards"

const leaves = [
  {x:116,y:103,at:2,r:8}, {x:127,y:99,at:3,r:8},
  {x:106,y:90,at:4,r:10}, {x:139,y:84,at:4,r:10},
  {x:94,y:76,at:5,r:12}, {x:153,y:73,at:5,r:12},
  {x:119,y:65,at:6,r:16}, {x:79,y:66,at:6,r:13},
  {x:161,y:61,at:6,r:14}, {x:101,y:47,at:7,r:15},
  {x:138,y:42,at:7,r:16}, {x:74,y:49,at:7,r:12},
  {x:171,y:47,at:7,r:12}, {x:119,y:26,at:8,r:15},
]
const blossoms = [{x:91,y:51},{x:143,y:40},{x:171,y:55},{x:111,y:27},{x:77,y:65}]

export function BonsaiGrowth({count,compact=false}:{count:number;compact?:boolean}) {
  const stage = growthStage(count)
  const stageIndex = GROWTH_STAGES.findIndex(item=>item.at===stage.at)
  const next = nextGrowthStage(count)
  return <div className="sb-bonsai-tree" style={{textAlign:"center",padding:compact?"4px 0":"12px 0"}}>
    <svg className="sb-bonsai-svg" viewBox="0 0 240 180" role="img" aria-label={`Bonsai: ${stage.name}; ${count} z 28 potwierdzeń`}
      style={{display:"block",width:compact?145:210,maxWidth:"100%",height:"auto",margin:"0 auto"}}>
      <ellipse cx="120" cy="169" rx="76" ry="7" fill="#dcebe0"/>
      {stageIndex===0 ?
        <>
          <path d="M88 145 Q120 130 152 145" fill="none" stroke="#9c805d" strokeWidth="3" strokeLinecap="round"/>
          <ellipse cx="120" cy="130" rx="16" ry="22" fill="#ab7b4b" transform="rotate(-23 120 130)"/>
          <path d="M111 112 Q120 128 129 144" stroke="#e6b986" fill="none" strokeWidth="3"/>
        </>
        : <>
          {stageIndex>=4 ?
            <>
              <path d="M88 142 L152 142 L145 167 Q120 176 95 167 Z" fill="#c98464" stroke="#925f49" strokeWidth="3"/>
              <path d="M93 148 L147 148" stroke="#eeb69a" strokeWidth="3"/>
              <ellipse cx="120" cy="142" rx="30" ry="5" fill="#8c7655"/>
            </> :
            <path d="M79 154 Q120 141 161 154" stroke="#9ebc91" strokeWidth="4" fill="none" strokeLinecap="round"/>}
          <path d={stageIndex<4?"M120 150 Q115 128 120 102":
            "M120 144 Q108 122 124 105 Q137 91 118 71"}
            stroke={stageIndex<4?"#518b52":"#806449"}
            strokeWidth={stageIndex<4?5:stageIndex>=7?11:8}
            fill="none" strokeLinecap="round"/>
          {stageIndex>=3 && <path d="M120 114 Q102 113 91 100" fill="none" stroke="#785b43" strokeWidth="5" strokeLinecap="round"/>}
          {stageIndex>=4 && <path d="M125 102 Q145 101 158 87" fill="none" stroke="#785b43" strokeWidth="6" strokeLinecap="round"/>}
          {stageIndex>=5 && <path d="M119 83 Q96 82 78 65 M120 69 Q142 64 161 60" fill="none" stroke="#785b43" strokeWidth="5" strokeLinecap="round"/>}
          {leaves.filter(leaf=>leaf.at<=stageIndex).map((leaf,i)=>
            <ellipse key={`${i}-${stageIndex}`} className="sb-bonsai-leaf" cx={leaf.x} cy={leaf.y} rx={leaf.r} ry={leaf.r*.78}
              fill={i%3===0?"#5b9b5b":i%3===1?"#75b779":"#42844f"} opacity=".96"/>)}
          {stageIndex===8 && blossoms.map((flower,i)=>
            <g key={i} transform={`translate(${flower.x} ${flower.y})`}>
              <circle className="sb-bonsai-flower" cx="-4" cy="0" r="5" fill="#f4b5c9"/>
              <circle className="sb-bonsai-flower" cx="4" cy="0" r="5" fill="#f4b5c9"/>
              <circle className="sb-bonsai-flower" cx="0" cy="-4" r="5" fill="#ffd4df"/>
              <circle cx="0" cy="3" r="3" fill="#f5dc72"/>
            </g>)}
        </>}
    </svg>
    <div className="sb-bonsai-info" style={{fontWeight:800,fontSize:compact?14:17,color:"#2e6746",marginTop:5}}>
      {stage.name}
    </div>
    <div className="sb-bonsai-info" style={{fontSize:12,color:"#678070",marginTop:4}}>
      {next ? `Kolejny etap: ${next.name} (za ${next.at-count} potwierdzeń)`
        : "Najwyższy etap wzrostu!"}
    </div>
  </div>
}
