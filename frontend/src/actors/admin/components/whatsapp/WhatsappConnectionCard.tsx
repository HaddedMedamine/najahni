import { CircleCheck, Loader2, LogOut, Send, Smartphone, TriangleAlert } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { WhatsappStatus } from '@/core/api/types'
import { useWhatsappConnect, useWhatsappLogout, useWhatsappTest } from '../../api/whatsapp.api'

/** Lier le telephone du centre (QR code), voir l'etat, envoyer un test. */
export function WhatsappConnectionCard({ status }: { status: WhatsappStatus }) {
  const { t } = useTranslation()
  const connect = useWhatsappConnect()
  const logout = useWhatsappLogout()
  const test = useWhatsappTest()
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [phone, setPhone] = useState('')

  const sendTest = (e: FormEvent) => {
    e.preventDefault()
    test.mutate(phone, { onSuccess: () => toast.success(t('whatsapp.testSent')) })
  }

  return (
    <Card className="flex flex-col gap-5 p-6">
      {status.state === 'CONNECTED' && (
        <>
          <div className="flex items-center gap-4">
            <span className="rounded-2xl bg-success-soft p-3.5 text-success">
              <CircleCheck className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-success">{t('whatsapp.connected')}</p>
              <p className="text-sm text-muted-foreground" dir="ltr">
                {status.phone}
                {status.name && ` · ${status.name}`}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setConfirmLogout(true)}>
              <LogOut />
              {t('whatsapp.logout')}
            </Button>
          </div>
          <form onSubmit={sendTest} className="flex flex-col gap-2 border-t border-border pt-5">
            <label htmlFor="wa-test" className="text-sm font-medium">
              {t('whatsapp.testLabel')}
            </label>
            <div className="flex gap-2">
              <Input
                id="wa-test"
                dir="ltr"
                inputMode="tel"
                placeholder="+216 95 123 456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Button type="submit" loading={test.isPending} disabled={phone.trim().length < 8}>
                <Send />
                {t('whatsapp.testSend')}
              </Button>
            </div>
          </form>
        </>
      )}

      {status.state === 'QR' && status.qr && (
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <img
            src={status.qr}
            alt={t('whatsapp.qrAlt')}
            className="size-56 shrink-0 rounded-2xl border border-border bg-white p-2"
          />
          <div className="flex flex-col gap-3">
            <p className="font-semibold">{t('whatsapp.scanTitle')}</p>
            <ol className="flex list-decimal flex-col gap-1.5 ps-5 text-sm text-muted-foreground">
              <li>{t('whatsapp.step1')}</li>
              <li>{t('whatsapp.step2')}</li>
              <li>{t('whatsapp.step3')}</li>
            </ol>
            <p className="text-xs text-muted-foreground">{t('whatsapp.qrRefresh')}</p>
          </div>
        </div>
      )}

      {(status.state === 'CONNECTING' || (status.state === 'QR' && !status.qr)) && (
        <div className="flex items-center gap-3 py-6 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          {t('whatsapp.connecting')}
        </div>
      )}

      {status.state === 'DISCONNECTED' && (
        <div className="flex flex-col items-start gap-4">
          <div className="flex items-center gap-4">
            <span className="rounded-2xl bg-muted p-3.5 text-muted-foreground">
              <Smartphone className="size-6" />
            </span>
            <div>
              <p className="font-semibold">{t('whatsapp.disconnected')}</p>
              <p className="text-sm text-muted-foreground">{t('whatsapp.disconnectedHint')}</p>
            </div>
          </div>
          {status.lastError && (
            <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{status.lastError}</p>
          )}
          <Button loading={connect.isPending} onClick={() => connect.mutate()}>
            <Smartphone />
            {t('whatsapp.connect')}
          </Button>
        </div>
      )}

      <p className="flex gap-2 rounded-xl bg-warning-soft px-3 py-2.5 text-xs text-warning">
        <TriangleAlert className="size-4 shrink-0" />
        {t('whatsapp.risk')}
      </p>

      <ConfirmDialog
        open={confirmLogout}
        onOpenChange={setConfirmLogout}
        title={t('whatsapp.logoutTitle')}
        description={t('whatsapp.logoutText')}
        confirmLabel={t('whatsapp.logout')}
        destructive
        loading={logout.isPending}
        onConfirm={() => logout.mutate(undefined, { onSuccess: () => setConfirmLogout(false) })}
      />
    </Card>
  )
}
