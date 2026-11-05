import type { ReactNode } from 'react'
import type { RunError } from '@/core/python/engine'
import type { GridOutcome } from '@/core/python/grid'
import { cn } from '@/core/lib/utils'

// Bitou parle en derja (comme dans les cours) quelle que soit la langue de l'interface.

/** Ce que dit Bitou a la fin d'une mission souris. */
export const GRID_MESSAGES: Record<GridOutcome, string> = {
  success: 'Bravo! El fara wselt l darha.',
  bump: 'Aie! El fara tkabbet fi 7it. Chouf win lezemha tdour.',
  cat: 'Ya 7asra, el 9attous klé el fara! Lawwej 3la thniya okhra.',
  nothing: 'ramasser() fi blasa ma fihech fromage! Ichouf 9bal.',
  limit: 'El fara 9a3da tdour fi blasetha... ya3ni el boucle ma toufach. Chouf el condition.',
  'not-home': 'El programme kmal ama el fara mazelt ma wseltech l darha.',
  'cheese-left': 'El fara fel dar, ama fama fromage mazel ma tlammech!',
  error: 'Fama ghalta fel code.',
}

/** Ce que dit Bitou apres "Ouvrir la porte". */
export const DOOR_MESSAGES = {
  locked: 'El bab mazal msakker : ba3dh les tests ma t3addewch. Chouf "Attendu" w "Obtenu" ta7t.',
  algoErrors: "L'algorithme fih ghaltat : sala7hom 9bal (chouf el ligne).",
}

const ERRORS: Record<string, string> = {
  SyntaxError: "Ghalta fel kteba : chouf el ':' fel ekher mta3 if / for / while / def, w el 9aws ( ).",
  IndentationError: 'Ghalta fel espaces (indentation) : el instructions ta7t if / for / while lezem 4 espaces 9eddemhom.',
  NameError: "Esm mouch m3arref : chouf el kteba mta3 el variable wala el fonction (majuscules, accents...).",
  TypeError: 'Type mouch s7i7 : mithel chaine m3a nombre. Ma tensech int(input(...)) ken t7eb nombre.',
  ValueError: "9ima mouch s7i7a : mithel int('abc').",
  ZeroDivisionError: '9assamt 3la 0!',
  IndexError: 'Indice barra el tableau / el chaine : el indices yebdew men 0 7atta n - 1.',
  EOFError: "El programme 7ab ya9ra donnée (input) ama ma fama chay : fel exercice hedha, ekteb ken el fonction, wala zid donnée fel 'Entrées'.",
  KeyError: 'Cle mouch mawjouda.',
  AttributeError: "Fonction mouch mawjouda 3al objet hedha (mithel ch.uper() blaset ch.upper()).",
  RecursionError: 'El fonction t3ayet l rouha bla ma to9ef.',
}

/** Explication en derja d'une erreur Python, suivie du message original. */
export const explainError = (error: RunError) => ERRORS[error.type] ?? 'Fama ghalta fel code.'

export const TIMEOUT_MESSAGE =
  'El programme 5dem barcha w ma kmalch : akid fama boucle ma toufach (while el condition mta3ha dima s7i7a).'

export const SUCCESS_MESSAGES = [
  'Mabrouk! Bitou fa5our bik.',
  'Ya3tik essa7a! Niveau t3adda.',
  'Behi barcha! Kammel hakka.',
]

/** Bitou, le petit robot guide. */
export function BitouAvatar({ className, happy }: { className?: string; happy?: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className={cn('shrink-0', className)} aria-hidden>
      <line x1={24} y1={4} x2={24} y2={10} stroke="#1565c0" strokeWidth={2} />
      <circle cx={24} cy={4} r={2.5} fill="#e5579a" />
      <rect x={8} y={10} width={32} height={26} rx={9} fill="#1565c0" />
      <rect x={12} y={14} width={24} height={16} rx={6} fill="#e3effb" />
      <circle cx={19} cy={21} r={2.6} fill="#0d4a91" />
      <circle cx={29} cy={21} r={2.6} fill="#0d4a91" />
      <path
        d={happy ? 'M18 25 Q 24 31 30 25' : 'M19 26 L 29 26'}
        fill="none"
        stroke="#0d4a91"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <rect x={15} y={37} width={18} height={7} rx={3} fill="#1e94d2" />
      <rect x={4} y={18} width={4} height={10} rx={2} fill="#1e94d2" />
      <rect x={40} y={18} width={4} height={10} rx={2} fill="#1e94d2" />
    </svg>
  )
}

/** Bulle de Bitou (texte en derja, toujours de gauche a droite). */
export function BitouSays({
  children,
  tone = 'info',
  className,
}: {
  children: ReactNode
  tone?: 'info' | 'success' | 'error'
  className?: string
}) {
  return (
    <div className={cn('flex items-start gap-3', className)} dir="ltr">
      <BitouAvatar className="size-10" happy={tone === 'success'} />
      <div
        className={cn(
          'min-w-0 flex-1 rounded-2xl rounded-ss-sm border px-3.5 py-2.5 text-sm whitespace-pre-line',
          tone === 'info' && 'border-primary/20 bg-primary-soft/50',
          tone === 'success' && 'border-success/30 bg-success-soft',
          tone === 'error' && 'border-danger/30 bg-danger-soft',
        )}
      >
        {children}
      </div>
    </div>
  )
}
