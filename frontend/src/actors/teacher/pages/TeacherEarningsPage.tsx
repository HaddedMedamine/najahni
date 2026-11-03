import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { EarningsView } from '@/components/shared/payments/EarningsView'
import { currentMonthKey } from '@/core/lib/dates'
import { useTeacherEarnings } from '../api/payments.api'

export function TeacherEarningsPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const month = params.get('month') ?? currentMonthKey()
  const query = useTeacherEarnings(month)

  return (
    <>
      <PageHeader title={t('earnings.title')} description={t('earnings.subtitle')} />
      <EarningsView
        data={query.data}
        isLoading={query.isLoading}
        isError={query.isError}
        onRetry={query.refetch}
        month={month}
        onMonthChange={(m) => setParams({ month: m }, { replace: true })}
      />
    </>
  )
}
