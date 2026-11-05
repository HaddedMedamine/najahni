import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CircleCheck } from 'lucide-react'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getErrorMessage, getErrorStatus } from '@/core/api/errors'
import { useResetPassword } from '@/core/auth/auth.api'
import { alongWith } from '@/core/lib/validation'
import i18n from '@/core/i18n'

const makeSchema = () =>
  z
    .object({
      password: z.string().min(8, i18n.t('validation.minPassword')),
      confirmPassword: z.string(),
    })
    .refine((v) => v.password === v.confirmPassword, {
      message: i18n.t('validation.passwordsMismatch'),
      path: ['confirmPassword'],
      ...alongWith('password', 'confirmPassword'),
    })
type Values = z.infer<ReturnType<typeof makeSchema>>

/** Lien recu par email / WhatsApp : /reset-password?token=... */
export function ResetPasswordPage() {
  const { t, i18n: { language } } = useTranslation()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const schema = useMemo(makeSchema, [language])
  const form = useForm<Values>({ mode: 'onTouched', resolver: zodResolver(schema), defaultValues: { password: '', confirmPassword: '' } })
  const reset = useResetPassword()
  const errors = form.formState.errors

  if (!token) {
    return (
      <AuthLayout title={t('auth.resetTitle')}>
        <p className="mt-8 rounded-2xl bg-danger-soft p-4 text-sm text-danger">{t('auth.resetInvalid')}</p>
        <Link to="/forgot-password" className="mt-4 text-sm font-medium text-primary hover:underline">
          {t('auth.resetAgain')}
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title={t('auth.resetTitle')} subtitle={t('auth.resetSubtitle')}>
      {reset.isSuccess ? (
        <div className="mt-8 flex flex-col gap-4">
          <div className="flex gap-3 rounded-2xl bg-success-soft p-4 text-sm text-success">
            <CircleCheck className="size-5 shrink-0" />
            <p>{t('auth.resetDone')}</p>
          </div>
          <Button size="lg" asChild>
            <Link to="/login">{t('auth.submit')}</Link>
          </Button>
        </div>
      ) : (
        <form
          onSubmit={form.handleSubmit((v) => reset.mutate({ token, password: v.password }))}
          className="mt-8 flex flex-col gap-4"
          noValidate
        >
          {reset.isError && (
            <div role="alert" className="flex flex-col gap-1 rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger">
              <span className="flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                {getErrorStatus(reset.error) === 429 ? t('auth.tooMany') : getErrorMessage(reset.error)}
              </span>
              <Link to="/forgot-password" className="font-medium underline">
                {t('auth.resetAgain')}
              </Link>
            </div>
          )}
          <FormField label={t('profile.newPassword')} htmlFor="password" error={errors.password?.message}>
            <Input id="password" type="password" autoComplete="new-password" autoFocus {...form.register('password')} />
          </FormField>
          <FormField label={t('profile.confirmPassword')} htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
            <Input id="confirmPassword" type="password" autoComplete="new-password" {...form.register('confirmPassword')} />
          </FormField>
          <Button type="submit" size="lg" className="mt-2" loading={reset.isPending}>
            {t('auth.resetSubmit')}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
