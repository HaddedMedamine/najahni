import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { EarningsView } from '@/components/shared/payments/EarningsView'
import { Select } from '@/components/ui/input'
import { currentMonthKey } from '@/core/lib/dates'
import { fullName } from '@/core/lib/utils'
import { useEarnings } from '../api/payments.api'
import { useTeachers } from '../api/teachers.api'

export function EarningsPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const month = params.get('month') ?? currentMonthKey()
  const teacherId = params.get('teacherId') ?? ''
  const query = useEarnings(month, teacherId || undefined)
  const teachers = useTeachers({ pageSize: 100 })

  const update = (next: { month?: string; teacherId?: string }) => {
    const merged = { month, teacherId, ...next }
    setParams(
      Object.fromEntries(Object.entries(merged).filter(([, v]) => v)),
      { replace: true },
    )
  }

  return (
    <>
      <PageHeader
        title={t('earnings.adminTitle')}
        description={t('earnings.adminSubtitle')}
        actions={
          <Select value={teacherId} onChange={(e) => update({ teacherId: e.target.value })} className="sm:w-64">
            <option value="">{t('payments.allTeachers')}</option>
            {teachers.data?.items.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {fullName(teacher.user)}
              </option>
            ))}
          </Select>
        }
      />
      <EarningsView
        data={query.data}
        isLoading={query.isLoading}
        isError={query.isError}
        onRetry={query.refetch}
        month={month}
        onMonthChange={(m) => update({ month: m })}
        showTeacher={!teacherId}
      />
    </>
  )
}
