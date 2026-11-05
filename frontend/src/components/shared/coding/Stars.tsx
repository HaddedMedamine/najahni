import { Star } from 'lucide-react'
import { cn } from '@/core/lib/utils'

/** 3 etoiles, dont `value` remplies. */
export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${value} / 3`}>
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          className={cn('size-[1em]', i <= value ? 'fill-warning text-warning' : 'text-muted-foreground/40')}
        />
      ))}
    </span>
  )
}
