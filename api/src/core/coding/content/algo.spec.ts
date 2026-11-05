import { fileURLToPath, pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import type { TdoRow } from '../types.js';

// Traducteur algorithme <-> Python du frontend (frontend/src/core/algo)
const frontend = new URL('../../../../../frontend/', import.meta.url);
const load = (path: string) =>
  import(pathToFileURL(fileURLToPath(new URL(path, frontend))).href);

type Result = {
  python: string;
  lineMap: (number | null)[];
  errors: { line: number | null; message: string }[];
};
let transpile: (source: string, tdo: TdoRow[] | null) => Result;
let pythonToAlgo: (code: string) => { algo: string; tdo: TdoRow[] };

const int = (...names: string[]): TdoRow[] =>
  names.map((name) => ({ name, type: 'Entier' }));

beforeAll(async () => {
  ({ transpile } = await load('src/core/algo/transpile.ts'));
  ({ pythonToAlgo } = await load('src/core/algo/toAlgo.ts'));
});

describe('algorithme -> Python', () => {
  it('traduit Lire / Ecrire, div / mod et garde les lignes', () => {
    const r = transpile(
      'ALGORITHME T\nDEBUT\n  Ecrire("t = "), Lire(t)\n  h ← t div 3600\n  Ecrire(h, t mod 60)\nFIN',
      int('t', 'h'),
    );
    expect(r.errors).toEqual([]);
    expect(r.python).toBe(
      't = int(input("t = "))\nh = t // 3600\nprint(h, t % 60)\n',
    );
    expect(r.lineMap).toEqual([3, 4, 5]);
  });

  it('exige le TDO', () => {
    const r = transpile('DEBUT\n  Lire(n)\n  s ← n + x\nFIN', int('n'));
    expect(r.errors.map((e) => e.line)).toEqual([3, 3]);
    expect(r.errors[0].message).toContain('« s »');
  });

  it('traduit Si en ligne, Sinon si, Pour avec Pas et ∈', () => {
    const r = transpile(
      'DEBUT\nPour i de 9 à 0 (Pas = -1) Faire\n Si c ∈ ["A".."Z"] Alors Ecrire(i) Sinon si i = 3 Alors Ecrire("x") FinSi\nFin Pour\nFIN',
      [...int('i'), { name: 'c', type: 'Caractère' }],
    );
    expect(r.errors).toEqual([]);
    expect(r.python).toContain('for i in range(9, -1, -1):');
    expect(r.python).toContain('if "A" <= c <= "Z":');
    expect(r.python).toContain('elif i == 3:');
  });

  it("traduit Repeter ... Jusqu'a et les procedures @", () => {
    const r = transpile(
      "ALGORITHME P\nDEBUT\n  Saisir(n)\n  Ecrire(n)\nFIN\nProcédure Saisir(@n : Entier)\nDEBUT\n  Répéter\n    Lire(n)\n  Jusqu'à n > 0\nFIN",
      int('n'),
    );
    expect(r.errors).toEqual([]);
    expect(r.python).toContain(
      'def Saisir():\n    while True:\n        n = int(input())\n        if n > 0:\n            break\n    return n',
    );
    expect(r.python).toContain('n = Saisir()');
  });

  it('signale les blocs mal fermes et les modules inconnus', () => {
    const r = transpile('DEBUT\n Si x > 0 Alors\n  x ← f(x)\nFIN', int('x'));
    const messages = r.errors.map((e) => e.message).join(' | ');
    expect(messages).toContain('FinSi');
    expect(messages).toContain('« f »');
  });
});

describe('Python -> algorithme', () => {
  it('traduit un programme du cours et propose le TDO', () => {
    const { algo, tdo } = pythonToAlgo(
      'n = int(input("n = "))\nwhile True:\n    x = int(input())\n    if x > 0:\n        break\ns = 0\nfor i in range(1, n + 1):\n    s = s + i % 10\nprint("S =", s // 2, len("ab"))',
    );
    expect(algo).toContain('Ecrire("n = "), Lire(n)');
    expect(algo).toContain("Jusqu'à x > 0");
    expect(algo).toContain('Pour i de 1 à n Faire');
    expect(algo).toContain('s ← s + i mod 10');
    expect(algo).toContain('Ecrire("S =", s div 2, Long("ab"))');
    expect(tdo.map((r) => r.name)).toEqual(['n', 'x', 's', 'i']);
    // aller-retour : le brouillon redevient du Python valide
    expect(transpile(algo, tdo).errors).toEqual([]);
  });
});
