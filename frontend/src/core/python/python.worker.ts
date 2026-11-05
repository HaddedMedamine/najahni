// Web Worker : Python tourne ici, hors de la page, pour qu'une boucle infinie
// ne bloque jamais l'interface (la page peut tuer le worker et en relancer un).
import type { loadPyodide as LoadPyodide } from 'pyodide'
import { createEngine, type Engine } from './engine.ts'

export type WorkerRequest =
  | { id: number; kind: 'init' }
  | { id: number; kind: 'runGrid'; args: Parameters<Engine['runGrid']> }
  | { id: number; kind: 'runFree'; args: Parameters<Engine['runFree']> }
  | { id: number; kind: 'runTests'; args: Parameters<Engine['runTests']> }

export type WorkerResponse = { id: number; ok: true; result: unknown } | { id: number; ok: false; message: string }

// Fichiers copies dans public/pyodide par scripts/fetch-pyodide.mjs
const PYODIDE_URL = new URL('/pyodide/', self.location.origin).href

let engine: Promise<Engine> | null = null

async function start() {
  const { loadPyodide } = (await import(/* @vite-ignore */ `${PYODIDE_URL}pyodide.mjs`)) as {
    loadPyodide: typeof LoadPyodide
  }
  return createEngine(await loadPyodide({ indexURL: PYODIDE_URL }))
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data
  try {
    engine ??= start()
    const e = await engine
    let result: unknown = null
    if (request.kind === 'runGrid') result = await e.runGrid(...request.args)
    else if (request.kind === 'runFree') result = await e.runFree(...request.args)
    else if (request.kind === 'runTests') result = await e.runTests(...request.args)
    self.postMessage({ id: request.id, ok: true, result } satisfies WorkerResponse)
  } catch (error) {
    self.postMessage({ id: request.id, ok: false, message: (error as Error).message } satisfies WorkerResponse)
  }
}
