import type { HTMLAttributes } from 'react'
import { cn } from '@/core/lib/utils'

type DivProps = HTMLAttributes<HTMLDivElement>

export const Card = ({ className, ...props }: DivProps) => (
  <div
    className={cn('rounded-2xl border border-border/70 bg-card shadow-soft', className)}
    {...props}
  />
)

export const CardHeader = ({ className, ...props }: DivProps) => (
  <div className={cn('flex flex-col gap-1 p-5 pb-3', className)} {...props} />
)

export const CardTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('font-semibold', className)} {...props} />
)

export const CardDescription = ({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-sm text-muted-foreground', className)} {...props} />
)

export const CardContent = ({ className, ...props }: DivProps) => (
  <div className={cn('p-5 pt-0', className)} {...props} />
)
