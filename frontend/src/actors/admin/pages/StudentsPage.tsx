import {
  Archive,
  ArchiveRestore,
  Eye,
  GraduationCap,
  KeyRound,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArchivedToggle } from '@/components/shared/ArchivedToggle'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Avatar, StatusBadge } from '@/components/shared/Misc'
import { PageHeader } from '@/components/shared/PageHeader'
import { Pagination } from '@/components/shared/Pagination'
import { RowActions } from '@/components/shared/RowActions'
import { SearchInput } from '@/components/shared/SearchInput'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/shared/States'
import { TemporaryPasswordDialog } from '@/components/shared/TemporaryPasswordDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/input'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { useListState } from '@/core/lib/use-list-state'
import { fullName } from '@/core/lib/utils'
import { useResetPassword } from '../api/accounts.api'
import { useGroups } from '../api/groups.api'
import {
  type StudentListItem,
  useArchiveStudent,
  useDeleteStudent,
  useStudents,
} from '../api/students.api'
import { StudentFormDialog } from '../components/StudentFormDialog'

type Confirm = { kind: 'archive' | 'restore' | 'delete' | 'reset'; student: StudentListItem }

export function StudentsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const list = useListState()
  const [groupId, setGroupId] = useState('')
  const { data, isLoading, isError, refetch } = useStudents({
    ...list.params,
    groupId: groupId || undefined,
  })
  const groups = useGroups({ pageSize: 100 })

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<StudentListItem | null>(null)
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  const archive = useArchiveStudent()
  const remove = useDeleteStudent()
  const reset = useResetPassword()

  const openForm = (student: StudentListItem | null) => {
    setEditing(student)
    setFormOpen(true)
  }

  const runConfirm = () => {
    if (!confirm) return
    const { kind, student } = confirm
    const done = (message?: string) => () => {
      if (message) toast.success(message)
      setConfirm(null)
    }
    if (kind === 'delete') remove.mutate(student.id, { onSuccess: done(t('common.deleted')) })
    else if (kind === 'reset')
      reset.mutate(student.user.id, {
        onSuccess: (r) => {
          setConfirm(null)
          setTempPassword(r.temporaryPassword)
        },
      })
    else
      archive.mutate(
        { id: student.id, archived: kind === 'archive' },
        { onSuccess: done(kind === 'archive' ? t('students.archivedOk') : t('students.restoredOk')) },
      )
  }

  const confirmTexts = {
    archive: { title: t('common.archive'), description: t('students.archiveConfirm') },
    restore: { title: t('common.restore'), description: undefined },
    delete: { title: t('common.delete'), description: t('students.deleteConfirm') },
    reset: { title: t('account.resetPassword'), description: t('account.resetConfirm') },
  }

  return (
    <>
      <PageHeader
        title={t('students.title')}
        description={t('students.subtitle')}
        actions={
          <Button onClick={() => openForm(null)}>
            <Plus />
            {t('students.new')}
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <SearchInput value={list.search} onChange={list.setSearch} />
          <Select
            value={groupId}
            onChange={(e) => {
              setGroupId(e.target.value)
              list.setPage(1)
            }}
            className="sm:w-56"
          >
            <option value="">{t('students.allGroups')}</option>
            {groups.data?.items.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
          <div className="sm:ms-auto">
            <ArchivedToggle value={list.archived} onChange={list.setArchived} />
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : data!.items.length === 0 ? (
          <EmptyState icon={GraduationCap} title={t('common.noResults')} />
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <TH>{t('person.name')}</TH>
                  <TH>{t('person.contact')}</TH>
                  <TH>{t('students.levelSection')}</TH>
                  <TH>{t('students.groups')}</TH>
                  <TH>{t('person.status')}</TH>
                  <TH className="w-12" />
                </tr>
              </THead>
              <TBody>
                {data!.items.map((s) => (
                  <TR key={s.id}>
                    <TD>
                      <Link to={`/admin/students/${s.id}`} className="flex items-center gap-3 hover:underline">
                        <Avatar user={s.user} />
                        <span className="font-medium">{fullName(s.user)}</span>
                      </Link>
                    </TD>
                    <TD className="text-muted-foreground">
                      <span dir="ltr" className="block">{s.user.phone ?? '—'}</span>
                      <span className="block text-xs">{s.user.email}</span>
                    </TD>
                    <TD>
                      {s.level} · {s.section}
                    </TD>
                    <TD>
                      <div className="flex flex-wrap gap-1">
                        {s.groups.length === 0 ? (
                          <span className="text-xs text-muted-foreground">{t('students.noGroup')}</span>
                        ) : (
                          s.groups.map(({ group }) => (
                            <Badge key={group.id} variant="primary">
                              {group.name}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TD>
                    <TD>
                      <StatusBadge isActive={s.user.isActive} archived={Boolean(s.archivedAt)} />
                    </TD>
                    <TD>
                      <RowActions
                        actions={[
                          { label: t('common.view'), icon: Eye, onSelect: () => navigate(`/admin/students/${s.id}`) },
                          { label: t('common.edit'), icon: Pencil, onSelect: () => openForm(s) },
                          {
                            label: t('account.resetPassword'),
                            icon: KeyRound,
                            hidden: Boolean(s.archivedAt),
                            onSelect: () => setConfirm({ kind: 'reset', student: s }),
                          },
                          {
                            label: t('common.restore'),
                            icon: ArchiveRestore,
                            hidden: !s.archivedAt,
                            onSelect: () => setConfirm({ kind: 'restore', student: s }),
                          },
                          {
                            label: t('common.archive'),
                            icon: Archive,
                            destructive: true,
                            hidden: Boolean(s.archivedAt),
                            onSelect: () => setConfirm({ kind: 'archive', student: s }),
                          },
                          {
                            label: t('common.delete'),
                            icon: Trash2,
                            destructive: true,
                            onSelect: () => setConfirm({ kind: 'delete', student: s }),
                          },
                        ]}
                      />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination page={data!.page} pageSize={data!.pageSize} total={data!.total} onChange={list.setPage} />
          </>
        )}
      </Card>

      <StudentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        student={editing}
        onCreated={(pw) => pw && setTempPassword(pw)}
      />
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm ? `${confirmTexts[confirm.kind].title} — ${fullName(confirm.student.user)}` : ''}
        description={confirm ? confirmTexts[confirm.kind].description : undefined}
        destructive={confirm?.kind === 'delete' || confirm?.kind === 'archive'}
        loading={archive.isPending || remove.isPending || reset.isPending}
        onConfirm={runConfirm}
      />
      <TemporaryPasswordDialog password={tempPassword} onClose={() => setTempPassword(null)} />
    </>
  )
}
