import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Pencil,
  UserMinus,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Avatar, FillBar, StatCard } from '@/components/shared/Misc'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/shared/States'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { formatDate, formatMoney } from '@/core/lib/format'
import { fullName } from '@/core/lib/utils'
import { useGroup, useRemoveGroupStudent } from '../api/groups.api'
import { AddStudentsDialog } from '../components/AddStudentsDialog'
import { GroupFormDialog } from '../components/GroupFormDialog'

export function GroupDetailPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const { data: group, isLoading, isError, refetch } = useGroup(id)
  const [editOpen, setEditOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [removing, setRemoving] = useState<{ id: string; name: string } | null>(null)
  const removeStudent = useRemoveGroupStudent()

  if (isLoading) return <TableSkeleton rows={6} />
  if (isError || !group) return <ErrorState onRetry={refetch} />

  const isFull = group.students.length >= group.capacity

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/admin/groups">
          <ArrowLeft className="rtl:rotate-180" />
          {t('common.back')}
        </Link>
      </Button>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{group.name}</h1>
            {group.archivedAt && <Badge variant="warning">{t('common.archived')}</Badge>}
            {isFull && <Badge variant="danger">{t('groups.full')}</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {group.subject} · {group.level} {group.section} · {fullName(group.teacher.user)}
          </p>
        </div>
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil />
          {t('common.edit')}
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('groups.students')} value={`${group.students.length} / ${group.capacity}`} icon={Users} />
        <StatCard label={t('groups.monthlyFee')} value={formatMoney(group.monthlyFee)} icon={Wallet} tone="success" />
        <StatCard label={t('groups.monthlySessions')} value={group.monthlySessions} icon={CalendarDays} tone="sky" />
        <StatCard label={t('groups.sessions')} value={group._count.sessions} icon={BookOpen} tone="violet" />
      </div>


      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex flex-col gap-2">
            <CardTitle>{t('groups.students')}</CardTitle>
            <FillBar count={group.students.length} capacity={group.capacity} />
          </div>
          <Button disabled={isFull || Boolean(group.archivedAt)} onClick={() => setAddOpen(true)}>
            <UserPlus />
            {t('groups.addStudents')}
          </Button>
        </CardHeader>

        {group.students.length === 0 ? (
          <EmptyState icon={Users} title={t('groups.noStudents')} />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>{t('person.name')}</TH>
                <TH>{t('person.contact')}</TH>
                <TH>{t('students.levelSection')}</TH>
                <TH>{t('groups.joinedAt')}</TH>
                <TH className="w-12" />
              </tr>
            </THead>
            <TBody>
              {group.students.map(({ student, joinedAt }) => (
                <TR key={student.id}>
                  <TD>
                    <Link to={`/admin/students/${student.id}`} className="flex items-center gap-3 hover:underline">
                      <Avatar user={student.user} />
                      <span className="font-medium">{fullName(student.user)}</span>
                    </Link>
                  </TD>
                  <TD dir="ltr" className="text-start text-muted-foreground">
                    {student.user.phone ?? student.user.email}
                  </TD>
                  <TD>
                    {student.level} · {student.section}
                  </TD>
                  <TD className="text-muted-foreground">{formatDate(joinedAt)}</TD>
                  <TD>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-danger"
                      aria-label={t('groups.removeStudent')}
                      title={t('groups.removeStudent')}
                      onClick={() => setRemoving({ id: student.id, name: fullName(student.user) })}
                    >
                      <UserMinus />
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <GroupFormDialog open={editOpen} onOpenChange={setEditOpen} group={group} />
      <AddStudentsDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        groupId={group.id}
        memberIds={group.students.map((s) => s.student.id)}
      />
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={removing ? `${t('groups.removeStudent')} — ${removing.name}` : ''}
        description={t('groups.removeConfirm')}
        destructive
        loading={removeStudent.isPending}
        onConfirm={() =>
          removing &&
          removeStudent.mutate(
            { id: group.id, studentId: removing.id },
            {
              onSuccess: () => {
                toast.success(t('common.saved'))
                setRemoving(null)
              },
            },
          )
        }
      />
    </>
  )
}
