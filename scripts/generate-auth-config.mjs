#!/usr/bin/env node
// Run locally: node scripts/generate-auth-config.mjs
// Never commit .env.local or the one-time password list.
import { randomBytes, scryptSync } from "node:crypto"
import { writeFileSync, existsSync } from "node:fs"

const names = [
  "Ada", "Amelia", "Anna", "Ewa", "Gabriela", "Hanna", "Hubert",
  "Julia", "Kamila", "Karina", "Kinga", "Laura", "Liliana", "Miłosz",
  "Natalia", "Nikola", "Oleksandr", "Stanisław", "Szczepan", "Weronika",
  "Zuzanna", "ks. Michał"
]
if (existsSync(".env.local") && !process.argv.includes("--overwrite")) {
  console.error("Plik .env.local już istnieje. Nie nadpisuję go. Użyj --overwrite świadomie.")
  process.exit(1)
}
const hashes = {}
const oneTime = []
for (const name of names) {
  const password = randomBytes(16).toString("base64url")
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  hashes[name] = `scrypt:${salt}:${hash}`
  oneTime.push(`${name}: ${password}`)
}
const sessionSecret = randomBytes(48).toString("base64url")
writeFileSync(".env.local", `STREFA_B_SESSION_SECRET=${sessionSecret}\nSTREFA_B_PASSWORD_HASHES='${JSON.stringify(hashes)}'\n`, { mode: 0o600 })
console.log("Utworzono .env.local. Skopiuj obie wartości do zmiennych środowiskowych Vercel.")
console.log("NOWE HASŁA (jednorazowy wydruk, nie dodawaj do repozytorium):")
console.log(oneTime.join("\n"))
console.log("Przekaż każdemu uczniowi wyłącznie jego nowe hasło prywatnym kanałem.")
