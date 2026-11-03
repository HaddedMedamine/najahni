import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
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
import { type ParentItem, useCreateParent, useUpdateParent } from '../api/parents.api'
import {
  AccountFields,
  accountDefaults,
  accountShape,
  toAccountInput,
  withEmailOrPhone,
} from './AccountFields'
import { StudentPicker } from './StudentPicker'

const makeSchema = () =>
  withEmailOrPhone(z.object({ ...accountShape(), studentIds: z.array(z.string()) }))

type Values = z.infer<ReturnType<typeof makeSchema>>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  parent?: ParentItem | null
  onCreated?: (temporaryPassword?: string) => void
}

export function ParentFormDialog({ open, onOpenChange, parent, onCreated }: Props) {
  const { t, i18n } = useTranslation()
  const isEdit = Boolean(parent)
  const schema = useMemo(makeSchema, [i18n.language])
  const form = useForm<Values>({ resolver: zodResolver(schema) })
  const create = useCreateParent()
  const update = useUpdateParent()

  useEffect(() => {
    if (open) form.reset({ ...accountDefaults(parent?.user), studentIds: [] })
  }, [open, parent, form])

  const onSubmit = (v: Values) => {
    if (parent) {
      const { password: _password, ...account } = toAccountInput(v)
      update.mutate(
        { id: parent.id, ...account },
        {
          onSuccess: () => {
            toast.success(t('common.saved'))
            onOpenChange(false)
          },
        },
      )
    } else {
      create.mutate(
        { ...toAccountInput(v), studentIds: v.studentIds },
        {
          onSuccess: (created) => {
            toast.success(t('parents.created'))
            onOpenChange(false)
            onCreated?.(created.temporaryPassword)
          },
        },
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('parents.editTitle') : t('parents.new')}</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-col">
            <DialogBody className="flex flex-col gap-4">
              <AccountFields withPassword={!isEdit} />
              {!isEdit && (
                <FormField label={t('parents.children')} optional>
                  <Controller
                    control={form.control}
                    name="studentIds"
                    render={({ field }) => (
                      <StudentPicker selected={field.value ?? []} onChange={field.onChange} />
                    )}
                  />
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
