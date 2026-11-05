import { ChevronRight, Code2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/shared/Misc'
import { SearchInput } from '@/components/shared/SearchInput'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/shared/States'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/input'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { formatDateTime } from '@/core/lib/format'
import { fullName } from '@/core/lib/utils'
import type { CodeTrack, CodingStudentRow } from './types'

interface Props {
  rows: CodingStudentRow[] | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  studentHref: (id: string) => string
}

const TRACKS: CodeTrack[] = ['BASES', 'TROIS_SI', 'BAC_INFO', 'BAC_ECO']

/** Suivi Coder (admin / enseignant) : avancement de chaque eleve dans son parcours. */
export function CodingFollowView({ rows, isLoading, isError, onRetry, studentHref }: Props) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [track, setTrack] = useState('')

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (rows ?? []).filter(
      (r) => (!track || r.track === track) && (!q || fullName(r.user).toLowerCase().includes(q)),
    )
  }, [rows, search, track])

  if (isLoading) return <TableSkeleton />
  if (isError) return <ErrorState onRetry={onRetry} />

  return (
    <Card>
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} className="sm:max-w-xs" />
        <Select value={track} onChange={(e) => setTrack(e.target.value)} className="sm:max-w-xs">
          <option value="">{t('coding.allTracks')}</option>
          {TRACKS.map((tr) => (
            <option key={tr} value={tr}>
              {t(`coding.track_${tr}`)}
            </option>
          ))}
        </Select>
      </div>
      {visible.length === 0 ? (
        <EmptyState icon={Code2} title={t('coding.noStudents')} />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>{t('coding.student')}</TH>
              <TH className="hidden md:table-cell">{t('coding.track')}</TH>
              <TH>{t('coding.completed')}</TH>
              <TH className="hidden sm:table-cell">{t('coding.stars')}</TH>
              <TH className="hidden lg:table-cell">{t('coding.lastActivity')}</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {visible.map((r) => (
              <TR key={r.id}>
                <TD>
                  <Link to={studentHref(r.id)} className="flex items-center gap-3 font-medium hover:text-primary">
                    <Avatar user={r.user} />
                    <span className="min-w-0">
                      <span className="block truncate">{fullName(r.user)}</span>
                      <span className="block text-xs font-normal text-muted-foreground">
                        {r.level} {r.section}
                      </span>
                    </span>
                  </Link>
                </TD>
                <TD className="hidden md:table-cell">{t(`coding.track_${r.track}`)}</TD>
                <TD>
                  <div className="flex min-w-24 flex-col gap-1">
                    <span className="text-xs font-medium">
                      {r.completed} / {r.totalLevels}
                    </span>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-success"
                        style={{ width: `${r.totalLevels ? (r.completed / r.totalLevels) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </TD>
                <TD className="hidden sm:table-cell">⭐ {r.stars}</TD>
                <TD className="hidden text-muted-foreground lg:table-cell">
                  {r.lastActivity ? formatDateTime(r.lastActivity) : t('coding.never')}
                </TD>
                <TD>
                  <Link to={studentHref(r.id)} aria-label={fullName(r.user)}>
                    <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" />
                  </Link>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </Card>
  )
}
