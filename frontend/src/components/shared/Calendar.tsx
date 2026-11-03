import arLocale from '@fullcalendar/core/locales/ar-tn'
import frLocale from '@fullcalendar/core/locales/fr'
import type { DatesSetArg, EventChangeArg, EventInput } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DateRange, SessionStatus } from '@/core/api/types'

// Palette pastel stable par groupe (meme groupe = meme couleur dans tout le planning)
const GROUP_PALETTE = [
  { accent: '#1565c0', bg: '#e3effb', text: '#0d4a91' },
  { accent: '#1e94d2', bg: '#e2f3fc', text: '#0f4a6e' },
  { accent: '#9061f0', bg: '#f1eafe', text: '#4b2591' },
  { accent: '#e5579a', bg: '#fdeaf3', text: '#7d1f4d' },
  { accent: '#f0745a', bg: '#ffede7', text: '#7a2e1d' },
  { accent: '#17a673', bg: '#e4f7ee', text: '#0d5a3e' },
  { accent: '#e8a10c', bg: '#fff4dc', text: '#6e4a05' },
  { accent: '#14a3a3', bg: '#e1f6f6', text: '#0b5454' },
]
const paletteOf = (groupId: string) => {
  let hash = 0
  for (const c of groupId) hash = (hash * 31 + c.charCodeAt(0)) | 0
  return GROUP_PALETTE[Math.abs(hash) % GROUP_PALETTE.length]
}
/** Couleur vive du groupe (pastilles, liserés). */
export const groupColor = (groupId: string) => paletteOf(groupId).accent

/** Convertit une seance en evenement FullCalendar. */
export function sessionEvent(s: {
  id: string
  startsAt: string
  endsAt: string
  status: SessionStatus
  title: string
  subtitle?: string
  colorKey: string
  editable?: boolean
}): EventInput {
  const color = paletteOf(s.colorKey)
  return {
    id: s.id,
    title: s.title,
    start: s.startsAt,
    end: s.endsAt,
    // Seules les seances planifiees se deplacent
    editable: Boolean(s.editable) && s.status === 'PLANNED',
    backgroundColor: color.bg,
    borderColor: color.accent,
    textColor: color.text,
    classNames: [`fc-status-${s.status.toLowerCase()}`],
    extendedProps: { subtitle: s.subtitle, status: s.status },
  }
}

interface Props {
  events: EventInput[]
  onRangeChange: (range: DateRange) => void
  onEventClick?: (id: string) => void
  /** Selection d'un creneau vide (creation). */
  onSelectSlot?: (start: Date, end: Date) => void
  /** Deplacement ou redimensionnement. Appeler `revert()` si l'API refuse. */
  onEventMove?: (id: string, start: Date, end: Date, revert: () => void) => void
}

const DEFAULT_START_HOUR = 7
const DEFAULT_END_HOUR = 22
const hourString = (h: number) => `${String(h).padStart(2, '0')}:00:00`

/** Plage horaire affichee : 7h-22h, elargie si une seance deborde (sinon elle serait invisible). */
function visibleHours(events: EventInput[]) {
  let min = DEFAULT_START_HOUR
  let max = DEFAULT_END_HOUR
  for (const e of events) {
    const start = new Date(e.start as string)
    const end = new Date(e.end as string)
    min = Math.min(min, start.getHours())
    // Fin le lendemain (seance a cheval sur minuit) : on montre jusqu'a minuit
    const endHour = end.getDate() !== start.getDate() ? 24 : end.getHours() + (end.getMinutes() > 0 ? 1 : 0)
    max = Math.max(max, endHour)
  }
  return { slotMinTime: hourString(min), slotMaxTime: hourString(max) }
}

const isSmallScreen = () => window.matchMedia('(max-width: 767px)').matches

// Options fixes definies hors du composant : FullCalendar se reconfigure
// (et relance `datesSet`) quand il recoit de nouveaux objets a chaque rendu
const PLUGINS = [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]
const LOCALES = [frLocale, arLocale]
const TIME_FORMAT = { hour: '2-digit', minute: '2-digit', hour12: false } as const
const TOOLBAR_SMALL = { start: 'prev,next today', center: 'title', end: 'timeGridDay,listWeek' }
const TOOLBAR_LARGE = { start: 'prev,next today', center: 'title', end: 'timeGridWeek,timeGridDay,listWeek' }

export function Calendar({ events, onRangeChange, onEventClick, onSelectSlot, onEventMove }: Props) {
  const { i18n } = useTranslation()
  const [small] = useState(isSmallScreen)
  const lastRange = useRef('')
  const { slotMinTime, slotMaxTime } = useMemo(() => visibleHours(events), [events])

  const handleChange = (arg: EventChangeArg) => {
    const { event, revert } = arg
    if (event.start && event.end) onEventMove?.(event.id, event.start, event.end, revert)
  }

  // Ne previent la page que si la periode affichee a vraiment change
  const handleDatesSet = (arg: DatesSetArg) => {
    const range = { from: arg.start.toISOString(), to: arg.end.toISOString() }
    const key = `${range.from}|${range.to}`
    if (key === lastRange.current) return
    lastRange.current = key
    onRangeChange(range)
  }

  return (
    <FullCalendar
      plugins={PLUGINS}
      locales={LOCALES}
      locale={i18n.language === 'ar' ? 'ar-tn' : 'fr'}
      direction={i18n.dir()}
      initialView={small ? 'listWeek' : 'timeGridWeek'}
      headerToolbar={small ? TOOLBAR_SMALL : TOOLBAR_LARGE}
      firstDay={1}
      allDaySlot={false}
      slotMinTime={slotMinTime}
      slotMaxTime={slotMaxTime}
      slotDuration="00:30:00"
      eventTimeFormat={TIME_FORMAT}
      slotLabelFormat={TIME_FORMAT}
      nowIndicator
      height="auto"
      events={events}
      datesSet={handleDatesSet}
      eventClick={(arg) => onEventClick?.(arg.event.id)}
      selectable={Boolean(onSelectSlot)}
      selectMirror
      select={(arg) => {
        onSelectSlot?.(arg.start, arg.end)
        arg.view.calendar.unselect()
      }}
      eventDrop={handleChange}
      eventResize={handleChange}
      eventContent={(arg) => (
        <div className="overflow-hidden px-1 py-0.5 leading-tight">
          <div className="text-[11px] font-semibold">{arg.timeText}</div>
          <div className="truncate text-xs font-medium">{arg.event.title}</div>
          {arg.event.extendedProps.subtitle && (
            <div className="truncate text-[11px] opacity-85">{arg.event.extendedProps.subtitle}</div>
          )}
        </div>
      )}
    />
  )
}
