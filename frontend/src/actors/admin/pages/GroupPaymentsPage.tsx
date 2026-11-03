import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { GroupPaymentsView } from '@/components/shared/payments/GroupPaymentsView'
import { fullName } from '@/core/lib/utils'
import { useGroupPayments, useTogglePayment } from '../api/payments.api'

export function GroupPaymentsPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const query = useGroupPayments(id)
  const toggle = useTogglePayment()

  return (
    <GroupPaymentsView
      data={query.data}
      isLoading={query.isLoading}
      isError={query.isError}
      onRetry={query.refetch}
      backHref="/admin/payments"
      pendingStudentId={toggle.isPending ? (toggle.variables?.studentId ?? null) : null}
      onPay={(row) =>
        toggle.mutate(
          { groupId: id, studentId: row.student.id, paid: true },
          {
            onSuccess: (result) =>
              toast.success(t('payments.markedPaid', { name: fullName(row.student.user), number: result.number }), {
                description: row.dueSeries.length > 1 ? t('payments.stillDue') : undefined,
              }),
          },
        )
      }
      onCancel={(row) =>
        toggle.mutate(
          { groupId: id, studentId: row.student.id, paid: false },
          { onSuccess: () => toast.success(t('payments.cancelled')) },
        )
      }
    />
  )
}
