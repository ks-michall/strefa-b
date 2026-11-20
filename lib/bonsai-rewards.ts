/** Bonsai achievements are derived from immutable, confirmed days. */
export const BONSAI_DAYS = 28
export const RECOGNITION_THRESHOLD = 21

export const GROWTH_STAGES = [
  { at: 0, symbol: "🌰", name: "Ziarenko" },
  { at: 1, symbol: "🌱", name: "Pierwsze korzenie" },
  { at: 2, symbol: "🌱", name: "Kiełek" },
  { at: 3, symbol: "🌿", name: "Pierwsze listki" },
  { at: 5, symbol: "🌿", name: "Młody pęd" },
  { at: 8, symbol: "🪴", name: "Silniejsze korzenie" },
  { at: 13, symbol: "🪴", name: "Młode Bonsai" },
  { at: 21, symbol: "🌳", name: "Małe drzewo" },
  { at: 28, symbol: "🌸", name: "Pełny rozkwit" },
] as const

export type TreeAchievement = {
  id: string
  habitIndex: number
  checks: string[]
  started: string
}

export function growthStage(count: number) {
  return [...GROWTH_STAGES].reverse().find(stage => count >= stage.at) ?? GROWTH_STAGES[0]
}

export function nextGrowthStage(count: number) {
  return GROWTH_STAGES.find(stage => stage.at > count) ?? null
}

/** Cycle ends on the morning after the 28th evening window closes. */
export function hasFinishedCycle(started: string, currentPlantingDay: string) {
  return currentPlantingDay >= addCalendarDays(started, BONSAI_DAYS)
}

function addCalendarDays(day: string, days: number) {
  const [y, m, d] = day.split("-").map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days, 12))
  return [date.getUTCFullYear(), String(date.getUTCMonth()+1).padStart(2,"0"), String(date.getUTCDate()).padStart(2,"0")].join("-")
}

export function harvestBadges(
  tree: TreeAchievement,
  earlier: TreeAchievement[],
  currentPlantingDay: string
) {
  if (!hasFinishedCycle(tree.started, currentPlantingDay)) return []
  const badges = []
  if (earlier.filter(old => hasFinishedCycle(old.started, currentPlantingDay)).length === 0) {
    badges.push({ id: "first-harvest", icon: "🌾", title: "Pierwsze zbiory",
      description: "Zakończyłeś pierwszy pełny cykl 28 dni." })
  }
  if (tree.checks.length >= RECOGNITION_THRESHOLD) {
    badges.push({ id: "persistent", icon: "🏅", title: "Wytrwały ogrodnik",
      description: "Co najmniej 21 potwierdzonych dni na 28." })
  }
  if (earlier.some(old => old.habitIndex === tree.habitIndex && hasFinishedCycle(old.started, currentPlantingDay))) {
    badges.push({ id: "new-roots", icon: "🌱", title: "Nowe korzenie",
      description: "Wróciłeś do nawyku i ukończyłeś kolejny cykl." })
  }
  return badges
}
