import type { CodeTrack } from '../../generated/prisma/client.js';

/** Ligne du TDO (meme format que frontend/src/core/algo/transpile.ts). */
export interface TdoRow {
  name: string;
  type:
    | 'Entier'
    | 'Réel'
    | 'Booléen'
    | 'Caractère'
    | 'Chaîne'
    | 'Tableau'
    | 'Fichier';
  elem?: 'Entier' | 'Réel' | 'Booléen' | 'Caractère' | 'Chaîne';
  size?: number;
}

/** Grille de la souris (meme format que frontend/src/core/python/grid.ts). */
export interface GridWorld {
  /** `#` mur, `.` vide, `S` depart, `H` maison, `C` fromage, `X` chat */
  map: string[];
  dir?: 'N' | 'E' | 'S' | 'W';
}

/** Mission du jeu "Mission souris". */
export interface GridData {
  /** Le meme code doit reussir sur chaque grille (empeche de coder les pas a la main). */
  worlds: GridWorld[];
  /** Lignes de code max pour 3 etoiles, puis pour 2 etoiles. */
  stars: [number, number];
}

/** Test d'un exercice (voir TestCase dans frontend/src/core/python/engine.ts). */
export interface PythonTest {
  expr?: string;
  setup?: string;
  expected?: string;
  inputs?: string[];
  output?: string[];
  numbers?: string[];
  hidden?: boolean;
  files?: Record<string, string>;
  closed?: boolean;
  label?: string;
}

/** Porte du jeu "Portes du code" : reponse en algorithme (avec TDO) ou en Python. */
export interface DoorData {
  tests: PythonTest[];
  /** Ce que le bon programme ouvre : une porte ou un coffre (cle a la fin du chapitre). */
  scene: 'door' | 'chest';
  /** `solution` et `tdo` restent caches a l'eleve. */
  algo: { starter: string; solution: string; tdo: TdoRow[] };
}

/** Operation rejouee par une scene (voir TraceEvent dans frontend/src/core/python/engine.ts). */
export type TraceEvent =
  | { t: 'get'; i: number }
  | { t: 'set'; i: number; v: number }
  | { t: 'open'; file: string; mode: string }
  | { t: 'write'; file: string; text: string }
  | { t: 'read'; file: string; text: string }
  | { t: 'eof'; file: string }
  | { t: 'close'; file: string };

/** Decor d'une mission et son etat de depart. */
export type StoryStage =
  | { type: 'penguins'; values: number[]; target: 'asc' | 'desc' }
  | { type: 'shop'; bags: Record<string, string[]> };

/** Mission du jeu "Aventure Bac" : une porte, avec objectif, principe et animation. */
export interface StoryData extends DoorData {
  story: {
    stage: StoryStage;
    /** Ce qu'on veut obtenir, dit simplement. */
    objective: string;
    /** Comment ca marche : le principe, pas le code. */
    principle: string[];
    /** Petite video d'introduction : chaque etape parle puis joue ses evenements. */
    intro: { say: string; events: TraceEvent[] }[];
    /**
     * Premiere mission d'un chapitre : le corrige, que l'eleve ouvre s'il le veut.
     * L'editeur reste vide : c'est lui qui ecrit le programme.
     */
    solved?: {
      python: string;
      algo: string;
      tdo: TdoRow[];
      notes: { code: string; why: string }[];
    };
  };
}

interface PackLevelBase {
  /** Identifiant stable : la progression des eleves y est rattachee. */
  slug: string;
  title: string;
  statement: string;
  bitou: string;
  starterCode: string;
  /** Visible des enseignants seulement. */
  solution: string;
  /** Des pistes, jamais la reponse (verifie par content.spec.ts). */
  hints: string[];
}

export type PackLevel =
  | (PackLevelBase & { kind: 'GRID'; data: GridData })
  | (PackLevelBase & { kind: 'PYTHON'; data: DoorData })
  | (PackLevelBase & { kind: 'STORY'; data: StoryData });

export interface PackChapter {
  slug: string;
  /** null = tous les parcours. */
  track: CodeTrack | null;
  kind: PackLevel['kind'];
  title: string;
  description: string;
  levels: PackLevel[];
}
