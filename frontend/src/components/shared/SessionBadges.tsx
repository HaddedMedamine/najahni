import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import type { AttendanceStatus, SessionStatus } from '@/core/api/types'

const SESSION_VARIANT = {
  PLANNED: 'primary',
  IN_PROGRESS: 'warning',
  DONE: 'success',
  CANCELLED: 'default',
} as const

const ATTENDANCE_VARIANT = {
  PRESENT: 'success',
  ABSENT: 'danger',
  LATE: 'warning',
  EXCUSED: 'default',
} as const

export function SessionStatusBadge({ status }: { status: SessionStatus }) {
  const { t } = useTranslation()
  return <Badge variant={SESSION_VARIANT[status]}>{t(`sessionStatus.${status}`)}</Badge>
}

export function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  const { t } = useTranslation()
  return <Badge variant={ATTENDANCE_VARIANT[status]}>{t(`attendanceStatus.${status}`)}</Badge>
}
