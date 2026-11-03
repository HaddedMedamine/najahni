import { FileText, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ExerciseCard } from '@/components/shared/exercises/ExerciseCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { RowActions } from '@/components/shared/RowActions'
import { CardsSkeleton, EmptyState, ErrorState } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Exercise } from '@/core/api/types'
import { teacherFileUrl, useDeleteExercise, useMyExercises } from '../api/exercises.api'
import { ExerciseFormDialog } from '../components/ExerciseFormDialog'

export function TeacherExercisesPage() {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useMyExercises()
  const remove = useDeleteExercise()
  const [form, setForm] = useState<{ open: boolean; exercise: Exercise | null }>({ open: false, exercise: null })
  const [toDelete, setToDelete] = useState<Exercise | null>(null)

  return (
    <>
      <PageHeader
        title={t('exercises.title')}
        description={t('exercises.subtitle')}
        actions={
          <Button onClick={() => setForm({ open: true, exercise: null })}>
            <Plus />
            {t('exercises.new')}
          </Button>
        }
      />

      {isLoading ? (
        <CardsSkeleton />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : data!.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title={t('exercises.none')}
            action={
              <Button variant="outline" onClick={() => setForm({ open: true, exercise: null })}>
                <Plus />
                {t('exercises.new')}
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {data!.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              fileUrl={teacherFileUrl}
              actions={
                <RowActions
                  actions={[
                    { label: t('common.edit'), icon: Pencil, onSelect: () => setForm({ open: true, exercise }) },
                    { label: t('common.delete'), icon: Trash2, destructive: true, onSelect: () => setToDelete(exercise) },
                  ]}
                />
              }
            />
          ))}
        </div>
      )}

      <ExerciseFormDialog
        open={form.open}
        exercise={form.exercise}
        onOpenChange={(open) => setForm((f) => ({ ...f, open }))}
      />
      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={t('exercises.deleteTitle')}
        description={t('exercises.deleteText', { title: toDelete?.title ?? '' })}
        confirmLabel={t('common.delete')}
        destructive
        loading={remove.isPending}
        onConfirm={() =>
          toDelete &&
          remove.mutate(toDelete.id, {
            onSuccess: () => {
              toast.success(t('exercises.deleted'))
              setToDelete(null)
            },
          })
        }
      />
    </>
  )
}
