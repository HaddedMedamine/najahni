import { Archive } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/core/lib/utils'

export function ArchivedToggle({
  value,
  onChange,
}: {
  value: boolean
  onChange: (value: boolean) => void
}) {
  const { t } = useTranslation()
  return (
    <Button
      variant="outline"
      aria-pressed={value}
      onClick={() => onChange(!value)}
      className={cn(value && 'border-warning bg-warning-soft text-warning hover:bg-warning-soft')}
    >
      <Archive />
      {t('common.showArchived')}
    </Button>
  )
}
