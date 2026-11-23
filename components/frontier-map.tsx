"use client"

import { WORLD_SECTORS } from "../lib/world-story"

type SectorId=(typeof WORLD_SECTORS)[number]["id"]

export function FrontierMap({
  unlocked,selected,onSelect,
}:{
  unlocked:Set<string>;selected:string;onSelect:(id:SectorId)=>void
}){
  const visible=(id:string)=>id==="baza"||unlocked.has(id)
  const reveal=WORLD_SECTORS.filter(s=>visible(s.id))
  return <div className="sb-frontier-map" aria-label="Mapa odkrywania Bezdroży">
    <svg className="sb-frontier-art" viewBox="0 0 900 570" role="img"
      aria-label="Topograficzna mapa Strefy B: odkryte tereny w kolorze, pozostałe ukryte pod mgłą."
      preserveAspectRatio="none">
      <defs>
        <linearGradient id="sb-terrain" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#28463f"/>
          <stop offset=".46" stopColor="#33413b"/>
          <stop offset="1" stopColor="#555345"/>
        </linearGradient>
        <linearGradient id="sb-fog" x1="0" x2="0.9" y1="0" y2="1">
          <stop stopColor="#0b1422" stopOpacity=".92"/>
          <stop offset="1" stopColor="#142338" stopOpacity=".88"/>
        </linearGradient>
        <radialGradient id="sb-reveal" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="black"/>
          <stop offset=".57" stopColor="black"/>
          <stop offset="1" stopColor="white"/>
        </radialGradient>
        <pattern id="sb-grid" width="45" height="45" patternUnits="userSpaceOnUse">
          <path d="M45 0H0V45" fill="none" stroke="#e2dfbd" strokeWidth=".6" opacity=".12"/>
        </pattern>
        <pattern id="sb-scratches" width="39" height="29" patternUnits="userSpaceOnUse" patternTransform="rotate(-17)">
          <path d="M0 0L17 0M22 12L39 12M8 28L25 28" fill="none" stroke="#0a1820" strokeWidth="1" opacity=".2"/>
        </pattern>
        <filter id="sb-terrain-grain">
          <feTurbulence type="fractalNoise" baseFrequency=".016" numOctaves="3" seed="13" stitchTiles="stitch"/>
          <feColorMatrix type="saturate" values="0"/>
          <feComponentTransfer><feFuncA type="linear" slope=".17"/></feComponentTransfer>
        </filter>
        <mask id="sb-map-fog-mask">
          <rect width="900" height="570" fill="white"/>
          {reveal.map(s=><circle key={s.id} cx={s.x*9} cy={s.y*5.7}
            r={s.id==="baza"?230:153} fill="url(#sb-reveal)"/>)}
        </mask>
        <linearGradient id="sb-water" x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#45797a"/><stop offset="1" stopColor="#1b565f"/>
        </linearGradient>
      </defs>
      <rect width="900" height="570" fill="url(#sb-terrain)"/>
      <path d="M-50 90L100 0H460L344 155L151 205L-50 176Z" fill="#6f7254" opacity=".57"/>
      <path d="M575-40L940 20V225L755 210L692 129L570 95Z" fill="#777d62" opacity=".63"/>
      <path d="M-40 310L113 263L197 330L166 595H-40Z" fill="#5b6349" opacity=".7"/>
      <path d="M496 570L542 378L651 300L916 368V590Z" fill="#686950" opacity=".68"/>
      <path d="M155-10L201 36L257 63L300 115L348 143L395 183L450 195L512 258"
        fill="none" stroke="#9aa084" strokeWidth="36" opacity=".13"/>
      {[
        "M-12 42Q111 62 179 125T364 154T576 107T922 65",
        "M-10 67Q115 88 173 153T347 182T583 138T910 98",
        "M-14 99Q118 121 174 178T341 209T591 169T936 132",
        "M13 288Q150 225 256 248T446 321T665 334T921 301",
        "M-10 324Q160 264 248 284T447 358T653 363T911 328",
        "M-24 355Q146 293 240 323T462 395T645 401T917 365",
        "M321-23Q355 78 421 120T490 247T552 367T612 584",
        "M290-21Q318 81 391 144T463 249T528 381T585 580",
        "M257-25Q276 87 363 165T439 259T502 396T560 582",
      ].map((d,i)=><path key={i} d={d} fill="none" stroke="#ced1ae"
        strokeWidth={i%3===0?2:1.05} opacity={i%3===0?.29:.18}/>)}
      <path d="M872-50Q817 66 764 116T612 254T524 420T407 618"
        fill="none" stroke="#162e33" strokeWidth="21" opacity=".32"/>
      <path d="M872-50Q817 66 764 116T612 254T524 420T407 618"
        fill="none" stroke="url(#sb-water)" strokeWidth="12" opacity=".76"/>
      <path d="M870-50Q823 65 767 115T613 257T526 421T409 618"
        fill="none" stroke="#add4ba" strokeWidth="1.3" opacity=".58"/>
      <path d="M90 532L224 436L308 392L424 297L512 253L641 146L758 91"
        fill="none" stroke="#7c6851" strokeWidth="11" strokeLinecap="round" opacity=".72"/>
      <path d="M90 532L224 436L308 392L424 297L512 253L641 146L758 91"
        fill="none" stroke="#d6ba91" strokeWidth="3" strokeDasharray="10 6" opacity=".48"/>
      <path d="M120 75L241 163L343 213L430 297L621 453L842 539"
        fill="none" stroke="#ae9c79" strokeWidth="6" opacity=".44" strokeDasharray="9 5"/>
      <g stroke="#a2bb83" strokeWidth="2.5" fill="none" opacity=".44">
        <path d="M89 318l-15 17 15-8-4 16 17-25-11 10-2-10Zm24 0l-15 17 15-8-4 16 17-25-11 10-2-10Z"/>
        <path d="M705 178l-15 17 15-8-4 16 17-25-11 10-2-10Zm36 0l-15 17 15-8-4 16 17-25-11 10-2-10Z"/>
        <path d="M745 415l-15 17 15-8-4 16 17-25-11 10-2-10Zm-27 9l-15 17 15-8-4 16 17-25-11 10-2-10Z"/>
        <path d="M260 520l-15 17 15-8-4 16 17-25-11 10-2-10Zm32-14l-15 17 15-8-4 16 17-25-11 10-2-10Z"/>
      </g>
      <g stroke="#d2caa5" fill="none" opacity=".43" strokeWidth="2">
        <path d="M250 377h49v20h-49zM258 385h12v12M280 385h12v12"/>
        <path d="M610 436h74v20h-74zM629 421v15M660 425v11"/>
        <path d="M302 98h55v29h-55zM310 108h39M314 117h12M335 117h12"/>
        <path d="M750 274h54v36h-54zM766 260v14M792 259v15"/>
      </g>
      <rect width="900" height="570" fill="url(#sb-scratches)" opacity=".8"/>
      <rect width="900" height="570" filter="url(#sb-terrain-grain)" opacity=".24"/>
      <rect width="900" height="570" fill="url(#sb-grid)"/>
      <rect width="900" height="570" fill="url(#sb-fog)" mask="url(#sb-map-fog-mask)"/>
      <rect x="12" y="12" width="876" height="546" rx="12" stroke="#f2e4b7" strokeWidth="1" fill="none" opacity=".19"/>
      <g fill="#e2deb9" opacity=".72" fontFamily="monospace" fontSize="11" letterSpacing="3">
        <text x="30" y="34">SB — 03 / 7</text>
        <text x="720" y="34">SEKTOR: NIEZNANY</text>
        <text x="31" y="540">SKALA ORIENTACYJNA</text>
      </g>
      <g transform="translate(850 500)" fill="none" stroke="#dcd4b7" strokeWidth="1.5" opacity=".78">
        <circle cx="0" cy="0" r="19"/><path d="M0-27V27M-27 0H27M0-18L-5 5L0 0L5 5Z"/>
        <text x="0" y="-34" textAnchor="middle" fontSize="11" stroke="none" fill="#ddd1aa">N</text>
      </g>
    </svg>
    <div className="sb-frontier-map-wash" aria-hidden="true"/>
    {WORLD_SECTORS.map(s=>{
      const discovered=visible(s.id)
      const active=selected===s.id
      return <button key={s.id} type="button" onClick={()=>onSelect(s.id)}
        style={{left:s.x+"%",top:s.y+"%"}}
        className={"sb-frontier-pin "+(discovered?"unlocked":"locked")+(active?" active":"")}
        aria-pressed={active}
        aria-label={discovered?s.name:"Nieznany sektor — "+s.tag}>
        <span className="sb-frontier-pin-icon" aria-hidden="true">{discovered?s.icon:"?"}</span>
        <span className="sb-frontier-pin-label">{discovered?s.name:"NIEZNANE"}</span>
      </button>
    })}
    <div className="sb-frontier-map-bottom">
      <span><i className="sb-frontier-legend-dot"/> Odkryte</span>
      <span><i className="sb-frontier-legend-dot fog"/> Nieznane</span>
      <span className="sb-frontier-coordinates">49° | STREFA B</span>
    </div>
  </div>
}
