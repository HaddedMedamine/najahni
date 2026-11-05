import { isAxiosError } from 'axios'
import i18n from '@/core/i18n'

/** Extrait un message lisible d'une erreur API (NestJS renvoie `message` en texte ou tableau). */
export function getErrorMessage(error: unknown): string {
  if (isAxiosError<{ message?: string | string[] }>(error)) {
    if (error.response?.status === 429) return i18n.t('auth.tooMany')
    const message = error.response?.data?.message
    if (Array.isArray(message)) return message.join('\n')
    if (message) return message
  }
  return i18n.t('common.error')
}

/** Erreurs par champ renvoyees par l'API (`errors: { champ: message }`), sinon undefined. */
export function getFieldErrors(error: unknown): Record<string, string> | undefined {
  if (!isAxiosError<{ errors?: Record<string, string> }>(error)) return undefined
  const errors = error.response?.data?.errors
  return errors && Object.keys(errors).length > 0 ? errors : undefined
}

export const getErrorStatus = (error: unknown) =>
  isAxiosError(error) ? error.response?.status : undefined
