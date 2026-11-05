import { z } from 'zod'
import i18n from '@/core/i18n'

// Regles de validation partagees par les formulaires (memes regles que le backend)
const t = i18n.t.bind(i18n)

export const PHONE_REGEX = /^\+?[0-9]{8,15}$/

export const requiredText = () =>
  z.string().trim().min(1, t('validation.required'))

export const optionalEmail = () =>
  z.union([z.literal(''), z.email(t('validation.email'))])

export const optionalPhone = () =>
  z.union([z.literal(''), z.string().regex(PHONE_REGEX, t('validation.phone'))])

export const optionalPassword = () =>
  z.union([z.literal(''), z.string().min(8, t('validation.minPassword'))])

/** Montant TND optionnel saisi en texte : '' ou 60 ou 60.500 */
export const optionalMoney = () =>
  z.union([
    z.literal(''),
    z.string().regex(/^\d+([.,]\d{1,3})?$/, t('validation.number')),
  ])

export const requiredMoney = () =>
  z.string().regex(/^\d+([.,]\d{1,3})?$/, t('validation.number'))

export const positiveInt = () =>
  z.string().regex(/^[1-9]\d*$/, t('validation.positiveInt'))

/**
 * Options d'un `refine` sur plusieurs champs : il s'execute meme si d'autres champs
 * sont invalides (toutes les erreurs s'affichent d'un coup), sauf si un des champs
 * qu'il compare a deja une erreur.
 */
export const alongWith = (...fields: string[]) => ({
  when: (payload: z.core.ParsePayload) =>
    !payload.issues.some((issue) => fields.includes(String(issue.path?.[0]))),
})

export const toNumber = (value: string) => Number(value.replace(',', '.'))
