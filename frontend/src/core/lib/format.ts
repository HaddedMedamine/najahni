import i18n from '@/core/i18n'

const locale = () => (i18n.language === 'ar' ? 'ar-TN' : 'fr-TN')

/** Montant en dinars (3 decimales). L'API renvoie les Decimal en texte. */
export const formatMoney = (value: string | number | null | undefined) =>
  value === null || value === undefined
    ? '—'
    : new Intl.NumberFormat(locale(), {
        style: 'currency',
        currency: 'TND',
      }).format(Number(value))

/** "2026-10" -> "octobre 2026" (long) ou "oct." (short). */
export const formatMonth = (key: string, style: 'long' | 'short' = 'long') => {
  const [year, month] = key.split('-').map(Number)
  return new Intl.DateTimeFormat(locale(), {
    timeZone: 'UTC',
    month: style,
    ...(style === 'long' && { year: 'numeric' }),
  }).format(new Date(Date.UTC(year, month - 1, 15)))
}

export const formatDate =(iso: string | null | undefined) =>
  iso
    ? new Intl.DateTimeFormat(locale(), { dateStyle: 'medium' }).format(
        new Date(iso),
      )
    : '—'

export const formatTime = (iso: string) =>
  new Intl.DateTimeFormat(locale(), { timeStyle: 'short', hourCycle: 'h23' }).format(
    new Date(iso),
  )

/** "mar. 21 oct. · 18:00 – 19:30" */
export const formatSessionSlot = (startsAt: string, endsAt: string) =>
  `${new Intl.DateTimeFormat(locale(), { weekday: 'short', day: 'numeric', month: 'short' }).format(
    new Date(startsAt),
  )} · ${formatTime(startsAt)} – ${formatTime(endsAt)}`

export const formatDateTime = (iso: string | null | undefined) =>
  iso
    ? new Intl.DateTimeFormat(locale(), {
        dateStyle: 'medium',
        timeStyle: 'short',
        hourCycle: 'h23',
      }).format(new Date(iso))
    : '—'
