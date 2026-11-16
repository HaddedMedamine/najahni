// Le TDO s'ecrit dans un seul champ, une declaration par ligne :
//   i, j, n : Entier
//   T : Tableau de 50 Entier
//   M : Tableau de 3 lignes * 4 colonnes d'entiers
//   F : Fichier texte
//   E : Eleve
import type { TdoRow } from './transpile.ts'
import { normalize } from './tokens.ts'
import { typeName } from './types.ts'

const NAMES = /^([\p{L}_][\p{L}\p{N}_]*(?:\s*,\s*[\p{L}_][\p{L}\p{N}_]*)*)\s*:\s*(.+)$/u
const OF = String.raw`(?:de\s+|d['’]\s*)?`
const MATRIX = new RegExp(String.raw`^tableau\s+de\s+(\d+)\s+lignes?\s*[*x×]\s*(\d+)\s+colonnes?\s+${OF}(.+)$`, 'iu')
const ARRAY = new RegExp(String.raw`^tableau\s+de\s+(\d+)\s+${OF}(.+)$`, 'iu')

/** "Tableau de 50 entiers", "Fichier texte", "eleve" -> nature de l'objet. */
function nature(text: string): Omit<TdoRow, 'name'> {
  let m: RegExpExecArray | null
  if ((m = MATRIX.exec(text))) return { type: 'Tableau', size: Number(m[1]), cols: Number(m[2]), elem: typeName(m[3]) }
  if ((m = ARRAY.exec(text))) return { type: 'Tableau', size: Number(m[1]), elem: typeName(m[2]) }
  const word = normalize(text).split(/\s+/)[0]
  if (word === 'fichier') return { type: 'Fichier' }
  if (word === 'tableau') return { type: 'Tableau', size: 50, elem: 'Entier' }
  return { type: typeName(text) }
}

export function parseTdo(text: string) {
  const rows: TdoRow[] = []
  const errors: { line: number; message: string }[] = []
  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim()
    if (!line) return
    const m = NAMES.exec(line)
    if (!m) {
      errors.push({ line: index + 1, message: 'Forme attendue : i, j, n : Entier' })
      return
    }
    for (const name of m[1].split(',')) rows.push({ name: name.trim(), ...nature(m[2].trim()) })
  })
  return { rows, errors }
}

const natureText = (row: TdoRow) => {
  if (row.type !== 'Tableau') return row.type
  const elem = row.elem ?? 'Entier'
  return row.cols ? `Tableau de ${row.size} lignes * ${row.cols} colonnes de ${elem}` : `Tableau de ${row.size ?? 50} ${elem}`
}

/** Lignes du champ : les objets voisins de meme nature sont regroupes. */
export function formatTdo(rows: TdoRow[]) {
  const lines: { names: string[]; nature: string }[] = []
  for (const row of rows.filter((r) => r.name.trim())) {
    const text = natureText(row)
    const last = lines.at(-1)
    if (last?.nature === text) last.names.push(row.name)
    else lines.push({ names: [row.name], nature: text })
  }
  return lines.map((l) => `${l.names.join(', ')} : ${l.nature}`).join('\n')
}
