import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import { getFieldErrors } from '@/core/api/errors'

/**
 * `onError` d'une mutation de formulaire : place les erreurs de l'API sous les champs.
 * `aliases` traduit un champ de l'API vers celui du formulaire (ex. `{ endsAt: 'end' }`).
 * Les erreurs sans champ correspondant sont affichees en toast.
 */
export const serverErrors =
  <T extends FieldValues>(form: UseFormReturn<T>, aliases: Record<string, Path<T>> = {}) =>
  (error: unknown) => {
    const fieldErrors = getFieldErrors(error)
    if (!fieldErrors) return
    const unplaced: string[] = []
    let focus = true
    for (const [field, message] of Object.entries(fieldErrors)) {
      const name = aliases[field] ?? (field as Path<T>)
      if (form.getValues(name) === undefined) {
        unplaced.push(message)
        continue
      }
      form.setError(name, { type: 'server', message }, { shouldFocus: focus })
      focus = false
    }
    if (unplaced.length > 0) toast.error(unplaced.join('\n'))
  }
