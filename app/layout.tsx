import "./globals.css"
import "./world.css"
import Link from "next/link"
import { QuickNav } from "../components/quick-nav"

export const metadata = {
  title: "Strefa B — przestrzeń klasy",
  description: "Biostacja, Biuletyn, Baza Archiwalna i Bezdroża. Odkrywaj świat Strefy B.",
  applicationName: "Strefa B",
  manifest: "/manifest.json",
  appleWebApp: {capable: true, title: "Strefa B", statusBarStyle: "default" },
  icons: {
    icon: [{url: "/icon", sizes: "512x512", type: "image/png"}],
    apple: [{url: "/apple-icon", sizes: "180x180", type: "image/png"}],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <header className="sb-site-header">
          <div className="sb-site-inner">
            <Link href="/" className="sb-brand" aria-label="Strefa B — strona główna">
              <span className="sb-brand-mark" aria-hidden="true">B.</span>
              <span>
                <span style={{display:"block",lineHeight:1}}>Strefa B</span>
                <span className="sb-brand-caption">SEKTOR OCALAŁYCH</span>
              </span>
            </Link>
            <span className="sb-site-meta">SEKTOR 3B • ONLINE</span>
          </div>
        </header>
        <div className="sb-page-frame">{children}</div>
        <QuickNav/>
      </body>
    </html>
  )
}