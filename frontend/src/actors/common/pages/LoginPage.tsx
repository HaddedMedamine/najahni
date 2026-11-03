import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle } from 'lucide-react'
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
import { useLogin } from '@/core/auth/auth.api'
import { requiredText } from '@/core/lib/validation'

const makeSchema = () => z.object({ identifier: requiredText(), password: requiredText() })
type Values = z.infer<ReturnType<typeof makeSchema>>

export function LoginPage() {
  const { t, i18n } = useTranslation()
  const schema = useMemo(makeSchema, [i18n.language])
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: '', password: '' },
  })
  const login = useLogin()
  const errors = form.formState.errors

  const loginError = login.isError
    ? getErrorStatus(login.error) === 429
      ? t('auth.tooMany')
      : getErrorStatus(login.error) === 401
        ? t('auth.invalid')
        : t('common.error')
    : null

  return (
    <AuthLayout title={t('auth.title')} subtitle={t('auth.subtitle')}>
      <form
        onSubmit={form.handleSubmit((v) => login.mutate(v))}
        className="mt-8 flex flex-col gap-4"
        noValidate
      >
        {loginError && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-2.5 text-sm text-danger"
          >
            <AlertCircle className="size-4 shrink-0" />
            {loginError}
          </div>
        )}
        <FormField label={t('auth.identifier')} htmlFor="identifier" error={errors.identifier?.message}>
          <Input
            id="identifier"
            dir="ltr"
            autoComplete="username"
            autoFocus
            aria-invalid={!!errors.identifier}
            {...form.register('identifier')}
          />
        </FormField>
        <FormField label={t('auth.password')} htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...form.register('password')}
          />
        </FormField>
        <Link to="/forgot-password" className="-mt-1 self-end text-sm font-medium text-primary hover:underline">
          {t('auth.forgot')}
        </Link>
        <Button type="submit" size="lg" className="mt-2" loading={login.isPending}>
          {t('auth.submit')}
        </Button>
      </form>
    </AuthLayout>
  )
}
