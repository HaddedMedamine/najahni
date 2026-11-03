import { Banknote, ChevronRight, GraduationCap, Plus, UserRound, Users, UsersRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { StatCard } from '@/components/shared/Misc'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/core/auth/auth.store'
import { formatMoney } from '@/core/lib/format'
import { useGroups } from '../api/groups.api'
import { useParents } from '../api/parents.api'
import { usePaymentsOverview } from '../api/payments.api'
import { useStudents } from '../api/students.api'
import { useTeachers } from '../api/teachers.api'

// pageSize 1 : seul le total nous interesse
const COUNT_ONLY = { pageSize: 1 }

export function DashboardPage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const students = useStudents(COUNT_ONLY)
  const teachers = useTeachers(COUNT_ONLY)
  const groups = useGroups(COUNT_ONLY)
  const parents = useParents(COUNT_ONLY)
  const payments = usePaymentsOverview()

  return (
    <>
      <PageHeader
        title={t('dashboard.welcome', { name: user?.firstName ?? '' })}
        description={t('dashboard.subtitle')}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('dashboard.students')} value={students.data?.total} loading={students.isLoading} icon={GraduationCap} />
        <StatCard label={t('dashboard.groups')} value={groups.data?.total} loading={groups.isLoading} icon={UsersRound} tone="sky" />
        <StatCard label={t('dashboard.teachers')} value={teachers.data?.total} loading={teachers.isLoading} icon={UserRound} tone="violet" />
        <StatCard label={t('dashboard.parents')} value={parents.data?.total} loading={parents.isLoading} icon={Users} tone="peach" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('dashboard.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              { to: '/admin/students', label: t('students.new'), icon: GraduationCap },
              { to: '/admin/groups', label: t('groups.new'), icon: UsersRound },
              { to: '/admin/teachers', label: t('teachers.new'), icon: UserRound },
              { to: '/admin/parents', label: t('parents.new'), icon: Users },
            ].map(({ to, label, icon: Icon }) => (
              <Button key={to} variant="outline" className="h-auto justify-start py-3" asChild>
                <Link to={to}>
                  <Icon className="text-primary" />
                  {label}
                  <Plus className="ms-auto text-muted-foreground" />
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Resume des paiements du mois en cours (tous groupes) */}
        <Link to="/admin/payments" className="group">
          <Card className="flex h-full flex-col gap-4 p-5 transition-shadow group-hover:shadow-lg">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-success-soft p-3 text-success">
                <Banknote className="size-5" />
              </span>
              <div className="flex-1">
                <p className="font-semibold">{t('payments.title')}</p>
                <p className="text-xs text-muted-foreground">{t('payments.collectedThisMonth')}</p>
              </div>
              <ChevronRight className="size-5 text-muted-foreground rtl:rotate-180" />
            </div>
            {payments.data && (
              <>
                <p className="text-2xl font-semibold tabular-nums">
                  {formatMoney(payments.data.totals.collectedThisMonth)}
                </p>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
                  {payments.data.totals.students > 0 && (
                    <>
                      <div
                        className="bg-success"
                        style={{ width: `${(payments.data.totals.paid / payments.data.totals.students) * 100}%` }}
                      />
                      <div
                        className="bg-danger"
                        style={{ width: `${(payments.data.totals.due / payments.data.totals.students) * 100}%` }}
                      />
                    </>
                  )}
                </div>
                <div className="flex flex-wrap justify-between gap-2 text-sm">
                  <span className="font-semibold text-success">
                    {t('payments.ofTotal', { paid: payments.data.totals.paid, total: payments.data.totals.students })}
                  </span>
                  <span className="font-semibold text-danger">
                    {t('payments.due')} : {payments.data.totals.due} · {formatMoney(payments.data.totals.dueAmount)}
                  </span>
                </div>
              </>
            )}
          </Card>
        </Link>
      </div>
    </>
  )
}
