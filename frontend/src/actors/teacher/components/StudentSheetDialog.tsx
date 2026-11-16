import { useState } from 'react'
import { ErrorState, TableSkeleton } from '@/components/shared/States'
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { PersonName } from '@/core/api/types'
import { fullName } from '@/core/lib/utils'
import { useTeacherGroupSheet } from '../api/payments.api'
import { MonthFilter, PresenceCounts, PresenceDates, SheetLegend } from './SheetParts'

interface Props {
  groupId: string
  student: { id: string; user: PersonName }
  onClose: () => void
}

/** Les seances d'un eleve dans le groupe, payees ou non. */
export function StudentSheetDialog({ groupId, student, onClose }: Props) {
  const [month, setMonth] = useState<string>()
  const sheet = useTeacherGroupSheet(groupId, month)
  const presences = sheet.data?.rows.find((r) => r.student.id === student.id)?.presences ?? []

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{fullName(student.user)}</DialogTitle>
          <PresenceCounts presences={presences} />
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4 pb-5">
          {sheet.isError ? (
            <ErrorState onRetry={() => void sheet.refetch()} />
          ) : !sheet.data ? (
            <TableSkeleton rows={2} />
          ) : (
            <>
              <MonthFilter months={sheet.data.months} month={month} onChange={setMonth} />
              <SheetLegend />
              <PresenceDates presences={presences} />
            </>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
