import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react'
import { cn } from '@/core/lib/utils'

const fieldClass =
  'h-10 w-full rounded-xl border border-border bg-card px-3.5 text-sm outline-none transition-all placeholder:text-muted-foreground/70 hover:border-primary/30 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 disabled:opacity-50 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/15'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(fieldClass, className)} {...props} />
  ),
)
Input.displayName = 'Input'

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(fieldClass, 'pe-8', className)} {...props} />
))
Select.displayName = 'Select'
