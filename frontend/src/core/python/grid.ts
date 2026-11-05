// Monde de la souris : grille, deplacements et capteurs.
// Fichier sans dependance (utilise par le worker Python et par les tests du contenu).

export type Direction = 'N' | 'E' | 'S' | 'W'

/**
 * Une grille decrite ligne par ligne :
 * `#` mur · `.` vide · `S` depart de la souris · `H` maison · `C` fromage · `X` chat
 */
export interface GridWorld {
  map: string[]
  /** Direction de depart de la souris (E par defaut). */
  dir?: Direction
}

export type GridEvent = 'bump' | 'cat' | 'pick' | 'nothing' | 'home' | 'limit'

/** Etat de la souris apres une instruction (pour l'animation). */
export interface GridFrame {
  x: number
  y: number
  dir: Direction
  /** Indices (dans `cheeses`) des fromages deja ramasses. */
  picked: number[]
  /** Ligne du code eleve qui a produit cet etat. */
  line: number | null
  event?: GridEvent
}

export type GridOutcome = 'success' | 'bump' | 'cat' | 'nothing' | 'limit' | 'not-home' | 'cheese-left' | 'error'

export interface ParsedWorld {
  width: number
  height: number
  walls: Set<string>
  cats: Set<string>
  cheeses: { x: number; y: number }[]
  start: { x: number; y: number; dir: Direction }
  house: { x: number; y: number }
}

/** Instructions disponibles : nom francais -> nom anglais (les deux marchent). */
export const GRID_COMMANDS = {
  avancer: 'move',
  tourner_gauche: 'turn_left',
  tourner_droite: 'turn_right',
  ramasser: 'pick',
} as const

/** Capteurs (renvoient Vrai / Faux). */
export const GRID_SENSORS = {
  devant_mur: 'wall_ahead',
  devant_chat: 'cat_ahead',
  sur_fromage: 'on_cheese',
  a_la_maison: 'at_home',
} as const

export type GridAction = keyof typeof GRID_COMMANDS | keyof typeof GRID_SENSORS

/** Au-dela, on considere que le programme tourne en rond. */
export const MAX_ACTIONS = 1000

const STEP: Record<Direction, [number, number]> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] }
const LEFT: Record<Direction, Direction> = { N: 'W', W: 'S', S: 'E', E: 'N' }
const RIGHT: Record<Direction, Direction> = { N: 'E', E: 'S', S: 'W', W: 'N' }
const key = (x: number, y: number) => `${x},${y}`

export function parseWorld(world: GridWorld): ParsedWorld {
  const walls = new Set<string>()
  const cats = new Set<string>()
  const cheeses: { x: number; y: number }[] = []
  let start: ParsedWorld['start'] | null = null
  let house: ParsedWorld['house'] | null = null
  world.map.forEach((row, y) => {
    ;[...row].forEach((cell, x) => {
      if (cell === '#') walls.add(key(x, y))
      else if (cell === 'X') cats.add(key(x, y))
      else if (cell === 'C') cheeses.push({ x, y })
      else if (cell === 'S') start = { x, y, dir: world.dir ?? 'E' }
      else if (cell === 'H') house = { x, y }
    })
  })
  if (!start || !house) throw new Error('Grille invalide : il faut un S (depart) et un H (maison)')
  return {
    width: Math.max(...world.map.map((r) => r.length)),
    height: world.map.length,
    walls,
    cats,
    cheeses,
    start,
    house,
  }
}

/**
 * Simulation pas a pas. `act` renvoie la valeur d'un capteur, `undefined` pour une
 * instruction, ou `'stop'` quand la souris ne peut plus continuer (mur, chat, limite).
 */
export class GridSimulation {
  readonly world: ParsedWorld
  readonly frames: GridFrame[]
  private x: number
  private y: number
  private dir: Direction
  private picked: number[] = []
  private actions = 0
  private stopped: GridOutcome | null = null

  constructor(world: GridWorld) {
    this.world = parseWorld(world)
    this.x = this.world.start.x
    this.y = this.world.start.y
    this.dir = this.world.start.dir
    this.frames = [this.frame(null)]
  }

  act(action: GridAction, line: number | null): boolean | 'stop' | undefined {
    if (this.stopped) return 'stop'
    if (++this.actions > MAX_ACTIONS) return this.stop('limit', line)
    const [dx, dy] = STEP[this.dir]
    const ahead = { x: this.x + dx, y: this.y + dy }

    switch (action) {
      case 'avancer':
        if (this.isWall(ahead.x, ahead.y)) return this.stop('bump', line)
        this.x = ahead.x
        this.y = ahead.y
        if (this.world.cats.has(key(this.x, this.y))) return this.stop('cat', line)
        this.frames.push(this.frame(line, this.atHome() ? 'home' : undefined))
        return undefined
      case 'tourner_gauche':
        this.dir = LEFT[this.dir]
        this.frames.push(this.frame(line))
        return undefined
      case 'tourner_droite':
        this.dir = RIGHT[this.dir]
        this.frames.push(this.frame(line))
        return undefined
      case 'ramasser': {
        // Ramasser sans fromage est une erreur : sinon un `si` ne servirait jamais
        const index = this.cheeseHere()
        if (index < 0) return this.stop('nothing', line)
        this.picked = [...this.picked, index]
        this.frames.push(this.frame(line, 'pick'))
        return undefined
      }
      case 'devant_mur':
        return this.isWall(ahead.x, ahead.y)
      case 'devant_chat':
        return this.world.cats.has(key(ahead.x, ahead.y))
      case 'sur_fromage':
        return this.cheeseHere() >= 0
      case 'a_la_maison':
        return this.atHome()
    }
  }

  /** Resultat une fois le programme termine. */
  outcome(): GridOutcome {
    if (this.stopped) return this.stopped
    if (!this.atHome()) return 'not-home'
    if (this.picked.length < this.world.cheeses.length) return 'cheese-left'
    return 'success'
  }

  private stop(outcome: GridOutcome, line: number | null) {
    this.stopped = outcome
    this.frames.push(this.frame(line, outcome as GridEvent))
    return 'stop' as const
  }

  private isWall(x: number, y: number) {
    const { width, height, walls } = this.world
    return x < 0 || y < 0 || x >= width || y >= height || walls.has(key(x, y))
  }

  private cheeseHere() {
    return this.world.cheeses.findIndex((c, i) => c.x === this.x && c.y === this.y && !this.picked.includes(i))
  }

  private atHome() {
    return this.x === this.world.house.x && this.y === this.world.house.y
  }

  private frame(line: number | null, event?: GridEvent): GridFrame {
    return { x: this.x, y: this.y, dir: this.dir, picked: this.picked, line, event }
  }
}
