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

export const getErrorStatus = (error: unknown) =>
  isAxiosError(error) ? error.response?.status : undefined
