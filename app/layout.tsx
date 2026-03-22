import "./globals.css"
import Link from "next/link"

export const metadata = {
  title: "Strefa B",
  description: "Strona naszej klasy",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl">
      <body
        style={{
          margin: 0,
          fontFamily: "Arial, sans-serif",
          background: "#f9fafb",
        }}
      >
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              maxWidth: "900px",
              margin: "0 auto",
              padding: "14px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                textDecoration: "none",
                color: "#111827",
                fontSize: "22px",
                fontWeight: "800",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  overflow: "hidden",
                }}
              >
                <img
                  src="/icon-192.png"
                  alt="Strefa B"
                  style={{
                    width: "28px",
                    height: "28px",
                  }}
                />
              </div>

              Strefa B
            </Link>
          </div>
        </header>

        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          {children}
        </div>
      </body>
    </html>
  )
}