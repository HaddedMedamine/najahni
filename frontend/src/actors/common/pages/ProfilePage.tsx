import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormField } from '@/components/shared/FormField'
import { Avatar } from '@/components/shared/Misc'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { logout, useChangePassword } from '@/core/auth/auth.api'
import { useAuthStore } from '@/core/auth/auth.store'
import { fullName } from '@/core/lib/utils'
import { requiredText } from '@/core/lib/validation'
import i18n from '@/core/i18n'

const makeSchema = () =>
  z
    .object({
      currentPassword: requiredText(),
      newPassword: z.string().min(8, i18n.t('validation.minPassword')),
      confirmPassword: z.string(),
    })
    .refine((v) => v.newPassword === v.confirmPassword, {
      message: i18n.t('validation.passwordsMismatch'),
      path: ['confirmPassword'],
    })

type Values = z.infer<ReturnType<typeof makeSchema>>

export function ProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const schema = useMemo(makeSchema, [i18n.language])
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })
  const changePassword = useChangePassword()
  const errors = form.formState.errors

  if (!user) return null

  // Le backend ferme toutes les sessions : on se reconnecte
  const onSubmit = (v: Values) =>
    changePassword.mutate(
      { currentPassword: v.currentPassword, newPassword: v.newPassword },
      {
        onSuccess: async () => {
          toast.success(t('profile.passwordChanged'))
          await logout()
          navigate('/login', { replace: true })
        },
      },
    )

  return (
    <>
      <PageHeader title={t('profile.title')} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.info')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Avatar user={user} className="size-14 text-lg" />
              <div>
                <p className="text-lg font-semibold">{fullName(user)}</p>
                <Badge variant="primary">{t(`roles.${user.role}`)}</Badge>
              </div>
            </div>
            <dl className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('person.email')}</dt>
                <dd>{user.email ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('person.phone')}</dt>
                <dd dir="ltr">{user.phone ?? '—'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('profile.changePassword')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField label={t('profile.currentPassword')} htmlFor="currentPassword" error={errors.currentPassword?.message}>
                <Input id="currentPassword" type="password" autoComplete="current-password" {...form.register('currentPassword')} />
              </FormField>
              <FormField label={t('profile.newPassword')} htmlFor="newPassword" error={errors.newPassword?.message}>
                <Input id="newPassword" type="password" autoComplete="new-password" {...form.register('newPassword')} />
              </FormField>
              <FormField label={t('profile.confirmPassword')} htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
                <Input id="confirmPassword" type="password" autoComplete="new-password" {...form.register('confirmPassword')} />
              </FormField>
              <Button type="submit" className="self-start" loading={changePassword.isPending}>
                {t('common.save')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
