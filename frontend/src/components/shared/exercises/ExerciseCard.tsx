import { FileImage, FileText, FileType2, Loader2 } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { getErrorMessage } from '@/core/api/errors'
import type { Exercise, ExerciseFile } from '@/core/api/types'
import { fileKind, formatSize, openFile } from '@/core/lib/files'
import { formatDate } from '@/core/lib/format'
import { cn, fullName } from '@/core/lib/utils'

const KIND = {
  pdf: { icon: FileText, className: 'bg-danger-soft text-danger' },
  image: { icon: FileImage, className: 'bg-success-soft text-success' },
  word: { icon: FileType2, className: 'bg-primary-soft text-primary' },
}

interface Props {
  exercise: Exercise
  /** URL de telechargement d'un fichier (differente pour l'enseignant et l'eleve) */
  fileUrl: (exerciseId: string, fileId: string) => string
  /** Vue eleve : afficher l'enseignant */
  showAuthor?: boolean
  actions?: ReactNode
}

/** Un exercice : titre, consignes, groupes et fichiers a ouvrir. */
export function ExerciseCard({ exercise, fileUrl, showAuthor, actions }: Props) {
  const { t } = useTranslation()
  const [opening, setOpening] = useState<string | null>(null)

  const open = async (file: ExerciseFile) => {
    setOpening(file.id)
    try {
      await openFile(fileUrl(exercise.id, file.id), file)
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setOpening(null)
    }
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{exercise.title}</p>
          <p className="text-sm text-muted-foreground">
            {exercise.subject} · {exercise.level} · {formatDate(exercise.createdAt)}
            {showAuthor && ` · ${fullName(exercise.author.user)}`}
          </p>
        </div>
        {actions}
      </div>

      {exercise.description && <p className="whitespace-pre-line text-sm">{exercise.description}</p>}

      <ul className="flex flex-col gap-2">
        {exercise.attachments.map((file) => {
          const kind = KIND[fileKind(file.mimeType)]
          const Icon = kind.icon
          return (
            <li key={file.id}>
              <button
                type="button"
                onClick={() => open(file)}
                disabled={opening === file.id}
                className="flex w-full items-center gap-3 rounded-2xl border border-border px-3 py-2.5 text-start transition-colors hover:border-primary/30 hover:bg-primary-soft/40"
              >
                <span className={cn('rounded-xl p-2', kind.className)}>
                  {opening === file.id ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium" dir="auto">
                    {file.fileName}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatSize(file.size)}</span>
                </span>
                <span className="text-xs font-semibold text-primary">{t('exercises.open')}</span>
              </button>
            </li>
          )
        })}
      </ul>

      {exercise.groups.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {exercise.groups.map((g) => (
            <Badge key={g.id} variant="primary">
              {g.name}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  )
}
