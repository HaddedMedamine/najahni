import { AlertCircle } from 'lucide-react'
import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
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

/** Libelle + champ + message d'erreur (le champ est marque invalide automatiquement). */
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
  const messageId = htmlFor && `${htmlFor}-message`
  const field =
    error && isValidElement(children)
      ? cloneElement(children as ReactElement<Record<string, unknown>>, {
          'aria-invalid': true,
          'aria-describedby': messageId,
        })
      : children

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
      {field}
      {error ? (
        <p id={messageId} role="alert" className="flex items-start gap-1 text-xs text-danger">
          <AlertCircle className="mt-px size-3.5 shrink-0" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={messageId} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
