import { ArrowLeft, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { Avatar } from '@/components/shared/Misc'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { fullName } from '@/core/lib/utils'
import { useMyGroup } from '../api/teacher.api'

export function TeacherGroupDetailPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const { data: group, isLoading, isError, refetch } = useMyGroup(id)

  if (isLoading) return <TableSkeleton rows={6} />
  if (isError || !group) return <ErrorState onRetry={refetch} />

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/teacher/groups">
          <ArrowLeft className="rtl:rotate-180" />
          {t('common.back')}
        </Link>
      </Button>
      <PageHeader
        title={group.name}
        description={`${group.subject} · ${group.level} ${group.section} · ${t('teacher.studentsCount', { count: group.students.length })}`}
      />
      <Card>
        {group.students.length === 0 ? (
          <EmptyState icon={Users} title={t('groups.noStudents')} />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH className="w-12">#</TH>
                <TH>{t('person.name')}</TH>
                <TH>{t('students.levelSection')}</TH>
              </tr>
            </THead>
            <TBody>
              {group.students.map(({ student }, index) => (
                <TR key={student.id}>
                  <TD className="text-muted-foreground tabular-nums">{index + 1}</TD>
                  <TD>
                    <div className="flex items-center gap-3">
                      <Avatar user={student.user} />
                      <span className="font-medium">{fullName(student.user)}</span>
                    </div>
                  </TD>
                  <TD>
                    {student.level} · {student.section}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  )
}
