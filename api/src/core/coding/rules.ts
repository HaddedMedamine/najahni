import type {
  CodeLevelKind,
  CodeTrack,
} from '../../generated/prisma/client.js';
import type { GridData } from './types.js';

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

/**
 * Parcours d'un eleve selon son niveau et sa section (saisie libre : "Bac", "4ème",
 * "3eme", "2ème"... et "Info", "Sciences", "Math", "Technique", "Eco"...).
 * null = pas de parcours pour ce niveau.
 */
export function trackOf(level: string, section: string): CodeTrack | null {
  const l = normalize(level);
  const s = normalize(section);
  const info = /info|^si$|^ti$/.test(s);
  const scientific = /sc|math|tech/.test(s);
  if (/bac|^4/.test(l)) {
    if (info) return 'BAC_INFO';
    if (/eco|gestion/.test(s)) return 'BAC_ECO';
    return scientific ? 'BASES' : null;
  }
  if (l.startsWith('3')) {
    if (info) return 'TROIS_SI';
    return scientific ? 'BASES' : null;
  }
  if (l.startsWith('2')) return info ? 'BASES' : null;
  return null;
}

/** Lignes de code utiles (sans lignes vides ni commentaires). */
export const codeLines = (code: string) =>
  code.split('\n').filter((line) => {
    const t = line.trim();
    return t !== '' && !t.startsWith('#');
  }).length;

/**
 * Etoiles d'un niveau reussi :
 * - Mission souris : selon la longueur du code (court = boucles bien utilisees) ;
 * - Portes du code : selon le nombre d'essais.
 */
export function starsFor(
  kind: CodeLevelKind,
  data: unknown,
  code: string,
  attempts: number,
) {
  if (kind === 'GRID') {
    const [three, two] = (data as GridData).stars;
    const lines = codeLines(code);
    return lines <= three ? 3 : lines <= two ? 2 : 1;
  }
  return attempts <= 2 ? 3 : attempts <= 5 ? 2 : 1;
}
