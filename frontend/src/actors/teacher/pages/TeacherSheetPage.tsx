import { ArrowLeft, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/shared/States'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { fullName } from '@/core/lib/utils'
import { useTeacherGroupSheet } from '../api/payments.api'
import { MonthFilter, PresenceCounts, PresenceDates, SheetLegend } from '../components/SheetParts'

/** Tout un groupe d'un coup : les seances de chaque eleve, payees ou non. */
export function TeacherSheetPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const month = params.get('month') ?? undefined
  const sheet = useTeacherGroupSheet(id, month)

  const back = (
    <Button variant="ghost" size="sm" asChild className="mb-4">
      <Link to={`/teacher/groups/${id}`}>
        <ArrowLeft className="rtl:rotate-180" />
        {t('common.back')}
      </Link>
    </Button>
  )

  if (sheet.isError) {
    return (
      <>
        {back}
        <ErrorState onRetry={() => void sheet.refetch()} />
      </>
    )
  }
  if (!sheet.data) return <TableSkeleton rows={6} />

  return (
    <>
      {back}
      <PageHeader title={sheet.data.group.name} description={t('sheet.subtitle')} />

      <div className="mb-4">
        <MonthFilter
          months={sheet.data.months}
          month={month}
          onChange={(m) => setParams(m ? { month: m } : {}, { replace: true })}
        />
      </div>

      <Card className="overflow-hidden">
        <SheetLegend className="border-b border-border bg-muted/40 px-5 py-2.5" />
        {sheet.data.rows.length === 0 ? (
          <EmptyState icon={Users} title={t('payments.noStudents')} />
        ) : (
          <ul className="divide-y divide-border">
            {sheet.data.rows.map((row) => (
              <li key={row.student.id} className="flex flex-col gap-2 px-5 py-3.5 md:flex-row md:gap-4">
                <div className="min-w-0 md:w-56 md:shrink-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{fullName(row.student.user)}</span>
                    {row.left && <Badge>{t('sheet.left')}</Badge>}
                  </div>
                  <PresenceCounts presences={row.presences} />
                </div>
                <PresenceDates presences={row.presences} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}
