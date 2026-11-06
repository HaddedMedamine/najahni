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

/** Etapes de l'animation : indice de fin de chaque etape (deux regards = une comparaison). */
export function stepEnds(events: TraceEvent[]) {
  const ends: number[] = []
  for (let i = 0; i < events.length; i++) {
    if (events[i].t === 'get' && events[i + 1]?.t === 'get') i++
    ends.push(i + 1)
  }
  return ends
}
