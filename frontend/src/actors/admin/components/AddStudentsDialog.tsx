import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAddGroupStudents } from '../api/groups.api'
import { StudentPicker } from './StudentPicker'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  /** Eleves deja dans le groupe. */
  memberIds: string[]
}

export function AddStudentsDialog({ open, onOpenChange, groupId, memberIds }: Props) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<string[]>([])
  const add = useAddGroupStudents()

  useEffect(() => {
    if (open) setSelected([])
  }, [open])

  const submit = () =>
    add.mutate(
      { id: groupId, studentIds: selected },
      {
        onSuccess: ({ added }) => {
          toast.success(t('groups.added', { count: added }))
          onOpenChange(false)
        },
      },
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('groups.addStudents')}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <StudentPicker selected={selected} onChange={setSelected} excludeIds={memberIds} />
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button disabled={selected.length === 0} loading={add.isPending} onClick={submit}>
            {t('groups.addStudents')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
