import type { CodeTrack } from '../../generated/prisma/client.js';

/** Ligne du TDO (meme format que frontend/src/core/algo/transpile.ts). */
export interface TdoRow {
  name: string;
  type: 'Entier' | 'Réel' | 'Booléen' | 'Caractère' | 'Chaîne' | 'Tableau';
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
}

/** Porte du jeu "Portes du code" : reponse en algorithme (avec TDO) ou en Python. */
export interface DoorData {
  tests: PythonTest[];
  /** Ce que le bon programme ouvre : une porte ou un coffre (cle a la fin du chapitre). */
  scene: 'door' | 'chest';
  /** `solution` et `tdo` restent caches a l'eleve. */
  algo: { starter: string; solution: string; tdo: TdoRow[] };
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
  | (PackLevelBase & { kind: 'PYTHON'; data: DoorData });

export interface PackChapter {
  slug: string;
  /** null = tous les parcours. */
  track: CodeTrack | null;
  kind: PackLevel['kind'];
  title: string;
  description: string;
  levels: PackLevel[];
}
