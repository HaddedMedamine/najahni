// Traduction d'un algorithme (notation des programmes tunisiens) en Python executable.
// Une ligne Python garde la ligne de l'algorithme d'ou elle vient (pour situer les erreurs).
import { callsIn, type Expr, ExprError, type Imports, namesIn, parseExpr, PREDEFINED, toPython } from './expr.ts'
import { type Token, tokenizeLine } from './tokens.ts'

export type TdoType = 'Entier' | 'Réel' | 'Booléen' | 'Caractère' | 'Chaîne' | 'Tableau'
export type ElementType = Exclude<TdoType, 'Tableau'>

/** Une ligne du tableau de declaration des objets. */
export interface TdoRow {
  name: string
  type: TdoType
  /** Tableau : type des elements et taille. */
  elem?: ElementType
  size?: number
}

export interface AlgoError {
  line: number | null
  message: string
}

export interface Transpiled {
  python: string
  /** Pour chaque ligne Python (indice 0 = ligne 1), la ligne de l'algorithme. */
  lineMap: (number | null)[]
  errors: AlgoError[]
}

interface Statement {
  tokens: Token[]
  line: number
}

interface Param {
  name: string
  ref: boolean
  type: string
}

interface Module {
  kind: 'main' | 'fonction' | 'procedure'
  name: string
  params: Param[]
  line: number
  /** `render` : texte calcule a la fin (appel d'une procedure definie plus loin). */
  lines: { text: string; indent: number; line: number | null; render?: () => string }[]
  /** Noms affectes (←, Lire, compteur de Pour) et lus : verifies avec le TDO. */
  assigned: Map<string, { name: string; line: number }>
  read: Map<string, { name: string; line: number }>
  /** Premier usage de chaque nom : lu ou ecrit (parametres @ remplaces par un retour). */
  firstUse: Map<string, 'read' | 'write'>
  started: boolean
}

interface Block {
  kind: 'si' | 'pour' | 'tantque' | 'repeter'
  line: number
  /** Instructions ecrites dans la branche courante (Python refuse un bloc vide). */
  count: number
}

const SPLIT_BEFORE = new Set(['sinonsi', 'sinon', 'finsi', 'finpour', 'fintantque', 'jusqua', 'repeter'])
const SPLIT_AFTER = new Set(['alors', 'faire', 'repeter', 'debut'])
const SCALAR_TYPES = new Set(['entier', 'reel', 'booleen', 'caractere', 'chaine'])

/** Une instruction par element : "Si x > 0 Alors Ecrire(x) FinSi" -> 3 instructions. */
function splitStatements(source: string, errors: AlgoError[]): Statement[] {
  const statements: Statement[] = []
  source.split(/\r?\n/).forEach((text, index) => {
    const line = index + 1
    let tokens: Token[]
    try {
      tokens = tokenizeLine(text)
    } catch (e) {
      errors.push({ line, message: (e as Error).message })
      return
    }
    let current: Token[] = []
    let depth = 0
    const flush = () => {
      if (current.length) statements.push({ tokens: current, line })
      current = []
    }
    tokens.forEach((t, i) => {
      if (t.kind === 'op' && (t.key === '(' || t.key === '[')) depth++
      if (t.kind === 'op' && (t.key === ')' || t.key === ']')) depth--
      if (t.kind === 'id' && SPLIT_BEFORE.has(t.key)) flush()
      // "Ecrire("n = "), Lire(n)" : deux instructions sur une ligne
      const next = tokens[i + 1]
      if (depth === 0 && t.kind === 'op' && t.key === ',' && next?.kind === 'id' && ['lire', 'ecrire', 'ecrire_nl'].includes(next.key)) {
        flush()
        return
      }
      current.push(t)
      const bareSinon = t.key === 'sinon' && t.kind === 'id'
      if (t.kind === 'id' && (SPLIT_AFTER.has(t.key) || bareSinon)) flush()
    })
    flush()
  })
  return statements
}

/** Position du separateur de niveau 0 (←, Alors...) dans une instruction. */
const findOp = (tokens: Token[], key: string, from = 0) => {
  let depth = 0
  for (let i = from; i < tokens.length; i++) {
    const t = tokens[i]
    if (depth === 0 && t.key === key) return i
    if (t.kind === 'op' && (t.key === '(' || t.key === '[')) depth++
    else if (t.kind === 'op' && (t.key === ')' || t.key === ']')) depth--
  }
  return -1
}
const isKey = (t: Token | undefined, key: string) => t !== undefined && t.kind === 'id' && t.key === key

export function transpile(source: string, tdo: TdoRow[] | null): Transpiled {
  const errors: AlgoError[] = []
  const statements = splitStatements(source, errors)
  const modules: Module[] = []
  const imports: Imports = { math: false, random: false }
  const tdoByKey = new Map((tdo ?? []).map((row) => [row.name.trim().toLowerCase(), row]))

  let mod: Module | null = null
  const blocks: Block[] = []
  let lastPrompt: { index: number; prompt: string; line: number } | null = null

  const newModule = (kind: Module['kind'], name: string, params: Param[], line: number): Module => {
    const m: Module = { kind, name, params, line, lines: [], assigned: new Map(), read: new Map(), firstUse: new Map(), started: false }
    modules.push(m)
    return m
  }
  const current = (line: number) => {
    // Pas d'entete : tout le texte est le programme principal
    mod ??= newModule('main', 'Programme', [], line)
    if (!mod.started && mod.kind === 'main') mod.started = true
    return mod
  }
  const indent = () => blocks.length + (mod && mod.kind !== 'main' ? 1 : 0)
  const emit = (text: string, line: number | null, extra = 0, render?: () => string) => {
    const m = current(line ?? 0)
    m.lines.push({ text, indent: indent() + extra, line, render })
    const top = blocks.at(-1)
    if (top && extra >= 0) top.count++
  }
  const expr = (tokens: Token[], line: number): string | null => {
    try {
      const e = parseExpr(tokens)
      noteReads(e, line)
      return toPython(e, imports)
    } catch (err) {
      errors.push({ line, message: err instanceof ExprError ? err.message : (err as Error).message })
      return null
    }
  }
  const noteReads = (e: Expr, line: number) => {
    const m = current(line)
    for (const [key, name] of namesIn(e)) {
      if (!m.read.has(key)) m.read.set(key, { name, line })
      if (!m.firstUse.has(key)) m.firstUse.set(key, 'read')
    }
    for (const call of callsIn(e)) if (!m.read.has(`()${call.key}`)) m.read.set(`()${call.key}`, { name: call.name, line })
  }
  const noteAssign = (name: string, line: number) => {
    const m = current(line)
    const key = name.toLowerCase()
    if (!m.assigned.has(key)) m.assigned.set(key, { name, line })
    if (!m.firstUse.has(key)) m.firstUse.set(key, 'write')
  }
  /** Cible d'une affectation ou d'une lecture : x ou T[i]. */
  const target = (tokens: Token[], line: number) => {
    if (tokens[0]?.kind !== 'id') {
      errors.push({ line, message: 'Variable attendue' })
      return null
    }
    const name = tokens[0].raw
    noteAssign(name, line)
    if (tokens.length === 1) return { name, python: name, indexed: false }
    if (tokens[1].key !== '[' || tokens.at(-1)?.key !== ']') {
      errors.push({ line, message: `Variable attendue a la place de « ${tokens.map((t) => t.raw).join(' ')} »` })
      return null
    }
    const index = expr(tokens.slice(2, -1), line)
    return index === null ? null : { name, python: `${name}[${index}]`, indexed: true }
  }
  const signatures = new Map<string, Param[]>()

  // Premier passage : signatures des modules (un appel peut preceder la definition)
  for (const s of statements) {
    const head = s.tokens[0]
    if (isKey(head, 'fonction') || isKey(head, 'procedure')) {
      const sig = parseSignature(s.tokens, s.line, errors)
      if (sig) signatures.set(sig.name.toLowerCase(), sig.params)
    }
  }

  for (const s of statements) {
    const [head] = s.tokens
    const key = head.kind === 'id' ? head.key : ''
    const line = s.line
    const rest = s.tokens.slice(1)
    const promptBefore = lastPrompt
    lastPrompt = null

    switch (key) {
      case 'algorithme':
        mod = newModule('main', s.tokens[1]?.raw ?? 'Programme', [], line)
        continue
      case 'fonction':
      case 'procedure': {
        if (blocks.length) errors.push({ line, message: `Bloc « ${blocks.at(-1)!.kind} » non ferme avant ${head.raw}` })
        blocks.length = 0
        const sig = parseSignature(s.tokens, line, errors)
        mod = newModule(key, sig?.name ?? 'module', sig?.params ?? [], line)
        continue
      }
      case 'debut':
        current(line).started = true
        continue
      case 'fin':
        if (blocks.length) errors.push({ line, message: `${closingWord(blocks.at(-1)!.kind)} manquant (bloc ouvert ligne ${blocks.at(-1)!.line})` })
        blocks.length = 0
        if (mod && mod.kind === 'procedure') returnRefs(mod, line)
        mod = null
        continue
      case 'si': {
        const at = findOp(s.tokens, 'alors')
        if (at < 0) {
          errors.push({ line, message: '« Alors » manquant apres la condition du Si' })
          continue
        }
        const cond = expr(s.tokens.slice(1, at), line)
        emit(`if ${cond}:`, line)
        blocks.push({ kind: 'si', line, count: 0 })
        continue
      }
      case 'sinonsi':
      case 'sinon': {
        const top = blocks.at(-1)
        if (top?.kind !== 'si') {
          errors.push({ line, message: `${head.raw} sans Si` })
          continue
        }
        if (top.count === 0) emit('pass', line)
        blocks.pop()
        if (key === 'sinonsi') {
          const at = findOp(s.tokens, 'alors')
          if (at < 0) errors.push({ line, message: '« Alors » manquant apres « Sinon si »' })
          emit(`elif ${expr(s.tokens.slice(1, at < 0 ? undefined : at), line)}:`, line)
        } else emit('else:', line)
        blocks.push({ kind: 'si', line: top.line, count: 0 })
        continue
      }
      case 'finsi':
      case 'finpour':
      case 'fintantque': {
        const kind = key === 'finsi' ? 'si' : key === 'finpour' ? 'pour' : 'tantque'
        const top = blocks.at(-1)
        if (top?.kind !== kind) {
          errors.push({ line, message: top ? `${closingWord(top.kind)} attendu avant ${head.raw}` : `${head.raw} sans ouverture` })
          continue
        }
        if (top.count === 0) emit('pass', line)
        blocks.pop()
        continue
      }
      case 'pour': {
        const loop = parseFor(s.tokens, line, errors)
        if (!loop) continue
        noteAssign(loop.counter, line)
        const from = expr(loop.from, line)
        const to = expr(loop.to, line)
        const step = loop.step ? expr(loop.step, line) : null
        if (from === null || to === null) continue
        emit(`for ${loop.counter} in ${rangeOf(from, to, step)}:`, line)
        blocks.push({ kind: 'pour', line, count: 0 })
        continue
      }
      case 'tantque': {
        const at = findOp(s.tokens, 'faire')
        if (at < 0) errors.push({ line, message: '« Faire » manquant apres la condition du TantQue' })
        emit(`while ${expr(s.tokens.slice(1, at < 0 ? undefined : at), line)}:`, line)
        blocks.push({ kind: 'tantque', line, count: 0 })
        continue
      }
      case 'repeter':
        emit('while True:', line)
        blocks.push({ kind: 'repeter', line, count: 0 })
        continue
      case 'jusqua': {
        const top = blocks.at(-1)
        if (top?.kind !== 'repeter') {
          errors.push({ line, message: "Jusqu'à sans Répéter" })
          continue
        }
        emit(`if ${expr(rest, line)}:`, line)
        emit('break', line, 1)
        blocks.pop()
        continue
      }
      case 'retourner':
        if (mod?.kind !== 'fonction') errors.push({ line, message: 'Retourner est reserve aux fonctions' })
        emit(`return ${expr(rest, line)}`, line)
        continue
      case 'lire': {
        const args = callArgs(s.tokens, line, errors)
        for (const arg of args ?? []) {
          const t = target(arg, line)
          if (!t) continue
          const row = tdoByKey.get(t.name.toLowerCase())
          const param = mod?.params.find((p) => p.name.toLowerCase() === t.name.toLowerCase())
          const type = param && !t.indexed ? paramType(param.type) : row?.type === 'Tableau' ? (row.elem ?? 'Entier') : (row?.type ?? 'Chaîne')
          // Ecrire("Donner n : "), Lire(n) -> n = int(input("Donner n : "))
          let prompt = ''
          if (promptBefore && promptBefore.line === line && args?.length === 1) {
            const m = current(line)
            m.lines.splice(promptBefore.index, 1)
            const top = blocks.at(-1)
            if (top) top.count--
            prompt = promptBefore.prompt
          }
          emit(`${t.python} = ${readAs(type, prompt)}`, line)
        }
        continue
      }
      case 'ecrire':
      case 'ecrire_nl': {
        const args = callArgs(s.tokens, line, errors)
        if (!args) continue
        const parts = args.map((a) => expr(a, line))
        emit(`print(${parts.join(', ')})`, line)
        if (args.length === 1 && parts[0] !== null) {
          const m = current(line)
          lastPrompt = { index: m.lines.length - 1, prompt: parts[0], line }
        }
        continue
      }
    }

    // Affectation : cible ← expression
    const arrow = findOp(s.tokens, '←')
    if (arrow > 0) {
      const t = target(s.tokens.slice(0, arrow), line)
      const value = expr(s.tokens.slice(arrow + 1), line)
      if (t && value !== null) emit(`${t.python} = ${value}`, line)
      continue
    }
    if (arrow === 0) {
      errors.push({ line, message: 'Variable manquante avant ←' })
      continue
    }

    // Appel de procedure : nom(parametres). Les parametres @ scalaires reviennent
    // par `return` : "Saisir(n)" -> "n = Saisir()" (ou "n = Saisir(n)" si la valeur est lue)
    if (head.kind === 'id' && s.tokens[1]?.key === '(' && s.tokens.at(-1)?.key === ')') {
      const call = expr(s.tokens, line)
      if (call === null) continue
      const name = head.raw
      const params = signatures.get(name.toLowerCase()) ?? []
      const args = (callArgs(s.tokens, line, errors) ?? []).map((a) => {
        try {
          return toPython(parseExpr(a), imports)
        } catch {
          return a.map((t) => t.raw).join('')
        }
      })
      const refs = params.flatMap((p, i) => (p.ref && SCALAR_TYPES.has(p.type) && args[i] ? [args[i]] : []))
      for (const r of refs) noteAssign(r.replace(/\[.*$/, ''), line)
      emit(call, line, 0, () => {
        const target = modules.find((m) => m.name.toLowerCase() === name.toLowerCase())
        const kept = params.flatMap((p, i) => (target && dropped(target, p) ? [] : [args[i] ?? '']))
        const text = `${name}(${kept.join(', ')})`
        return refs.length ? `${refs.join(', ')} = ${text}` : text
      })
      continue
    }

    if (head.kind === 'op' && head.key === '=') errors.push({ line, message: "Utilisez ← pour l'affectation" })
    else if (findOp(s.tokens, '=') > 0) errors.push({ line, message: "Affectation : utilisez ← (et non =)" })
    else errors.push({ line, message: `Instruction non reconnue : « ${s.tokens.map((t) => t.raw).join(' ')} »` })
  }

  if (blocks.length) {
    const top = blocks.at(-1)!
    errors.push({ line: top.line, message: `${closingWord(top.kind)} manquant` })
  }
  if (mod && mod.kind === 'procedure') returnRefs(mod, null)

  if (tdo) checkTdo(modules, tdoByKey, signatures, errors)

  return { ...assemble(modules, tdo ?? [], imports), errors }
}

/** Type d'un parametre ("entier", "reel"...) -> type du TDO. */
function paramType(type: string): TdoType {
  const types: Record<string, TdoType> = { entier: 'Entier', reel: 'Réel', booleen: 'Booléen', caractere: 'Caractère', chaine: 'Chaîne' }
  return types[type] ?? 'Chaîne'
}

/** `Lire(x)` selon le type declare dans le TDO. */
function readAs(type: TdoType, prompt: string) {
  if (type === 'Entier') return `int(input(${prompt}))`
  if (type === 'Réel') return `float(input(${prompt}))`
  if (type === 'Booléen') return `input(${prompt}) == "Vrai"`
  return `input(${prompt})`
}

/** Pour i de a à b (Pas = p) -> range(...), en simplifiant "n - 1 + 1". */
function rangeOf(from: string, to: string, step: string | null) {
  const negative = step !== null && step.trim().startsWith('-')
  const bound = (b: string, delta: 1 | -1) => {
    if (/^-?\d+$/.test(b)) return String(Number(b) + delta)
    if (delta === 1 && / - 1$/.test(b)) return b.replace(/ - 1$/, '')
    if (delta === -1 && / \+ 1$/.test(b)) return b.replace(/ \+ 1$/, '')
    return `${b} ${delta === 1 ? '+' : '-'} 1`
  }
  if (step !== null && step !== '1') return `range(${from}, ${bound(to, negative ? -1 : 1)}, ${step})`
  const end = bound(to, 1)
  return from === '0' ? `range(${end})` : `range(${from}, ${end})`
}

function closingWord(kind: Block['kind']) {
  return { si: 'FinSi', pour: 'FinPour', tantque: 'FinTantQue', repeter: "Jusqu'à" }[kind]
}

/** Parametres d'un appel Lire(...) / Ecrire(...) : listes de jetons. */
function callArgs(tokens: Token[], line: number, errors: AlgoError[]): Token[][] | null {
  if (tokens[1]?.key !== '(' || tokens.at(-1)?.key !== ')') {
    errors.push({ line, message: `Parentheses attendues : ${tokens[0].raw}( ... )` })
    return null
  }
  const inner = tokens.slice(2, -1)
  const args: Token[][] = []
  let depth = 0
  let cur: Token[] = []
  for (const t of inner) {
    if (t.kind === 'op' && (t.key === '(' || t.key === '[')) depth++
    if (t.kind === 'op' && (t.key === ')' || t.key === ']')) depth--
    if (depth === 0 && t.kind === 'op' && t.key === ',') {
      args.push(cur)
      cur = []
    } else cur.push(t)
  }
  if (cur.length) args.push(cur)
  return args
}

/** Fonction nom(a : Entier, @T : Tab) : Entier */
function parseSignature(tokens: Token[], line: number, errors: AlgoError[]) {
  const name = tokens[1]
  if (name?.kind !== 'id') {
    errors.push({ line, message: `Nom du module manquant apres ${tokens[0].raw}` })
    return null
  }
  const params: Param[] = []
  const open = tokens.findIndex((t) => t.key === '(')
  const close = findOp(tokens, ')', open + 1)
  if (open > 0 && close > open) {
    const pending: { name: string; ref: boolean }[] = []
    let ref = false
    for (let i = open + 1; i < close; i++) {
      const t = tokens[i]
      if (t.key === '@') ref = true
      else if (t.kind === 'id' && tokens[i - 1]?.key !== ':') {
        pending.push({ name: t.raw, ref })
        ref = false
      } else if (t.key === ':') {
        const type = tokens[i + 1]?.key ?? ''
        for (const p of pending.splice(0)) params.push({ ...p, type })
        i++
      }
    }
    for (const p of pending) params.push({ ...p, type: '' })
  }
  return { name: name.raw, params }
}

/** Pour i de <debut> à <fin> [(Pas = p)] Faire */
function parseFor(tokens: Token[], line: number, errors: AlgoError[]) {
  const counter = tokens[1]
  if (counter?.kind !== 'id' || !isKey(tokens[2], 'de')) {
    errors.push({ line, message: 'Forme attendue : Pour i de debut à fin Faire' })
    return null
  }
  let end = findOp(tokens, 'faire')
  if (end < 0) {
    errors.push({ line, message: '« Faire » manquant a la fin du Pour' })
    end = tokens.length
  }
  let body = tokens.slice(3, end)
  let step: Token[] | null = null
  const pas = body.findIndex((t, i) => t.key === '(' && isKey(body[i + 1], 'pas'))
  if (pas >= 0) {
    const eq = body.findIndex((t, i) => i > pas && t.key === '=')
    step = body.slice(eq + 1, body.length - 1)
    body = body.slice(0, pas)
  }
  // Le separateur est « à » (ou « a » : on choisit celui qui laisse deux expressions valides)
  const candidates = body.map((t, i) => (t.kind === 'id' && t.key === 'a' ? i : -1)).filter((i) => i > 0)
  const accented = candidates.filter((i) => body[i].accent)
  for (const i of accented.length ? accented : candidates) {
    try {
      parseExpr(body.slice(0, i))
      parseExpr(body.slice(i + 1))
      return { counter: counter.raw, from: body.slice(0, i), to: body.slice(i + 1), step }
    } catch {
      // separateur suivant
    }
  }
  errors.push({ line, message: 'Bornes du Pour introuvables : Pour i de debut à fin Faire' })
  return null
}

/** Parametre @ scalaire ecrit avant d'etre lu : il devient une variable locale renvoyee. */
function dropped(m: Module, p: Param) {
  return p.ref && SCALAR_TYPES.has(p.type) && m.firstUse.get(p.name.toLowerCase()) !== 'read'
}

/** Une procedure renvoie ses parametres scalaires passes par reference (@). */
function returnRefs(m: Module, line: number | null) {
  const refs = m.params.filter((p) => p.ref && SCALAR_TYPES.has(p.type))
  if (refs.length) m.lines.push({ text: `return ${refs.map((p) => p.name).join(', ')}`, indent: 1, line })
}

const IMPLICIT = new Set([...Object.keys(PREDEFINED), 'vrai', 'faux'])

/** Chaque objet utilise doit etre declare (TDO) ou etre un parametre du module. */
function checkTdo(
  modules: Module[],
  tdo: Map<string, TdoRow>,
  signatures: Map<string, Param[]>,
  errors: AlgoError[],
) {
  const moduleNames = new Set([...signatures.keys()])
  for (const m of modules) {
    const params = new Set(m.params.map((p) => p.name.toLowerCase()))
    const seen = new Set<string>()
    const report = (key: string, name: string, line: number, assigned: boolean) => {
      if (seen.has(key) || params.has(key) || moduleNames.has(key) || IMPLICIT.has(key)) return
      seen.add(key)
      if (!tdo.has(key)) {
        errors.push({
          line,
          message: assigned
            ? `« ${name} » n'est pas declare dans le TDO`
            : `« ${name} » est utilise mais n'est pas declare dans le TDO`,
        })
      }
    }
    for (const [key, v] of m.assigned) report(key, v.name, v.line, true)
    for (const [key, v] of m.read) {
      if (key.startsWith('()')) {
        const fn = key.slice(2)
        if (!moduleNames.has(fn)) errors.push({ line: v.line, message: `Le module « ${v.name} » n'existe pas` })
        continue
      }
      report(key, v.name, v.line, false)
    }
  }
}

/** Code Python final : imports, modules, puis programme principal. */
function assemble(modules: Module[], tdo: TdoRow[], imports: Imports) {
  const out: { text: string; line: number | null }[] = []
  const arrays = tdo.filter((row) => row.type === 'Tableau')
  if (arrays.length) out.push({ text: 'from numpy import *', line: null })
  if (imports.math) out.push({ text: 'from math import *', line: null })
  if (imports.random) out.push({ text: 'from random import *', line: null })
  if (out.length) out.push({ text: '', line: null })

  const pad = (n: number) => '    '.repeat(n)
  for (const m of modules.filter((x) => x.kind !== 'main')) {
    const params = m.params
      .filter((p) => !dropped(m, p))
      .map((p) => p.name)
      .join(', ')
    out.push({ text: `def ${m.name}(${params}):`, line: m.line })
    if (m.lines.length === 0) out.push({ text: '    pass', line: m.line })
    for (const l of m.lines) out.push({ text: pad(l.indent) + (l.render?.() ?? l.text), line: l.line })
    out.push({ text: '', line: null }, { text: '', line: null })
  }

  const init = { Entier: 'int()', Réel: 'float()', Booléen: 'bool()', Caractère: 'str()', Chaîne: 'str()' }
  for (const row of arrays) {
    const elem = row.elem ?? 'Entier'
    const dtype = elem === 'Chaîne' || elem === 'Caractère' ? ', dtype=object' : ''
    out.push({ text: `${row.name} = array([${init[elem]}] * ${row.size ?? 100}${dtype})`, line: null })
  }
  for (const m of modules.filter((x) => x.kind === 'main')) {
    for (const l of m.lines) out.push({ text: pad(l.indent) + (l.render?.() ?? l.text), line: l.line })
  }
  while (out.length && out.at(-1)!.text === '') out.pop()
  return { python: out.map((l) => l.text).join('\n') + '\n', lineMap: out.map((l) => l.line) }
}
