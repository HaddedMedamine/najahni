import { Link2Off } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { FormField } from '@/components/shared/FormField'
import { Avatar } from '@/components/shared/Misc'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { fullName } from '@/core/lib/utils'
import { type ParentItem, useLinkChild, useUnlinkChild } from '../api/parents.api'
import { StudentPicker } from './StudentPicker'

interface Props {
  parent: ParentItem | null
  onOpenChange: (open: boolean) => void
}

/** Liste des enfants d'un parent : delier / lier un nouvel enfant. */
export function ManageChildrenDialog({ parent, onOpenChange }: Props) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<string[]>([])
  const [relationship, setRelationship] = useState('')
  const link = useLinkChild()
  const unlink = useUnlinkChild()

  useEffect(() => {
    setSelected([])
    setRelationship('')
  }, [parent?.id])

  if (!parent) return null

  const submit = () =>
    link.mutate(
      { id: parent.id, studentId: selected[0], relationship: relationship.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(t('parents.linked'))
          setSelected([])
          setRelationship('')
        },
      },
    )

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('parents.manageChildren')} — {fullName(parent.user)}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-5 pb-5">
          <div className="flex flex-col gap-2">
            {parent.children.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('parents.noChildren')}</p>
            ) : (
              parent.children.map(({ student, relationship: rel }) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-2.5"
                >
                  <Avatar user={student.user} className="size-8" />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium">{fullName(student.user)}</p>
                    <p className="text-xs text-muted-foreground">
                      {student.level} {student.section}
                      {rel && ` · ${rel}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger"
                    loading={unlink.isPending && unlink.variables?.studentId === student.id}
                    onClick={() => unlink.mutate({ id: parent.id, studentId: student.id })}
                  >
                    <Link2Off />
                    {t('parents.unlink')}
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <StudentPicker
              multiple={false}
              selected={selected}
              onChange={setSelected}
              excludeIds={parent.children.map((c) => c.student.id)}
            />
            <FormField label={t('parents.relationship')} htmlFor="relationship" optional>
              <Input
                id="relationship"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
              />
            </FormField>
            <Button disabled={selected.length === 0} loading={link.isPending} onClick={submit}>
              {t('parents.linkChild')}
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
