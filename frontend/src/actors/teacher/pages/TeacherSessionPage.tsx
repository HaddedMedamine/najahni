import { ArrowLeft, CheckCheck, CircleCheckBig, DoorOpen, Play, Save, Trash2, Video } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Avatar } from '@/components/shared/Misc'
import { SessionStatusBadge } from '@/components/shared/SessionBadges'
import { StatusSwitch } from '@/components/shared/StatusSwitch'
import { ErrorState, TableSkeleton } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatSessionSlot } from '@/core/lib/format'
import { cn, fullName } from '@/core/lib/utils'
import {
  useCompleteSession,
  useDeleteTeacherSession,
  useMarkAttendance,
  useSaveNotes,
  useStartSession,
  useTeacherSession,
} from '../api/sessions.api'

const textareaClass =
  'min-h-24 w-full rounded-xl border border-border bg-card p-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15'

export function TeacherSessionPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: session, isLoading, isError, refetch } = useTeacherSession(id)
  const start = useStartSession(id)
  const mark = useMarkAttendance(id)
  const saveNotes = useSaveNotes(id)
  const complete = useCompleteSession(id)
  const remove = useDeleteTeacherSession()

  // Appel en cours de saisie : true = present (par defaut tout le monde est absent)
  const [present, setPresent] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState({ contentCovered: '', homework: '' })
  const [confirmComplete, setConfirmComplete] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // On ne resynchronise avec le serveur que si SES donnees changent :
  // enregistrer les notes ne doit pas effacer un appel en cours de saisie (et inversement)
  const serverAttendance = session?.roster
    .map((r) => `${r.student.id}:${r.attendance?.status === 'PRESENT' || r.attendance?.status === 'LATE' ? 1 : 0}`)
    .join('|')
  const serverNotes = session ? `${session.contentCovered ?? ''}\u0000${session.homework ?? ''}` : undefined

  useEffect(() => {
    if (serverAttendance === undefined) return
    setPresent(
      Object.fromEntries(
        serverAttendance
          .split('|')
          .filter(Boolean)
          .map((entry) => {
            const [studentId, flag] = entry.split(':')
            return [studentId, flag === '1']
          }),
      ),
    )
  }, [serverAttendance])

  useEffect(() => {
    if (serverNotes === undefined) return
    const [contentCovered, homework] = serverNotes.split('\u0000')
    setNotes({ contentCovered, homework })
  }, [serverNotes])

  const isPresent = (studentId: string) => present[studentId] ?? false

  const dirty = useMemo(
    () =>
      session?.roster.some((r) => {
        const wasPresent = r.attendance?.status === 'PRESENT' || r.attendance?.status === 'LATE'
        return r.attendance === null || (present[r.student.id] ?? false) !== wasPresent
      }) ?? false,
    [session, present],
  )

  if (isLoading) return <TableSkeleton rows={6} />
  if (isError || !session) return <ErrorState onRetry={refetch} />

  const canMark = session.status === 'IN_PROGRESS' || session.status === 'DONE'
  const presentCount = session.roster.filter((r) => isPresent(r.student.id)).length
  const absentCount = session.roster.length - presentCount
  const records = session.roster.map((r) => ({
    studentId: r.student.id,
    status: isPresent(r.student.id) ? ('PRESENT' as const) : ('ABSENT' as const),
  }))

  const toggle = (studentId: string) => setPresent((p) => ({ ...p, [studentId]: !(p[studentId] ?? false) }))

  const saveAttendance = (onDone?: () => void) =>
    mark.mutate(records, {
      onSuccess: () => {
        if (!onDone) toast.success(t('session.attendanceSaved'))
        onDone?.()
      },
    })

  const finish = () => {
    const run = () =>
      complete.mutate(undefined, {
        onSuccess: ({ completedSeries }) => {
          setConfirmComplete(false)
          toast.success(t('session.completed'))
          // Prevenir l'enseignant des eleves qui viennent de finir leur serie
          for (const { student, number } of completedSeries) {
            toast.info(t('payments.seriesCompleted', { name: fullName(student.user), number }), {
              description: t('payments.seriesCompletedHint'),
              duration: 8000,
            })
          }
        },
        onError: () => setConfirmComplete(false),
      })
    // L'appel non enregistre est envoye avant de terminer
    if (dirty) saveAttendance(run)
    else run()
  }

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/teacher">
          <ArrowLeft className="rtl:rotate-180" />
          {t('common.back')}
        </Link>
      </Button>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{session.group.name}</h1>
            <SessionStatusBadge status={session.status} />
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
            <span>{formatSessionSlot(session.startsAt, session.endsAt)}</span>
            {session.room && (
              <span className="flex items-center gap-1">
                <DoorOpen className="size-3.5" />
                {session.room.name}
              </span>
            )}
            {session.isOnline && session.meetingUrl && (
              <a href={session.meetingUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                <Video className="size-3.5" />
                {t('planning.online')}
              </a>
            )}
          </p>
        </div>
        {session.status === 'PLANNED' && (
          <div className="flex flex-col items-end gap-1">
            <Button
              size="lg"
              loading={start.isPending}
              onClick={() => start.mutate(undefined, { onSuccess: () => toast.success(t('session.started')) })}
            >
              <Play />
              {t('session.start')}
            </Button>
            <span className="text-xs text-muted-foreground">{t('session.startHint')}</span>
            <Button variant="ghost" size="sm" className="text-danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 />
              {t('planning.deleteSession')}
            </Button>
          </div>
        )}
        {session.status === 'IN_PROGRESS' && (
          <Button size="lg" onClick={() => setConfirmComplete(true)}>
            <CircleCheckBig />
            {t('session.complete')}
          </Button>
        )}
      </div>

      {session.status === 'CANCELLED' && (
        <Card className="mb-6 border-dashed p-5 text-sm text-muted-foreground">{t('session.cancelledInfo')}</Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Feuille d'appel */}
        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex flex-col gap-2">
              <CardTitle>{t('session.rollCall')}</CardTitle>
              {canMark ? (
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-success-soft px-2.5 py-1 text-success">
                    {t('session.presentCount', { count: presentCount })}
                  </span>
                  <span className="rounded-full bg-danger-soft px-2.5 py-1 text-danger">
                    {t('session.absentCount', { count: absentCount })}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('session.notStarted')}</p>
              )}
            </div>
            {canMark && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPresent(Object.fromEntries(session.roster.map((r) => [r.student.id, true])))}
                >
                  <CheckCheck />
                  {t('session.allPresent')}
                </Button>
                <Button size="sm" disabled={!dirty} loading={mark.isPending} onClick={() => saveAttendance()}>
                  <Save />
                  {t('session.saveAttendance')}
                </Button>
              </div>
            )}
          </CardHeader>

          {canMark && <p className="border-b border-border bg-muted/40 px-5 py-2 text-xs text-muted-foreground">{t('session.tapHint')}</p>}

          <ul className="divide-y divide-border">
            {session.roster.map(({ student }) => {
              const on = isPresent(student.id)
              return (
                <li key={student.id}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-label={fullName(student.user)}
                    disabled={!canMark}
                    onClick={() => toggle(student.id)}
                    className={cn(
                      'flex w-full items-center gap-3 px-5 py-3 text-start transition-colors disabled:cursor-not-allowed',
                      canMark && 'hover:bg-muted/50',
                      on && 'bg-success-soft/40',
                    )}
                  >
                    <Avatar user={student.user} className="size-9" />
                    <span className="flex-1 font-medium">{fullName(student.user)}</span>
                    <StatusSwitch
                      on={on}
                      onLabel={t('attendanceStatus.PRESENT')}
                      offLabel={t('attendanceStatus.ABSENT')}
                      disabled={!canMark}
                    />
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>

        {/* Notes de seance */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{t('session.notes')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {t('planning.contentCovered')}
              <textarea
                className={textareaClass}
                value={notes.contentCovered}
                disabled={session.status === 'CANCELLED'}
                onChange={(e) => setNotes((n) => ({ ...n, contentCovered: e.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {t('planning.homework')}
              <textarea
                className={textareaClass}
                value={notes.homework}
                disabled={session.status === 'CANCELLED'}
                onChange={(e) => setNotes((n) => ({ ...n, homework: e.target.value }))}
              />
            </label>
            <Button
              variant="outline"
              disabled={session.status === 'CANCELLED'}
              loading={saveNotes.isPending}
              onClick={() => saveNotes.mutate(notes, { onSuccess: () => toast.success(t('session.notesSaved')) })}
            >
              <Save />
              {t('session.saveNotes')}
            </Button>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmComplete}
        onOpenChange={setConfirmComplete}
        title={t('session.complete')}
        description={t('session.completeSummary', { present: presentCount, absent: absentCount })}
        confirmLabel={t('session.complete')}
        loading={complete.isPending || mark.isPending}
        onConfirm={finish}
      />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t('planning.deleteSession')}
        description={t('planning.deleteSessionConfirm')}
        confirmLabel={t('planning.deleteSession')}
        destructive
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(id, {
            onSuccess: () => {
              toast.success(t('planning.sessionDeleted'))
              navigate('/teacher', { replace: true })
            },
          })
        }
      />
    </>
  )
}
