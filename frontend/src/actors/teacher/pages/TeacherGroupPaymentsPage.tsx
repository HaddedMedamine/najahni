import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { GroupPaymentsView } from '@/components/shared/payments/GroupPaymentsView'
import { fullName } from '@/core/lib/utils'
import { useTeacherGroupPayments, useTeacherTogglePayment } from '../api/payments.api'

export function TeacherGroupPaymentsPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const query = useTeacherGroupPayments(id)
  const toggle = useTeacherTogglePayment()

  return (
    <GroupPaymentsView
      data={query.data}
      isLoading={query.isLoading}
      isError={query.isError}
      onRetry={query.refetch}
      backHref="/teacher/payments"
      pendingStudentId={toggle.isPending ? (toggle.variables?.studentId ?? null) : null}
      onPay={(row) =>
        toggle.mutate(
          { groupId: id, studentId: row.student.id, paid: true },
          {
            onSuccess: (result) =>
              toast.success(t('payments.markedPaid', { name: fullName(row.student.user), number: result.number }), {
                // Plusieurs series en retard : il en reste a regler
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
