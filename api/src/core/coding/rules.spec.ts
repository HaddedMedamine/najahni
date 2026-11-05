import { describe, expect, it } from 'vitest';
import { codeLines, starsFor, trackOf } from './rules.js';

describe('parcours Coder', () => {
  it.each([
    ['Bac', 'Info', 'BAC_INFO'],
    ['4ème', 'Sciences', 'BASES'],
    ['Bac', 'Math', 'BASES'],
    ['Bac', 'Technique', 'BASES'],
    ['Bac', 'Eco', 'BAC_ECO'],
    ['3ème', 'Info', 'TROIS_SI'],
    ['3eme', 'Sciences', 'BASES'],
    ['2ème', 'Info', 'BASES'],
    ['2ème', 'Lettres', null],
    ['Bac', 'Lettres', null],
    ['1ère', 'Info', null],
  ])('%s %s -> %s', (level, section, track) => {
    expect(trackOf(level, section)).toBe(track);
  });

  it('compte les lignes utiles et donne les etoiles', () => {
    const code = '# commentaire\nfor i in range(8):\n\n    avancer()\n';
    expect(codeLines(code)).toBe(2);
    const grid = { worlds: [], stars: [2, 3] };
    expect(starsFor('GRID', grid, code, 9)).toBe(3);
    expect(starsFor('GRID', grid, code + 'avancer()\n', 1)).toBe(2);
    expect(starsFor('PYTHON', {}, '', 2)).toBe(3);
    expect(starsFor('PYTHON', {}, '', 5)).toBe(2);
    expect(starsFor('PYTHON', {}, '', 6)).toBe(1);
  });
});
