import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { SESSION_MINUTES } from '@/components/shared/Calendar'
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
import { serverErrors } from '@/core/lib/form-errors'
import { fullName } from '@/core/lib/utils'
import { alongWith, positiveInt, requiredText } from '@/core/lib/validation'
import i18n from '@/core/i18n'
import { useGroups } from '../api/groups.api'
import { useRooms } from '../api/rooms.api'
import { useCreateSession } from '../api/sessions.api'
import { useTeachers } from '../api/teachers.api'

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

const makeSchema = () =>
  z
    .object({
      groupId: requiredText(),
      date: requiredText(),
      start: z.string().regex(TIME, i18n.t('validation.time')),
      end: z.string().regex(TIME, i18n.t('validation.time')),
      roomId: z.string(),
      teacherId: z.string(),
      repeatWeeks: positiveInt(),
      isOnline: z.boolean(),
      meetingUrl: z.union([z.literal(''), z.url(i18n.t('validation.url'))]),
    })
    .refine((v) => v.end > v.start, {
      message: i18n.t('validation.endAfterStart'),
      path: ['end'],
      ...alongWith('start', 'end'),
    })

type Values = z.infer<ReturnType<typeof makeSchema>>

const pad = (n: number) => String(n).padStart(2, '0')
const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const toTimeInput = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`
/** Date + heure locales -> ISO (UTC) pour l'API */
const toIso = (date: string, time: string) => new Date(`${date}T${time}`).toISOString()

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Creneau selectionne dans le calendrier. */
  slot?: { start: Date; end: Date } | null
  defaultGroupId?: string
}

export function SessionFormDialog({ open, onOpenChange, slot, defaultGroupId }: Props) {
  const { t } = useTranslation()
  const schema = useMemo(makeSchema, [i18n.language])
  const form = useForm<Values>({ mode: 'onTouched', resolver: zodResolver(schema) })
  const create = useCreateSession()
  const groups = useGroups({ pageSize: 100 })
  const teachers = useTeachers({ pageSize: 100 })
  const rooms = useRooms()

  useEffect(() => {
    if (!open) return
    const start = slot?.start ?? new Date()
    const end = slot?.end ?? new Date(start.getTime() + SESSION_MINUTES * 60_000)
    form.reset({
      groupId: defaultGroupId ?? '',
      date: toDateInput(start),
      start: toTimeInput(start),
      end: toTimeInput(end),
      roomId: '',
      teacherId: '',
      repeatWeeks: '1',
      isOnline: false,
      meetingUrl: '',
    })
  }, [open, slot, defaultGroupId, form])

  const onSubmit = (v: Values) =>
    create.mutate(
      {
        groupId: v.groupId,
        startsAt: toIso(v.date, v.start),
        endsAt: toIso(v.date, v.end),
        roomId: v.roomId || undefined,
        teacherId: v.teacherId || undefined,
        repeatWeeks: Number(v.repeatWeeks),
        isOnline: v.isOnline,
        meetingUrl: v.isOnline && v.meetingUrl ? v.meetingUrl : undefined,
      },
      {
        onError: serverErrors(form, { startsAt: 'start', endsAt: 'end' }),
        onSuccess: (created) => {
          toast.success(t('planning.created', { count: created.length }))
          onOpenChange(false)
        },
      },
    )

  const errors = form.formState.errors
  const isOnline = form.watch('isOnline')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('planning.newSession')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-col" noValidate>
          <DialogBody className="grid gap-4 sm:grid-cols-3">
            <FormField label={t('planning.group')} htmlFor="groupId" error={errors.groupId?.message} className="sm:col-span-3">
              <Select id="groupId" aria-invalid={!!errors.groupId} {...form.register('groupId')}>
                <option value="">{t('planning.selectGroup')}</option>
                {groups.data?.items.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} — {g.subject} ({g._count.students}/{g.capacity})
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={t('planning.date')} htmlFor="date" error={errors.date?.message}>
              <Input id="date" type="date" {...form.register('date')} />
            </FormField>
            <FormField label={t('planning.start')} htmlFor="start" error={errors.start?.message}>
              <Input id="start" type="time" {...form.register('start')} />
            </FormField>
            <FormField label={t('planning.end')} htmlFor="end" error={errors.end?.message}>
              <Input id="end" type="time" {...form.register('end')} />
            </FormField>
            <FormField label={t('planning.room')} htmlFor="roomId" className="sm:col-span-2">
              <Select id="roomId" {...form.register('roomId')}>
                <option value="">{t('planning.noRoom')}</option>
                {rooms.data
                  ?.filter((r) => r.isActive)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({t('rooms.places', { count: r.capacity })})
                    </option>
                  ))}
              </Select>
            </FormField>
            <FormField
              label={t('planning.repeatWeeks')}
              htmlFor="repeatWeeks"
              hint={t('planning.repeatHint')}
              error={errors.repeatWeeks?.message}
            >
              <Input id="repeatWeeks" inputMode="numeric" dir="ltr" {...form.register('repeatWeeks')} />
            </FormField>
            <FormField label={t('planning.substitute')} htmlFor="teacherId" optional className="sm:col-span-3">
              <Select id="teacherId" {...form.register('teacherId')}>
                <option value="">{t('planning.groupTeacher')}</option>
                {teachers.data?.items
                  .filter((teacher) => teacher.user.isActive)
                  .map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {fullName(teacher.user)}
                    </option>
                  ))}
              </Select>
            </FormField>
            <label className="flex items-center gap-2 text-sm font-medium sm:col-span-3">
              <input type="checkbox" className="size-4 accent-primary" {...form.register('isOnline')} />
              {t('planning.online')}
            </label>
            {isOnline && (
              <FormField label={t('planning.meetingUrl')} htmlFor="meetingUrl" error={errors.meetingUrl?.message} className="sm:col-span-3">
                <Input id="meetingUrl" dir="ltr" placeholder="https://meet.google.com/..." {...form.register('meetingUrl')} />
              </FormField>
            )}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={create.isPending}>
              {t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
