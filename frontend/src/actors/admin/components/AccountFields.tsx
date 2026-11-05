import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { FormField } from '@/components/shared/FormField'
import { Input } from '@/components/ui/input'
import type { AccountInput } from '@/core/api/types'
import { compact } from '@/core/lib/utils'
import {
  optionalEmail,
  optionalPassword,
  optionalPhone,
  alongWith,
  requiredText,
} from '@/core/lib/validation'
import i18n from '@/core/i18n'

/** Champs de compte communs (eleve, parent, enseignant). */
export const accountShape = () => ({
  firstName: requiredText(),
  lastName: requiredText(),
  email: optionalEmail(),
  phone: optionalPhone(),
  password: optionalPassword(),
})

export type AccountValues = z.infer<z.ZodObject<ReturnType<typeof accountShape>>>

/** A appliquer a chaque schema de compte : au moins un email ou un telephone. */
export const withEmailOrPhone = <S extends z.ZodType<{ email: string; phone: string }>>(
  schema: S,
) =>
  schema.refine((v) => Boolean(v.email || v.phone), {
    message: i18n.t('validation.emailOrPhone'),
    path: ['phone'],
    ...alongWith('email', 'phone'),
  })

export const emptyAccount: AccountValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
}

export const accountDefaults = (user?: {
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
}): AccountValues =>
  user
    ? {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email ?? '',
        phone: user.phone ?? '',
        password: '',
      }
    : emptyAccount

export const toAccountInput = (v: AccountValues): AccountInput =>
  compact({
    firstName: v.firstName,
    lastName: v.lastName,
    email: v.email,
    phone: v.phone,
    password: v.password,
  }) as AccountInput

/** A utiliser dans un <FormProvider>. */
export function AccountFields({ withPassword }: { withPassword: boolean }) {
  const { t } = useTranslation()
  const {
    register,
    formState: { errors },
  } = useFormContext<AccountValues>()

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField label={t('person.firstName')} htmlFor="firstName" error={errors.firstName?.message}>
        <Input id="firstName" autoFocus aria-invalid={!!errors.firstName} {...register('firstName')} />
      </FormField>
      <FormField label={t('person.lastName')} htmlFor="lastName" error={errors.lastName?.message}>
        <Input id="lastName" aria-invalid={!!errors.lastName} {...register('lastName')} />
      </FormField>
      <FormField label={t('person.phone')} htmlFor="phone" error={errors.phone?.message}>
        <Input
          id="phone"
          dir="ltr"
          type="tel"
          placeholder="+21698123456"
          aria-invalid={!!errors.phone}
          {...register('phone')}
        />
      </FormField>
      <FormField label={t('person.email')} htmlFor="email" error={errors.email?.message}>
        <Input
          id="email"
          dir="ltr"
          type="email"
          aria-invalid={!!errors.email}
          {...register('email')}
        />
      </FormField>
      {withPassword && (
        <FormField
          label={t('person.password')}
          htmlFor="password"
          optional
          hint={t('person.passwordHint')}
          error={errors.password?.message}
          className="sm:col-span-2"
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
        </FormField>
      )}
    </div>
  )
}
