import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/shared/PageHeader'
import { PaymentsOverviewView } from '@/components/shared/payments/PaymentsOverviewView'
import { Select } from '@/components/ui/input'
import { fullName } from '@/core/lib/utils'
import { usePaymentsOverview } from '../api/payments.api'
import { useTeachers } from '../api/teachers.api'

export function PaymentsPage() {
  const { t } = useTranslation()
  const [teacherId, setTeacherId] = useState('')
  const { data, isLoading } = usePaymentsOverview(teacherId || undefined)
  const teachers = useTeachers({ pageSize: 100 })

  return (
    <>
      <PageHeader
        title={t('payments.title')}
        description={t('payments.subtitle')}
        actions={
          <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="sm:w-64">
            <option value="">{t('payments.allTeachers')}</option>
            {teachers.data?.items.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {fullName(teacher.user)}
              </option>
            ))}
          </Select>
        }
      />
      <PaymentsOverviewView
        data={data}
        isLoading={isLoading}
        groupHref={(id) => `/admin/payments/groups/${id}`}
        showTeacher
      />
    </>
  )
}
