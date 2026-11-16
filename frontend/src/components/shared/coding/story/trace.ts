// Etat d'une scene apres une suite d'operations (la trace du programme de l'eleve).
// Fonctions pures : la scene se recalcule a chaque etape, et les tests du contenu les utilisent.
import type { TraceEvent } from '../../../../core/python/engine.ts'

export interface PenguinsState {
  /** Tableau du programme. */
  array: number[]
  /** Case de chaque pingouin (indice = rang de depart) ; null = sorti du rang (dans aux). */
  place: (number | null)[]
  /** Derniere case de chaque pingouin : il attend devant elle quand il est sorti. */
  home: number[]
}

/**
 * Un pingouin est reconnu a sa taille. T[i] ← v amene le pingouin v en case i ; celui qui
 * s'y trouvait sort du rang. Un echange se voit donc comme en vrai : l'un sort, l'autre
 * prend sa place, le premier revient. Sans aux, le pingouin ecrase reste dehors.
 */
export function foldPenguins(initial: number[], events: TraceEvent[]): PenguinsState {
  const array = [...initial]
  const place: (number | null)[] = initial.map((_, i) => i)
  const home = initial.map((_, i) => i)
  for (const e of events) {
    if (e.t !== 'set') continue
    array[e.i] = e.v
    const target = initial.indexOf(e.v)
    const occupant = place.indexOf(e.i)
    if (occupant === target) continue
    if (occupant >= 0) place[occupant] = null
    if (target >= 0) {
      place[target] = e.i
      home[target] = e.i
    }
  }
  return { array, place, home }
}

export const isSorted = (array: number[], target: 'asc' | 'desc') =>
  array.every((v, i) => i === 0 || (target === 'asc' ? array[i - 1] <= v : array[i - 1] >= v))

export interface Bag {
  name: string
  items: string[]
  /** Produits deja sortis (position de lecture). */
  pointer: number
  /** null = ferme. */
  mode: string | null
}

export interface ShopState {
  bags: Bag[]
  /** Produits sortis du sac, dans l'ordre. */
  table: string[]
  /** Fin de fichier atteinte : le "!" au-dessus de la tete. */
  alert: boolean
}

const itemsOf = (text: string) => text.split('\n').filter((line) => line !== '')

export function foldShop(start: Record<string, string[]>, events: TraceEvent[]): ShopState {
  const bags: Bag[] = Object.entries(start).map(([name, items]) => ({ name, items: [...items], pointer: 0, mode: null }))
  const state: ShopState = { bags, table: [], alert: false }
  const bag = (name: string) => {
    let found = bags.find((b) => b.name === name)
    if (!found) {
      found = { name, items: [], pointer: 0, mode: null }
      bags.push(found)
    }
    return found
  }
  for (const e of events) {
    if (e.t === 'open') {
      const b = bag(e.file)
      b.mode = e.mode
      b.pointer = 0
      if (e.mode.startsWith('w')) b.items = []
      state.alert = false
    } else if (e.t === 'write') {
      bag(e.file).items.push(...itemsOf(e.text))
    } else if (e.t === 'read') {
      const lines = itemsOf(e.text)
      bag(e.file).pointer += lines.length
      state.table.push(...lines)
    } else if (e.t === 'eof') {
      state.alert = true
    } else if (e.t === 'close') {
      bag(e.file).mode = null
    }
  }
  return state
}

export interface Card {
  fields: Record<string, string | number | boolean>
}

/** Les cartes dans l'ordre ou le programme les a touchees. */
export function foldCards(events: TraceEvent[]) {
  const cards: Card[] = []
  for (const e of events) {
    if (e.t !== 'field' && e.t !== 'look') continue
    cards[e.r] ??= { fields: {} }
    if (e.t === 'field') cards[e.r].fields[e.k] = e.v
  }
  return { cards }
}

/** Les sieges de la salle apres les ecritures du programme. */
export function foldCinema(rows: number[][], events: TraceEvent[]) {
  const seats = rows.map((row) => [...row])
  for (const e of events) if (e.t === 'mset') seats[e.i][e.j] = e.v
  return seats
}

export interface Doll {
  label: string
  /** Valeur retournee ; undefined tant que l'appel n'est pas fini. */
  value?: string | number | boolean
}

/** Les appels en cours et finis, du premier au plus profond. */
export function foldCalls(events: TraceEvent[]) {
  const dolls: Doll[] = []
  let depth = 0
  for (const e of events) {
    if (e.t === 'call') {
      dolls.length = e.d
      dolls.push({ label: `${e.f}(${e.a})` })
      depth = e.d + 1
    } else if (e.t === 'ret') {
      if (dolls[e.d]) dolls[e.d].value = e.v
      depth = e.d
    }
  }
  return { dolls, depth }
}

/** Les marches : une case du tableau, ou chaque nouvelle valeur d'une variable surveillee. */
export function foldStairs(length: number, events: TraceEvent[]) {
  const steps: (number | null)[] = Array.from({ length }, () => null)
  let next = 0
  let current = -1
  for (const e of events) {
    if (e.t === 'set') {
      steps[e.i] = e.v
      current = e.i
    } else if (e.t === 'var' && typeof e.v === 'number') {
      steps[next] = e.v
      current = next
      next = Math.min(next + 1, length - 1)
    }
  }
  return { steps, current }
}

/** Valeur courante des variables, et l'historique de chacune. */
export function foldVars(events: TraceEvent[]) {
  const values: Record<string, (string | number | boolean)[]> = {}
  for (const e of events) if (e.t === 'var') (values[e.k] ??= []).push(e.v)
  return values
}

/** Etapes de l'animation : indice de fin de chaque etape (deux regards = une comparaison). */
export function stepEnds(events: TraceEvent[]) {
  const ends: number[] = []
  for (let i = 0; i < events.length; i++) {
    if (events[i].t === 'get' && events[i + 1]?.t === 'get') i++
    ends.push(i + 1)
  }
  return ends
}
