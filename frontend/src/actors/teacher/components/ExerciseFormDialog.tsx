import { zodResolver } from '@hookform/resolvers/zod'
import { Paperclip, Upload, X } from 'lucide-react'
import { type DragEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input, Select } from '@/components/ui/input'
import type { Exercise } from '@/core/api/types'
import { ACCEPTED_FILES, formatSize, isAccepted, MAX_FILES } from '@/core/lib/files'
import { requiredText } from '@/core/lib/validation'
import { cn } from '@/core/lib/utils'
import { useCreateExercise, useUpdateExercise } from '../api/exercises.api'
import { useMyGroups } from '../api/teacher.api'

const textareaClass =
  'min-h-24 w-full rounded-xl border border-border bg-card p-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15'

const makeSchema = () =>
  z.object({
    title: requiredText(),
    description: z.string(),
    level: requiredText(),
  })
type Values = z.infer<ReturnType<typeof makeSchema>>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Modification (sans changer les fichiers) */
  exercise?: Exercise | null
}

/** Publier un exercice : niveau -> mes groupes de ce niveau (tous coches) + fichiers. */
export function ExerciseFormDialog({ open, onOpenChange, exercise }: Props) {
  const { t, i18n } = useTranslation()
  const schema = useMemo(makeSchema, [i18n.language])
  const form = useForm<Values>({ resolver: zodResolver(schema) })
  const groups = useMyGroups()
  const create = useCreateExercise()
  const update = useUpdateExercise()
  const [groupIds, setGroupIds] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [progress, setProgress] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)

  const levels = useMemo(() => [...new Set((groups.data ?? []).map((g) => g.level))].sort(), [groups.data])
  const level = form.watch('level')
  const levelGroups = (groups.data ?? []).filter((g) => g.level === level)

  useEffect(() => {
    if (!open) return
    form.reset({ title: exercise?.title ?? '', description: exercise?.description ?? '', level: exercise?.level ?? '' })
    setGroupIds(exercise?.groups.map((g) => g.id) ?? [])
    setFiles([])
    setProgress(null)
    setFormError(null)
  }, [open, exercise, form])

  // Un seul niveau : choisi d'office
  useEffect(() => {
    if (open && !exercise && levels.length === 1 && !form.getValues('level')) {
      form.setValue('level', levels[0])
      setGroupIds((groups.data ?? []).filter((g) => g.level === levels[0]).map((g) => g.id))
    }
  }, [open, exercise, levels, groups.data, form])

  const chooseLevel = (value: string) => {
    form.setValue('level', value, { shouldValidate: true })
    setGroupIds((groups.data ?? []).filter((g) => g.level === value).map((g) => g.id))
  }

  const addFiles = (list: FileList | null) => {
    if (!list) return
    const picked = [...list]
    const rejected = picked.filter((f) => !isAccepted(f))
    if (rejected.length) toast.error(t('exercises.rejected', { names: rejected.map((f) => f.name).join(', ') }))
    setFiles((current) => {
      const next = [...current, ...picked.filter(isAccepted)]
      if (next.length > MAX_FILES) toast.error(t('exercises.tooMany', { max: MAX_FILES }))
      return next.slice(0, MAX_FILES)
    })
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const onSubmit = (v: Values) => {
    if (groupIds.length === 0) return setFormError(t('exercises.chooseGroup'))
    if (!exercise && files.length === 0) return setFormError(t('exercises.chooseFile'))
    setFormError(null)
    const onSuccess = () => {
      toast.success(exercise ? t('common.saved') : t('exercises.published'))
      onOpenChange(false)
    }
    if (exercise) {
      update.mutate({ id: exercise.id, title: v.title, description: v.description, groupIds }, { onSuccess })
    } else {
      setProgress(0)
      create.mutate(
        { ...v, groupIds, files, onProgress: setProgress },
        { onSuccess, onSettled: () => setProgress(null) },
      )
    }
  }

  const errors = form.formState.errors

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{exercise ? t('exercises.editTitle') : t('exercises.new')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-col">
          <DialogBody className="flex flex-col gap-4">
            <FormField label={t('exercises.titleLabel')} htmlFor="title" error={errors.title?.message}>
              <Input
                id="title"
                autoFocus
                placeholder={t('exercises.titlePlaceholder')}
                aria-invalid={!!errors.title}
                {...form.register('title')}
              />
            </FormField>

            <FormField label={t('exercises.description')} htmlFor="description" optional>
              <textarea
                id="description"
                className={textareaClass}
                placeholder={t('exercises.descriptionPlaceholder')}
                {...form.register('description')}
              />
            </FormField>

            <FormField label={t('exercises.level')} htmlFor="level" error={errors.level?.message}>
              <Select
                id="level"
                value={level ?? ''}
                disabled={!!exercise}
                aria-invalid={!!errors.level}
                onChange={(e) => chooseLevel(e.target.value)}
              >
                <option value="">{t('exercises.chooseLevel')}</option>
                {levels.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </Select>
            </FormField>

            {level && (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1.5 text-sm font-medium">{t('exercises.groups')}</legend>
                {levelGroups.map((g) => {
                  const checked = groupIds.includes(g.id)
                  return (
                    <label
                      key={g.id}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm transition-colors',
                        checked ? 'border-primary/40 bg-primary-soft/50' : 'border-border',
                      )}
                    >
                      <input
                        type="checkbox"
                        className="size-4 accent-primary"
                        checked={checked}
                        onChange={() =>
                          setGroupIds((ids) => (checked ? ids.filter((id) => id !== g.id) : [...ids, g.id]))
                        }
                      />
                      <span className="flex-1 font-medium">{g.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {g.subject} · {g.section}
                      </span>
                    </label>
                  )
                })}
              </fieldset>
            )}

            {!exercise && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">{t('exercises.files')}</span>
                <button
                  type="button"
                  onClick={() => input.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragging(true)
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors',
                    dragging ? 'border-primary bg-primary-soft/60' : 'border-border hover:border-primary/40 hover:bg-primary-soft/30',
                  )}
                >
                  <Upload className="size-6 text-primary" />
                  <span className="text-sm font-medium">{t('exercises.dropHint')}</span>
                  <span className="text-xs text-muted-foreground">{t('exercises.filesHint', { max: MAX_FILES })}</span>
                </button>
                <input
                  ref={input}
                  type="file"
                  multiple
                  accept={ACCEPTED_FILES}
                  className="hidden"
                  onChange={(e) => {
                    addFiles(e.target.files)
                    e.target.value = ''
                  }}
                />
                {files.length > 0 && (
                  <ul className="flex flex-col gap-1.5">
                    {files.map((f, i) => (
                      <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2 text-sm">
                        <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate" dir="auto">
                          {f.name}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatSize(f.size)}</span>
                        <button
                          type="button"
                          aria-label={t('exercises.removeFile')}
                          onClick={() => setFiles((list) => list.filter((_, j) => j !== i))}
                          className="rounded-full p-1 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                        >
                          <X className="size-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {progress !== null && (
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
            {formError && <p className="text-sm text-danger">{formError}</p>}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={create.isPending || update.isPending}>
              {exercise ? t('common.save') : t('exercises.publish')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
