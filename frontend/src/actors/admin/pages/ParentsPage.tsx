import { Baby, KeyRound, Pencil, Plus, Power, PowerOff, Trash2, Users } from 'lucide-react'
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
import { useListState } from '@/core/lib/use-list-state'
import { fullName } from '@/core/lib/utils'
import { useResetPassword } from '../api/accounts.api'
import {
  type ParentItem,
  useDeleteParent,
  useParents,
  useUpdateParent,
} from '../api/parents.api'
import { ManageChildrenDialog } from '../components/ManageChildrenDialog'
import { ParentFormDialog } from '../components/ParentFormDialog'

type Confirm = { kind: 'delete' | 'reset'; parent: ParentItem }

export function ParentsPage() {
  const { t } = useTranslation()
  const list = useListState()
  const { data, isLoading, isError, refetch } = useParents(list.params)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ParentItem | null>(null)
  // On garde l'id : le dialogue lit la version a jour du parent apres chaque lien
  const [childrenOf, setChildrenOf] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  const update = useUpdateParent()
  const remove = useDeleteParent()
  const reset = useResetPassword()

  const openForm = (parent: ParentItem | null) => {
    setEditing(parent)
    setFormOpen(true)
  }

  const runConfirm = () => {
    if (!confirm) return
    if (confirm.kind === 'delete') {
      remove.mutate(confirm.parent.id, {
        onSuccess: () => {
          toast.success(t('common.deleted'))
          setConfirm(null)
        },
      })
    } else {
      reset.mutate(confirm.parent.user.id, {
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
        title={t('parents.title')}
        description={t('parents.subtitle')}
        actions={
          <Button onClick={() => openForm(null)}>
            <Plus />
            {t('parents.new')}
          </Button>
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
          <EmptyState icon={Users} title={t('common.noResults')} />
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <TH>{t('person.name')}</TH>
                  <TH>{t('person.contact')}</TH>
                  <TH>{t('parents.children')}</TH>
                  <TH>{t('person.status')}</TH>
                  <TH className="w-12" />
                </tr>
              </THead>
              <TBody>
                {data!.items.map((parent) => (
                  <TR key={parent.id}>
                    <TD>
                      <div className="flex items-center gap-3">
                        <Avatar user={parent.user} />
                        <span className="font-medium">{fullName(parent.user)}</span>
                      </div>
                    </TD>
                    <TD className="text-muted-foreground">
                      <span dir="ltr" className="block">{parent.user.phone ?? '—'}</span>
                      <span className="block text-xs">{parent.user.email}</span>
                    </TD>
                    <TD>
                      <div className="flex flex-wrap gap-1">
                        {parent.children.length === 0 ? (
                          <span className="text-xs text-muted-foreground">{t('parents.noChildren')}</span>
                        ) : (
                          parent.children.map(({ student }) => (
                            <Badge key={student.id} variant="primary">
                              {fullName(student.user)}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TD>
                    <TD>
                      <StatusBadge isActive={parent.user.isActive} />
                    </TD>
                    <TD>
                      <RowActions
                        actions={[
                          { label: t('parents.manageChildren'), icon: Baby, onSelect: () => setChildrenOf(parent.id) },
                          { label: t('common.edit'), icon: Pencil, onSelect: () => openForm(parent) },
                          {
                            label: t('account.resetPassword'),
                            icon: KeyRound,
                            onSelect: () => setConfirm({ kind: 'reset', parent }),
                          },
                          {
                            label: parent.user.isActive ? t('common.deactivate') : t('common.activate'),
                            icon: parent.user.isActive ? PowerOff : Power,
                            onSelect: () =>
                              update.mutate(
                                { id: parent.id, isActive: !parent.user.isActive },
                                { onSuccess: () => toast.success(t('common.saved')) },
                              ),
                          },
                          {
                            label: t('common.delete'),
                            icon: Trash2,
                            destructive: true,
                            onSelect: () => setConfirm({ kind: 'delete', parent }),
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

      <ParentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        parent={editing}
        onCreated={(pw) => pw && setTempPassword(pw)}
      />
      <ManageChildrenDialog
        parent={data?.items.find((p) => p.id === childrenOf) ?? null}
        onOpenChange={(open) => !open && setChildrenOf(null)}
      />
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={
          confirm
            ? `${confirm.kind === 'delete' ? t('common.delete') : t('account.resetPassword')} — ${fullName(confirm.parent.user)}`
            : ''
        }
        description={confirm?.kind === 'delete' ? t('parents.deleteConfirm') : t('account.resetConfirm')}
        destructive={confirm?.kind === 'delete'}
        loading={remove.isPending || reset.isPending}
        onConfirm={runConfirm}
      />
      <TemporaryPasswordDialog password={tempPassword} onClose={() => setTempPassword(null)} />
    </>
  )
}
