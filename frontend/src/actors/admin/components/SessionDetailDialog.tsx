import { Ban, CalendarClock, DoorOpen, Repeat, Trash2, UserRound, Video } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AttendanceBadge, SessionStatusBadge } from '@/components/shared/SessionBadges'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { formatSessionSlot } from '@/core/lib/format'
import { fullName } from '@/core/lib/utils'
import { useCancelSession, useDeleteSession, useSession } from '../api/sessions.api'

type Pending = 'cancel' | 'one' | 'following' | null

export function SessionDetailDialog({
  sessionId,
  onClose,
}: {
  sessionId: string | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { data: s, isLoading } = useSession(sessionId)
  const cancel = useCancelSession()
  const remove = useDeleteSession()
  // Une action destructive demande un 2e clic de confirmation
  const [pending, setPending] = useState<Pending>(null)

  const close = () => {
    setPending(null)
    onClose()
  }

  const confirm = () => {
    if (!s || !pending) return
    if (pending === 'cancel') {
      cancel.mutate(s.id, {
        onSuccess: () => {
          toast.success(t('planning.cancelled'))
          close()
        },
      })
    } else {
      remove.mutate(
        { id: s.id, scope: pending },
        {
          onSuccess: ({ deleted }) => {
            toast.success(t('planning.deletedCount', { count: deleted }))
            close()
          },
        },
      )
    }
  }

  const editable = s?.status === 'PLANNED'
  const deletable = s?.status === 'PLANNED' || s?.status === 'CANCELLED'

  return (
    <Dialog open={sessionId !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent>
        {isLoading || !s ? (
          <div className="flex flex-col gap-3 p-5">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                {s.group.name}
                <SessionStatusBadge status={s.status} />
              </DialogTitle>
              <DialogDescription>
                {s.group.subject} · {s.group.level} {s.group.section}
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-4 pb-5">
              <ul className="grid gap-2 text-sm">
                <li className="flex items-center gap-2">
                  <CalendarClock className="size-4 text-muted-foreground" />
                  {formatSessionSlot(s.startsAt, s.endsAt)}
                </li>
                <li className="flex items-center gap-2">
                  <UserRound className="size-4 text-muted-foreground" />
                  {fullName(s.teacher.user)}
                </li>
                <li className="flex items-center gap-2">
                  <DoorOpen className="size-4 text-muted-foreground" />
                  {s.room?.name ?? t('planning.noRoom')}
                </li>
                {s.isOnline && (
                  <li className="flex items-center gap-2">
                    <Video className="size-4 text-muted-foreground" />
                    {s.meetingUrl ? (
                      <a href={s.meetingUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        {t('planning.online')}
                      </a>
                    ) : (
                      t('planning.online')
                    )}
                  </li>
                )}
                {s.seriesId && (
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Repeat className="size-4" />
                    {t('planning.series')}
                  </li>
                )}
              </ul>

              {(s.contentCovered || s.homework) && (
                <div className="grid gap-2 rounded-lg bg-muted/60 p-3 text-sm">
                  {s.contentCovered && (
                    <p>
                      <span className="font-medium">{t('planning.contentCovered')} :</span> {s.contentCovered}
                    </p>
                  )}
                  {s.homework && (
                    <p>
                      <span className="font-medium">{t('planning.homework')} :</span> {s.homework}
                    </p>
                  )}
                </div>
              )}

              {s.status !== 'PLANNED' && s.status !== 'CANCELLED' && (
                <div>
                  <p className="mb-2 text-sm font-medium">{t('planning.attendance')}</p>
                  {s.attendances.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('planning.noAttendance')}</p>
                  ) : (
                    <ul className="divide-y divide-border rounded-lg border border-border">
                      {s.attendances.map((a) => (
                        <li key={a.student.id} className="flex items-center justify-between px-3 py-2 text-sm">
                          {fullName(a.student.user)}
                          <AttendanceBadge status={a.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {pending && (
                <p className="rounded-lg bg-danger-soft p-3 text-sm text-danger">
                  {pending === 'cancel' ? t('planning.cancelConfirm') : t('planning.deleteConfirm')}
                </p>
              )}
            </DialogBody>

            {(editable || deletable) && (
              <DialogFooter className="flex-wrap">
                {pending ? (
                  <>
                    <Button variant="outline" onClick={() => setPending(null)}>
                      {t('common.back')}
                    </Button>
                    <Button variant="destructive" loading={cancel.isPending || remove.isPending} onClick={confirm}>
                      {t('common.confirm')}
                    </Button>
                  </>
                ) : (
                  <>
                    {editable && (
                      <Button variant="outline" onClick={() => setPending('cancel')}>
                        <Ban />
                        {t('planning.cancel')}
                      </Button>
                    )}
                    {deletable && s.seriesId && (
                      <Button variant="outline" className="text-danger" onClick={() => setPending('following')}>
                        <Trash2 />
                        {t('planning.deleteFollowing')}
                      </Button>
                    )}
                    {deletable && (
                      <Button variant="destructive" onClick={() => setPending('one')}>
                        <Trash2 />
                        {t('planning.deleteOne')}
                      </Button>
                    )}
                  </>
                )}
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
