import { Check, X } from 'lucide-react'
import { cn } from '@/core/lib/utils'

/**
 * Interrupteur visuel oui / non (present / absent, paye / non paye).
 * Purement visuel : le clic est gere par la ligne qui le contient (role="switch").
 */
export function StatusSwitch({
  on,
  onLabel,
  offLabel,
  disabled,
}: {
  on: boolean
  onLabel: string
  offLabel: string
  disabled?: boolean
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'relative inline-flex h-9 w-32 shrink-0 items-center rounded-full border p-1 text-xs font-semibold transition-colors',
        on ? 'border-success/30 bg-success-soft' : 'border-danger/20 bg-danger-soft',
        disabled && 'opacity-50',
      )}
    >
      {/* Pastille qui glisse d'un cote a l'autre */}
      <span
        className={cn(
          'absolute top-1 flex size-7 items-center justify-center rounded-full text-white shadow-sm transition-all duration-200',
          on ? 'start-[calc(100%-2rem)] bg-success' : 'start-1 bg-danger',
        )}
      >
        {on ? <Check className="size-4" strokeWidth={3} /> : <X className="size-4" strokeWidth={3} />}
      </span>
      <span className={cn('w-full text-center transition-all', on ? 'pe-8 text-success' : 'ps-8 text-danger')}>
        {on ? onLabel : offLabel}
      </span>
    </span>
  )
}
