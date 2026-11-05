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
import { Input } from '@/components/ui/input'
import { serverErrors } from '@/core/lib/form-errors'
import { positiveInt, requiredText } from '@/core/lib/validation'
import { type Room, useCreateRoom, useUpdateRoom } from '../api/rooms.api'

const makeSchema = () => z.object({ name: requiredText(), capacity: positiveInt() })
type Values = z.infer<ReturnType<typeof makeSchema>>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  room?: Room | null
}

export function RoomFormDialog({ open, onOpenChange, room }: Props) {
  const { t, i18n } = useTranslation()
  const schema = useMemo(makeSchema, [i18n.language])
  const form = useForm<Values>({ mode: 'onTouched', resolver: zodResolver(schema) })
  const create = useCreateRoom()
  const update = useUpdateRoom()

  useEffect(() => {
    if (open) form.reset({ name: room?.name ?? '', capacity: room ? String(room.capacity) : '20' })
  }, [open, room, form])

  const onSubmit = (v: Values) => {
    const input = { name: v.name, capacity: Number(v.capacity) }
    const onSuccess = () => {
      toast.success(t('common.saved'))
      onOpenChange(false)
    }
    if (room) update.mutate({ id: room.id, ...input }, { onSuccess, onError: serverErrors(form) })
    else create.mutate(input, { onSuccess, onError: serverErrors(form) })
  }

  const errors = form.formState.errors

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{room ? t('rooms.editTitle') : t('rooms.new')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-col">
          <DialogBody className="flex flex-col gap-4">
            <FormField label={t('rooms.name')} htmlFor="name" error={errors.name?.message}>
              <Input id="name" autoFocus aria-invalid={!!errors.name} {...form.register('name')} />
            </FormField>
            <FormField label={t('rooms.capacity')} htmlFor="capacity" error={errors.capacity?.message}>
              <Input
                id="capacity"
                inputMode="numeric"
                dir="ltr"
                aria-invalid={!!errors.capacity}
                {...form.register('capacity')}
              />
            </FormField>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={create.isPending || update.isPending}>
              {room ? t('common.save') : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
