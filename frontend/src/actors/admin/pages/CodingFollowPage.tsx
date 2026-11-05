import { useTranslation } from 'react-i18next'
import { CodingFollowView } from '@/components/shared/coding/CodingFollowView'
import { PageHeader } from '@/components/shared/PageHeader'
import { useCodingStudents } from '../api/coding.api'

export function CodingFollowPage() {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useCodingStudents()
  return (
    <>
      <PageHeader title={t('coding.followTitle')} description={t('coding.followSubtitle')} />
      <CodingFollowView
        rows={data}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        studentHref={(id) => `/admin/coding/${id}`}
      />
    </>
  )
}
