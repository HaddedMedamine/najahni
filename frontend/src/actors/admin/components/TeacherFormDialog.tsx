import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
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
import { Input } from '@/components/ui/input'
import { requiredText } from '@/core/lib/validation'
import {
  type TeacherListItem,
  useCreateTeacher,
  useUpdateTeacher,
} from '../api/teachers.api'
import {
  AccountFields,
  accountDefaults,
  accountShape,
  toAccountInput,
  withEmailOrPhone,
} from './AccountFields'

const makeSchema = () =>
  withEmailOrPhone(z.object({ ...accountShape(), subjects: requiredText() }))

type Values = z.infer<ReturnType<typeof makeSchema>>

const splitSubjects = (value: string) =>
  value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  teacher?: TeacherListItem | null
  onCreated?: (temporaryPassword?: string) => void
}

export function TeacherFormDialog({ open, onOpenChange, teacher, onCreated }: Props) {
  const { t, i18n } = useTranslation()
  const isEdit = Boolean(teacher)
  const schema = useMemo(makeSchema, [i18n.language])
  const form = useForm<Values>({ resolver: zodResolver(schema) })
  const create = useCreateTeacher()
  const update = useUpdateTeacher()

  useEffect(() => {
    if (open) {
      form.reset({
        ...accountDefaults(teacher?.user),
        subjects: teacher?.subjects.join(', ') ?? '',
      })
    }
  }, [open, teacher, form])

  const onSubmit = (v: Values) => {
    const subjects = splitSubjects(v.subjects)
    if (teacher) {
      const { password: _password, ...account } = toAccountInput(v)
      update.mutate(
        { id: teacher.id, ...account, subjects },
        {
          onSuccess: () => {
            toast.success(t('common.saved'))
            onOpenChange(false)
          },
        },
      )
    } else {
      create.mutate(
        { ...toAccountInput(v), subjects },
        {
          onSuccess: (created) => {
            toast.success(t('teachers.created'))
            onOpenChange(false)
            onCreated?.(created.temporaryPassword)
          },
        },
      )
    }
  }

  const errors = form.formState.errors

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('teachers.editTitle') : t('teachers.new')}</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-col">
            <DialogBody className="flex flex-col gap-4">
              <AccountFields withPassword={!isEdit} />
              <FormField
                label={t('teachers.subjects')}
                htmlFor="subjects"
                hint={t('teachers.subjectsHint')}
                error={errors.subjects?.message}
              >
                <Input
                  id="subjects"
                  placeholder="Informatique, Mathématiques"
                  aria-invalid={!!errors.subjects}
                  {...form.register('subjects')}
                />
              </FormField>
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
