import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input, Select } from '@/components/ui/input'
import { fullName } from '@/core/lib/utils'
import { positiveInt, requiredMoney, requiredText, toNumber } from '@/core/lib/validation'
import { type Group, useCreateGroup, useUpdateGroup } from '../api/groups.api'
import { useTeachers } from '../api/teachers.api'
import { LevelSectionDatalists } from './Datalists'

const makeSchema = () =>
  z.object({
    name: requiredText(),
    level: requiredText(),
    section: requiredText(),
    subject: requiredText(),
    teacherId: requiredText(),
    monthlySessions: positiveInt(),
    monthlyFee: requiredMoney(),
    capacity: positiveInt(),
  })

type Values = z.infer<ReturnType<typeof makeSchema>>

const defaults = (g?: Group | null): Values => ({
  name: g?.name ?? '',
  level: g?.level ?? '',
  section: g?.section ?? '',
  subject: g?.subject ?? '',
  teacherId: g?.teacherId ?? '',
  monthlySessions: g ? String(g.monthlySessions) : '8',
  monthlyFee: g ? String(Number(g.monthlyFee)) : '',
  capacity: g ? String(g.capacity) : '15',
})

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  group?: Group | null
}

export function GroupFormDialog({ open, onOpenChange, group }: Props) {
  const { t, i18n } = useTranslation()
  const isEdit = Boolean(group)
  const schema = useMemo(makeSchema, [i18n.language])
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults() })
  const create = useCreateGroup()
  const update = useUpdateGroup()
  const teachers = useTeachers({ pageSize: 100 })

  useEffect(() => {
    if (open) form.reset(defaults(group))
  }, [open, group, form])

  const onSubmit = (v: Values) => {
    const input = {
      ...v,
      monthlySessions: Number(v.monthlySessions),
      monthlyFee: toNumber(v.monthlyFee),
      capacity: Number(v.capacity),
    }
    const onSuccess = () => {
      toast.success(isEdit ? t('common.saved') : t('groups.created'))
      onOpenChange(false)
    }
    if (group) update.mutate({ id: group.id, ...input }, { onSuccess })
    else create.mutate(input, { onSuccess })
  }

  const errors = form.formState.errors
  const field = (name: keyof Values, label: string, props: Record<string, unknown> = {}) => (
    <FormField label={label} htmlFor={name} error={errors[name]?.message}>
      <Input id={name} aria-invalid={!!errors[name]} {...props} {...form.register(name)} />
    </FormField>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('groups.editTitle') : t('groups.new')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-col">
          <DialogBody className="grid gap-4 sm:grid-cols-2">
            <LevelSectionDatalists />
            <div className="sm:col-span-2">
              {field('name', t('groups.name'), { autoFocus: true, placeholder: 'Bac Info - Groupe A' })}
            </div>
            {field('level', t('students.level'), { list: 'levels' })}
            {field('section', t('students.section'), { list: 'sections' })}
            {field('subject', t('groups.subject'))}
            <FormField label={t('groups.teacher')} htmlFor="teacherId" error={errors.teacherId?.message}>
              <Select id="teacherId" aria-invalid={!!errors.teacherId} {...form.register('teacherId')}>
                <option value="">{t('groups.selectTeacher')}</option>
                {teachers.data?.items.map((teacher) => (
                  <option key={teacher.id} value={teacher.id} disabled={!teacher.user.isActive}>
                    {fullName(teacher.user)} — {teacher.subjects.join(', ')}
                  </option>
                ))}
              </Select>
            </FormField>
            {field('monthlySessions', t('groups.monthlySessions'), { inputMode: 'numeric', dir: 'ltr' })}
            {field('monthlyFee', t('groups.monthlyFee'), { inputMode: 'decimal', dir: 'ltr' })}
            {field('capacity', t('groups.capacity'), { inputMode: 'numeric', dir: 'ltr' })}
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
      </DialogContent>
    </Dialog>
  )
}
