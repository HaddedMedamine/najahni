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

describe('enregistrements et matrices', () => {
  const type = `Type
    Eleve = Enregistrement
        nom : Chaîne
        age, classe : Entier
        moy : Réel
    Fin
    Tab = Tableau de 30 Eleve
    Mat = Tableau de 3 lignes * 4 colonnes d'entiers
`;

  it('declare un enregistrement et lit ses champs selon leur type', () => {
    const r = transpile(
      `${type}\nALGORITHME T\nDEBUT\n  Lire(E.nom)\n  Lire(E.age)\n  Lire(E.moy)\n  Ecrire(E.nom)\nFIN`,
      [{ name: 'E', type: 'Eleve' }],
    );
    expect(r.errors).toEqual([]);
    expect(r.python).toContain(
      'E = dict(nom=str(), age=int(), classe=int(), moy=float())',
    );
    expect(r.python).toContain('E["nom"] = input()');
    expect(r.python).toContain('E["age"] = int(input())');
    expect(r.python).toContain('E["moy"] = float(input())');
    expect(r.python).toContain('print(E["nom"])');
  });

  it('garde un dictionnaire par case et la ligne des erreurs', () => {
    const r = transpile(
      `${type}\nALGORITHME T\nDEBUT\n  Lire(T[0].moy)\n  x ← T[0].moy\nFIN`,
      [
        { name: 'T', type: 'Tab' },
        { name: 'x', type: 'Réel' },
      ],
    );
    expect(r.errors).toEqual([]);
    expect(r.python).toContain(
      'T = array([dict(nom=str(), age=int(), classe=int(), moy=float()) for i in range(30)])',
    );
    expect(r.python).toContain('T[0]["moy"] = float(input())');
  });

  it('traduit M[i, j] et la declaration de la matrice', () => {
    const r = transpile(
      `${type}\nALGORITHME T\nDEBUT\n  M[1, 2] ← 5\n  Lire(M[0, 0])\n  Ecrire(M[1, 2] + 1)\nFIN`,
      [{ name: 'M', type: 'Mat' }],
    );
    expect(r.errors).toEqual([]);
    expect(r.python).toContain('M = array([[int()] * 4] * 3)');
    expect(r.python).toContain('M[1][2] = 5');
    expect(r.python).toContain('M[0][0] = int(input())');
    expect(r.python).toContain('print(M[1][2] + 1)');
  });

  it('signale un type du TDO qui n\'est pas declare', () => {
    const r = transpile('ALGORITHME T\nDEBUT\n  Ecrire(E.nom)\nFIN', [
      { name: 'E', type: 'Eleve' },
    ]);
    expect(r.errors[0].message).toContain('« Eleve »');
  });

  it("refuse un champ qui n'est pas dans le type", () => {
    const r = transpile(
      `${type}\nALGORITHME T\nDEBUT\n  Lire(E.note)\n  Ecrire(T[0].prenom)\nFIN`,
      [
        { name: 'E', type: 'Eleve' },
        { name: 'T', type: 'Tab' },
      ],
    );
    expect(r.errors.map((e) => e.message)).toEqual([
      "Le champ « note » n'existe pas dans Eleve",
      "Le champ « prenom » n'existe pas dans Eleve",
    ]);
  });

  it('signale un champ mal ecrit et un Fin oublie', () => {
    const field = transpile('Type\n  A = Enregistrement\n  nom\n  Fin', []);
    expect(field.errors[0]).toEqual({
      line: 3,
      message: 'Champ attendu : nom : type',
    });
    const end = transpile('Type\n  A = Enregistrement\n  nom : Entier', []);
    expect(end.errors[0].message).toContain('Fin manquant');
  });

  it('traduit dict et M[i][j] de Python en algorithme', () => {
    const { algo } = pythonToAlgo(
      [
        'E = dict()',
        'E["nom"] = input("Nom : ")',
        'E["age"] = 17',
        'M[i][j] = E["age"]',
        'print(E["nom"], M[i][j])',
      ].join('\n'),
    );
    expect(algo).toContain('Ecrire("Nom : "), Lire(E.nom)');
    expect(algo).toContain('E.age ← 17');
    expect(algo).toContain('M[i, j] ← E.age');
    expect(algo).toContain('Ecrire(E.nom, M[i, j])');
  });
});

describe('TDO dans un seul champ', () => {
  type Row = TdoRow & { cols?: number };
  let parseTdo: (text: string) => {
    rows: Row[];
    errors: { line: number; message: string }[];
  };
  let formatTdo: (rows: Row[]) => string;

  beforeAll(async () => {
    ({ parseTdo, formatTdo } = await load('src/core/algo/tdo.ts'));
  });

  it('declare plusieurs variables sur une ligne, sans tenir compte de la casse', () => {
    expect(parseTdo('i,j,n:entier\n\nmoy : reel').rows).toEqual([
      { name: 'i', type: 'Entier' },
      { name: 'j', type: 'Entier' },
      { name: 'n', type: 'Entier' },
      { name: 'moy', type: 'Réel' },
    ]);
  });

  it('comprend les tableaux, les matrices, les fichiers et les nouveaux types', () => {
    const { rows } = parseTdo(
      "T : Tableau de 50 entiers\nM : tableau de 3 lignes * 4 colonnes d'entiers\nF, G : Fichier texte\nE : Eleve",
    );
    expect(rows).toEqual([
      { name: 'T', type: 'Tableau', size: 50, elem: 'Entier' },
      { name: 'M', type: 'Tableau', size: 3, cols: 4, elem: 'Entier' },
      { name: 'F', type: 'Fichier' },
      { name: 'G', type: 'Fichier' },
      { name: 'E', type: 'Eleve' },
    ]);
    expect(parseTdo(formatTdo(rows)).rows).toEqual(rows);
  });

  it('regroupe les objets voisins de meme type', () => {
    expect(
      formatTdo([
        { name: 'i', type: 'Entier' },
        { name: 'j', type: 'Entier' },
        { name: 's', type: 'Réel' },
      ]),
    ).toBe('i, j : Entier\ns : Réel');
  });

  it('signale une ligne sans deux-points', () => {
    expect(parseTdo('i : Entier\nj Entier').errors).toEqual([
      { line: 2, message: 'Forme attendue : i, j, n : Entier' },
    ]);
  });

  it('declare la matrice du TDO en Python', () => {
    const { rows } = parseTdo('M : Tableau de 2 lignes * 3 colonnes de Réel');
    const r = transpile('ALGORITHME T\nDEBUT\n  Lire(M[0, 1])\nFIN', rows);
    expect(r.errors).toEqual([]);
    expect(r.python).toContain('M = array([[float()] * 3] * 2)');
    expect(r.python).toContain('M[0][1] = float(input())');
  });
});

describe('fichiers de donnees', () => {
  it('traduit Ecrire et Lire avec dump et load', () => {
    const r = transpile(
      [
        'ALGORITHME T',
        'DEBUT',
        '  Ouvrir("n.dat", F, "wb")',
        '  Ecrire(F, x)',
        '  Fermer(F)',
        '  Ouvrir("n.dat", F, "rb")',
        '  Lire(F, x)',
        '  Fermer(F)',
        'FIN',
      ].join('\n'),
      [{ name: 'F', type: 'Fichier' }, ...int('x')],
    );
    expect(r.errors).toEqual([]);
    expect(r.python).toContain('from pickle import *');
    expect(r.python).toContain('F = open("n.dat", "wb")');
    expect(r.python).toContain('dump(x, F)');
    expect(r.python).toContain('x = load(F)');
  });
});

describe('fichiers texte', () => {
  const tdo: TdoRow[] = [
    { name: 'F', type: 'Fichier' },
    { name: 'ch', type: 'Chaîne' },
  ];

  it('traduit Ouvrir, Lire_ligne, Fin_fichier, Ecrire_nl et Fermer', () => {
    const r = transpile(
      [
        'ALGORITHME T',
        'DEBUT',
        '  Ouvrir("a.txt", F, "r")',
        '  TantQue Non Fin_fichier(F) Faire',
        '    Lire_ligne(F, ch)',
        '    Ecrire(ch)',
        '  FinTantQue',
        '  Fermer(F)',
        '  Ouvrir("b.txt", F, "w")',
        '  Ecrire(F, "x")',
        '  Ecrire_nl(F, ch)',
        '  Lire(F, ch)',
        '  Fermer(F)',
        'FIN',
      ].join('\n'),
      tdo,
    );
    expect(r.errors).toEqual([]);
    expect(r.python).toContain('F = open("a.txt", "r")');
    expect(r.python).toContain('while not Fin_fichier(F):');
    expect(r.python).toContain('ch = F.readline().rstrip("\\n")');
    expect(r.python).toContain('print(ch)');
    expect(r.python).toContain('F.write("x")');
    expect(r.python).toContain('F.write(ch + "\\n")');
    expect(r.python).toContain('ch = F.read()');
    expect(r.python).toContain('F.close()');
  });

  it('exige que le fichier soit declare dans le TDO', () => {
    const r = transpile('Ouvrir("a.txt", F, "r")\nFermer(F)', []);
    expect(r.errors.map((e) => e.message).join()).toContain('« F »');
  });

  it('refuse un mode inconnu et un Fermer sans fichier', () => {
    const mode = transpile('Ouvrir("a.txt", F, "x")', tdo);
    expect(mode.errors[0].message).toContain('Mode');
    const close = transpile('Fermer(ch)', tdo);
    expect(close.errors[0].message).toContain('Fermer(F)');
  });

  it('reconnait un fichier passe en parametre', () => {
    const r = transpile(
      'Procedure P(@F : Fichier texte, ch : Chaîne)\nDébut\n  Ecrire_nl(F, ch)\nFin',
      [],
    );
    expect(r.errors).toEqual([]);
    expect(r.python).toContain('def P(F, ch):');
    expect(r.python).toContain('F.write(ch + "\\n")');
  });

  it('traduit un programme Python de fichiers en algorithme', () => {
    const { algo, tdo: rows } = pythonToAlgo(
      [
        'F = open("a.txt", "r")',
        'ch = F.readline()',
        'F.close()',
        'G = open("b.txt", "w")',
        'G.write(ch + "\\n")',
        'G.close()',
      ].join('\n'),
    );
    expect(algo).toContain('Ouvrir("a.txt", F, "r")');
    expect(algo).toContain('Lire_ligne(F, ch)');
    expect(algo).toContain('Ecrire_nl(G, ch)');
    expect(algo).toContain('Fermer(G)');
    expect(rows).toContainEqual({ name: 'F', type: 'Fichier' });
  });
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

  it('garde l ecriture de la declaration, meme en changeant les majuscules', () => {
    const r = transpile(
      'Procedure Tri(@T : Tab, n : Entier)\nDebut\n  AUX ← t[N - 1]\n  t[0] ← aux\nFin\nDEBUT\n  TRI(v, 3)\nFIN',
      [...int('aux'), { name: 'v', type: 'Tableau', elem: 'Entier', size: 3 }],
    );
    expect(r.errors).toEqual([]);
    expect(r.python).toContain('aux = T[n - 1]');
    expect(r.python).toContain('T[0] = aux');
    expect(r.python).toContain('Tri(v, 3)');
  });

  it('accepte fin et debut comme noms de variables', () => {
    const r = transpile(
      'DEBUT\n  debut ← 0\n  fin ← 3\n  TantQue debut < fin Faire\n    debut ← debut + T[fin]\n  FinTantQue\n  Pour i de debut à fin Faire\n    Ecrire(i)\n  FinPour\nFIN',
      [...int('debut', 'fin', 'i'), { name: 'T', type: 'Tableau', elem: 'Entier', size: 5 }],
    );
    expect(r.errors).toEqual([]);
    expect(r.python).toContain('fin = 3');
    expect(r.python).toContain('while debut < fin:');
    expect(r.python).toContain('debut = debut + T[fin]');
    expect(r.python).toContain('for i in range(debut, fin + 1):');
  });

  it('accepte un champ nomme fin dans un enregistrement', () => {
    const r = transpile(
      'Type\n  Periode = Enregistrement\n    debut, fin : Entier\n  Fin\nALGORITHME P\nDEBUT\n  p.fin ← 2\nFIN',
      [{ name: 'p', type: 'Periode' }],
    );
    expect(r.errors).toEqual([]);
  });

  it('garde un parametre @ lu avant ecriture ou ecrit sous condition', () => {
    const incr = transpile('Procedure Incr(@x : Entier)\nDebut\n  x ← x + 1\nFin', []);
    expect(incr.errors).toEqual([]);
    expect(incr.python).toContain('def Incr(x):');

    const si = transpile(
      'Procedure Borne(v : Entier, @x : Entier)\nDebut\n  Si v > 0 Alors\n    x ← v\n  FinSi\nFin',
      [],
    );
    expect(si.errors).toEqual([]);
    expect(si.python).toContain('def Borne(v, x):');
    expect(si.python).toContain('return x');
  });

  it('passe None pour une variable sans valeur, ecrite des deux cotes', () => {
    const r = transpile(
      'DEBUT\n  Grand(1, 2, m)\n  Ecrire(m)\nFIN\nProcedure Grand(a, b : Entier, @m : Entier)\nDebut\n  Si a > b Alors\n    m ← a\n  Sinon\n    m ← b\n  FinSi\nFin',
      int('m'),
    );
    expect(r.errors).toEqual([]);
    expect(r.python).toContain('m = Grand(1, 2, None)');
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
