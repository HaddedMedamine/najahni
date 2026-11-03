import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '@/core/lib/utils'

export const Table = ({ className, ...props }: HTMLAttributes<HTMLTableElement>) => (
  <div className="w-full overflow-x-auto">
    <table className={cn('w-full text-sm', className)} {...props} />
  </div>
)

export const THead = (props: HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className="border-b border-border bg-muted/60" {...props} />
)

export const TBody = (props: HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className="divide-y divide-border" {...props} />
)

export const TR = ({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn('transition-colors hover:bg-primary-soft/40', className)} {...props} />
)

export const TH = ({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn(
      'px-4 py-3 text-start text-xs font-medium tracking-wide text-muted-foreground uppercase',
      className,
    )}
    {...props}
  />
)

export const TD = ({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn('px-4 py-3 align-middle', className)} {...props} />
)
