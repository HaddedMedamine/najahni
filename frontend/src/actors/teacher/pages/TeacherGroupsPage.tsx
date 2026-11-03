import { ChevronRight, UsersRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { FillBar } from '@/components/shared/Misc'
import { PageHeader } from '@/components/shared/PageHeader'
import { CardsSkeleton, EmptyState, ErrorState } from '@/components/shared/States'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useMyGroups } from '../api/teacher.api'

export function TeacherGroupsPage() {
  const { t } = useTranslation()
  const { data: groups, isLoading, isError, refetch } = useMyGroups()

  return (
    <>
      <PageHeader title={t('teacher.groupsTitle')} description={t('teacher.groupsSubtitle')} />
      {isLoading ? (
        <CardsSkeleton />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : groups!.length === 0 ? (
        <Card>
          <EmptyState icon={UsersRound} title={t('teacher.noGroups')} />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups!.map((g) => (
            <Link key={g.id} to={`/teacher/groups/${g.id}`} className="group">
              <Card className="flex h-full flex-col gap-4 p-5 transition-shadow group-hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{g.name}</p>
                    <p className="text-sm text-muted-foreground">{g.subject}</p>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground rtl:rotate-180" />
                </div>
                <div className="mt-auto flex items-center justify-between gap-2">
                  <Badge variant="primary">
                    {g.level} · {g.section}
                  </Badge>
                  <FillBar count={g._count.students} capacity={g.capacity} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
