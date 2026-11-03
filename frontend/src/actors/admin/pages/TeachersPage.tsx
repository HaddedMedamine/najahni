import { useQueryClient } from '@tanstack/react-query'
import { KeyRound, Pencil, Plus, Power, PowerOff, Presentation, Trash2, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
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
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { useAuthStore } from '@/core/auth/auth.store'
import { useListState } from '@/core/lib/use-list-state'
import { fullName } from '@/core/lib/utils'
import { useResetPassword } from '../api/accounts.api'
import {
  type TeacherListItem,
  useDeleteTeacher,
  useTeachers,
  useUpdateTeacher,
} from '../api/teachers.api'
import { SelfTeacherDialog } from '../components/SelfTeacherDialog'
import { TeacherFormDialog } from '../components/TeacherFormDialog'

type Confirm = { kind: 'delete' | 'reset'; teacher: TeacherListItem }

export function TeachersPage() {
  const { t } = useTranslation()
  const list = useListState()
  const { data, isLoading, isError, refetch } = useTeachers(list.params)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TeacherListItem | null>(null)
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [selfOpen, setSelfOpen] = useState(false)
  const me = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const update = useUpdateTeacher()
  const remove = useDeleteTeacher()
  const reset = useResetPassword()

  const openForm = (teacher: TeacherListItem | null) => {
    setEditing(teacher)
    setFormOpen(true)
  }

  const toggleActive = (teacher: TeacherListItem) =>
    update.mutate(
      { id: teacher.id, isActive: !teacher.user.isActive },
      { onSuccess: () => toast.success(t('common.saved')) },
    )

  const runConfirm = () => {
    if (!confirm) return
    if (confirm.kind === 'delete') {
      const self = confirm.teacher.user.id === me?.id
      remove.mutate(confirm.teacher.id, {
        onSuccess: () => {
          toast.success(t('common.deleted'))
          setConfirm(null)
          // Mon espace prof retire : le menu Admin / Prof disparait
          if (self) queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
        },
      })
    } else {
      reset.mutate(confirm.teacher.user.id, {
        onSuccess: (r) => {
          setConfirm(null)
          setTempPassword(r.temporaryPassword)
        },
      })
    }
  }

  return (
    <>
      <PageHeader
        title={t('teachers.title')}
        description={t('teachers.subtitle')}
        actions={
          <div className="flex flex-wrap gap-2">
            {me && !me.teacher && (
              <Button variant="outline" onClick={() => setSelfOpen(true)}>
                <Presentation />
                {t('teachers.selfEnable')}
              </Button>
            )}
            <Button onClick={() => openForm(null)}>
              <Plus />
              {t('teachers.new')}
            </Button>
          </div>
        }
      />

      <Card>
        <div className="border-b border-border p-4">
          <SearchInput value={list.search} onChange={list.setSearch} />
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : data!.items.length === 0 ? (
          <EmptyState icon={UserRound} title={t('common.noResults')} />
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <TH>{t('person.name')}</TH>
                  <TH>{t('person.contact')}</TH>
                  <TH>{t('teachers.subjects')}</TH>
                  <TH>{t('teachers.groupsCount')}</TH>
                  <TH>{t('person.status')}</TH>
                  <TH className="w-12" />
                </tr>
              </THead>
              <TBody>
                {data!.items.map((teacher) => (
                  <TR key={teacher.id}>
                    <TD>
                      <div className="flex items-center gap-3">
                        <Avatar user={teacher.user} />
                        <span className="font-medium">{fullName(teacher.user)}</span>
                        {teacher.user.id === me?.id && <Badge variant="success">{t('teachers.you')}</Badge>}
                      </div>
                    </TD>
                    <TD className="text-muted-foreground">
                      <span dir="ltr" className="block">{teacher.user.phone ?? '—'}</span>
                      <span className="block text-xs">{teacher.user.email}</span>
                    </TD>
                    <TD>
                      <div className="flex flex-wrap gap-1">
                        {teacher.subjects.map((s) => (
                          <Badge key={s} variant="primary">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </TD>
                    <TD className="tabular-nums">{teacher._count.groups}</TD>
                    <TD>
                      <StatusBadge isActive={teacher.user.isActive} />
                    </TD>
                    <TD>
                      <RowActions
                        actions={[
                          { label: t('common.edit'), icon: Pencil, onSelect: () => openForm(teacher) },
                          {
                            label: t('account.resetPassword'),
                            icon: KeyRound,
                            onSelect: () => setConfirm({ kind: 'reset', teacher }),
                          },
                          {
                            label: teacher.user.isActive ? t('common.deactivate') : t('common.activate'),
                            icon: teacher.user.isActive ? PowerOff : Power,
                            onSelect: () => toggleActive(teacher),
                            hidden: teacher.user.id === me?.id,
                          },
                          {
                            label: t('common.delete'),
                            icon: Trash2,
                            destructive: true,
                            onSelect: () => setConfirm({ kind: 'delete', teacher }),
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

      <TeacherFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        teacher={editing}
        onCreated={(pw) => pw && setTempPassword(pw)}
      />
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={
          confirm
            ? `${confirm.kind === 'delete' ? t('common.delete') : t('account.resetPassword')} — ${fullName(confirm.teacher.user)}`
            : ''
        }
        description={
          confirm?.kind === 'delete'
            ? confirm.teacher.user.id === me?.id
              ? t('teachers.selfDeleteConfirm')
              : t('teachers.deleteConfirm')
            : t('account.resetConfirm')
        }
        destructive={confirm?.kind === 'delete'}
        loading={remove.isPending || reset.isPending}
        onConfirm={runConfirm}
      />
      <TemporaryPasswordDialog password={tempPassword} onClose={() => setTempPassword(null)} />
      <SelfTeacherDialog open={selfOpen} onOpenChange={setSelfOpen} />
    </>
  )
}
