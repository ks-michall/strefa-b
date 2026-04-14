import { cookies } from "next/headers"
import { createHash } from "crypto"
import type { StudentName } from "./students"

const SESSION_COOKIE = "strefa_b_user"

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex")
}

/*
  TU USTAWISZ HASŁA.
  Po lewej imię z listy, po prawej zwykłe hasło.
*/
const plainPasswords: Record<StudentName, string> = {
  Ada: "baranek321",
  Amelia: "barometr123",
  Anna: "batyskaf321",
  Ewa: "biologia123",
  Gabriela: "brokat321",
  Hanna: "bursztyn123",
  Hubert: "bombonierka321",
  Julia: "borowina123",
  Kamila: "bonus321",
  Karina: "bombradilo123",
  Kinga: "bingo321",
  Laura: "burza123",
  Liliana: "bazarek321",
  Miłosz: "bohater123",
  Natalia: "brylant321",
  Nikola: "burmistrz123",
  Oleksandr: "bazylika321",
  Stanisław: "bojownik123",
  Szczepan: "batalion321",
  Weronika: "bukiet123",
  Zuzanna: "balustrada321",
  "ks. Michał": "bingo123",
}

const passwordHashes: Record<StudentName, string> = Object.fromEntries(
  Object.entries(plainPasswords).map(([name, password]) => [
    name,
    hashPassword(password),
  ])
) as Record<StudentName, string>

export function verifyLogin(name: string, password: string) {
  const expectedHash = passwordHashes[name as StudentName]
  if (!expectedHash) return false

  const providedHash = hashPassword(password)
  return expectedHash === providedHash
}

export async function setLoggedInUser(name: StudentName) {
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE, name, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function clearLoggedInUser() {
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 0,
  })
}

export async function getLoggedInUser() {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE)?.value ?? ""
}