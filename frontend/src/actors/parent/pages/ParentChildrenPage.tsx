import { Baby, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/shared/Misc'
import { PageHeader } from '@/components/shared/PageHeader'
import { CardsSkeleton, EmptyState, ErrorState } from '@/components/shared/States'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { fullName } from '@/core/lib/utils'
import { useMyChildren } from '../api/parent.api'

export function ParentChildrenPage() {
  const { t } = useTranslation()
  const { data: children, isLoading, isError, refetch } = useMyChildren()

  return (
    <>
      <PageHeader title={t('parent.title')} description={t('parent.subtitle')} />
      {isLoading ? (
        <CardsSkeleton count={2} />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : children!.length === 0 ? (
        <Card>
          <EmptyState icon={Baby} title={t('parent.noChildren')} />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children!.map((child) => (
            <Link key={child.id} to={`/parent/children/${child.id}`} className="group">
              <Card className="flex h-full flex-col gap-4 p-5 transition-shadow group-hover:shadow-md">
                <div className="flex items-center gap-3">
                  <Avatar user={child.user} className="size-11" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{fullName(child.user)}</p>
                    <p className="text-sm text-muted-foreground">
                      {child.level} · {child.section}
                    </p>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground rtl:rotate-180" />
                </div>
                <div className="flex flex-wrap gap-1">
                  {child.groups.map(({ group }) => (
                    <Badge key={group.id} variant="primary">
                      {group.subject}
                    </Badge>
                  ))}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
