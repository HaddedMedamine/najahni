import { Compass } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-primary-soft p-4">
        <Compass className="size-8 text-primary" />
      </div>
      <h1 className="text-2xl font-semibold">{t('errors.notFound')}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{t('errors.notFoundText')}</p>
      <Button asChild>
        <Link to="/">{t('errors.goHome')}</Link>
      </Button>
    </div>
  )
}
