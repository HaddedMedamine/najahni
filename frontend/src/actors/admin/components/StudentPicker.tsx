import { Check } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SearchInput } from '@/components/shared/SearchInput'
import { Avatar } from '@/components/shared/Misc'
import { cn, fullName, useDebounce } from '@/core/lib/utils'
import { useStudents } from '../api/students.api'

interface Props {
  selected: string[]
  onChange: (ids: string[]) => void
  /** Eleves a masquer (deja dans le groupe, deja lies...). */
  excludeIds?: string[]
  multiple?: boolean
}

/** Recherche et selection d'eleves actifs. */
export function StudentPicker({ selected, onChange, excludeIds = [], multiple = true }: Props) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search)
  const { data, isLoading } = useStudents({ search: debounced || undefined, pageSize: 8 })

  const students = (data?.items ?? []).filter((s) => !excludeIds.includes(s.id))

  const toggle = (id: string) => {
    if (!multiple) return onChange(selected[0] === id ? [] : [id])
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])
  }

  return (
    <div className="flex flex-col gap-2">
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder={t('picker.searchStudents')}
        className="sm:w-full"
      />
      <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
        {isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">{t('common.loading')}</p>
        ) : students.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">{t('common.noResults')}</p>
        ) : (
          students.map((s) => {
            const isSelected = selected.includes(s.id)
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => toggle(s.id)}
                className={cn(
                  'flex w-full items-center gap-3 border-b border-border px-3 py-2 text-start last:border-0 hover:bg-muted',
                  isSelected && 'bg-primary-soft/50',
                )}
              >
                <Avatar user={s.user} className="size-8" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{fullName(s.user)}</span>
                  <span className="block text-xs text-muted-foreground">
                    {s.level} {s.section} · <span dir="ltr">{s.user.phone ?? s.user.email}</span>
                  </span>
                </span>
                <span
                  className={cn(
                    'flex size-5 items-center justify-center rounded border',
                    isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                    !multiple && 'rounded-full',
                  )}
                >
                  {isSelected && <Check className="size-3.5" />}
                </span>
              </button>
            )
          })
        )}
      </div>
      {multiple && selected.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {t('picker.selected', { count: selected.length })}
        </p>
      )}
    </div>
  )
}
