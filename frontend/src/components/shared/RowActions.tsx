import { MoreHorizontal, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface RowAction {
  label: string
  icon: LucideIcon
  onSelect: () => void
  destructive?: boolean
  hidden?: boolean
}

/** Menu "..." d'une ligne de tableau. Les actions destructives sont separees en bas. */
export function RowActions({ actions }: { actions: RowAction[] }) {
  const { t } = useTranslation()
  const visible = actions.filter((a) => !a.hidden)
  const normal = visible.filter((a) => !a.destructive)
  const destructive = visible.filter((a) => a.destructive)

  const renderItem = ({ label, icon: Icon, onSelect, destructive }: RowAction) => (
    <DropdownMenuItem key={label} destructive={destructive} onSelect={onSelect}>
      <Icon />
      {label}
    </DropdownMenuItem>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('common.actions')}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {normal.map(renderItem)}
        {normal.length > 0 && destructive.length > 0 && <DropdownMenuSeparator />}
        {destructive.map(renderItem)}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
