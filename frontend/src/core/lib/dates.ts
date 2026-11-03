import type { DateRange } from '@/core/api/types'

/** Mois en cours a Tunis, au format "AAAA-MM". */
export function currentMonthKey() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Tunis', year: 'numeric', month: '2-digit' }).formatToParts(
    new Date(),
  )
  const get = (type: string) => parts.find((p) => p.type === type)?.value
  return `${get('year')}-${get('month')}`
}

/** Decale un mois "AAAA-MM" de `delta` mois. */
export function shiftMonthKey(key: string, delta: number) {
  const [year, month] = key.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

/** Du debut de la journee jusqu'a dans `days` jours. */
export function nextDaysRange(days: number): DateRange {
  const from = new Date()
  from.setHours(0, 0, 0, 0)
  const to = new Date(from)
  to.setDate(to.getDate() + days)
  return { from: from.toISOString(), to: to.toISOString() }
}
