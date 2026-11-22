"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

const destinations = [
  {href:"/", icon:"⌂", label:"Start"},
  {href:"/bonsai", icon:"🌱", label:"Bonsai"},
  {href:"/podziekowania", icon:"💙", label:"Bohaterowie"},
  {href:"/galeria", icon:"📸", label:"Bajki"},
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
