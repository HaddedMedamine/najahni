import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormField } from '@/components/shared/FormField'
import { FillBar } from '@/components/shared/Misc'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { serverErrors } from '@/core/lib/form-errors'
import { cn } from '@/core/lib/utils'
import { optionalMoney, optionalPhone, requiredText, toNumber } from '@/core/lib/validation'
import { useGroups } from '../api/groups.api'
import {
  type StudentListItem,
  useCreateStudent,
  useUpdateStudent,
} from '../api/students.api'
import {
  AccountFields,
  accountDefaults,
  accountShape,
  toAccountInput,
  withEmailOrPhone,
} from './AccountFields'
import { LevelSectionDatalists } from './Datalists'

const makeSchema = () =>
  withEmailOrPhone(
    z.object({
      ...accountShape(),
      level: requiredText(),
      section: requiredText(),
      parentPhone: optionalPhone(),
      monthlyFee: optionalMoney(),
      birthDate: z.string(),
      groupIds: z.array(z.string()),
    }),
  )

type Values = z.infer<ReturnType<typeof makeSchema>>

const defaults = (student?: StudentListItem | null): Values => ({
  ...accountDefaults(student?.user),
  level: student?.level ?? '',
  section: student?.section ?? '',
  parentPhone: student?.parentPhone ?? '',
  monthlyFee: student?.monthlyFee ? String(Number(student.monthlyFee)) : '',
  birthDate: student?.birthDate?.slice(0, 10) ?? '',
  groupIds: [],
})

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Absent = creation. */
  student?: StudentListItem | null
  onCreated?: (temporaryPassword?: string) => void
}

export function StudentFormDialog({ open, onOpenChange, student, onCreated }: Props) {
  const { t, i18n } = useTranslation()
  const isEdit = Boolean(student)
  const schema = useMemo(makeSchema, [i18n.language])
  const form = useForm<Values>({ mode: 'onTouched', resolver: zodResolver(schema), defaultValues: defaults() })
  const create = useCreateStudent()
  const update = useUpdateStudent()
  const groups = useGroups({ pageSize: 100 })

  useEffect(() => {
    if (open) form.reset(defaults(student))
  }, [open, student, form])

  const onSubmit = (v: Values) => {
    const fields = {
      level: v.level,
      section: v.section,
      parentPhone: v.parentPhone || undefined,
      monthlyFee: v.monthlyFee ? toNumber(v.monthlyFee) : undefined,
      birthDate: v.birthDate || undefined,
    }
    if (student) {
      const { password: _password, ...account } = toAccountInput(v)
      update.mutate(
        { id: student.id, ...account, ...fields },
        {
          onError: serverErrors(form),
          onSuccess: () => {
            toast.success(t('common.saved'))
            onOpenChange(false)
          },
        },
      )
    } else {
      create.mutate(
        { ...toAccountInput(v), ...fields, groupIds: v.groupIds },
        {
          onError: serverErrors(form),
          onSuccess: (created) => {
            toast.success(t('students.created'))
            onOpenChange(false)
            onCreated?.(created.temporaryPassword)
          },
        },
      )
    }
  }

  const errors = form.formState.errors
  const selectedGroups = form.watch('groupIds')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('students.editTitle') : t('students.new')}</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-col">
            <DialogBody className="flex flex-col gap-4">
              <AccountFields withPassword={!isEdit} />
              <LevelSectionDatalists />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label={t('students.level')} htmlFor="level" error={errors.level?.message}>
                  <Input id="level" list="levels" aria-invalid={!!errors.level} {...form.register('level')} />
                </FormField>
                <FormField label={t('students.section')} htmlFor="section" error={errors.section?.message}>
                  <Input id="section" list="sections" aria-invalid={!!errors.section} {...form.register('section')} />
                </FormField>
                <FormField
                  label={t('students.parentPhone')}
                  htmlFor="parentPhone"
                  optional
                  error={errors.parentPhone?.message}
                >
                  <Input id="parentPhone" dir="ltr" type="tel" {...form.register('parentPhone')} />
                </FormField>
                <FormField label={t('students.birthDate')} htmlFor="birthDate" optional>
                  <Input id="birthDate" type="date" {...form.register('birthDate')} />
                </FormField>
                <FormField
                  label={t('students.monthlyFee')}
                  htmlFor="monthlyFee"
                  optional
                  hint={t('students.monthlyFeeHint')}
                  error={errors.monthlyFee?.message}
                  className="sm:col-span-2"
                >
                  <Input id="monthlyFee" inputMode="decimal" dir="ltr" {...form.register('monthlyFee')} />
                </FormField>
              </div>

              {!isEdit && (groups.data?.items.length ?? 0) > 0 && (
                <FormField label={t('students.groups')} optional>
                  <div className="grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2">
                    {groups.data!.items.map((g) => {
                      const full = g._count.students >= g.capacity
                      const checked = selectedGroups.includes(g.id)
                      return (
                        <label
                          key={g.id}
                          className={cn(
                            'flex cursor-pointer items-center gap-3 rounded-lg border border-border p-2.5 text-sm',
                            checked && 'border-primary bg-primary-soft/40',
                            full && !checked && 'cursor-not-allowed opacity-50',
                          )}
                        >
                          <input
                            type="checkbox"
                            value={g.id}
                            disabled={full && !checked}
                            className="accent-primary"
                            {...form.register('groupIds')}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{g.name}</span>
                            <FillBar count={g._count.students} capacity={g.capacity} />
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </FormField>
              )}
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" loading={create.isPending || update.isPending}>
                {isEdit ? t('common.save') : t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
