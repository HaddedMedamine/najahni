// Expressions algorithmiques -> arbre -> Python.
// Precedence (de la plus faible a la plus forte) :
// ou · et · non · comparaisons (= ≠ < > ≤ ≥ ∈) · + - · * / div mod · moins unaire · appel, indice
import type { Token } from './tokens.ts'

export type Expr =
  | { type: 'num'; value: string }
  | { type: 'str'; value: string }
  | { type: 'bool'; value: boolean }
  | { type: 'name'; name: string; key: string }
  | { type: 'call'; name: string; key: string; args: Expr[] }
  | { type: 'index'; target: Expr; index: Expr }
  | { type: 'unary'; op: 'not' | '-'; operand: Expr }
  | { type: 'binary'; op: string; left: Expr; right: Expr }
  | { type: 'in'; value: Expr; items: (Expr | { from: Expr; to: Expr })[] }

export class ExprError extends Error {}

/** Fonctions predefinies du programme (nom normalise -> nom affiche). */
export const PREDEFINED: Record<string, string> = {
  long: 'Long',
  pos: 'Pos',
  sous_chaine: 'Sous_Chaine',
  souschaine: 'Sous_Chaine',
  effacer: 'Effacer',
  majus: 'Majus',
  convch: 'Convch',
  valeur: 'Valeur',
  estnum: 'Estnum',
  ord: 'Ord',
  chr: 'Chr',
  alea: 'Alea',
  ent: 'Ent',
  arrondi: 'Arrondi',
  racinecarre: 'RacineCarre',
  racinecarree: 'RacineCarre',
  abs: 'Abs',
}

const ARITY: Record<string, number> = {
  Long: 1,
  Pos: 2,
  Sous_Chaine: 3,
  Effacer: 3,
  Majus: 1,
  Convch: 1,
  Valeur: 1,
  Estnum: 1,
  Ord: 1,
  Chr: 1,
  Alea: 2,
  Ent: 1,
  Arrondi: 1,
  RacineCarre: 1,
  Abs: 1,
}

class Parser {
  private i = 0
  private readonly tokens: Token[]
  constructor(tokens: Token[]) {
    this.tokens = tokens
  }

  parse(): Expr {
    if (this.tokens.length === 0) throw new ExprError('Expression vide')
    const e = this.or()
    if (this.i < this.tokens.length) throw new ExprError(`« ${this.tokens[this.i].raw} » inattendu`)
    return e
  }

  private peek() {
    return this.tokens[this.i]
  }
  private isKey(key: string) {
    const t = this.peek()
    return t !== undefined && t.kind === 'id' && t.key === key
  }
  private isOp(...ops: string[]) {
    const t = this.peek()
    return t !== undefined && t.kind === 'op' && ops.includes(t.key)
  }
  private expectOp(op: string) {
    if (!this.isOp(op)) throw new ExprError(`« ${op} » attendu`)
    this.i++
  }

  private or(): Expr {
    let left = this.and()
    while (this.isKey('ou')) {
      this.i++
      left = { type: 'binary', op: 'or', left, right: this.and() }
    }
    return left
  }

  private and(): Expr {
    let left = this.not()
    while (this.isKey('et')) {
      this.i++
      left = { type: 'binary', op: 'and', left, right: this.not() }
    }
    return left
  }

  private not(): Expr {
    if (this.isKey('non')) {
      this.i++
      return { type: 'unary', op: 'not', operand: this.not() }
    }
    return this.comparison()
  }

  private comparison(): Expr {
    const left = this.additive()
    if (this.isOp('∈') || this.isKey('dans')) {
      this.i++
      return { type: 'in', value: left, items: this.set() }
    }
    const map: Record<string, string> = { '=': '==', '≠': '!=', '<>': '!=', '<': '<', '>': '>', '<=': '<=', '>=': '>=', '≤': '<=', '≥': '>=' }
    const t = this.peek()
    if (t?.kind === 'op' && t.key in map) {
      this.i++
      return { type: 'binary', op: map[t.key], left, right: this.additive() }
    }
    return left
  }

  /** [a..b, c, ...] apres ∈ */
  private set(): (Expr | { from: Expr; to: Expr })[] {
    this.expectOp('[')
    const items: (Expr | { from: Expr; to: Expr })[] = []
    while (!this.isOp(']')) {
      const from = this.additive()
      if (this.isOp('..')) {
        this.i++
        items.push({ from, to: this.additive() })
      } else items.push(from)
      if (this.isOp(',')) this.i++
      else if (!this.isOp(']')) throw new ExprError('« , » ou « ] » attendu')
    }
    this.i++
    return items
  }

  private additive(): Expr {
    let left = this.multiplicative()
    while (this.isOp('+', '-')) {
      const op = this.peek().key
      this.i++
      left = { type: 'binary', op, left, right: this.multiplicative() }
    }
    return left
  }

  private multiplicative(): Expr {
    let left = this.unary()
    for (;;) {
      if (this.isOp('*', '/')) {
        const op = this.peek().key
        this.i++
        left = { type: 'binary', op, left, right: this.unary() }
      } else if (this.isKey('div') || this.isKey('mod')) {
        const op = this.peek().key === 'div' ? '//' : '%'
        this.i++
        left = { type: 'binary', op, left, right: this.unary() }
      } else return left
    }
  }

  private unary(): Expr {
    if (this.isOp('-')) {
      this.i++
      return { type: 'unary', op: '-', operand: this.unary() }
    }
    if (this.isOp('+')) {
      this.i++
      return this.unary()
    }
    return this.postfix()
  }

  private postfix(): Expr {
    let e = this.primary()
    while (this.isOp('[')) {
      this.i++
      const index = this.or()
      this.expectOp(']')
      e = { type: 'index', target: e, index }
    }
    return e
  }

  private primary(): Expr {
    const t = this.peek()
    if (!t) throw new ExprError('Expression incomplete')
    this.i++
    if (t.kind === 'num') return { type: 'num', value: t.raw }
    if (t.kind === 'str') return { type: 'str', value: t.raw }
    if (t.kind === 'op' && t.key === '(') {
      const e = this.or()
      this.expectOp(')')
      return e
    }
    if (t.kind === 'id') {
      if (t.key === 'vrai' || t.key === 'faux') return { type: 'bool', value: t.key === 'vrai' }
      if (this.isOp('(')) {
        this.i++
        const args: Expr[] = []
        while (!this.isOp(')')) {
          args.push(this.or())
          if (this.isOp(',')) this.i++
          else if (!this.isOp(')')) throw new ExprError('« , » ou « ) » attendu')
        }
        this.i++
        const predefined = PREDEFINED[t.key]
        if (predefined && args.length !== ARITY[predefined]) {
          throw new ExprError(`${predefined} attend ${ARITY[predefined]} parametre(s)`)
        }
        return { type: 'call', name: predefined ?? t.raw, key: t.key, args }
      }
      return { type: 'name', name: t.raw, key: t.key }
    }
    throw new ExprError(`« ${t.raw} » inattendu`)
  }
}

export const parseExpr = (tokens: Token[]) => new Parser(tokens).parse()

const PRECEDENCE: Record<string, number> = {
  or: 1,
  and: 2,
  not: 3,
  '==': 4,
  '!=': 4,
  '<': 4,
  '>': 4,
  '<=': 4,
  '>=': 4,
  in: 4,
  '+': 5,
  '-': 5,
  '*': 6,
  '/': 6,
  '//': 6,
  '%': 6,
  neg: 7,
}

/** Modules Python a importer selon les fonctions utilisees. */
export interface Imports {
  math: boolean
  random: boolean
}

const level = (e: Expr): number => {
  if (e.type === 'binary') return PRECEDENCE[e.op]
  if (e.type === 'in') return PRECEDENCE.in
  if (e.type === 'unary') return e.op === 'not' ? PRECEDENCE.not : PRECEDENCE.neg
  return 9
}

/** Expression Python equivalente (fonctions predefinies traduites comme dans le cours). */
export function toPython(e: Expr, imports: Imports): string {
  const sub = (child: Expr, min: number) => {
    const s = toPython(child, imports)
    return level(child) < min ? `(${s})` : s
  }
  switch (e.type) {
    case 'num':
      return e.value
    case 'str':
      return JSON.stringify(e.value)
    case 'bool':
      return e.value ? 'True' : 'False'
    case 'name':
      return e.name
    case 'index':
      return `${sub(e.target, 9)}[${toPython(e.index, imports)}]`
    case 'unary':
      return e.op === 'not' ? `not ${sub(e.operand, PRECEDENCE.not)}` : `-${sub(e.operand, PRECEDENCE.neg)}`
    case 'binary': {
      const p = PRECEDENCE[e.op]
      // gauche associatif : a - (b - c) garde ses parentheses
      return `${sub(e.left, p)} ${e.op} ${sub(e.right, p + 1)}`
    }
    case 'in': {
      const value = sub(e.value, PRECEDENCE.in + 1)
      const ranges = e.items.filter((it): it is { from: Expr; to: Expr } => 'from' in it)
      const singles = e.items.filter((it): it is Expr => !('from' in it))
      const parts = [
        ...ranges.map((r) => `${toPython(r.from, imports)} <= ${value} <= ${toPython(r.to, imports)}`),
        ...(singles.length ? [`${value} in [${singles.map((s) => toPython(s, imports)).join(', ')}]`] : []),
      ]
      return parts.length === 1 ? parts[0] : `(${parts.join(' or ')})`
    }
    case 'call': {
      const a = e.args.map((x) => toPython(x, imports))
      const obj = (x: Expr) => sub(x, 9)
      switch (e.name) {
        case 'Long':
          return `len(${a[0]})`
        case 'Pos':
          return `${obj(e.args[1])}.find(${a[0]})`
        case 'Sous_Chaine':
          return `${obj(e.args[0])}[${a[1]}:${a[2]}]`
        case 'Effacer':
          return `${obj(e.args[0])}[:${a[1]}] + ${obj(e.args[0])}[${a[2]}:]`
        case 'Majus':
          return `${obj(e.args[0])}.upper()`
        case 'Convch':
          return `str(${a[0]})`
        case 'Valeur':
          return `int(${a[0]})`
        case 'Estnum':
          return `${obj(e.args[0])}.isdigit()`
        case 'Ord':
          return `ord(${a[0]})`
        case 'Chr':
          return `chr(${a[0]})`
        case 'Alea':
          imports.random = true
          return `randint(${a[0]}, ${a[1]})`
        case 'Ent':
          return `int(${a[0]})`
        case 'Arrondi':
          return `round(${a[0]})`
        case 'RacineCarre':
          imports.math = true
          return `sqrt(${a[0]})`
        case 'Abs':
          return `abs(${a[0]})`
        default:
          return `${e.name}(${a.join(', ')})`
      }
    }
  }
}

/** Noms (normalises) lus dans une expression, hors fonctions appelees. */
export function namesIn(e: Expr, out = new Map<string, string>()): Map<string, string> {
  switch (e.type) {
    case 'name':
      if (!out.has(e.key)) out.set(e.key, e.name)
      break
    case 'call':
      e.args.forEach((a) => namesIn(a, out))
      break
    case 'index':
      namesIn(e.target, out)
      namesIn(e.index, out)
      break
    case 'unary':
      namesIn(e.operand, out)
      break
    case 'binary':
      namesIn(e.left, out)
      namesIn(e.right, out)
      break
    case 'in':
      namesIn(e.value, out)
      for (const it of e.items) {
        if ('from' in it) {
          namesIn(it.from, out)
          namesIn(it.to, out)
        } else namesIn(it, out)
      }
      break
  }
  return out
}

/** Modules appeles dans une expression (pour verifier qu'ils existent). */
export function callsIn(e: Expr, out: { key: string; name: string }[] = []) {
  if (e.type === 'call') {
    if (!PREDEFINED[e.key]) out.push({ key: e.key, name: e.name })
    e.args.forEach((a) => callsIn(a, out))
  } else if (e.type === 'index') {
    callsIn(e.target, out)
    callsIn(e.index, out)
  } else if (e.type === 'unary') callsIn(e.operand, out)
  else if (e.type === 'binary') {
    callsIn(e.left, out)
    callsIn(e.right, out)
  } else if (e.type === 'in') {
    callsIn(e.value, out)
    for (const it of e.items) {
      if ('from' in it) {
        callsIn(it.from, out)
        callsIn(it.to, out)
      } else callsIn(it, out)
    }
  }
  return out
}
