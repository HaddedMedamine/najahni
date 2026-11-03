import { DoorOpen, Pencil, Plus, Power, PowerOff, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { StatusBadge } from '@/components/shared/Misc'
import { PageHeader } from '@/components/shared/PageHeader'
import { RowActions } from '@/components/shared/RowActions'
import { CardsSkeleton, EmptyState, ErrorState } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { type Room, useDeleteRoom, useRooms, useUpdateRoom } from '../api/rooms.api'
import { RoomFormDialog } from '../components/RoomFormDialog'

export function RoomsPage() {
  const { t } = useTranslation()
  const { data: rooms, isLoading, isError, refetch } = useRooms()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Room | null>(null)
  const [deleting, setDeleting] = useState<Room | null>(null)
  const update = useUpdateRoom()
  const remove = useDeleteRoom()

  const openForm = (room: Room | null) => {
    setEditing(room)
    setFormOpen(true)
  }

  return (
    <>
      <PageHeader
        title={t('rooms.title')}
        description={t('rooms.subtitle')}
        actions={
          <Button onClick={() => openForm(null)}>
            <Plus />
            {t('rooms.new')}
          </Button>
        }
      />

      {isLoading ? (
        <CardsSkeleton />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : rooms!.length === 0 ? (
        <Card>
          <EmptyState
            icon={DoorOpen}
            title={t('rooms.empty')}
            action={
              <Button size="sm" onClick={() => openForm(null)}>
                <Plus />
                {t('rooms.new')}
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms!.map((room) => (
            <Card key={room.id} className="flex items-center gap-4 p-5">
              <div className="rounded-xl bg-primary-soft p-3">
                <DoorOpen className="size-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{room.name}</p>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  {t('rooms.places', { count: room.capacity })}
                  <StatusBadge isActive={room.isActive} />
                </div>
              </div>
              <RowActions
                actions={[
                  { label: t('common.edit'), icon: Pencil, onSelect: () => openForm(room) },
                  {
                    label: room.isActive ? t('common.deactivate') : t('common.activate'),
                    icon: room.isActive ? PowerOff : Power,
                    onSelect: () =>
                      update.mutate(
                        { id: room.id, isActive: !room.isActive },
                        { onSuccess: () => toast.success(t('common.saved')) },
                      ),
                  },
                  { label: t('common.delete'), icon: Trash2, destructive: true, onSelect: () => setDeleting(room) },
                ]}
              />
            </Card>
          ))}
        </div>
      )}

      <RoomFormDialog open={formOpen} onOpenChange={setFormOpen} room={editing} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? `${t('common.delete')} — ${deleting.name}` : ''}
        description={t('rooms.deleteConfirm')}
        destructive
        loading={remove.isPending}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting.id, {
            onSuccess: () => {
              toast.success(t('common.deleted'))
              setDeleting(null)
            },
          })
        }
      />
    </>
  )
}
