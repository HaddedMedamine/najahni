import type { PersonName } from '@/core/api/types'
import type { TdoRow } from '@/core/algo/transpile'
import type { TestCase, TraceEvent } from '@/core/python/engine'
import type { GridWorld } from '@/core/python/grid'

export type CodeTrack = 'BASES' | 'TROIS_SI' | 'BAC_INFO' | 'BAC_ECO'
export type CodeLanguage = 'PYTHON' | 'ALGO'
/** Le jeu d'un niveau : GRID = Mission souris, PYTHON = Portes du code, STORY = Aventure Bac. */
export type CodeLevelKind = 'GRID' | 'PYTHON' | 'STORY'

/** Mission souris : le meme code doit reussir sur chaque grille. */
export interface GridData {
  worlds: GridWorld[]
  /** Lignes max pour 3 etoiles, puis 2 etoiles. */
  stars: [number, number]
}

/** Portes du code : reponse en algorithme (avec TDO) ou en Python. */
export interface DoorData {
  tests: TestCase[]
  /** Ce que le bon programme ouvre. */
  scene: 'door' | 'chest'
  algo: { starter: string }
}

/** Decor d'une mission de l'Aventure Bac et son etat de depart. */
export type StoryStage =
  | { type: 'penguins'; values: number[]; target: 'asc' | 'desc' }
  | { type: 'shop'; bags: Record<string, string[]> }
  | { type: 'cards'; title: string; fields: string[]; count: number }
  | { type: 'cinema'; rows: number[][]; mode: 'seats' | 'numbers' }
  | { type: 'archive'; drawers: Record<string, string[]> }
  | { type: 'dolls' }
  | { type: 'stairs'; length: number }
  | { type: 'machine'; vars: string[] }
  | { type: 'target'; variable: string; exact: number; min: number; max: number }

/** Aventure Bac : une porte, avec objectif, principe et animation. */
export interface StoryData extends DoorData {
  story: {
    stage: StoryStage
    objective: string
    principle: string[]
    /** Petite video d'introduction : chaque etape parle puis joue ses evenements. */
    intro: { say: string; events: TraceEvent[] }[]
    /** Premiere mission d'un chapitre : le corrige, que l'eleve ouvre s'il le veut. */
    solved?: { python: string; algo: string; tdo: TdoRow[]; notes: { code: string; why: string }[] }
  }
}

/** Avancement d'un eleve (liste de suivi admin / enseignant). */
export interface CodingStudentRow {
  id: string
  level: string
  section: string
  user: PersonName & { lastLoginAt: string | null }
  track: CodeTrack
  totalLevels: number
  completed: number
  stars: number
  lastActivity: string | null
}

/** Detail d'un eleve : chaque niveau de son parcours. */
export interface CodingStudentDetail {
  student: { id: string; level: string; section: string; user: PersonName }
  track: CodeTrack | null
  levels: {
    id: string
    title: string
    kind: CodeLevelKind
    solution: string
    chapter: { title: string }
    stars: number
    attempts: number
    completedAt: string | null
    lastCode: string | null
    language: CodeLanguage
    tdo: TdoRow[] | null
    bestCode: string | null
    updatedAt: string | null
  }[]
}
