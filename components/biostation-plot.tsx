"use client"

import { useId } from "react"

/** Each confirmed day grows one of 28 seedlings. Purely visual, no personal data. */
export function BiostationPlot({count,compact=false}:{count:number;compact?:boolean}){
  const grown=Math.max(0,Math.min(28,Math.floor(Number.isFinite(count)?count:0)))
  const id=useId().replace(/:/g,"")
  const url=(key:string)=>`url(#${id}-${key})`
  const plants=Array.from({length:28},(_,i)=>({i,row:Math.floor(i/7),col:i%7,ready:i<grown}))
  return <div className={"sb-bio-plot"+(compact?" compact":"")}
    aria-label={`Postęp Biostacji: ${grown} z 28 sadzonek`}>
    <svg viewBox="0 0 620 330" preserveAspectRatio="xMidYMid meet" role="img"
      aria-label={`Futurystyczna szklarnia z ${grown} wyrośniętymi sadzonkami na 28 miejsc`}>
      <defs>
        <linearGradient id={id+"-night"} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#1b3e4a"/><stop offset=".57" stopColor="#285d53"/><stop offset="1" stopColor="#101f2b"/>
        </linearGradient>
        <linearGradient id={id+"-glass"} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#b8f4cd" stopOpacity=".35"/><stop offset=".45" stopColor="#8cd6bd" stopOpacity=".1"/>
          <stop offset="1" stopColor="#77bfad" stopOpacity=".25"/>
        </linearGradient>
        <linearGradient id={id+"-bed"} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#354c4c"/><stop offset=".5" stopColor="#223c3f"/><stop offset="1" stopColor="#101d2b"/>
        </linearGradient>
        <linearGradient id={id+"-leaf"} x1="0" y1="0" x2="1" y2=".4">
          <stop stopColor="#4c9f6d"/><stop offset=".58" stopColor="#94d886"/><stop offset="1" stopColor="#d8fa9c"/>
        </linearGradient>
        <linearGradient id={id+"-sun"} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#d9ffbe" stopOpacity=".42"/><stop offset="1" stopColor="#d9ffbe" stopOpacity="0"/>
        </linearGradient>
        <radialGradient id={id+"-haze"}>
          <stop stopColor="#baf2a1" stopOpacity=".32"/><stop offset="1" stopColor="#baf2a1" stopOpacity="0"/>
        </radialGradient>
        <clipPath id={id+"-interior"}>
          <path d="M46 221V125Q52 50 152 39Q312 6 467 39Q564 54 574 125V221Z"/>
        </clipPath>
      </defs>
      <rect width="620" height="330" rx="20" fill={url("night")}/>
      <circle cx="460" cy="90" r="190" fill={url("haze")}/>
      <path d="M40 244V124Q44 46 151 30Q312 -8 469 30Q578 46 580 124V244Z"
        fill="#101f28" stroke="#79b49e" strokeWidth="5"/>
      <g clipPath={url("interior")}>
        <rect x="45" y="27" width="530" height="218" fill={url("glass")}/>
        <circle cx="424" cy="43" r="85" fill={url("sun")}/>
        <path d="M42 176Q116 128 187 169Q245 141 315 167Q370 129 433 167Q501 137 583 180V241H42Z"
          fill="#264f4c" opacity=".76"/>
        <path d="M46 191Q145 163 252 189Q343 159 433 186Q500 166 574 196V244H46Z"
          fill="#1b3c39" opacity=".9"/>
        <path d="M126 30Q109 123 115 234M217 18Q206 127 211 234M310 12V243M403 18Q414 127 408 234M495 30Q512 123 506 234"
          fill="none" stroke="#b7e4cb" strokeWidth="3" opacity=".38"/>
        <path d="M41 113Q310 59 578 113M43 173Q310 123 576 173"
          fill="none" stroke="#b9dfd1" strokeWidth="2.4" opacity=".28"/>
        <path d="M85 71L270 220M523 66L344 217" stroke="#d2f7d5" strokeWidth="12" opacity=".035"/>
      </g>
      <path d="M42 223H578V251H42Z" fill="#152e32" stroke="#5e9082" strokeWidth="2.5"/>
      <path d="M48 244H571V313H48Z" fill={url("bed")}/>
      <path d="M48 272H572M48 304H572" stroke="#6e9782" strokeWidth="1.5" opacity=".24"/>
      <path d="M57 245H563" stroke="#c6ed9a" strokeWidth="3" opacity=".55"/>
      <path d="M59 58V225M562 58V225" stroke="#78b0a7" strokeWidth="7" opacity=".75"/>
      <path d="M76 72V224M546 72V224" stroke="#c0e7cb" opacity=".2" strokeWidth="2"/>
      {Array.from({length:4},(_,row)=>{
        const y=183+row*35
        return <g key={row}>
          <rect x="88" y={y-3} width="445" height="29" rx="8" fill="#182c31" stroke="#6a9682" strokeWidth="1.5"/>
          <rect x="92" y={y+15} width="437" height="6" rx="3" fill="#84bfa2" opacity=".23"/>
          <path d={`M100 ${y+24}H522`} stroke="#d2f9a2" strokeWidth="2" opacity=".65"/>
          <path d={`M104 ${y+27}H517`} stroke="#7cd9ad" strokeWidth="1" opacity=".27"/>
        </g>
      })}
      {plants.map(({i,row,col,ready})=>{
        const x=121+col*61.5
        const y=187+row*35
        const stemH=9+(i%3)*2.5
        return <g key={i} className={ready?"sb-bio-seedbed alive":"sb-bio-seedbed"}
          style={{animationDelay:(i%7)*55+"ms"}}>
          <ellipse cx={x} cy={y+2} rx="19.5" ry="6.5" fill="#101e22" stroke="#638674" strokeWidth="1"/>
          <ellipse cx={x} cy={y+1} rx="15" ry="4.4" fill={ready?"#516f46":"#374743"}/>
          {ready?<g>
            <path d={`M${x} ${y}Q${x-1.7} ${y-stemH*.57} ${x} ${y-stemH}`}
              stroke="#c2ef9f" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d={`M${x} ${y-stemH*.36}Q${x-6} ${y-stemH-3} ${x-12} ${y-stemH-1}
              Q${x-10} ${y-stemH*.18} ${x} ${y-stemH*.36}Z`}
              fill={url("leaf")} stroke="#b1eaa2" strokeWidth=".5"/>
            <path d={`M${x} ${y-stemH*.43}Q${x+6} ${y-stemH-5} ${x+13} ${y-stemH-3}
              Q${x+10} ${y-stemH*.24} ${x} ${y-stemH*.43}Z`}
              fill={url("leaf")} stroke="#b1eaa2" strokeWidth=".5"/>
            <circle cx={x} cy={y-stemH} r="1.8" fill="#e5ffc0"/>
          </g>:
            <ellipse cx={x} cy={y} rx="3" ry="1.5" fill="#78957b" opacity=".5"/>}
        </g>
      })}
      <path d="M39 244H581M42 316H578" stroke="#a6cead" strokeWidth="2" opacity=".65"/>
      <rect x="18" y="15" width="143" height="28" rx="8" fill="#0c2527" stroke="#4f8272"/>
      <circle cx="34" cy="29" r="4" fill="#c4f594"/>
      <text x="47" y="33" fill="#ddf8cb" fontFamily="monospace" fontWeight="700" fontSize="11" letterSpacing="1">SZKLARNIA 01</text>
      <rect x="483" y="15" width="119" height="28" rx="8" fill="#0c2527" stroke="#4f8272"/>
      <text x="542" y="33" textAnchor="middle" fill="#ddf8cb" fontFamily="monospace" fontSize="12" fontWeight="700">
        {String(grown).padStart(2,"0")} / 28
      </text>
    </svg>
    {!compact&&<div className="sb-bio-plot-foot">
      <span><span className="sb-bio-led"/> SZKLARNIA AKTYWNA</span>
      <strong>{grown} / 28 <small>sadzonki</small></strong>
    </div>}
  </div>
}
