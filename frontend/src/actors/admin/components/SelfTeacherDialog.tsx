import { type FormEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useEnableSelfTeacher } from '../api/teachers.api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** « Je suis aussi enseignant » : l'admin active l'espace prof sur son propre compte. */
export function SelfTeacherDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const enable = useEnableSelfTeacher()
  const [subjects, setSubjects] = useState('')

  useEffect(() => {
    if (open) setSubjects('')
  }, [open])

  const list = subjects
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    enable.mutate(list, {
      onSuccess: () => {
        toast.success(t('teachers.selfEnabled'))
        onOpenChange(false)
        navigate('/teacher')
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('teachers.selfTitle')}</DialogTitle>
          <DialogDescription>{t('teachers.selfText')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex min-h-0 flex-col">
          <DialogBody>
            <FormField label={t('teachers.subjects')} htmlFor="self-subjects" hint={t('teachers.subjectsHint')}>
              <Input
                id="self-subjects"
                autoFocus
                placeholder="Mathématiques, Physique"
                value={subjects}
                onChange={(e) => setSubjects(e.target.value)}
              />
            </FormField>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={enable.isPending} disabled={list.length === 0}>
              {t('teachers.selfEnable')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
