import { Archive, ArchiveRestore, Eye, Pencil, Plus, Trash2, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArchivedToggle } from '@/components/shared/ArchivedToggle'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { FillBar } from '@/components/shared/Misc'
import { PageHeader } from '@/components/shared/PageHeader'
import { Pagination } from '@/components/shared/Pagination'
import { RowActions } from '@/components/shared/RowActions'
import { SearchInput } from '@/components/shared/SearchInput'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { formatMoney } from '@/core/lib/format'
import { useListState } from '@/core/lib/use-list-state'
import { fullName } from '@/core/lib/utils'
import {
  type GroupListItem,
  useArchiveGroup,
  useDeleteGroup,
  useGroups,
} from '../api/groups.api'
import { GroupFormDialog } from '../components/GroupFormDialog'

type Confirm = { kind: 'archive' | 'restore' | 'delete'; group: GroupListItem }

export function GroupsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const list = useListState()
  const { data, isLoading, isError, refetch } = useGroups(list.params)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<GroupListItem | null>(null)
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const archive = useArchiveGroup()
  const remove = useDeleteGroup()

  const openForm = (group: GroupListItem | null) => {
    setEditing(group)
    setFormOpen(true)
  }

  const runConfirm = () => {
    if (!confirm) return
    const onSuccess = () => {
      toast.success(confirm.kind === 'delete' ? t('common.deleted') : t('common.saved'))
      setConfirm(null)
    }
    if (confirm.kind === 'delete') remove.mutate(confirm.group.id, { onSuccess })
    else archive.mutate({ id: confirm.group.id, archived: confirm.kind === 'archive' }, { onSuccess })
  }

  const confirmTexts = {
    archive: { title: t('common.archive'), description: t('groups.archiveConfirm') },
    restore: { title: t('common.restore'), description: undefined },
    delete: { title: t('common.delete'), description: t('groups.deleteConfirm') },
  }

  return (
    <>
      <PageHeader
        title={t('groups.title')}
        description={t('groups.subtitle')}
        actions={
          <Button onClick={() => openForm(null)}>
            <Plus />
            {t('groups.new')}
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput value={list.search} onChange={list.setSearch} />
          <ArchivedToggle value={list.archived} onChange={list.setArchived} />
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : data!.items.length === 0 ? (
          <EmptyState icon={UsersRound} title={t('common.noResults')} />
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <TH>{t('groups.name')}</TH>
                  <TH>{t('students.levelSection')}</TH>
                  <TH>{t('groups.teacher')}</TH>
                  <TH>{t('groups.fill')}</TH>
                  <TH>{t('groups.monthlyFee')}</TH>
                  <TH className="w-12" />
                </tr>
              </THead>
              <TBody>
                {data!.items.map((g) => (
                  <TR key={g.id}>
                    <TD>
                      <Link to={`/admin/groups/${g.id}`} className="font-medium hover:underline">
                        {g.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{g.subject}</p>
                    </TD>
                    <TD>
                      {g.level} · {g.section}
                    </TD>
                    <TD>{fullName(g.teacher.user)}</TD>
                    <TD>
                      <FillBar count={g._count.students} capacity={g.capacity} />
                    </TD>
                    <TD className="tabular-nums">{formatMoney(g.monthlyFee)}</TD>
                    <TD>
                      <RowActions
                        actions={[
                          { label: t('common.view'), icon: Eye, onSelect: () => navigate(`/admin/groups/${g.id}`) },
                          { label: t('common.edit'), icon: Pencil, onSelect: () => openForm(g) },
                          {
                            label: t('common.restore'),
                            icon: ArchiveRestore,
                            hidden: !g.archivedAt,
                            onSelect: () => setConfirm({ kind: 'restore', group: g }),
                          },
                          {
                            label: t('common.archive'),
                            icon: Archive,
                            destructive: true,
                            hidden: Boolean(g.archivedAt),
                            onSelect: () => setConfirm({ kind: 'archive', group: g }),
                          },
                          {
                            label: t('common.delete'),
                            icon: Trash2,
                            destructive: true,
                            onSelect: () => setConfirm({ kind: 'delete', group: g }),
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

      <GroupFormDialog open={formOpen} onOpenChange={setFormOpen} group={editing} />
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm ? `${confirmTexts[confirm.kind].title} — ${confirm.group.name}` : ''}
        description={confirm ? confirmTexts[confirm.kind].description : undefined}
        destructive={confirm?.kind !== 'restore'}
        loading={archive.isPending || remove.isPending}
        onConfirm={runConfirm}
      />
    </>
  )
}
