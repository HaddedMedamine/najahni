// Cote page : envoie le code au worker Python et attend la reponse.
// Si Python ne repond pas a temps (boucle infinie), le worker est tue puis recree.
import { useSyncExternalStore } from 'react'
import type { Engine, FreeRun, GridRun, TestResult } from './engine'
import type { WorkerRequest, WorkerResponse } from './python.worker'

/** Temps maximal d'une execution (le premier lancement inclut le chargement de Python). */
const TIMEOUT_MS = 10_000
const FIRST_TIMEOUT_MS = 120_000

export type PythonStatus = 'idle' | 'loading' | 'ready'

/** Python n'a pas termine a temps : probablement une boucle qui ne s'arrete jamais. */
export class PythonTimeoutError extends Error {
  constructor() {
    super('timeout')
  }
}

/** Une requete sans son id (attribue par `send`). */
type NewRequest = { [K in WorkerRequest['kind']]: Omit<Extract<WorkerRequest, { kind: K }>, 'id'> }[WorkerRequest['kind']]

type Pending = { resolve: (value: unknown) => void; reject: (error: Error) => void; timer: number }

let worker: Worker | null = null
let ready = false
let nextId = 1
const pending = new Map<number, Pending>()

let status: PythonStatus = 'idle'
const listeners = new Set<() => void>()
const setStatus = (value: PythonStatus) => {
  status = value
  listeners.forEach((l) => l())
}

function getWorker() {
  if (worker) return worker
  worker = new Worker(new URL('./python.worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const response = event.data
    const p = pending.get(response.id)
    if (!p) return
    pending.delete(response.id)
    clearTimeout(p.timer)
    ready = true
    setStatus('ready')
    if (response.ok) p.resolve(response.result)
    else p.reject(new Error(response.message))
  }
  setStatus('loading')
  return worker
}

/** Tue le worker (et tout ce qu'il calculait) ; le prochain appel en relance un. */
function reset(error: Error) {
  worker?.terminate()
  worker = null
  ready = false
  setStatus('idle')
  for (const p of pending.values()) {
    clearTimeout(p.timer)
    p.reject(error)
  }
  pending.clear()
}

function send<T>(request: NewRequest): Promise<T> {
  const id = nextId++
  const w = getWorker()
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reset(new PythonTimeoutError()), ready ? TIMEOUT_MS : FIRST_TIMEOUT_MS)
    pending.set(id, { resolve: resolve as (value: unknown) => void, reject, timer })
    w.postMessage({ ...request, id } as WorkerRequest)
  })
}

export const python = {
  /** Charge Python a l'avance (a l'ouverture d'un niveau). */
  warmUp: () => send<null>({ kind: 'init' }),
  runGrid: (...args: Parameters<Engine['runGrid']>) => send<GridRun>({ kind: 'runGrid', args }),
  runFree: (...args: Parameters<Engine['runFree']>) => send<FreeRun>({ kind: 'runFree', args }),
  runTests: (...args: Parameters<Engine['runTests']>) => send<TestResult[]>({ kind: 'runTests', args }),
}

/** Etat du moteur, pour afficher "Chargement de Python...". */
export const usePythonStatus = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => status,
  )
