import type { PackChapter } from '../types.js';
import { BAC } from './bac.js';
import { RAPPEL } from './bac-rappel.js';
import { avecDefis, SUITE } from './bac-suite.js';
import { DOORS } from './doors.js';
import { MOUSE } from './mouse.js';

/** Contenu fourni avec l'application, synchronise en base au demarrage. */
export const CODING_PACK: PackChapter[] = [
  ...MOUSE,
  ...DOORS,
  ...avecDefis([...RAPPEL, ...BAC]),
  ...SUITE,
];
