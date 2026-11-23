"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

const destinations = [
  {href:"/bonsai", icon:"🌾", label:"Biostacja"},
  {href:"/podziekowania", icon:"✳", label:"Biuletyn"},
  {href:"/galeria", icon:"▤", label:"Baza"},
  {href:"/bezdroza", icon:"⌖", label:"Bezdroża"},
] as const

export function QuickNav() {
  const path = usePathname()
  if (path === "/login" || path === "/ustaw-haslo" || path.startsWith("/api/")) return null
  return <nav className="sb-quicknav" aria-label="Główna nawigacja">
    {destinations.map(item => <Link key={item.href} href={item.href}
      className={`sb-quicknav-link${path === item.href ? " is-active" : ""}`}
      aria-current={path===item.href?"page":undefined}>
      <span className="sb-quicknav-icon" aria-hidden="true">{item.icon}</span>
      <span>{item.label}</span>
    </Link>)}
  </nav>
}
