// All Biostacja milestones use calendar days in Europe/Warsaw.
// One confirmed check-in per crop and local calendar day.
const TIME_ZONE = "Europe/Warsaw"
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
})

type LocalParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

export function warsawParts(now: Date): LocalParts {
  const values = Object.fromEntries(
    dateFormatter.formatToParts(now)
      .filter(part => part.type !== "literal")
      .map(part => [part.type, Number(part.value)])
  )
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  }
}

export function dateKey(now: Date): string {
  const p = warsawParts(now)
  return [p.year, String(p.month).padStart(2, "0"), String(p.day).padStart(2, "0")].join("-")
}

export function addDays(day: string, numberOfDays: number): string {
  const [year, month, date] = day.split("-").map(Number)
  const next = new Date(Date.UTC(year, month - 1, date + numberOfDays, 12))
  return [next.getUTCFullYear(), String(next.getUTCMonth() + 1).padStart(2, "0"), String(next.getUTCDate()).padStart(2, "0")].join("-")
}

export function daysBetween(first: string, second: string): number {
  const dayNumber = (day: string) => {
    const [year, month, date] = day.split("-").map(Number)
    return Date.UTC(year, month - 1, date, 12) / 86400000
  }
  return dayNumber(second) - dayNumber(first)
}

export function isValidDay(value: unknown): value is string {
  return typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value + "T12:00:00Z")) &&
    addDays(value, 0) === value
}

/** A check-in is available all day, once per active crop on the local date. */
export function currentCheckInDay(now: Date): string {
  return dateKey(now)
}

export function currentPlantingDay(now: Date): string {
  return dateKey(now)
}

function eveningStartUtcMillis(day: string): number {
  const [year, month, date] = day.split("-").map(Number)
  // At 18:00Z the Polish offset is definitely the same as at local 20:00
  // even on a daylight-saving switch date (the switch happens earlier).
  const referenceUtc = Date.UTC(year, month - 1, date, 18)
  const local = warsawParts(new Date(referenceUtc))
  const localAsUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second)
  const offsetMillis = localAsUtc - referenceUtc
  return Date.UTC(year, month - 1, date, 20) - offsetMillis
}

export function nextOpeningAt(now: Date): number {
  const today = dateKey(now)
  const day = warsawParts(now).hour >= 20 ? addDays(today, 1) : today
  return eveningStartUtcMillis(day)
}

export function remainingUntilNextOpening(now: Date): number {
  return Math.max(0, nextOpeningAt(now) - now.getTime())
}

export function countdown(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map(value => String(value).padStart(2, "0")).join(":")
}

export function readableDate(day: string): string {
  const [year, month, date] = day.split("-").map(Number)
  return new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, date, 12)))
}
