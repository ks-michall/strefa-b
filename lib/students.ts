export const students = [
  "Ada",
  "Amelia",
  "Gabriela",
  "Hanna",
  "Hubert",
  "Julia",
  "Kamila",
  "Karina",
  "Kacper",
  "Kinga",
  "Laura",
  "Liliana",
  "Miłosz",
  "Natalia",
  "Nikola",
  "Oleksandr",
  "Stanisław",
  "Szczepan",
  "Weronika",
  "ks. Michał",
] as const

export type StudentName = (typeof students)[number]

export const sortedStudents = [...students].sort((a, b) => {
  if (a === "ks. Michał") return 1
  if (b === "ks. Michał") return -1
  return a.localeCompare(b, "pl")
})