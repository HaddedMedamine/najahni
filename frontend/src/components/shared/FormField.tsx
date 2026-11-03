import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/core/lib/utils'

interface Props {
  label: string
  htmlFor?: string
  error?: string
  hint?: string
  optional?: boolean
  className?: string
  children: ReactNode
}

/** Libelle + champ + message d'erreur. */
export function FormField({
  label,
  htmlFor,
  error,
  hint,
  optional,
  className,
  children,
}: Props) {
  const { t } = useTranslation()
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {optional && (
          <span className="ms-1 text-xs font-normal text-muted-foreground">
            ({t('common.optional')})
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}
