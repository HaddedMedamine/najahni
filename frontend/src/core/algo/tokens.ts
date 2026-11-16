// Decoupage d'un algorithme (notation des programmes tunisiens) en jetons.
// Fichier sans dependance : utilise dans le navigateur et dans les tests (Node).

export type TokenKind = 'num' | 'str' | 'id' | 'op'

export interface Token {
  kind: TokenKind
  /** Texte tel qu'ecrit par l'eleve. */
  raw: string
  /** Mot-cle normalise (minuscules, sans accents) pour les identifiants. */
  key: string
  /** `à` accentue : separe sans ambiguite les bornes d'une boucle Pour. */
  accent?: boolean
  /** « fin » ou « debut » employe comme nom de variable, pas comme mot-cle. */
  variable?: boolean
}

/** Minuscules sans accents : "Répéter" -> "repeter", "Aléa" -> "alea". */
export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

// « … » : type a completer (brouillon traduit depuis Python)
const OPERATORS = ['<-', ':=', '<=', '>=', '<>', '…', '..', '←', '≠', '≤', '≥', '∈', '(', ')', '[', ']', ',', ':', ';', '+', '-', '*', '/', '=', '<', '>', '@', '.']
const QUOTES: Record<string, string> = { '"': '"', "'": "'", '“': '”', '«': '»', '”': '”' }

export class AlgoSyntaxError extends Error {
  readonly column: number
  constructor(message: string, column: number) {
    super(message)
    this.column = column
  }
}

/** Jetons d'une ligne (les commentaires `#` et `//` en debut de ligne sont ignores). */
export function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const trimmed = line.trimStart()
  if (trimmed.startsWith('#') || trimmed.startsWith('//')) return tokens

  while (i < line.length) {
    const c = line[i]
    if (/\s/.test(c)) {
      i++
      continue
    }
    if (c === '#') break

    // Jusqu'à (l'apostrophe ne commence pas une chaine)
    const until = /^jusqu['’]\s*[àa]\b/i.exec(line.slice(i)) ?? /^jusqu['’]\s*[àa]/i.exec(line.slice(i))
    if (until) {
      tokens.push({ kind: 'id', raw: until[0], key: 'jusqua' })
      i += until[0].length
      continue
    }

    if (c in QUOTES) {
      const close = QUOTES[c]
      const end = line.indexOf(close, i + 1)
      if (end < 0) throw new AlgoSyntaxError('Guillemet fermant manquant', i)
      tokens.push({ kind: 'str', raw: line.slice(i + 1, end), key: '' })
      i = end + 1
      continue
    }

    const num = /^\d+(\.\d+)?/.exec(line.slice(i))
    if (num) {
      tokens.push({ kind: 'num', raw: num[0], key: num[0] })
      i += num[0].length
      continue
    }

    const word = /^[\p{L}_][\p{L}\p{N}_]*/u.exec(line.slice(i))
    if (word) {
      tokens.push({ kind: 'id', raw: word[0], key: normalize(word[0]), accent: word[0] === 'à' || word[0] === 'À' })
      i += word[0].length
      continue
    }

    const op = OPERATORS.find((o) => line.startsWith(o, i))
    if (op) {
      tokens.push({ kind: 'op', raw: op, key: op === '<-' || op === ':=' ? '←' : op })
      i += op.length
      continue
    }
    throw new AlgoSyntaxError(`Caractere inattendu « ${c} »`, i)
  }
  return mergeKeywords(tokens)
}

/** "Fin Si" -> finsi, "Tant que" -> tantque, "Sinon si" -> sinonsi... */
function mergeKeywords(tokens: Token[]): Token[] {
  const out: Token[] = []
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    const next = tokens[i + 1]?.kind === 'id' ? tokens[i + 1].key : ''
    const next2 = tokens[i + 2]?.kind === 'id' ? tokens[i + 2].key : ''
    if (t.kind === 'id') {
      if (t.key === 'fin' && next === 'tant' && next2 === 'que') {
        out.push({ ...t, raw: 'FinTantQue', key: 'fintantque' })
        i += 2
        continue
      }
      if (t.key === 'fin' && ['si', 'pour', 'tantque'].includes(next)) {
        out.push({ ...t, raw: `Fin${next}`, key: `fin${next}` })
        i++
        continue
      }
      if (t.key === 'tant' && next === 'que') {
        out.push({ ...t, raw: 'TantQue', key: 'tantque' })
        i++
        continue
      }
      if (t.key === 'sinon' && next === 'si') {
        out.push({ ...t, raw: 'Sinon si', key: 'sinonsi' })
        i++
        continue
      }
      if (t.key === 'repeter' || t.key === 'repete') {
        out.push({ ...t, key: 'repeter' })
        continue
      }
    }
    out.push(t)
  }
  return out
}
