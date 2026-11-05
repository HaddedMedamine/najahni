import { Draggable } from '@fullcalendar/interaction'
import { DoorOpen, GripVertical } from 'lucide-react'
import { type ReactNode, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'
import { groupColor, ROOM_DRAG_TYPE, SESSION_MINUTES } from './Calendar'

interface PaletteGroup {
  id: string
  name: string
  subtitle?: string
}

interface PaletteRoom {
  id: string
  name: string
  capacity: number
}

interface Props {
  groups: PaletteGroup[]
  rooms: PaletteRoom[]
  /** Contenu au-dessus des groupes (ex. choix de l'enseignant). */
  header?: ReactNode
}

/** Groupes a glisser sur un creneau (nouvelle seance) et salles a glisser sur une seance. */
export function PlanningPalette({ groups, rooms, header }: Props) {
  const { t } = useTranslation()
  const groupsRef = useRef<HTMLUListElement>(null)

  // FullCalendar gere le glisser des groupes (souris et tactile) vers le calendrier
  useEffect(() => {
    if (!groupsRef.current) return
    const draggable = new Draggable(groupsRef.current, {
      itemSelector: '[data-group-id]',
      eventData: (el) => ({
        title: el.dataset.title,
        duration: { minutes: SESSION_MINUTES },
        create: false,
        color: el.dataset.color,
      }),
    })
    return () => draggable.destroy()
  }, [])

  return (
    <Card className="flex flex-col gap-5 p-4 lg:sticky lg:top-4">
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">{t('planning.paletteGroups')}</h3>
        {header}
        <p className="text-xs text-muted-foreground">{t('planning.paletteGroupsHint')}</p>
        <ul ref={groupsRef} className="flex max-h-80 flex-col gap-1.5 overflow-y-auto">
          {groups.map((g) => (
            <li
              key={g.id}
              data-group-id={g.id}
              data-title={g.name}
              data-color={groupColor(g.id)}
              className="fc-palette-item flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2 text-sm hover:border-primary/40"
            >
              <span className="h-7 w-1 shrink-0 rounded-full" style={{ background: groupColor(g.id) }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{g.name}</span>
                {g.subtitle && <span className="block truncate text-xs text-muted-foreground">{g.subtitle}</span>}
              </span>
              <GripVertical className="size-4 shrink-0 text-muted-foreground" />
            </li>
          ))}
          {groups.length === 0 && <li className="text-xs text-muted-foreground">{t('planning.paletteEmpty')}</li>}
        </ul>
      </section>

      {rooms.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">{t('planning.paletteRooms')}</h3>
          <p className="text-xs text-muted-foreground">{t('planning.paletteRoomsHint')}</p>
          <ul className="flex flex-wrap gap-1.5">
            {rooms.map((r) => (
              <li
                key={r.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(ROOM_DRAG_TYPE, r.id)
                  e.dataTransfer.effectAllowed = 'copy'
                }}
                className="fc-palette-item flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium hover:border-primary/40"
                title={t('rooms.places', { count: r.capacity })}
              >
                <DoorOpen className="size-3.5 text-muted-foreground" />
                {r.name}
              </li>
            ))}
          </ul>
        </section>
      )}
    </Card>
  )
}
