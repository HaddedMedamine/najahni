import { AlertCircle, Banknote, ChevronRight, CircleCheck, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { groupColor } from '@/components/shared/Calendar'
import { StatCard } from '@/components/shared/Misc'
import { CardsSkeleton, EmptyState } from '@/components/shared/States'
import { Card } from '@/components/ui/card'
import type { PaymentsOverview } from '@/core/api/types'
import { formatMoney } from '@/core/lib/format'
import { fullName } from '@/core/lib/utils'

interface Props {
  data: PaymentsOverview | undefined
  isLoading: boolean
  groupHref: (groupId: string) => string
  /** Afficher l'enseignant de chaque groupe (vue admin). */
  showTeacher?: boolean
}

/** Tableau de bord des paiements : totaux + une carte par groupe. */
export function PaymentsOverviewView({ data, isLoading, groupHref, showTeacher }: Props) {
  const { t } = useTranslation()

  if (isLoading || !data) return <CardsSkeleton count={4} />

  const { totals, items } = data
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('payments.collectedThisMonth')} value={formatMoney(totals.collectedThisMonth)} icon={Banknote} tone="success" />
        <StatCard label={t('payments.dueAmount')} value={formatMoney(totals.dueAmount)} icon={Wallet} tone="peach" />
        <StatCard label={t('payments.paidStudents')} value={`${totals.paid} / ${totals.students}`} icon={CircleCheck} tone="sky" />
        <StatCard label={t('payments.dueStudents')} value={totals.due} icon={AlertCircle} tone="peach" />
      </div>

      {items.length === 0 ? (
        <Card>
          <EmptyState icon={Wallet} title={t('payments.noGroups')} />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map(({ group, ...s }) => (
            <Link key={group.id} to={groupHref(group.id)} className="group">
              <Card className="flex h-full flex-col gap-4 p-5 transition-shadow group-hover:shadow-lg">
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-10 w-1.5 shrink-0 rounded-full" style={{ background: groupColor(group.id) }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{group.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {group.subject} · {t('payments.perSeries', { amount: formatMoney(group.monthlyFee), size: group.monthlySessions })}
                    </p>
                    {showTeacher && (
                      <p className="text-xs text-muted-foreground">
                        {t('payments.teacher', { name: fullName(group.teacher.user) })}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground rtl:rotate-180" />
                </div>

                {/* Repartition payes / a payer / non payes */}
                <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
                  {s.students > 0 && (
                    <>
                      <div className="bg-success" style={{ width: `${(s.paid / s.students) * 100}%` }} />
                      <div className="bg-danger" style={{ width: `${(s.due / s.students) * 100}%` }} />
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-success-soft px-2.5 py-1 text-success">
                    {t('payments.paid')} : {s.paid}
                  </span>
                  <span className="rounded-full bg-danger-soft px-2.5 py-1 text-danger">
                    {t('payments.due')} : {s.due}
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                    {t('payments.pending')} : {s.pending}
                  </span>
                </div>
                {s.dueAmount > 0 && (
                  <p className="text-sm text-danger">
                    {t('payments.dueAmount')} : <span className="font-semibold tabular-nums">{formatMoney(s.dueAmount)}</span>
                  </p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
