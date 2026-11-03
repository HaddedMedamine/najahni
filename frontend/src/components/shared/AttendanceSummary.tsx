import { CalendarCheck, Percent, UserX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { StatCard } from '@/components/shared/Misc'
import { AttendanceBadge } from '@/components/shared/SessionBadges'
import { EmptyState } from '@/components/shared/States'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import type { AttendanceHistory } from '@/core/api/types'
import { formatDateTime } from '@/core/lib/format'

/** Statistiques + historique de presence d'un eleve (espace eleve et parent). */
export function AttendanceSummary({ data }: { data: AttendanceHistory }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t('attendance.rate')}
          value={data.rate === null ? '—' : `${data.rate} %`}
          icon={Percent}
          tone="success"
        />
        <StatCard label={t('attendance.sessions')} value={data.total} icon={CalendarCheck} tone="sky" />
        <StatCard label={t('attendanceStatus.ABSENT')} value={data.stats.ABSENT} icon={UserX} tone="peach" />
      </div>
      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle>{t('attendance.history')}</CardTitle>
        </CardHeader>
        {data.records.length === 0 ? (
          <EmptyState icon={CalendarCheck} title={t('attendance.empty')} />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>{t('planning.date')}</TH>
                <TH>{t('planning.group')}</TH>
                <TH>{t('person.status')}</TH>
              </tr>
            </THead>
            <TBody>
              {data.records.map((r) => (
                <TR key={r.id}>
                  <TD className="whitespace-nowrap text-muted-foreground">
                    {formatDateTime(r.session.startsAt)}
                  </TD>
                  <TD>
                    <span className="font-medium">{r.session.group.subject}</span>
                    <span className="text-muted-foreground"> · {r.session.group.name}</span>
                  </TD>
                  <TD>
                    <AttendanceBadge status={r.status} />
                    {r.note && <span className="ms-2 text-xs text-muted-foreground">{r.note}</span>}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
