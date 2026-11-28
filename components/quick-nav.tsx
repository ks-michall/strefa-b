"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

const destinations = [
  {href:"/bonsai", icon:"sprout", label:"Biostacja"},
  {href:"/podziekowania", icon:"heart-message", label:"Biuletyn"},
  {href:"/galeria", icon:"images", label:"Baza"},
  {href:"/bezdroza", icon:"compass", label:"Bezdroża"},
] as const

type NavigationIcon = (typeof destinations)[number]["icon"]

function ModuleIcon({kind}:{kind:NavigationIcon}){
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" focusable="false">
    {kind==="sprout"&&<>
      <path d="M12 21v-9"/>
      <path d="M12 15c0-5-3.4-8-9-8 0 5.2 3.4 8 9 8Z"/>
      <path d="M12 12c0-5 3.4-8 9-8 0 5.2-3.4 8-9 8Z"/>
    </>}
    {kind==="heart-message"&&<>
      <path d="M20 11.5v5a3 3 0 0 1-3 3H9l-5 3v-5.5a3 3 0 0 1-1-2.2V7a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3v4.5Z"/>
      <path d="M12 15s-4-2.5-4-5a2 2 0 0 1 4-1 2 2 0 0 1 4 1c0 2.5-4 5-4 5Z"/>
    </>}
    {kind==="images"&&<>
      <rect x="4" y="7" width="16" height="14" rx="2"/>
      <path d="M7 4h12a3 3 0 0 1 3 3v11"/>
      <circle cx="9" cy="12" r="1.5"/>
      <path d="m5 19 5-5 3 3 2-2 4 4"/>
    </>}
    {kind==="compass"&&<>
      <circle cx="12" cy="12" r="9"/>
      <path d="m15.8 8.2-2.5 5.1-5.1 2.5 2.5-5.1 5.1-2.5Z"/>
      <circle cx="12" cy="12" r=".7" fill="currentColor" stroke="none"/>
    </>}
  </svg>
}

export function QuickNav() {
  const path = usePathname()
  if (path === "/login" || path === "/ustaw-haslo" || path === "/wprowadzenie" || path.startsWith("/api/")) return null
  return <nav className="sb-quicknav" aria-label="Główna nawigacja">
    {destinations.map(item => <Link key={item.href} href={item.href}
      className={`sb-quicknav-link${path === item.href ? " is-active" : ""}`}
      aria-current={path===item.href?"page":undefined}>
      <span className="sb-quicknav-icon" aria-hidden="true"><ModuleIcon kind={item.icon}/></span>
      <span>{item.label}</span>
    </Link>)}
  </nav>
}
