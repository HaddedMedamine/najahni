import { FileText } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ExerciseCard } from '@/components/shared/exercises/ExerciseCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { CardsSkeleton, EmptyState, ErrorState } from '@/components/shared/States'
import { Card } from '@/components/ui/card'
import { cn } from '@/core/lib/utils'
import { studentFileUrl, useMyExercises } from '../api/student.api'

export function StudentExercisesPage() {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useMyExercises()
  const [subject, setSubject] = useState<string | null>(null)

  const subjects = useMemo(() => [...new Set((data ?? []).map((e) => e.subject))].sort(), [data])
  const shown = (data ?? []).filter((e) => !subject || e.subject === subject)

  return (
    <>
      <PageHeader title={t('exercises.studentTitle')} description={t('exercises.studentSubtitle')} />

      {isLoading ? (
        <CardsSkeleton />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : data!.length === 0 ? (
        <Card>
          <EmptyState icon={FileText} title={t('exercises.studentNone')} />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {subjects.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {[null, ...subjects].map((s) => (
                <button
                  key={s ?? 'all'}
                  type="button"
                  onClick={() => setSubject(s)}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors',
                    subject === s ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-primary-soft',
                  )}
                >
                  {s ?? t('exercises.allSubjects')}
                </button>
              ))}
            </div>
          )}
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {shown.map((exercise) => (
              <ExerciseCard key={exercise.id} exercise={exercise} fileUrl={studentFileUrl} showAuthor />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
