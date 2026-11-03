import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, ArrowLeft, MailCheck } from 'lucide-react'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getErrorStatus } from '@/core/api/errors'
import { useForgotPassword } from '@/core/auth/auth.api'
import { requiredText } from '@/core/lib/validation'

const makeSchema = () => z.object({ identifier: requiredText() })
type Values = z.infer<ReturnType<typeof makeSchema>>

/** Demande d'un lien : par email si le compte en a un, sinon par WhatsApp. */
export function ForgotPasswordPage() {
  const { t, i18n } = useTranslation()
  const schema = useMemo(makeSchema, [i18n.language])
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { identifier: '' } })
  const forgot = useForgotPassword()
  const errors = form.formState.errors

  return (
    <AuthLayout title={t('auth.forgotTitle')} subtitle={t('auth.forgotSubtitle')}>
      {forgot.isSuccess ? (
        // Meme message que le compte existe ou non (securite)
        <div className="mt-8 flex flex-col gap-4">
          <div className="flex gap-3 rounded-2xl bg-success-soft p-4 text-sm text-success">
            <MailCheck className="size-5 shrink-0" />
            <p>{t('auth.forgotSent')}</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/login">
              <ArrowLeft className="rtl:rotate-180" />
              {t('auth.backToLogin')}
            </Link>
          </Button>
        </div>
      ) : (
        <form
          onSubmit={form.handleSubmit((v) => forgot.mutate(v.identifier))}
          className="mt-8 flex flex-col gap-4"
          noValidate
        >
          {forgot.isError && (
            <div role="alert" className="flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger">
              <AlertCircle className="size-4 shrink-0" />
              {getErrorStatus(forgot.error) === 429 ? t('auth.tooMany') : t('common.error')}
            </div>
          )}
          <FormField label={t('auth.identifier')} htmlFor="identifier" error={errors.identifier?.message}>
            <Input id="identifier" dir="ltr" autoComplete="username" autoFocus aria-invalid={!!errors.identifier} {...form.register('identifier')} />
          </FormField>
          <Button type="submit" size="lg" className="mt-2" loading={forgot.isPending}>
            {t('auth.forgotSubmit')}
          </Button>
          <Link to="/login" className="self-center text-sm font-medium text-primary hover:underline">
            {t('auth.backToLogin')}
          </Link>
        </form>
      )}
    </AuthLayout>
  )
}
