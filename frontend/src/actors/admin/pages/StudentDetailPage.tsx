import { ArrowLeft, Pencil } from 'lucide-react'
import { type ReactNode, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { Avatar, StatusBadge } from '@/components/shared/Misc'
import { ErrorState, TableSkeleton } from '@/components/shared/States'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatDateTime, formatMoney } from '@/core/lib/format'
import { fullName } from '@/core/lib/utils'
import { useStudent } from '../api/students.api'
import { StudentFormDialog } from '../components/StudentFormDialog'

export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-end font-medium">{value}</span>
    </div>
  )
}

export function StudentDetailPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const { data: student, isLoading, isError, refetch } = useStudent(id)
  const [editOpen, setEditOpen] = useState(false)
  // Objet stable : le formulaire se reinitialise quand `student` change
  const editable = useMemo(() => (student ? { ...student, groups: [] } : null), [student])

  if (isLoading) return <TableSkeleton rows={6} />
  if (isError || !student) return <ErrorState onRetry={refetch} />

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/admin/students">
          <ArrowLeft className="rtl:rotate-180" />
          {t('common.back')}
        </Link>
      </Button>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar user={student.user} className="size-14 text-lg" />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{fullName(student.user)}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {student.level} · {student.section}
            <StatusBadge isActive={student.user.isActive} archived={Boolean(student.archivedAt)} />
          </div>
        </div>
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil />
          {t('common.edit')}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t('students.info')}</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            <InfoRow label={t('person.phone')} value={<span dir="ltr">{student.user.phone ?? '—'}</span>} />
            <InfoRow label={t('person.email')} value={student.user.email ?? '—'} />
            <InfoRow label={t('students.parentPhone')} value={<span dir="ltr">{student.parentPhone ?? '—'}</span>} />
            <InfoRow label={t('students.birthDate')} value={formatDate(student.birthDate)} />
            <InfoRow label={t('students.monthlyFee')} value={formatMoney(student.monthlyFee)} />
            <InfoRow
              label={t('person.lastLogin')}
              value={student.user.lastLoginAt ? formatDateTime(student.user.lastLoginAt) : t('person.never')}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('students.groups')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {student.groups.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('students.noGroup')}</p>
            ) : (
              student.groups.map(({ group, joinedAt }) => (
                <Link
                  key={group.id}
                  to={`/admin/groups/${group.id}`}
                  className="rounded-lg border border-border p-3 transition-colors hover:bg-muted"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{group.name}</span>
                    <Badge variant="primary">{formatMoney(group.monthlyFee)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {group.subject} · {t('students.joinedAt', { date: formatDate(joinedAt) })}
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('students.parents')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {student.parents.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('students.noParent')}</p>
            ) : (
              student.parents.map(({ parent, relationship }) => (
                <div key={parent.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <Avatar user={parent.user} className="size-8" />
                  <div className="text-sm">
                    <p className="font-medium">
                      {fullName(parent.user)}
                      {relationship && <span className="text-muted-foreground"> · {relationship}</span>}
                    </p>
                    <p dir="ltr" className="text-xs text-muted-foreground">
                      {parent.user.phone ?? parent.user.email}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <StudentFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        student={editable}
      />
    </>
  )
}
