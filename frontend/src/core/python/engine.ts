// Moteur d'execution : relie Pyodide (Python compile en WebAssembly) au harness Python.
// Utilise dans le Web Worker (navigateur) et dans les tests du contenu (Node),
// d'ou l'absence d'alias "@/".
import type { PyodideAPI } from 'pyodide'
import {
  GRID_COMMANDS,
  GRID_SENSORS,
  type GridAction,
  type GridFrame,
  type GridOutcome,
  GridSimulation,
  type GridWorld,
} from './grid.ts'
import { HARNESS } from './harness.ts'

export interface RunError {
  /** Type Python : NameError, SyntaxError... */
  type: string
  message: string
  /** Ligne du code execute, si connue. */
  line: number | null
}

export interface GridWorldRun {
  frames: GridFrame[]
  outcome: GridOutcome
}

export interface GridRun {
  /** Un resultat par grille : le meme code doit reussir sur toutes. */
  worlds: GridWorldRun[]
  success: boolean
  stdout: string
  error: RunError | null
}

/**
 * Un test d'exercice :
 * - appel : `expr` est evalue apres le code (et `setup`), compare a `expected` ;
 * - programme : lance avec `inputs` ; chaque texte de `output` doit etre affiche,
 *   ou (avec `numbers`) les nombres affiches doivent contenir ceux attendus, dans l'ordre.
 */
export interface TestCase {
  expr?: string
  setup?: string
  expected?: string
  inputs?: string[]
  output?: string[]
  numbers?: string[]
  /** Test cache : l'eleve voit seulement s'il passe. */
  hidden?: boolean
}

export interface TestResult {
  ok: boolean
  got?: string
  stdout: string
  error: RunError | null
}

export interface FreeRun {
  stdout: string
  error: RunError | null
}

export type Engine = Awaited<ReturnType<typeof createEngine>>

export async function createEngine(pyodide: PyodideAPI) {
  // La grille en cours : le module Python `_jeu` lui transmet chaque instruction
  let current: GridSimulation | null = null
  pyodide.registerJsModule('_jeu', {
    act: (action: GridAction, line?: number) => (current ? current.act(action, line ?? null) : 'stop'),
  })
  // Les print passent par le harness ; on coupe la console du navigateur
  pyodide.setStdout({ batched: () => {} })
  pyodide.setStderr({ batched: () => {} })
  pyodide.runPython(HARNESS)

  const call = <T>(name: string, ...args: string[]): T => {
    const fn = pyodide.globals.get(name)
    try {
      return JSON.parse(fn(...args)) as T
    } finally {
      fn.destroy()
    }
  }

  /** Charge numpy / pandas si le code les importe (fichiers servis avec l'application). */
  const prepare = (code: string) => pyodide.loadPackagesFromImports(code, { messageCallback: () => {} })

  return {
    async runGrid(code: string, worlds: GridWorld[]): Promise<GridRun> {
      await prepare(code)
      let stdout = ''
      let error: RunError | null = null
      const runs = worlds.map((world) => {
        const simulation = new GridSimulation(world)
        current = simulation
        const r = call<FreeRun>('_executer_grille', code, JSON.stringify(GRID_COMMANDS), JSON.stringify(GRID_SENSORS))
        current = null
        stdout ||= r.stdout
        error ||= r.error
        return { frames: simulation.frames, outcome: r.error ? ('error' as const) : simulation.outcome() }
      })
      return { worlds: runs, success: runs.every((r) => r.outcome === 'success'), stdout, error }
    },

    async runFree(code: string, inputs: string[]): Promise<FreeRun> {
      await prepare(code)
      return call<FreeRun>('_executer_libre', code, JSON.stringify(inputs))
    },

    async runTests(code: string, tests: TestCase[]): Promise<TestResult[]> {
      await prepare(code)
      return call<TestResult[]>('_executer_tests', code, JSON.stringify(tests))
    },
  }
}
