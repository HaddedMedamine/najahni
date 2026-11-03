import { AlertCircle, Clock, Moon, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { StatCard } from '@/components/shared/Misc'
import { PageHeader } from '@/components/shared/PageHeader'
import { CardsSkeleton, ErrorState } from '@/components/shared/States'
import { Card } from '@/components/ui/card'
import { useWhatsappStatus } from '../api/whatsapp.api'
import { WhatsappConnectionCard } from '../components/whatsapp/WhatsappConnectionCard'
import { WhatsappMessagesCard } from '../components/whatsapp/WhatsappMessagesCard'

export function WhatsappPage() {
  const { t } = useTranslation()
  const status = useWhatsappStatus()

  return (
    <>
      <PageHeader title={t('whatsapp.title')} description={t('whatsapp.subtitle')} />

      {status.isError ? (
        <ErrorState onRetry={status.refetch} />
      ) : !status.data ? (
        <CardsSkeleton count={3} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <WhatsappConnectionCard status={status.data} />
            </div>

            {/* Regles d'envoi */}
            <Card className="flex flex-col gap-4 p-6 lg:col-span-2">
              <p className="font-semibold">{t('whatsapp.rulesTitle')}</p>
              <ul className="flex flex-col gap-3 text-sm">
                <li className="flex gap-3">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" />
                  {t('whatsapp.ruleAbsence')}
                </li>
                <li className="flex gap-3">
                  <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
                  {t('whatsapp.rulePayment', { hour: status.data.quietHours.morning })}
                </li>
                <li className="flex gap-3">
                  <Moon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  {t('whatsapp.ruleNight', status.data.quietHours)}
                </li>
              </ul>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label={t('whatsapp.pending')} value={status.data.stats.pending} icon={Clock} tone="sky" />
            <StatCard
              label={t('whatsapp.sentToday')}
              value={`${status.data.stats.sentToday} / ${status.data.stats.dailyLimit}`}
              icon={Send}
              tone="success"
            />
            <StatCard label={t('whatsapp.failed')} value={status.data.stats.failed} icon={AlertCircle} tone="peach" />
          </div>

          <WhatsappMessagesCard />
        </div>
      )}
    </>
  )
}
