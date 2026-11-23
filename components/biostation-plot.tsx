"use client"

/** The twenty-eight confirmed days become a growing greenhouse plot.
 * No student information leaves this component.
 */
export function BiostationPlot({count,compact=false}:{count:number;compact?:boolean}){
  const grown=Math.max(0,Math.min(28,count))
  const plants=Array.from({length:28},(_,i)=>({
    i, row:Math.floor(i/7),col:i%7,ready:i<grown,
  }))
  return <div className={"sb-bio-plot"+(compact?" compact":"")} aria-label={"Poletko Biostacji: "+grown+" z 28 dni potwierdzonych"}>
    <svg viewBox="0 0 620 320" role="img" aria-label={"Szklarnia z "+grown+" rosnącymi roślinami"}
      preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="bio-dome" x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#152d31"/><stop offset=".5" stopColor="#2a4e47"/><stop offset="1" stopColor="#152a2b"/>
        </linearGradient>
        <linearGradient id="bio-floor" x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="#516d52"/><stop offset="1" stopColor="#233b34"/>
        </linearGradient>
        <linearGradient id="bio-leaf" x1="0" x2="1">
          <stop stopColor="#70bf81"/><stop offset="1" stopColor="#cdfc9c"/>
        </linearGradient>
        <radialGradient id="bio-light">
          <stop stopColor="#c0f4b4" stopOpacity=".23"/><stop offset="1" stopColor="#c0f4b4" stopOpacity="0"/>
        </radialGradient>
        <pattern id="bio-glass" width="37" height="37" patternUnits="userSpaceOnUse">
          <path d="M37 0H0V37" fill="none" stroke="#d7fbcd" strokeWidth=".75" opacity=".13"/>
        </pattern>
      </defs>
      <rect width="620" height="320" rx="24" fill="url(#bio-dome)"/>
      <path d="M18 152Q90 23 310 20Q530 23 603 152V286H18Z"
        fill="#406355" opacity=".42" stroke="#aad9ac" strokeWidth="2.5"/>
      <path d="M39 152Q96 42 310 41Q524 42 581 152"
        fill="none" stroke="#acd7b2" opacity=".22" strokeWidth="4"/>
      <path d="M310 25V190M95 58L206 163M520 58L412 163M18 152H603"
        stroke="#b1d5b7" opacity=".17" strokeWidth="3"/>
      <rect width="620" height="220" fill="url(#bio-glass)" opacity=".63"/>
      <ellipse cx="310" cy="125" rx="278" ry="140" fill="url(#bio-light)"/>
      <path d="M32 231L307 147L594 230L583 295H38Z" fill="url(#bio-floor)"/>
      <path d="M32 231L307 147L594 230" fill="none" stroke="#b1cc9b" opacity=".49" strokeWidth="2"/>
      <g fill="none" stroke="#a8d19e" opacity=".16" strokeWidth="2">
        <path d="M53 249L311 165L574 245M57 265L311 185L569 263M65 280L309 206L565 282"/>
      </g>
      {plants.map(({i,row,col,ready})=>{
        // Slight perspective: more distant rows are higher, and plants grow
        // upwards from a small patch in the shared planter.
        const x=111+col*56+row*4
        const y=191+row*23-(col%2)*4
        const tall=9+(i%4)*3
        return <g key={i} className={ready?"sb-bio-seedbed alive":"sb-bio-seedbed"} style={{animationDelay:(i%7)*65+"ms"}}>
          <ellipse cx={x} cy={y+9} rx="21" ry="10" fill="#122925" opacity=".55"/>
          <path d={`M${x-22} ${y+6} l22 -8 l23 8 l-22 10 Z`} fill={ready?"#496e42":"#445348"} stroke="#8bad6f" strokeWidth=".8" opacity={ready?1:.49}/>
          {ready ? <>
            <path d={`M${x} ${y+7} Q${x-2} ${y-tall*.55} ${x+2} ${y-tall}`}
              stroke="#b2e88c" strokeWidth="2.3" strokeLinecap="round" fill="none"/>
            <path d={`M${x} ${y+1} Q${x-8} ${y-tall*.75} ${x-13} ${y-tall*.6}
              Q${x-9} ${y+1} ${x} ${y+2}`} fill="#6fac6e"/>
            <path d={`M${x+1} ${y-tall*.3} Q${x+6} ${y-tall*1.05} ${x+13} ${y-tall*.85}
              Q${x+10} ${y-tall*.3} ${x+1} ${y-tall*.3}`} fill="url(#bio-leaf)"/>
            {i%5===0&&<circle cx={x+2} cy={y-tall} r="3.4" fill="#d3e66c"/>}
          </>:
            <path d={`M${x-5} ${y+5}q5 -3 10 0`} stroke="#b4a17e" strokeWidth="1.3" fill="none" opacity=".43"/>}
        </g>
      })}
      <path d="M35 290L310 211L585 288" stroke="#c3e1a5" strokeWidth="2" opacity=".43" fill="none"/>
      <rect x="19" y="18" width="131" height="27" rx="8" fill="#122d2b" opacity=".75"/>
      <circle cx="33" cy="31" r="4" fill="#c9fa97"/>
      <text x="46" y="35" fill="#c5e6be" fontFamily="monospace" fontSize="11" letterSpacing="2">BIOSTACJA 01</text>
      <rect x="469" y="18" width="127" height="27" rx="8" fill="#122d2b" opacity=".75"/>
      <text x="532" y="35" textAnchor="middle" fill="#c5e6be" fontFamily="monospace" fontSize="11" letterSpacing="1">
        {String(grown).padStart(2,"0")} / 28 DNI
      </text>
    </svg>
    {!compact&&<div className="sb-bio-plot-foot">
      <span><span className="sb-bio-led"/> UPRAWA AKTYWNA</span>
      <strong>{grown} / 28 <small>potwierdzeń</small></strong>
    </div>}
  </div>
}
