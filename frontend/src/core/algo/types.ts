// Tableau de declaration des nouveaux types (TDNT), ecrit au debut de l'algorithme :
//   Type
//       Eleve = Enregistrement
//           nom : Chaîne
//           age, classe : Entier
//       Fin
//       Tab = Tableau de 50 Eleve
//       Mat = Tableau de 10 lignes * 20 colonnes d'entiers
import { normalize } from './tokens.ts'

export type DeclaredType =
  | { kind: 'record'; name: string; fields: { name: string; type: string }[] }
  | { kind: 'array'; name: string; size: number; elem: string }
  | { kind: 'matrix'; name: string; rows: number; cols: number; elem: string }
  | { kind: 'file'; name: string }

const NAME = String.raw`[\p{L}_][\p{L}\p{N}_]*`
const OF = String.raw`(?:de\s+|d['’]\s*)?`
const RECORD = new RegExp(String.raw`^(${NAME})\s*=\s*enregistrement$`, 'iu')
const MATRIX = new RegExp(String.raw`^(${NAME})\s*=\s*tableau\s+de\s+(\d+)\s+lignes?\s*[*x×]\s*(\d+)\s+colonnes?\s+${OF}(.+)$`, 'iu')
const ARRAY = new RegExp(String.raw`^(${NAME})\s*=\s*tableau\s+de\s+(\d+)\s+${OF}(.+)$`, 'iu')
const FILE = new RegExp(String.raw`^(${NAME})\s*=\s*fichier\b`, 'iu')
const FIELD = new RegExp(String.raw`^(${NAME}(?:\s*,\s*${NAME})*)\s*:\s*(.+)$`, 'u')

const BASE: Record<string, string> = {
  entier: 'Entier',
  reel: 'Réel',
  booleen: 'Booléen',
  caractere: 'Caractère',
  chaine: 'Chaîne',
}

/** "entiers", "Chaîne de caractères", "data" -> type du TDO, ou le nom d'un nouveau type. */
export function typeName(text: string) {
  const word = normalize(text.trim()).split(/\s+/)[0]
  return BASE[word] ?? BASE[word.replace(/s$/, '')] ?? text.trim()
}

export const isBaseType = (type: string) => Object.values(BASE).includes(type)

/** Retire le bloc Type du texte (les lignes restent a leur place) et lit ses declarations. */
export function parseTypes(source: string) {
  const types = new Map<string, DeclaredType>()
  const errors: { line: number; message: string }[] = []
  let inBlock = false
  let record: Extract<DeclaredType, { kind: 'record' }> | null = null
  const add = (type: DeclaredType) => types.set(type.name.toLowerCase(), type)

  const lines = source.split(/\r?\n/).map((text, index) => {
    const line = index + 1
    const trimmed = text.trim()
    const first = normalize(trimmed).split(/[\s(]/)[0]
    if (!inBlock) {
      if (first !== 'type' && first !== 'types') return text
      if (trimmed.length !== first.length) return text
      inBlock = true
      return ''
    }
    if (['algorithme', 'fonction', 'procedure', 'debut'].includes(first) && !FIELD.test(trimmed)) {
      inBlock = false
      return text
    }
    if (!trimmed) return ''
    if (record) {
      if ((first === 'fin' || first === 'finenregistrement') && !FIELD.test(trimmed)) {
        record = null
        return ''
      }
      const field = FIELD.exec(trimmed)
      if (field) {
        for (const name of field[1].split(',')) record.fields.push({ name: name.trim(), type: typeName(field[2]) })
      } else errors.push({ line, message: 'Champ attendu : nom : type' })
      return ''
    }
    let m: RegExpExecArray | null
    if ((m = RECORD.exec(trimmed))) {
      record = { kind: 'record', name: m[1], fields: [] }
      add(record)
    } else if ((m = MATRIX.exec(trimmed))) {
      add({ kind: 'matrix', name: m[1], rows: Number(m[2]), cols: Number(m[3]), elem: typeName(m[4]) })
    } else if ((m = ARRAY.exec(trimmed))) {
      add({ kind: 'array', name: m[1], size: Number(m[2]), elem: typeName(m[3]) })
    } else if ((m = FILE.exec(trimmed))) {
      add({ kind: 'file', name: m[1] })
    } else {
      errors.push({ line, message: 'Type attendu : Nom = Enregistrement, ou Nom = Tableau de ...' })
    }
    return ''
  })
  if (record) errors.push({ line: lines.length, message: `Fin manquant pour l'enregistrement ${(record as { name: string }).name}` })
  return { source: lines.join('\n'), types, errors }
}
