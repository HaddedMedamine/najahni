import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/shared/PageHeader'
import { PaymentsOverviewView } from '@/components/shared/payments/PaymentsOverviewView'
import { useTeacherPayments } from '../api/payments.api'

export function TeacherPaymentsPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useTeacherPayments()
  return (
    <>
      <PageHeader title={t('payments.title')} description={t('payments.subtitle')} />
      <PaymentsOverviewView data={data} isLoading={isLoading} groupHref={(id) => `/teacher/payments/groups/${id}`} />
    </>
  )
}
