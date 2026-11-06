import { Plus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import type { ElementType, TdoRow, TdoType } from '@/core/algo/transpile'

const TYPES: TdoType[] = ['Entier', 'Réel', 'Booléen', 'Caractère', 'Chaîne', 'Tableau', 'Fichier']
const ELEMENTS: ElementType[] = ['Entier', 'Réel', 'Booléen', 'Caractère', 'Chaîne']

interface Props {
  rows: TdoRow[]
  onChange: (rows: TdoRow[]) => void
  readOnly?: boolean
}

/** Tableau de declaration des objets (obligatoire pour executer un algorithme). */
export function TdoEditor({ rows, onChange, readOnly }: Props) {
  const { t } = useTranslation()
  const update = (index: number, patch: Partial<TdoRow>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))

  return (
    <div className="flex flex-col gap-2" dir="ltr">
      <p className="text-sm font-semibold">{t('coding.tdo')}</p>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs text-muted-foreground">
            <tr>
              <th className="px-2 py-1.5 text-start font-medium">{t('coding.tdoObject')}</th>
              <th className="px-2 py-1.5 text-start font-medium">{t('coding.tdoType')}</th>
              {!readOnly && <th className="w-8" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row, i) => (
              <tr key={i}>
                <td className="p-1.5 align-top">
                  {readOnly ? (
                    <span className="font-mono">{row.name}</span>
                  ) : (
                    <Input
                      value={row.name}
                      onChange={(e) => update(i, { name: e.target.value.replace(/\s/g, '') })}
                      className="h-8 font-mono"
                      aria-label={t('coding.tdoObject')}
                    />
                  )}
                </td>
                <td className="p-1.5">
                  {readOnly ? (
                    <span>
                      {t(`coding.type_${row.type}`)}
                      {row.type === 'Tableau' && ` (${row.size ?? '?'} × ${t(`coding.type_${row.elem ?? 'Entier'}`)})`}
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      <Select
                        value={row.type}
                        onChange={(e) => {
                          const type = e.target.value as TdoType
                          update(i, type === 'Tableau' ? { type, elem: row.elem ?? 'Entier', size: row.size ?? 50 } : { type, elem: undefined, size: undefined })
                        }}
                        className="h-8 w-auto min-w-28 text-xs"
                        aria-label={t('coding.tdoType')}
                      >
                        {TYPES.map((type) => (
                          <option key={type} value={type}>
                            {t(`coding.type_${type}`)}
                          </option>
                        ))}
                      </Select>
                      {row.type === 'Tableau' && (
                        <>
                          <Input
                            type="number"
                            min={1}
                            max={1000}
                            value={row.size ?? 50}
                            onChange={(e) => update(i, { size: Math.max(1, Number(e.target.value) || 1) })}
                            className="h-8 w-20 text-xs"
                            aria-label={t('coding.tdoSize')}
                          />
                          <Select
                            value={row.elem ?? 'Entier'}
                            onChange={(e) => update(i, { elem: e.target.value as ElementType })}
                            className="h-8 w-auto text-xs"
                            aria-label={t('coding.tdoElem')}
                          >
                            {ELEMENTS.map((type) => (
                              <option key={type} value={type}>
                                {t(`coding.type_${type}`)}
                              </option>
                            ))}
                          </Select>
                        </>
                      )}
                    </div>
                  )}
                </td>
                {!readOnly && (
                  <td className="p-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => onChange(rows.filter((_, j) => j !== i))}
                      className="rounded-md p-1 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                      aria-label={t('coding.tdoRemove')}
                    >
                      <X className="size-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-3 text-xs text-muted-foreground">
                  {t('coding.tdoEmpty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {!readOnly && (
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => onChange([...rows, { name: '', type: 'Entier' }])}
        >
          <Plus />
          {t('coding.tdoAdd')}
        </Button>
      )}
    </div>
  )
}
