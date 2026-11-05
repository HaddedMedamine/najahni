import { ArrowLeft, Code2, Gamepad2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/shared/States'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatDateTime } from '@/core/lib/format'
import { cn, fullName } from '@/core/lib/utils'
import { CodeEditor } from './CodeEditor'
import { Stars } from './Stars'
import { TdoEditor } from './TdoEditor'
import type { CodingStudentDetail } from './types'

interface Props {
  data: CodingStudentDetail | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  backHref: string
}

type CodeTab = 'lastCode' | 'bestCode' | 'solution'

/** Detail Coder d'un eleve : chaque niveau, ses essais et son code. */
export function CodingStudentView({ data, isLoading, isError, onRetry, backHref }: Props) {
  const { t } = useTranslation()
  const [openId, setOpenId] = useState<string | null>(null)
  const [tab, setTab] = useState<CodeTab>('lastCode')

  if (isLoading) return <TableSkeleton />
  if (isError || !data) return <ErrorState onRetry={onRetry} />

  const done = data.levels.filter((l) => l.completedAt).length
  return (
    <>
      <Button variant="ghost" size="sm" className="mb-2" asChild>
        <Link to={backHref}>
          <ArrowLeft className="rtl:rotate-180" />
          {t('coding.followTitle')}
        </Link>
      </Button>
      <PageHeader
        title={fullName(data.student.user)}
        description={`${data.student.level} ${data.student.section}${
          data.track ? ` · ${t(`coding.track_${data.track}`)} · ${t('coding.progress', { done, total: data.levels.length })}` : ''
        }`}
      />
      {data.levels.length === 0 ? (
        <Card>
          <EmptyState icon={Code2} title={t('coding.noTrack')} />
        </Card>
      ) : (
        <Card className="divide-y divide-border">
          {data.levels.map((level) => {
            const open = openId === level.id
            const Icon = level.kind === 'GRID' ? Gamepad2 : Code2
            const shown = level[tab]
            return (
              <div key={level.id}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenId(open ? null : level.id)
                    setTab(level.lastCode ? 'lastCode' : 'solution')
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-start hover:bg-muted/50"
                >
                  <Icon className={cn('size-4 shrink-0', level.completedAt ? 'text-success' : 'text-muted-foreground')} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 truncate text-sm font-medium">
                      {level.title}
                      {level.lastCode && (
                        <Badge>{level.language === 'ALGO' ? t('coding.langAlgo') : t('coding.langPython')}</Badge>
                      )}
                    </span>
                    <span className="block text-xs text-muted-foreground">{level.chapter.title}</span>
                  </span>
                  {level.attempts > 0 ? (
                    <span className="flex flex-col items-end gap-0.5 text-xs text-muted-foreground">
                      {level.completedAt && <Stars value={level.stars} className="text-sm" />}
                      <span>
                        {t('coding.attempts', { count: level.attempts })}
                        {level.updatedAt && ` · ${formatDateTime(level.updatedAt)}`}
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t('coding.notStarted')}</span>
                  )}
                </button>
                {open && (
                  <div className="flex flex-col gap-2 px-4 pb-4">
                    <div className="flex gap-1.5">
                      {(['lastCode', 'bestCode', 'solution'] as const).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setTab(key)}
                          className={cn(
                            'rounded-full border px-3 py-1 text-xs font-medium',
                            tab === key ? 'border-primary bg-primary-soft text-primary' : 'border-border',
                          )}
                        >
                          {t(`coding.${key}`)}
                        </button>
                      ))}
                    </div>
                    {shown ? (
                      <CodeEditor key={`${level.id}-${tab}`} value={shown} readOnly className="max-h-80" />
                    ) : (
                      <p className="text-sm text-muted-foreground">{t('coding.noCode')}</p>
                    )}
                    {tab === 'lastCode' && level.language === 'ALGO' && level.tdo && (
                      <TdoEditor rows={level.tdo} onChange={() => {}} readOnly />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </Card>
      )}
    </>
  )
}
