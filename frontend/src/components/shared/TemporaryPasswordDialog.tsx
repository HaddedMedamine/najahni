import { Check, Copy, KeyRound } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/** Affiche une seule fois le mot de passe temporaire genere par l'API. */
export function TemporaryPasswordDialog({
  password,
  onClose,
}: {
  password: string | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (!password) return
    await navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Dialog open={password !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-5 text-primary" />
            {t('account.tempPasswordTitle')}
          </DialogTitle>
          <DialogDescription>{t('account.tempPasswordText')}</DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-5">
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-primary bg-primary-soft/40 p-3">
            <code dir="ltr" className="flex-1 text-center font-mono text-lg tracking-wider">
              {password}
            </code>
            <Button variant="ghost" size="icon" onClick={copy} aria-label={t('common.copy')}>
              {copied ? <Check className="text-success" /> : <Copy />}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>{t('common.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
