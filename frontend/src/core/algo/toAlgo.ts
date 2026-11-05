// Traduction Python -> algorithme (notation des programmes tunisiens), ligne par ligne.
// Couvre ce qu'on ecrit au lycee : input/print, if/elif/else, for range, while,
// while True ... break (Repeter), def, return, fonctions predefinies.
import type { TdoRow, TdoType } from './transpile.ts'

interface Open {
  indent: number
  kind: 'si' | 'pour' | 'tantque' | 'repeter' | 'module'
  /** Lignes ecrites dans ce bloc (pour detecter "if c: break" en fin de Repeter). */
  start: number
}

const STRING = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g

/** Expression Python -> notation algorithmique (les chaines sont protegees). */
export function exprToAlgo(code: string): string {
  const strings: string[] = []
  let s = code.replace(STRING, (m) => {
    strings.push(`"${m.slice(1, -1)}"`)
    return `\uE000${strings.length - 1}\uE000`
  })
  const atom = String.raw`[\p{L}_][\p{L}\p{N}_]*(?:\[[^\[\]]*\])?`
  // 5 <= n <= 20 -> (5 ≤ n) et (n ≤ 20) : l'algorithme n'enchaine pas les comparaisons
  const operand = String.raw`-?[\p{L}\p{N}_.]+(?:\[[^\[\]]*\])?`
  s = s.replace(
    new RegExp(String.raw`(${operand})\s*(<=|<|>=|>)\s*(${operand})\s*(<=|<|>=|>)\s*(${operand})`, 'gu'),
    '($1 $2 $3) and ($3 $4 $5)',
  )
  const rules: [RegExp, string][] = [
    [new RegExp(String.raw`(${atom})\.upper\(\)`, 'gu'), 'Majus($1)'],
    [new RegExp(String.raw`(${atom})\.(?:isdigit|isnumeric)\(\)`, 'gu'), 'Estnum($1)'],
    [new RegExp(String.raw`(${atom})\.find\(([^()]*)\)`, 'gu'), 'Pos($2, $1)'],
    [/([\p{L}_][\p{L}\p{N}_]*)\[([^[\]:]*):([^[\]]*)\]/gu, 'Sous_Chaine($1, $2, $3)'],
    [/\blen\(/g, 'Long('],
    [/\bstr\(/g, 'Convch('],
    [/\bint\(/g, 'Ent('],
    [/\bfloat\(/g, 'Valeur('],
    [/\bord\(/g, 'Ord('],
    [/\bchr\(/g, 'Chr('],
    [/\babs\(/g, 'Abs('],
    [/\bround\(/g, 'Arrondi('],
    [/\bsqrt\(/g, 'RacineCarré('],
    [/\brandint\(/g, 'Aléa('],
    [/\s*\/\/\s*/g, ' div '],
    [/\s*%\s*/g, ' mod '],
    [/\s*==\s*/g, ' = '],
    [/\s*!=\s*/g, ' ≠ '],
    [/\s*<=\s*/g, ' ≤ '],
    [/\s*>=\s*/g, ' ≥ '],
    [/\band\b/g, 'et'],
    [/\bor\b/g, 'ou'],
    [/\bnot\b/g, 'non'],
    [/\bTrue\b/g, 'Vrai'],
    [/\bFalse\b/g, 'Faux'],
  ]
  for (const [re, by] of rules) s = s.replace(re, by)
  // Sous_Chaine(ch, , 3) -> 0 ; Sous_Chaine(ch, 2, ) -> Long(ch)
  s = s.replace(/Sous_Chaine\(([^,]+), \s*,/g, 'Sous_Chaine($1, 0,').replace(/Sous_Chaine\(([^,]+), ([^,]+), \s*\)/g, 'Sous_Chaine($1, $2, Long($1))')
  return s
    .replace(/\uE000(\d+)\uE000/g, (_, i) => strings[Number(i)])
    .replace(/\s+/g, ' ')
    .trim()
}

/** for i in range(...) -> bornes de la boucle Pour. */
function rangeToAlgo(args: string[]) {
  const minusOne = (b: string) => {
    if (/^-?\d+$/.test(b)) return String(Number(b) - 1)
    if (/ \+ 1$/.test(b)) return b.replace(/ \+ 1$/, '')
    return `${b} - 1`
  }
  const plusOne = (b: string) => (/^-?\d+$/.test(b) ? String(Number(b) + 1) : / - 1$/.test(b) ? b.replace(/ - 1$/, '') : `${b} + 1`)
  const [a, b, c] = args.map(exprToAlgo)
  if (args.length === 1) return `0 à ${minusOne(a)}`
  if (args.length === 2) return `${a} à ${minusOne(b)}`
  const negative = c.trim().startsWith('-')
  return `${a} à ${negative ? plusOne(b) : minusOne(b)} (Pas = ${c})`
}

/** Arguments de premier niveau : "a, f(b, c)" -> ["a", "f(b, c)"]. */
function splitArgs(s: string) {
  const out: string[] = []
  let depth = 0
  let cur = ''
  let quote = ''
  for (const c of s) {
    if (quote) {
      cur += c
      if (c === quote) quote = ''
      continue
    }
    if (c === '"' || c === "'") quote = c
    if ('([{'.includes(c)) depth++
    if (')]}'.includes(c)) depth--
    if (c === ',' && depth === 0) {
      out.push(cur.trim())
      cur = ''
    } else cur += c
  }
  if (cur.trim()) out.push(cur.trim())
  return out
}

const LINE_COMMENT = /\s+#.*$/

export interface AlgoDraft {
  algo: string
  /** Objets affectes, avec un type devine : a verifier par l'eleve. */
  tdo: TdoRow[]
}

export function pythonToAlgo(code: string): AlgoDraft {
  const main: string[] = []
  const modules: string[][] = []
  let out = main
  const open: Open[] = []
  const tdo = new Map<string, TdoRow>()
  const params = new Set<string>()
  const guess = (name: string, type: TdoType, extra: Partial<TdoRow> = {}) => {
    const base = name.replace(/\[.*$/, '')
    if (!params.has(base) && !tdo.has(base)) tdo.set(base, { name: base, type, ...extra })
  }
  const pad = () => '    '.repeat(open.filter((o) => o.kind !== 'module').length + (out === main ? 1 : 1))

  const close = (o: Open) => {
    if (o.kind === 'si') out.push(pad() + 'FinSi')
    else if (o.kind === 'pour') out.push(pad() + 'FinPour')
    else if (o.kind === 'tantque') out.push(pad() + 'FinTantQue')
    else if (o.kind === 'repeter') {
      // "Si c Alors / (sortir) / FinSi" en fin de bloc -> Jusqu'à c
      const n = out.length
      const m = /^\s*Si (.*) Alors$/.exec(out[n - 2] ?? '')
      if (m && out[n - 1]?.trim() === '__SORTIR__') {
        out.splice(n - 2, 2)
        out.push(pad() + `Jusqu'à ${m[1]}`)
      } else out.push(pad() + "Jusqu'à Faux")
    } else if (o.kind === 'module') {
      out.push('FIN')
      out = main
      params.clear()
    }
  }

  const lines = code.replace(/\t/g, '    ').split(/\r?\n/)
  for (const raw of lines) {
    const text = raw.replace(LINE_COMMENT, '')
    if (!text.trim() || text.trim().startsWith('#')) continue
    const indent = text.length - text.trimStart().length
    const t = text.trim()
    const isBranch = /^(elif\b|else\s*:)/.test(t)
    // Fermer les blocs dont on sort (un elif / else continue le Si)
    while (open.length) {
      const top = open.at(-1)!
      if (indent > top.indent) break
      if (isBranch && indent === top.indent && top.kind === 'si') break
      open.pop()
      // un if suivi de "break" ferme : on garde la trace pour le Repeter
      if (top.kind === 'si' && out.at(-1)?.trim() === '__SORTIR__') {
        const parent = open.at(-1)
        if (parent?.kind === 'repeter' && indent <= parent.indent) continue
        out.push(pad() + 'FinSi')
        continue
      }
      close(top)
    }

    let m: RegExpExecArray | null
    if (/^(from|import)\s/.test(t)) continue
    if ((m = /^def\s+(\w+)\s*\((.*)\)\s*:$/.exec(t))) {
      const body = lines.slice(lines.indexOf(raw) + 1)
      const returns = body.some((l) => /^\s+return\s+\S/.test(l))
      const args = splitArgs(m[2])
      args.forEach((a) => params.add(a))
      out = []
      modules.push(out)
      out.push(
        returns
          ? `Fonction ${m[1]}(${args.map((a) => `${a} : …`).join(', ')}) : …`
          : `Procédure ${m[1]}(${args.map((a) => `${a} : …`).join(', ')})`,
        'DEBUT',
      )
      open.push({ indent, kind: 'module', start: out.length })
      continue
    }
    if ((m = /^if\s+(.*):$/.exec(t))) {
      out.push(pad() + `Si ${exprToAlgo(m[1])} Alors`)
      open.push({ indent, kind: 'si', start: out.length })
      continue
    }
    if ((m = /^elif\s+(.*):$/.exec(t))) {
      open.pop()
      out.push(pad() + `Sinon si ${exprToAlgo(m[1])} Alors`)
      open.push({ indent, kind: 'si', start: out.length })
      continue
    }
    if (/^else\s*:$/.test(t)) {
      open.pop()
      out.push(pad() + 'Sinon')
      open.push({ indent, kind: 'si', start: out.length })
      continue
    }
    if ((m = /^for\s+(\w+)\s+in\s+range\((.*)\)\s*:$/.exec(t))) {
      guess(m[1], 'Entier')
      out.push(pad() + `Pour ${m[1]} de ${rangeToAlgo(splitArgs(m[2]))} Faire`)
      open.push({ indent, kind: 'pour', start: out.length })
      continue
    }
    if (/^while\s+True\s*:$/.test(t)) {
      out.push(pad() + 'Répéter')
      open.push({ indent, kind: 'repeter', start: out.length })
      continue
    }
    if ((m = /^while\s+(.*):$/.exec(t))) {
      out.push(pad() + `TantQue ${exprToAlgo(m[1])} Faire`)
      open.push({ indent, kind: 'tantque', start: out.length })
      continue
    }
    if (t === 'break') {
      out.push(pad() + '__SORTIR__')
      continue
    }
    if (t === 'pass') continue
    if ((m = /^return\s+(.*)$/.exec(t))) {
      out.push(pad() + `Retourner ${exprToAlgo(m[1])}`)
      continue
    }
    if ((m = /^print\((.*)\)$/.exec(t))) {
      const args = splitArgs(m[1]).filter((a) => !/^(sep|end)\s*=/.test(a))
      out.push(pad() + `Ecrire(${args.map(exprToAlgo).join(', ')})`)
      continue
    }
    // x = int(input("...")) -> Ecrire("..."), Lire(x)
    if ((m = /^([\w[\]+\-* ]+?)\s*=\s*(int|float)?\(?\s*input\((.*?)\)\s*\)?$/.exec(t))) {
      const [, name, conv, prompt] = m
      guess(name, conv === 'int' ? 'Entier' : conv === 'float' ? 'Réel' : 'Chaîne')
      out.push(pad() + (prompt.trim() ? `Ecrire(${exprToAlgo(prompt)}), Lire(${name.trim()})` : `Lire(${name.trim()})`))
      continue
    }
    // T = array([int()] * n) : declare dans le TDO
    if ((m = /^(\w+)\s*=\s*array\(\[\s*(int|float|str|bool)\(\)\s*\]\s*\*\s*(\w+)/.exec(t))) {
      const elem = { int: 'Entier', float: 'Réel', str: 'Chaîne', bool: 'Booléen' } as const
      guess(m[1], 'Tableau', { elem: elem[m[2] as keyof typeof elem], size: /^\d+$/.test(m[3]) ? Number(m[3]) : 50 })
      continue
    }
    if ((m = /^([\w[\]]+(?:\[[^\]]*\])?)\s*([+\-*])=\s*(.*)$/.exec(t))) {
      out.push(pad() + `${m[1]} ← ${m[1]} ${m[2]} ${exprToAlgo(m[3])}`)
      continue
    }
    if ((m = /^([\w, ]+?)\s*=\s*([^=].*)$/.exec(t)) && !/[=<>!]=/.test(t.slice(0, t.indexOf('=') + 2))) {
      const targets = m[1].split(',').map((x) => x.trim())
      if (targets.length === 1) {
        const value = m[2].trim()
        guess(
          targets[0],
          /^-?\d+$/.test(value) ? 'Entier' : /^-?\d+\.\d+$/.test(value) ? 'Réel' : /^["']/.test(value) ? 'Chaîne' : /^(True|False)$/.test(value) ? 'Booléen' : 'Entier',
        )
        out.push(pad() + `${targets[0]} ← ${exprToAlgo(value)}`)
      } else out.push(pad() + `${exprToAlgo(m[2])}`)
      continue
    }
    if ((m = /^(\w+(?:\[[^\]]*\])?)\s*=\s*(.*)$/.exec(t))) {
      out.push(pad() + `${m[1]} ← ${exprToAlgo(m[2])}`)
      continue
    }
    out.push(pad() + exprToAlgo(t))
  }
  while (open.length) {
    const top = open.pop()!
    close(top)
  }

  const body = main.map((l) => l.replace('__SORTIR__', '(sortir)'))
  const algo = ['ALGORITHME Programme', 'DEBUT', ...body, 'FIN', ...modules.flatMap((m) => ['', ...m])]
    .join('\n')
    .replace(/__SORTIR__/g, '(sortir)')
  return { algo, tdo: [...tdo.values()] }
}
