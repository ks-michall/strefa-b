export const students = [
  "Ada",
  "Amelia",
  "Anna",
  "Ewa",
  "Gabriela",
  "Hanna",
  "Hubert",
  "Julia",
  "Kamila",
  "Karina",
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
  "Zuzanna",
  "ks. Michał",
] as const

export type StudentName = (typeof students)[number]

export const sortedStudents = [...students].sort((a, b) => {
  if (a === "ks. Michał") return 1
  if (b === "ks. Michał") return -1
  return a.localeCompare(b, "pl")
})