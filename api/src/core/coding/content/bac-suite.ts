import type {
  PackChapter,
  PackLevel,
  PythonTest,
  StoryData,
  TdoRow,
  TraceEvent,
} from '../types.js';
import { code, START } from './text.js';

/**
 * Jeu "Aventure Bac", suite du programme : fichiers de donnees, recursivite, recurrence,
 * arithmetique, conversion et approximation, puis les defis ajoutes aux premiers chapitres.
 * Exercices repris des series du professeur (Serie recursivite, resume arithmetique,
 * conversion entre bases, algo_approximation, Serie 1 fichiers).
 */

type Story = StoryData['story'];

interface Mission {
  slug: string;
  title: string;
  statement: string;
  bitou: string;
  python: string;
  algo: string;
  tdo: TdoRow[];
  hints: string[];
  tests: PythonTest[];
  stage: Story['stage'];
  objective: string;
  principle: string[];
  intro: Story['intro'];
  /** Explication du corrige : la mission est alors "resolue". */
  notes?: { code: string; why: string }[];
  chest?: boolean;
}

const objets = (type: string, ...names: string[]): TdoRow[] =>
  names.map((name) => ({ name, type }));
const entiers = (...names: string[]) => objets('Entier', ...names);
const reels = (...names: string[]) => objets('Réel', ...names);
const chaines = (...names: string[]) => objets('Chaîne', ...names);

/** Modules appeles par les tests : le seul squelette donne a l'eleve. */
function appeles(tests: PythonTest[]) {
  const text = tests.map((t) => `${t.expr ?? ''} ${t.setup ?? ''}`).join(' ');
  return new Set(
    [...text.matchAll(/\b([A-Za-z_]\w*)\(/g)].map((m) => m[1].toLowerCase()),
  );
}

function departPython(python: string, tests: PythonTest[]) {
  const noms = appeles(tests);
  const defs = python
    .split('\n')
    .filter((l) => noms.has(/^def (\w+)/.exec(l)?.[1].toLowerCase() ?? ''));
  return defs.length
    ? defs.map((d) => `${d}\n    pass`).join('\n\n\n')
    : START;
}

function departAlgo(algo: string, tests: PythonTest[]) {
  const noms = appeles(tests);
  const lignes = algo.split('\n').map((l) => l.trim());
  const modules = lignes
    .filter((l) =>
      noms.has(
        /^(?:Fonction|Procedure)\s+(\w+)/.exec(l)?.[1].toLowerCase() ?? '',
      ),
    )
    .map((l) => `${l}\nDébut\n\nFin`);
  const principal = lignes.find((l) => l.startsWith('ALGORITHME'));
  return [
    ...(principal ? [`${principal}\nDEBUT\n\nFIN`] : []),
    ...modules,
  ].join('\n\n');
}

function mission(m: Mission): PackLevel {
  return {
    slug: m.slug,
    kind: 'STORY',
    title: m.title,
    statement: m.statement,
    bitou: m.bitou,
    starterCode: departPython(m.python, m.tests),
    solution: m.python,
    hints: m.hints,
    data: {
      scene: m.chest ? 'chest' : 'door',
      tests: m.tests,
      algo: {
        starter: departAlgo(m.algo, m.tests),
        solution: m.algo,
        tdo: m.tdo,
      },
      story: {
        stage: m.stage,
        objective: m.objective,
        principle: m.principle,
        intro: m.intro,
        ...(m.notes && {
          solved: {
            python: m.python,
            algo: m.algo,
            tdo: m.tdo,
            notes: m.notes,
          },
        }),
      },
    },
  };
}

const chapitre = (
  slug: string,
  title: string,
  description: string,
  missions: Mission[],
): PackChapter => ({
  slug,
  kind: 'STORY',
  track: 'BAC_INFO',
  title,
  description,
  levels: missions.map(mission),
});

const SOLVED_BITOU =
  'Hedhi el mission el louwla : el 7all mawjoud ken t7eb tchoufou.\nAma el programme, enti eli tektbou.';

/** Test d'une fonction : son resultat, avec le suivi demande par la scene. */
const vaut = (
  expr: string,
  expected: string,
  label: string,
  more: Partial<PythonTest> = {},
): PythonTest => ({ expr, expected, label, ...more });

// ---------- Fichiers de donnees ----------

const NOTES = [12, 15, 9];
const notes = { 'notes.dat': NOTES.map(String) };

const BIN_LECTURE = code`
  from pickle import *
  F = open("notes.dat", "rb")
  fin = False
  while not fin:
      try:
          x = load(F)
          print(x)
      except:
          fin = True
  F.close()
`;

const lectureNotes: TraceEvent[] = [
  { t: 'open', file: 'notes.dat', mode: 'rb' },
  ...NOTES.map(
    (n): TraceEvent => ({ t: 'read', file: 'notes.dat', text: `${n}\n` }),
  ),
  { t: 'eof', file: 'notes.dat' },
  { t: 'close', file: 'notes.dat' },
];

const BINAIRES = chapitre(
  'bac-binaires',
  'Les fichiers de données',
  'Les archives : des fiches rangées dans des tiroirs, avec dump et load.',
  [
    {
      slug: 'bac-bin-remplir',
      title: 'Ranger les notes',
      statement: code`
        Écrire un programme qui saisit n, puis n notes entières,
        et les enregistre dans le fichier de données "notes.dat".
      `,
      bitou: SOLVED_BITOU,
      python: code`
        from pickle import *
        n = int(input("n : "))
        F = open("notes.dat", "wb")
        for i in range(n):
            x = int(input("Note : "))
            dump(x, F)
        F.close()
      `,
      algo: code`
        ALGORITHME Notes
        DEBUT
            Ecrire("n : "), Lire(n)
            Ouvrir("notes.dat", F, "wb")
            Pour i de 1 à n Faire
                Ecrire("Note : "), Lire(x)
                Ecrire(F, x)
            FinPour
            Fermer(F)
        FIN
      `,
      tdo: [...objets('Fichier', 'F'), ...entiers('n', 'i', 'x')],
      hints: [
        'Fichier de données : el mode fih "b".',
        'Fi Python, el objet yod5ol b dump, mouch b write.',
      ],
      tests: [
        {
          inputs: ['3', '12', '15', '9'],
          expr: '_objets("notes.dat")',
          expected: '[12, 15, 9]',
          closed: true,
          label: 'Les 3 notes sont rangées',
        },
        {
          inputs: ['1', '20'],
          expr: '_objets("notes.dat")',
          expected: '[20]',
          closed: true,
          hidden: true,
        },
      ],
      stage: { type: 'archive', drawers: { 'notes.dat': [] } },
      objective:
        'Trangi el notes fi tiroir : kol note objet, mouch ligne texte.',
      principle: [
        'Fichier texte yekhou lignes, ama fichier de données yekhou objets.',
        'Tet7all b "wb" (écriture), "rb" (lecture), "ab" (ajout).',
        'Ecrire(F, x) y7ott objet wa7ed. Fel Python : dump(x, F).',
      ],
      intro: [
        {
          say: 'Tiroir fergh. N7ellouh b "wb", w kol note tod5ol fiche.',
          events: [
            { t: 'open', file: 'notes.dat', mode: 'wb' },
            ...NOTES.map(
              (n): TraceEvent => ({
                t: 'write',
                file: 'notes.dat',
                text: `${n}\n`,
              }),
            ),
            { t: 'close', file: 'notes.dat' },
          ],
        },
      ],
      notes: [
        {
          code: 'Ouvrir("notes.dat", F, "wb")',
          why: '"wb" : écriture fi fichier de données. Ken mawjoud yetfassa5.',
        },
        {
          code: 'Ecrire(F, x)',
          why: 'Y7ott el objet x fel fichier. Fel Python : dump(x, F).',
        },
        { code: 'Fermer(F)', why: 'Nsakkrou el tiroir bech yetsajjel kol chay.' },
      ],
    },
    {
      slug: 'bac-bin-afficher',
      title: 'Lire les fiches',
      statement: code`
        Le fichier "notes.dat" contient des notes.
        Écrire un programme qui les affiche toutes, jusqu'à la fin du fichier.
      `,
      bitou:
        'Nafs el fekra mta3 el sac, ama hna ta9ra objets.\nFel Python, load y7abbes b erreur ki yousel lel fin.',
      python: BIN_LECTURE,
      algo: code`
        ALGORITHME Afficher
        DEBUT
            Ouvrir("notes.dat", F, "rb")
            TantQue Non Fin_fichier(F) Faire
                Lire(F, x)
                Ecrire(x)
            FinTantQue
            Fermer(F)
        FIN
      `,
      tdo: [...objets('Fichier', 'F'), ...entiers('x')],
      hints: [
        'Mode el lecture fih "b".',
        'Fel algorithme, Fin_fichier kif el sac.',
        'Fel Python, fin du fichier = try / except, kif el cours.',
      ],
      tests: [
        {
          records: { 'notes.dat': NOTES },
          numbers: ['12', '15', '9'],
          closed: true,
          label: 'Afficher 12, 15, 9',
        },
        {
          records: { 'notes.dat': [20] },
          numbers: ['20'],
          closed: true,
          hidden: true,
        },
      ],
      stage: { type: 'archive', drawers: notes },
      objective: 'Tejbed el fiches wa7da wa7da 7atta el tiroir yefregh.',
      principle: [
        'Lire tejbed objet wa7ed men el fichier. Fel Python : load.',
        'Tkammel ma dam mouch fin du fichier.',
      ],
      intro: [{ say: 'Fiche fiche, 7atta "!" yodhhor.', events: lectureNotes }],
    },
    {
      slug: 'bac-bin-meilleure',
      title: 'La meilleure note',
      statement: code`
        Écrire un programme qui affiche la meilleure note du fichier "notes.dat",
        puis la moyenne des notes.
      `,
      bitou:
        'Tour wa7ed fel fichier yekfi : fi nafs el boucle, tjamma3 w t9aren.',
      python: code`
        from pickle import *
        F = open("notes.dat", "rb")
        s = 0
        n = 0
        m = -1
        fin = False
        while not fin:
            try:
                x = load(F)
                s = s + x
                n = n + 1
                if x > m:
                    m = x
            except:
                fin = True
        F.close()
        print(m, s / n)
      `,
      algo: code`
        ALGORITHME Meilleure
        DEBUT
            Ouvrir("notes.dat", F, "rb")
            s ← 0
            n ← 0
            m ← -1
            TantQue Non Fin_fichier(F) Faire
                Lire(F, x)
                s ← s + x
                n ← n + 1
                Si x > m Alors
                    m ← x
                FinSi
            FinTantQue
            Fermer(F)
            Ecrire(m, " ", s / n)
        FIN
      `,
      tdo: [...objets('Fichier', 'F'), ...entiers('s', 'n', 'm', 'x')],
      hints: [
        'Thletha variables : somme, 3add, w a7sen note.',
        'El a7sen tebda b 9ima a9all men kol note.',
      ],
      tests: [
        {
          records: { 'notes.dat': NOTES },
          numbers: ['15', '12'],
          closed: true,
          label: 'Meilleure 15, moyenne 12',
        },
        {
          records: { 'notes.dat': [8, 4] },
          numbers: ['8', '6'],
          closed: true,
          hidden: true,
        },
      ],
      stage: { type: 'archive', drawers: notes },
      objective: 'Ta3ref a7sen note w el moyenne, b lecture wa7da.',
      principle: [
        'Kol fiche tejbedha, tzidha lel somme.',
        'W t9arenha m3a a7sen note l9itha.',
      ],
      intro: [{ say: 'Kol note tet3add w tet9aren.', events: lectureNotes }],
    },
    {
      slug: 'bac-bin-resultats',
      title: 'Les résultats de la classe',
      statement: code`
        Le fichier "eleves.dat" contient des enregistrements (nom, res), avec res = "A" (admis),
        "C" (contrôle) ou "R" (refusé). Afficher le pourcentage d'élèves admis.
      `,
      bitou:
        'Hedhi el fiche enregistrement kemla : lecture wa7da tejbed el carte el kol.\nMa tensech el bloc Type.',
      python: code`
        from pickle import *
        F = open("eleves.dat", "rb")
        n = 0
        a = 0
        fin = False
        while not fin:
            try:
                E = load(F)
                n = n + 1
                if E["res"] == "A":
                    a = a + 1
            except:
                fin = True
        F.close()
        print(a * 100 / n)
      `,
      algo: code`
        Type
            Eleve = Enregistrement
                nom : Chaîne
                res : Caractère
            Fin

        ALGORITHME Resultats
        DEBUT
            Ouvrir("eleves.dat", F, "rb")
            n ← 0
            a ← 0
            TantQue Non Fin_fichier(F) Faire
                Lire(F, E)
                n ← n + 1
                Si E.res = "A" Alors
                    a ← a + 1
                FinSi
            FinTantQue
            Fermer(F)
            Ecrire(a * 100 / n)
        FIN
      `,
      tdo: [
        ...objets('Fichier', 'F'),
        ...objets('Eleve', 'E'),
        ...entiers('n', 'a'),
      ],
      hints: [
        'Compteur lel kol, w compteur lel admis.',
        'Fel ekher : admis * 100 / total.',
      ],
      tests: [
        {
          records: {
            'eleves.dat': [
              { nom: 'Salma', res: 'A' },
              { nom: 'Ali', res: 'R' },
              { nom: 'Rim', res: 'A' },
              { nom: 'Sami', res: 'C' },
            ],
          },
          numbers: ['50'],
          closed: true,
          label: '2 admis sur 4 : 50 %',
        },
      ],
      stage: {
        type: 'archive',
        drawers: { 'eleves.dat': ['Salma A', 'Ali R', 'Rim A', 'Sami C'] },
      },
      objective: 'Ta7seb pourcentage el admis men el fiches.',
      principle: [
        'El fichier fih enregistrements : kol lecture tejbed carte.',
        'Ba3d testa3mel el champ res kif ay champ.',
      ],
      intro: [
        {
          say: 'Kol fiche carte kemla : nchoufou champ el résultat.',
          events: [
            { t: 'open', file: 'eleves.dat', mode: 'rb' },
            { t: 'read', file: 'eleves.dat', text: 'Salma A\n' },
            { t: 'read', file: 'eleves.dat', text: 'Ali R\n' },
          ],
        },
      ],
    },
    {
      slug: 'bac-bin-rond',
      title: 'Les nombres ronds',
      chest: true,
      statement: code`
        Un entier est rond si son écriture binaire contient autant de 1 que de 0
        (611 = 1001100011 est rond). Le fichier "naturels.dat" contient des entiers.
        Copier les nombres ronds dans "rond.dat" et les autres dans "non_rond.dat".
      `,
      bitou:
        'Mission el chapitre! Thletha fichiers m7loulin, w fonction t9ollek rond wala la.',
      python: code`
        from pickle import *


        def Rond(n):
            u = 0
            z = 0
            while n > 0:
                if n % 2 == 1:
                    u = u + 1
                else:
                    z = z + 1
                n = n // 2
            return u == z


        F = open("naturels.dat", "rb")
        R = open("rond.dat", "wb")
        N = open("non_rond.dat", "wb")
        fin = False
        while not fin:
            try:
                x = load(F)
                if Rond(x):
                    dump(x, R)
                else:
                    dump(x, N)
            except:
                fin = True
        F.close()
        R.close()
        N.close()
      `,
      algo: code`
        ALGORITHME Ronds
        DEBUT
            Ouvrir("naturels.dat", F, "rb")
            Ouvrir("rond.dat", R, "wb")
            Ouvrir("non_rond.dat", N, "wb")
            TantQue Non Fin_fichier(F) Faire
                Lire(F, x)
                Si Rond(x) Alors
                    Ecrire(R, x)
                Sinon
                    Ecrire(N, x)
                FinSi
            FinTantQue
            Fermer(F)
            Fermer(R)
            Fermer(N)
        FIN

        Fonction Rond(n : Entier) : Booléen
        Début
            u ← 0
            z ← 0
            TantQue n > 0 Faire
                Si n mod 2 = 1 Alors
                    u ← u + 1
                Sinon
                    z ← z + 1
                FinSi
                n ← n div 2
            FinTantQue
            Retourner u = z
        Fin
      `,
      tdo: [
        ...objets('Fichier', 'F', 'R', 'N'),
        ...entiers('x', 'u', 'z'),
      ],
      hints: [
        'El chiffres binaires yjiw b mod 2 w div 2.',
        'Module yerja3 Vrai ken el zouz compteurs kif kif.',
        'Thletha Fermer fel ekher.',
      ],
      tests: [
        {
          records: { 'naturels.dat': [611, 7, 12, 10, 9] },
          expr: '(_objets("rond.dat"), _objets("non_rond.dat"))',
          expected: '([611, 12, 10, 9], [7])',
          closed: true,
          label: '611, 12, 10, 9 sont ronds ; 7 ne l\'est pas',
        },
      ],
      stage: {
        type: 'archive',
        drawers: {
          'naturels.dat': ['611', '7', '12', '10', '9'],
          'rond.dat': [],
          'non_rond.dat': [],
        },
      },
      objective: 'T9assem el nombres bin zouz tiroirs.',
      principle: [
        'Tiroir wa7ed ta9ra menou, w zouz tekteb fihom.',
        'Rond : 3add el 1 = 3add el 0 fel écriture binaire.',
      ],
      intro: [
        {
          say: '611 rond : yemchi l tiroir. 7 = 111 : mouch rond.',
          events: [
            { t: 'open', file: 'naturels.dat', mode: 'rb' },
            { t: 'open', file: 'rond.dat', mode: 'wb' },
            { t: 'open', file: 'non_rond.dat', mode: 'wb' },
            { t: 'read', file: 'naturels.dat', text: '611\n' },
            { t: 'write', file: 'rond.dat', text: '611\n' },
            { t: 'read', file: 'naturels.dat', text: '7\n' },
            { t: 'write', file: 'non_rond.dat', text: '7\n' },
          ],
        },
      ],
    },
  ],
);

// ---------- Recursivite ----------

const FACT_PYTHON = code`
  def Fact(n):
      if n == 0:
          return 1
      else:
          return n * Fact(n - 1)
`;
const FACT_ALGO = code`
  Fonction Fact(n : Entier) : Entier
  Début
      Si n = 0 Alors
          Retourner 1
      Sinon
          Retourner n * Fact(n - 1)
      FinSi
  Fin
`;

/** Test d'une fonction recursive : elle doit s'appeler elle-meme. */
const recursif = (
  nom: string,
  expr: string,
  expected: string,
  label: string,
  hidden = false,
) =>
  vaut(expr, expected, label, { calls: [nom], recursive: true, hidden });

const descente = (f: string, args: string[], values: (string | number)[]) => {
  const events: TraceEvent[] = args.map((a, d) => ({ t: 'call', f, a, d }));
  values.forEach((v, i) =>
    events.push({ t: 'ret', f, v, d: args.length - 1 - i }),
  );
  return events;
};

const RECURSIVITE = chapitre(
  'bac-recursivite',
  'La récursivité',
  'Les poupées : chaque appel en ouvre une plus petite, puis elles se referment.',
  [
    {
      slug: 'bac-rec-fact',
      title: 'La factorielle',
      statement: code`
        Écrire la fonction récursive Fact(n) qui retourne n!.
        Exemple : Fact(4) = 24.
      `,
      bitou: SOLVED_BITOU,
      python: FACT_PYTHON,
      algo: FACT_ALGO,
      tdo: [],
      hints: [
        'Chnouwa el cas eli ma y7tejch 7seb? Hedhi condition el arrêt.',
        'n! = n × (n - 1)!',
      ],
      tests: [
        recursif('Fact', 'Fact(4)', '24', 'Fact(4) = 24'),
        vaut('Fact(1)', '1', 'Fact(1) = 1', { hidden: true }),
        vaut('Fact(0)', '1', 'Fact(0) = 1', { hidden: true }),
      ],
      stage: { type: 'dolls' },
      objective: 'Ta7seb n! b fonction t3ayet l rou7ha.',
      principle: [
        'Fonction récursive t3ayet l rou7ha b paramètre as8ar.',
        'Lezem condition d\'arrêt, sinon ma to9efch.',
        'Akher appel ykammel louwel, ba3d el poupées yetsakkrou.',
      ],
      intro: [
        {
          say: 'Kol poupée t7ell wa7da as8ar : Fact(3), Fact(2), Fact(1), Fact(0).',
          events: descente('Fact', ['3', '2', '1', '0'], []),
        },
        {
          say: 'Fact(0) ta3ref el jweb : 1. Ba3d kol poupée tetsakkar b natija.',
          events: [
            { t: 'call', f: 'Fact', a: '3', d: 0 },
            { t: 'call', f: 'Fact', a: '2', d: 1 },
            { t: 'call', f: 'Fact', a: '1', d: 2 },
            { t: 'call', f: 'Fact', a: '0', d: 3 },
            { t: 'ret', f: 'Fact', v: 1, d: 3 },
            { t: 'ret', f: 'Fact', v: 1, d: 2 },
            { t: 'ret', f: 'Fact', v: 2, d: 1 },
            { t: 'ret', f: 'Fact', v: 6, d: 0 },
          ],
        },
      ],
      notes: [
        { code: 'Si n = 0 Alors', why: 'Condition d\'arrêt : hna el fonction ma t3ayetch.' },
        {
          code: 'Retourner n * Fact(n - 1)',
          why: 'Appel récursif b n - 1 : kol mara nkarbou mel arrêt.',
        },
      ],
    },
    {
      slug: 'bac-rec-puissance',
      title: 'La puissance',
      statement: code`
        Écrire la fonction récursive Puissance(a, n) qui retourne a à la puissance n.
        Exemple : Puissance(2, 5) = 32.
      `,
      bitou: 'Nafs el fekra : n yon9os fi kol appel.',
      python: code`
        def Puissance(a, n):
            if n == 0:
                return 1
            else:
                return a * Puissance(a, n - 1)
      `,
      algo: code`
        Fonction Puissance(a : Réel, n : Entier) : Réel
        Début
            Si n = 0 Alors
                Retourner 1
            Sinon
                Retourner a * Puissance(a, n - 1)
            FinSi
        Fin
      `,
      tdo: [],
      hints: ['Ay nombre b puissance 0 chnouwa ya3ti?', 'a^n = a × a^(n-1)'],
      tests: [
        recursif('Puissance', 'Puissance(2, 5)', '32', 'Puissance(2, 5) = 32'),
        recursif('Puissance', 'Puissance(3, 2)', '9', '3 au carré', true),
      ],
      stage: { type: 'dolls' },
      objective: 'Ta7seb a^n b appels récursifs.',
      principle: ['Condition d\'arrêt : n = 0.', 'Kol appel ydharrab fi a.'],
      intro: [
        {
          say: 'Kol poupée n as8ar b wa7ed.',
          events: descente('Puissance', ['2, 2', '2, 1', '2, 0'], [1, 2, 4]),
        },
      ],
    },
    {
      slug: 'bac-rec-chiffres',
      title: 'La somme des chiffres',
      statement: code`
        Écrire la fonction récursive Somme(n) qui retourne la somme des chiffres de n.
        Exemple : Somme(451) = 10.
      `,
      bitou: 'Chiffre el ekher b mod, w el ba9i b div.',
      python: code`
        def Somme(n):
            if n == 0:
                return 0
            else:
                return n % 10 + Somme(n // 10)
      `,
      algo: code`
        Fonction Somme(n : Entier) : Entier
        Début
            Si n = 0 Alors
                Retourner 0
            Sinon
                Retourner n mod 10 + Somme(n div 10)
            FinSi
        Fin
      `,
      tdo: [],
      hints: [
        'Ki ma yo93od 7atta chiffre, chnouwa el somme?',
        'Khouth chiffre, w 3ayet lel ba9i.',
      ],
      tests: [
        recursif('Somme', 'Somme(451)', '10', 'Somme(451) = 10'),
        recursif('Somme', 'Somme(123)', '6', 'Somme(123) = 6', true),
      ],
      stage: { type: 'dolls' },
      objective: 'Tjamma3 chiffres n, chiffre fi kol poupée.',
      principle: [
        'n mod 10 : el chiffre el ekher.',
        'n div 10 : el nombre bla chiffre el ekher.',
      ],
      intro: [
        {
          say: '451, ba3d 45, ba3d 4, ba3d 0.',
          events: descente('Somme', ['451', '45', '4', '0'], [0, 4, 9, 10]),
        },
      ],
    },
    {
      slug: 'bac-rec-palin',
      title: 'Le palindrome',
      statement: code`
        Écrire la fonction récursive Palin(ch) qui retourne Vrai si la chaîne ch est un palindrome.
        Exemple : Palin("elle") = Vrai.
      `,
      bitou: 'T9aren el louwel m3a el ekher, w tna77ihom, w t3awed 3al ba9i.',
      python: code`
        def Palin(ch):
            if len(ch) < 2:
                return True
            elif ch[0] != ch[len(ch) - 1]:
                return False
            else:
                return Palin(ch[1:len(ch) - 1])
      `,
      algo: code`
        Fonction Palin(ch : Chaîne) : Booléen
        Début
            Si Long(ch) < 2 Alors
                Retourner Vrai
            Sinon si ch[0] ≠ ch[Long(ch) - 1] Alors
                Retourner Faux
            Sinon
                Retourner Palin(Sous_Chaine(ch, 1, Long(ch) - 1))
            FinSi
        Fin
      `,
      tdo: [],
      hints: [
        'Zouz conditions d\'arrêt : chaîne sghira, w caractères mouch kif kif.',
        'Sous_Chaine tna77i el louwel w el ekher.',
      ],
      tests: [
        recursif('Palin', 'Palin("elle")', 'True', '"elle" est un palindrome'),
        recursif('Palin', 'Palin("radar")', 'True', '"radar"', true),
        recursif('Palin', 'Palin("abca")', 'False', '"abca" ne l\'est pas', true),
      ],
      stage: { type: 'dolls' },
      objective: 'Tchouf ken el kelma tet9ra kif kif mel zouz jiha.',
      principle: [
        'Ken el louwel ≠ el ekher : mouch palindrome.',
        'Sinon t3awed 3al chaîne eli fel west.',
      ],
      intro: [
        {
          say: '"elle", ba3d "ll", ba3d "".',
          events: descente(
            'Palin',
            ['\'elle\'', '\'ll\'', '\'\''],
            ['Vrai', 'Vrai', 'Vrai'],
          ),
        },
      ],
    },
    {
      slug: 'bac-rec-convch',
      title: 'De la chaîne à l’entier',
      statement: code`
        Écrire la fonction récursive ConvChEnt(ch) qui convertit une chaîne de chiffres en entier,
        sans utiliser Valeur. ConvChEnt("125") = 125 et ConvChEnt("") = 0.
        Ord("0") = 48.
      `,
      bitou: 'Chiffre el ekher b Ord, w el ba9i b appel récursif.',
      python: code`
        def ConvChEnt(ch):
            if len(ch) == 0:
                return 0
            else:
                d = len(ch) - 1
                return ConvChEnt(ch[0:d]) * 10 + ord(ch[d]) - 48
      `,
      algo: code`
        Fonction ConvChEnt(ch : Chaîne) : Entier
        Début
            Si Long(ch) = 0 Alors
                Retourner 0
            Sinon
                d ← Long(ch) - 1
                Retourner ConvChEnt(Sous_Chaine(ch, 0, d)) * 10 + Ord(ch[d]) - 48
            FinSi
        Fin
      `,
      tdo: entiers('d'),
      hints: [
        'Ord(chiffre) - 48 ya3tik 9ima el chiffre.',
        '125 = 12 × 10 + 5.',
      ],
      tests: [
        recursif('ConvChEnt', 'ConvChEnt("125")', '125', '"125" donne 125'),
        vaut('ConvChEnt("")', '0', 'Chaîne vide', { hidden: true }),
        recursif('ConvChEnt', 'ConvChEnt("7040")', '7040', '"7040"', true),
      ],
      stage: { type: 'dolls' },
      objective: 'Trodd el chaîne nombre, chiffre b chiffre.',
      principle: [
        'Kol appel yna77i chiffre mel ekher.',
        'Ki yarja3, ydharreb fi 10 w yzid el chiffre.',
      ],
      intro: [
        {
          say: '"125" yest7a99 "12", eli yest7a99 "1"...',
          events: descente(
            'ConvChEnt',
            ['\'125\'', '\'12\'', '\'1\'', '\'\''],
            [0, 1, 12, 125],
          ),
        },
      ],
    },
    {
      slug: 'bac-rec-dicho',
      title: 'La dichotomie récursive',
      chest: true,
      statement: code`
        T est un tableau trié de n entiers. Écrire la fonction récursive Existe(T, g, d, x)
        qui retourne Vrai si x se trouve entre les indices g et d, par dichotomie.
      `,
      bitou: 'Mission el chapitre! Nafs el pingouins, ama bla boucle : kol noss saf appel.',
      python: code`
        def Existe(T, g, d, x):
            if g > d:
                return False
            m = (g + d) // 2
            if T[m] == x:
                return True
            elif T[m] < x:
                return Existe(T, m + 1, d, x)
            else:
                return Existe(T, g, m - 1, x)
      `,
      algo: code`
        Fonction Existe(T : Tab, g : Entier, d : Entier, x : Entier) : Booléen
        Début
            Si g > d Alors
                Retourner Faux
            FinSi
            m ← (g + d) div 2
            Si T[m] = x Alors
                Retourner Vrai
            Sinon si T[m] < x Alors
                Retourner Existe(T, m + 1, d, x)
            Sinon
                Retourner Existe(T, g, m - 1, x)
            FinSi
        Fin
      `,
      tdo: entiers('m'),
      hints: [
        'Arrêt : el zouz bornes tkhaltou, wala l9it x.',
        'El appel yet3adda b noss el saf bark.',
      ],
      tests: [
        {
          ...recursif('Existe', 'Existe(T, 0, 6, 70)', 'True', '70 existe'),
          setup: 'T = _suivi([20, 35, 40, 55, 70, 85, 95])',
        },
        {
          ...recursif('Existe', 'Existe(T, 0, 6, 50)', 'False', '50 n\'existe pas'),
          setup: 'T = _suivi([20, 35, 40, 55, 70, 85, 95])',
        },
      ],
      stage: { type: 'dolls' },
      objective: 'Tal9a x b noss el saf fi kol appel.',
      principle: [
        'Kol appel ychouf el west.',
        'Ba3d y3ayet 3al noss eli ynajem ykoun fih x.',
      ],
      intro: [
        {
          say: 'Saf kemel, ba3d noss, ba3d noss el noss.',
          events: descente(
            'Existe',
            ['T, 0, 6, 70', 'T, 4, 6, 70', 'T, 4, 4, 70'],
            ['Vrai', 'Vrai', 'Vrai'],
          ),
        },
      ],
    },
  ],
);

// ---------- Recurrence ----------

const FIBO_PYTHON = code`
  def Fibo(T, n):
      T[0] = 1
      T[1] = 1
      for i in range(2, n):
          T[i] = T[i - 1] + T[i - 2]
`;
const FIBO_ALGO = code`
  Procedure Fibo(@T : Tab, n : Entier)
  Début
      T[0] ← 1
      T[1] ← 1
      Pour i de 2 à n - 1 Faire
          T[i] ← T[i - 1] + T[i - 2]
      FinPour
  Fin
`;

const remplirSuite = (nom: string, n: number, expected: number[], label: string, hidden = false) =>
  ({
    setup: `T = _suivi([0] * ${n})`,
    expr: `(${nom}(T, ${n}), list(T))[1]`,
    expected: JSON.stringify(expected),
    label,
    hidden,
  }) satisfies PythonTest;

const marches = (values: number[]): TraceEvent[] =>
  values.map((v, i) => ({ t: 'set', i, v }));

const PASCAL = [
  [1, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
];

const RECURRENCE = chapitre(
  'bac-recurrence',
  'Les algorithmes récurrents',
  'Les marches : chaque terme se construit sur les précédents.',
  [
    {
      slug: 'bac-rcr-fibo',
      title: 'La suite de Fibonacci',
      statement: code`
        U0 = 1, U1 = 1 et Un = Un-1 + Un-2.
        Écrire la procédure Fibo(@T, n) qui remplit T par les n premiers termes.
      `,
      bitou: SOLVED_BITOU,
      python: FIBO_PYTHON,
      algo: FIBO_ALGO,
      tdo: entiers('i'),
      hints: [
        'Récurrence d\'ordre 2 : lezmek zouz termes fel bdeya.',
        'El boucle tebda mel terme el theleth.',
      ],
      tests: [
        remplirSuite('Fibo', 8, [1, 1, 2, 3, 5, 8, 13, 21], '8 premiers termes'),
        remplirSuite('Fibo', 3, [1, 1, 2], '3 termes', true),
      ],
      stage: { type: 'stairs', length: 8 },
      objective: 'Tbani el marches : kol wa7da majmou3 el zouz eli 9balha.',
      principle: [
        'Ordre de récurrence : 9addech men terme 9dim lezem.',
        'Hna ordre 2 : Un yest7a99 Un-1 w Un-2.',
        'T3abbi el premiers termes 9bal el boucle.',
      ],
      intro: [
        {
          say: '1, 1, ba3d kol marche = majmou3 el zouz eli 9balha.',
          events: marches([1, 1, 2, 3, 5, 8, 13, 21]),
        },
      ],
      notes: [
        { code: 'T[0] ← 1', why: 'Termes el bdeya : ma yet7asbouch.' },
        {
          code: 'Pour i de 2 à n - 1 Faire',
          why: 'Mel terme el theleth, kol terme yet7seb.',
        },
        {
          code: 'T[i] ← T[i - 1] + T[i - 2]',
          why: 'Hedhi el relation de récurrence.',
        },
      ],
    },
    {
      slug: 'bac-rcr-ordre1',
      title: 'Une suite d’ordre 1',
      statement: code`
        U0 = 2 et Un = 3 × Un-1 + 1.
        Écrire la fonction Terme(n) qui retourne Un sans utiliser de tableau.
      `,
      bitou: 'Variable wa7da tekfi : kol terme yakhou blaset eli 9bal.',
      python: code`
        def Terme(n):
            u = 2
            for i in range(n):
                u = 3 * u + 1
            return u
      `,
      algo: code`
        Fonction Terme(n : Entier) : Entier
        Début
            u ← 2
            Pour i de 1 à n Faire
                u ← 3 * u + 1
            FinPour
            Retourner u
        Fin
      `,
      tdo: entiers('u', 'i'),
      hints: ['Ordre 1 : terme wa7ed 9dim yekfi.', 'El boucle tetexécuta n marrat.'],
      tests: [
        vaut('Terme(4)', '202', 'U4 = 202', { watch: ['u'] }),
        vaut('Terme(0)', '2', 'U0 = 2', { hidden: true }),
      ],
      stage: { type: 'stairs', length: 6 },
      objective: 'Ta7seb Un bla ma tehfedh el termes el kol.',
      principle: [
        'Un yest7a99 Un-1 bark.',
        'Variable wa7da tet3awed fi kol tour.',
      ],
      intro: [
        { say: '2, 7, 22, 67, 202...', events: marches([2, 7, 22, 67, 202]) },
      ],
    },
    {
      slug: 'bac-rcr-syracuse',
      title: 'La suite de Syracuse',
      statement: code`
        À partir d'un entier n > 0 : si n est pair, on le divise par 2, sinon on calcule 3n + 1.
        Écrire la fonction Vol(n) qui retourne le nombre d'étapes pour arriver à 1.
        Exemple : Vol(6) = 8 (6, 3, 10, 5, 16, 8, 4, 2, 1).
      `,
      bitou: 'Ma ta3refch 9addech men tour : chnouwa el boucle?',
      python: code`
        def Vol(n):
            c = 0
            while n != 1:
                if n % 2 == 0:
                    n = n // 2
                else:
                    n = 3 * n + 1
                c = c + 1
            return c
      `,
      algo: code`
        Fonction Vol(n : Entier) : Entier
        Début
            c ← 0
            TantQue n ≠ 1 Faire
                Si n mod 2 = 0 Alors
                    n ← n div 2
                Sinon
                    n ← 3 * n + 1
                FinSi
                c ← c + 1
            FinTantQue
            Retourner c
        Fin
      `,
      tdo: entiers('c'),
      hints: ['Boucle to9ef ki n = 1.', 'Compteur yzid fi kol tabdil.'],
      tests: [
        vaut('Vol(6)', '8', 'Vol(6) = 8', { watch: ['n'] }),
        vaut('Vol(1)', '0', 'Vol(1) = 0', { hidden: true }),
        vaut('Vol(27)', '111', 'Vol(27) = 111', { hidden: true }),
      ],
      stage: { type: 'stairs', length: 9 },
      objective: 'T3idd el marches 7atta tousel l 1.',
      principle: [
        'Pair : n div 2. Impair : 3 × n + 1.',
        'To9ef ki n ywalli 1.',
      ],
      intro: [
        {
          say: '6, 3, 10, 5, 16, 8, 4, 2, 1 : tetla3 w tahbet.',
          events: marches([6, 3, 10, 5, 16, 8, 4, 2, 1]),
        },
      ],
    },
    {
      slug: 'bac-rcr-terme',
      title: 'Est-il un terme de la suite ?',
      statement: code`
        Écrire la fonction EstTerme(x) qui retourne Vrai si x est un terme de la suite
        de Fibonacci (U0 = 1, U1 = 1), sans tableau.
      `,
      bitou: 'Ta7seb el termes 7atta tfout x, ba3d tchouf.',
      python: code`
        def EstTerme(x):
            a = 1
            b = 1
            while b < x:
                c = a + b
                a = b
                b = c
            return b == x
      `,
      algo: code`
        Fonction EstTerme(x : Entier) : Booléen
        Début
            a ← 1
            b ← 1
            TantQue b < x Faire
                c ← a + b
                a ← b
                b ← c
            FinTantQue
            Retourner b = x
        Fin
      `,
      tdo: entiers('a', 'b', 'c'),
      hints: [
        'Ordre 2 : zouz variables lel zouz termes el lekhrin.',
        'Variable thelletha bech ma tfassakhch el 9dim.',
      ],
      tests: [
        vaut('EstTerme(13)', 'True', '13 est un terme', { watch: ['b'] }),
        vaut('EstTerme(14)', 'False', '14 n\'en est pas un'),
        vaut('EstTerme(1)', 'True', '1 est un terme', { hidden: true }),
      ],
      stage: { type: 'stairs', length: 8 },
      objective: 'Tetla3 el marches 7atta tousel l x wala tfoutou.',
      principle: [
        'Ta7seb terme terme.',
        'To9ef ki terme ywalli ≥ x.',
        'Ken yesawi x : Vrai.',
      ],
      intro: [
        { say: 'N7awsou 3al 13 : 1, 2, 3, 5, 8, 13!', events: marches([1, 2, 3, 5, 8, 13]) },
      ],
    },
    {
      slug: 'bac-rcr-pascal',
      title: 'Le triangle de Pascal',
      chest: true,
      statement: code`
        Écrire la procédure Pascal(@M, n) qui remplit le triangle de Pascal dans la matrice M :
        la colonne 0 et la diagonale valent 1, et M[i, j] = M[i-1, j-1] + M[i-1, j].
      `,
      bitou: 'Mission el chapitre! Récurrence fi matrice : kol case men zouz cases fou9ha.',
      python: code`
        def Pascal(M, n):
            for i in range(n):
                M[i][0] = 1
                M[i][i] = 1
                for j in range(1, i):
                    M[i][j] = M[i - 1][j - 1] + M[i - 1][j]
      `,
      algo: code`
        Procedure Pascal(@M : Mat, n : Entier)
        Début
            Pour i de 0 à n - 1 Faire
                M[i, 0] ← 1
                M[i, i] ← 1
                Pour j de 1 à i - 1 Faire
                    M[i, j] ← M[i - 1, j - 1] + M[i - 1, j]
                FinPour
            FinPour
        Fin
      `,
      tdo: entiers('i', 'j'),
      hints: [
        'Kol ligne tebda w toufa b 1.',
        'El boucle eli wost-ha temchi bin el zouz.',
      ],
      tests: [
        {
          setup: `M = _matrice(${JSON.stringify(PASCAL)})`,
          expr: '(Pascal(M, 5), M.tolist())[1]',
          expected:
            '[[1, 0, 0, 0, 0], [1, 1, 0, 0, 0], [1, 2, 1, 0, 0], [1, 3, 3, 1, 0], [1, 4, 6, 4, 1]]',
          label: 'Triangle de 5 lignes',
        },
      ],
      stage: { type: 'cinema', rows: PASCAL, mode: 'numbers' },
      objective: 'Tbani el triangle ligne b ligne.',
      principle: [
        'Kol ligne tet7seb men eli fou9ha.',
        'Case = eli fou9ha + eli fou9ha 3al ysar.',
      ],
      intro: [
        {
          say: 'Ligne 2 : 1, ba3d 1 + 1 = 2, ba3d 1.',
          events: [
            { t: 'mset', i: 1, j: 0, v: 1 },
            { t: 'mset', i: 1, j: 1, v: 1 },
            { t: 'mset', i: 2, j: 0, v: 1 },
            { t: 'mset', i: 2, j: 1, v: 2 },
            { t: 'mset', i: 2, j: 2, v: 1 },
          ],
        },
      ],
    },
  ],
);

// ---------- Arithmetique et conversion ----------

const PGCD_PYTHON = code`
  def PGCD(a, b):
      while a != b:
          if a > b:
              a = a - b
          else:
              b = b - a
      return a
`;
const PGCD_ALGO = code`
  Fonction PGCD(a : Entier, b : Entier) : Entier
  Début
      TantQue a ≠ b Faire
          Si a > b Alors
              a ← a - b
          Sinon
              b ← b - a
          FinSi
      FinTantQue
      Retourner a
  Fin
`;

const change = (k: string, ...values: (string | number)[]): TraceEvent[] =>
  values.map((v) => ({ t: 'var', k, v }));

const PREMIER_PYTHON = code`
  def Premier(n):
      if n < 2:
          return False
      i = 2
      while i * i <= n:
          if n % i == 0:
              return False
          i = i + 1
      return True
`;

const ARITHMETIQUE = chapitre(
  'bac-arithmetique',
  'Arithmétique et conversions',
  'La machine à nombres : PGCD, nombres premiers, facteurs et bases.',
  [
    {
      slug: 'bac-ari-pgcd',
      title: 'Le PGCD',
      statement: code`
        Écrire la fonction PGCD(a, b) par soustractions successives.
        Exemple : PGCD(48, 18) = 6.
      `,
      bitou: SOLVED_BITOU,
      python: PGCD_PYTHON,
      algo: PGCD_ALGO,
      tdo: [],
      hints: ['To9ef ki a w b ysawiw b3adhhom.', 'A9sar yon9os mel akbar.'],
      tests: [
        vaut('PGCD(48, 18)', '6', 'PGCD(48, 18) = 6', { watch: ['a', 'b'] }),
        vaut('PGCD(7, 7)', '7', 'PGCD(7, 7) = 7', { hidden: true }),
        vaut('PGCD(17, 5)', '1', 'PGCD(17, 5) = 1', { hidden: true }),
      ],
      stage: { type: 'machine', vars: ['a', 'b'] },
      objective: 'Tal9a akbar diviseur moucharrek b tar7 bark.',
      principle: [
        'PGCD(a, b) = PGCD(a - b, b) ki a > b.',
        'T3awed 7atta a = b.',
      ],
      intro: [
        {
          say: '48 w 18 : 30, 12, ba3d 18 - 12 = 6...',
          events: [
            ...change('a', 48),
            ...change('b', 18),
            ...change('a', 30, 12),
            ...change('b', 6),
            ...change('a', 6),
          ],
        },
      ],
      notes: [
        { code: 'TantQue a ≠ b Faire', why: 'Ki ysawiw b3adhhom, wsolna lel PGCD.' },
        { code: 'a ← a - b', why: 'El PGCD ma yetbaddelch ki nna77iw el as8ar mel akbar.' },
        { code: 'Retourner a', why: 'a = b : hedha el PGCD.' },
      ],
    },
    {
      slug: 'bac-ari-premier',
      title: 'Nombre premier',
      statement: code`
        Écrire la fonction Premier(n) qui retourne Vrai si n est premier.
      `,
      bitou: 'Ma tlezmekch t9assem 3la kol chay : wa9t ti7 el diviseurs?',
      python: PREMIER_PYTHON,
      algo: code`
        Fonction Premier(n : Entier) : Booléen
        Début
            Si n < 2 Alors
                Retourner Faux
            FinSi
            i ← 2
            TantQue i * i ≤ n Faire
                Si n mod i = 0 Alors
                    Retourner Faux
                FinSi
                i ← i + 1
            FinTantQue
            Retourner Vrai
        Fin
      `,
      tdo: entiers('i'),
      hints: [
        '0 w 1 mouch premiers.',
        'Diviseur wa7ed yekfi bech t9oul la.',
        'Diviseur as8ar men racine n yekfi.',
      ],
      tests: [
        vaut('Premier(97)', 'True', '97 est premier', { watch: ['i'] }),
        vaut('Premier(91)', 'False', '91 = 7 × 13'),
        vaut('Premier(1)', 'False', '1 n\'est pas premier', { hidden: true }),
        vaut('Premier(2)', 'True', '2 est premier', { hidden: true }),
      ],
      stage: { type: 'machine', vars: ['i'] },
      objective: 'Tchouf n yet9assem 3la 7atta wa7ed.',
      principle: [
        'Tjarreb el diviseurs men 2.',
        'Ken wa7ed y9assem n : mouch premier.',
      ],
      intro: [{ say: 'i yetla3 : 2, 3, 4...', events: change('i', 2, 3, 4, 5) }],
    },
    {
      slug: 'bac-ari-ppcm',
      title: 'Le PPCM',
      statement: code`
        Écrire la fonction PPCM(a, b) : on part du plus grand des deux,
        et on ajoute ce nombre jusqu'à obtenir un multiple de l'autre.
        Exemple : PPCM(4, 6) = 12.
      `,
      bitou: 'Tebda mel akbar, w tzid rou7ou.',
      python: code`
        def PPCM(a, b):
            if a > b:
                g = a
                p = b
            else:
                g = b
                p = a
            m = g
            while m % p != 0:
                m = m + g
            return m
      `,
      algo: code`
        Fonction PPCM(a : Entier, b : Entier) : Entier
        Début
            Si a > b Alors
                g ← a
                p ← b
            Sinon
                g ← b
                p ← a
            FinSi
            m ← g
            TantQue m mod p ≠ 0 Faire
                m ← m + g
            FinTantQue
            Retourner m
        Fin
      `,
      tdo: entiers('g', 'p', 'm'),
      hints: ['Zouz variables lel akbar w el as8ar.', 'To9ef ki mod ya3ti 0.'],
      tests: [
        vaut('PPCM(4, 6)', '12', 'PPCM(4, 6) = 12', { watch: ['m'] }),
        vaut('PPCM(7, 3)', '21', 'PPCM(7, 3) = 21', { hidden: true }),
        vaut('PPCM(5, 5)', '5', 'PPCM(5, 5) = 5', { hidden: true }),
      ],
      stage: { type: 'machine', vars: ['m'] },
      objective: 'Tal9a as8ar multiple moucharrek.',
      principle: [
        'Multiples el akbar : g, 2g, 3g...',
        'Awwel wa7ed yet9assem 3al as8ar howa el PPCM.',
      ],
      intro: [{ say: '6, 12 : 12 yet9assem 3la 4!', events: change('m', 6, 12) }],
    },
    {
      slug: 'bac-ari-facteurs',
      title: 'Les facteurs premiers',
      statement: code`
        Écrire la fonction Facteurs(T, n) qui range dans T les facteurs premiers de n
        et retourne leur nombre. Exemple : pour n = 60, T = 2, 2, 3, 5 et le résultat est 4.
      `,
      bitou: 'Ki i y9assem n, tehfdhou w t9assem. Sinon i yzid.',
      python: code`
        def Facteurs(T, n):
            i = 2
            nb = 0
            while n > 1:
                if n % i == 0:
                    T[nb] = i
                    nb = nb + 1
                    n = n // i
                else:
                    i = i + 1
            return nb
      `,
      algo: code`
        Fonction Facteurs(@T : Tab, n : Entier) : Entier
        Début
            i ← 2
            nb ← 0
            Répéter
                Si n mod i = 0 Alors
                    T[nb] ← i
                    nb ← nb + 1
                    n ← n div i
                Sinon
                    i ← i + 1
                FinSi
            Jusqu'à n = 1
            Retourner nb
        Fin
      `,
      tdo: entiers('i', 'nb'),
      hints: ['i yebda b 2.', 'Nafs el i ynajem y9assem barcha marrat.'],
      tests: [
        {
          setup: 'T = _suivi([0] * 10)',
          expr: '(Facteurs(T, 60), list(T)[:4])',
          expected: '(4, [2, 2, 3, 5])',
          label: '60 = 2 × 2 × 3 × 5',
          watch: ['n', 'i'],
        },
        {
          setup: 'T = _suivi([0] * 10)',
          expr: '(Facteurs(T, 13), list(T)[:1])',
          expected: '(1, [13])',
          label: '13 est premier',
          hidden: true,
        },
      ],
      stage: { type: 'machine', vars: ['n', 'i'] },
      objective: 'Tfakkek n l facteurs premiers.',
      principle: [
        'T9assem 3la 2 9ad ma tnajem.',
        'Ba3d 3, ba3d 4, 5...',
        'To9ef ki n = 1.',
      ],
      intro: [
        {
          say: '60, 30, 15, ba3d 5, ba3d 1.',
          events: [...change('i', 2), ...change('n', 60, 30, 15), ...change('i', 3), ...change('n', 5, 1)],
        },
      ],
    },
    {
      slug: 'bac-ari-binaire',
      title: 'Du décimal au binaire',
      statement: code`
        Écrire la fonction Binaire(n) qui retourne l'écriture binaire de n > 0 dans une chaîne.
        Exemple : Binaire(13) = "1101".
      `,
      bitou: 'El chiffres yjiw men lekher : 7ott kol chiffre 9eddem el chaîne.',
      python: code`
        def Binaire(n):
            ch = ""
            while n > 0:
                ch = str(n % 2) + ch
                n = n // 2
            return ch
      `,
      algo: code`
        Fonction Binaire(n : Entier) : Chaîne
        Début
            ch ← ""
            TantQue n > 0 Faire
                ch ← Convch(n mod 2) + ch
                n ← n div 2
            FinTantQue
            Retourner ch
        Fin
      `,
      tdo: chaines('ch'),
      hints: ['Divisions successives 3la 2.', 'El reste houwa el chiffre.'],
      tests: [
        vaut('Binaire(13)', '"1101"', '13 = 1101', { watch: ['n', 'ch'] }),
        vaut('Binaire(1)', '"1"', '1 = 1', { hidden: true }),
        vaut('Binaire(611)', '"1001100011"', '611', { hidden: true }),
      ],
      stage: { type: 'machine', vars: ['n', 'ch'] },
      objective: 'T7awwel n l base 2.',
      principle: [
        'Reste el division 3la 2 = chiffre.',
        'Quotient ywalli n jdid.',
        'El restes yet9raw bel 3aks.',
      ],
      intro: [
        {
          say: '13, 6, 3, 1 : el restes 1, 0, 1, 1.',
          events: [
            ...change('n', 13),
            ...change('ch', '1'),
            ...change('n', 6),
            ...change('ch', '01'),
            ...change('n', 3),
            ...change('ch', '101'),
            ...change('n', 1),
            ...change('ch', '1101'),
          ],
        },
      ],
    },
    {
      slug: 'bac-ari-base',
      title: 'D’une base à une autre',
      statement: code`
        Écrire la fonction Convertir(ch, b1, b2) qui convertit le nombre ch écrit en base b1
        vers la base b2 (bases 2 à 16, chiffres 0..9 puis A..F).
        Exemple : Convertir("FF", 16, 2) = "11111111".
      `,
      bitou: 'Zouz étapes : ch l décimal, ba3d décimal l b2. Module lkol étape ye3awnek.',
      python: code`
        def Decimal(ch, b):
            n = 0
            for i in range(len(ch)):
                n = n * b + "0123456789ABCDEF".find(ch[i])
            return n


        def Convertir(ch, b1, b2):
            n = Decimal(ch, b1)
            r = ""
            while n > 0:
                r = "0123456789ABCDEF"[n % b2] + r
                n = n // b2
            return r
      `,
      algo: code`
        Fonction Decimal(ch : Chaîne, b : Entier) : Entier
        Début
            n ← 0
            Pour i de 0 à Long(ch) - 1 Faire
                n ← n * b + Pos(ch[i], "0123456789ABCDEF")
            FinPour
            Retourner n
        Fin

        Fonction Convertir(ch : Chaîne, b1 : Entier, b2 : Entier) : Chaîne
        Début
            n ← Decimal(ch, b1)
            r ← ""
            TantQue n > 0 Faire
                r ← "0123456789ABCDEF"[n mod b2] + r
                n ← n div b2
            FinTantQue
            Retourner r
        Fin
      `,
      tdo: [...entiers('n', 'i'), ...chaines('r')],
      hints: [
        'Chaîne fiha el chiffres el kol t3awnek : Pos ta3tik 9ima el chiffre.',
        'Horner : n ← n × b + chiffre.',
      ],
      tests: [
        vaut('Convertir("FF", 16, 2)', '"11111111"', 'FF en binaire', { watch: ['n', 'r'] }),
        vaut('Convertir("1101", 2, 10)', '"13"', '1101 en décimal'),
        vaut('Convertir("255", 10, 16)', '"FF"', '255 en hexadécimal', { hidden: true }),
      ],
      stage: { type: 'machine', vars: ['n', 'r'] },
      objective: 'T3addi nombre men base l base.',
      principle: [
        'Base b1 → décimal b tadhrib w jam3.',
        'Décimal → base b2 b divisions.',
      ],
      intro: [
        {
          say: 'FF = 255, ba3d 255 yet9assem 3la 2...',
          events: [...change('n', 15, 255, 127, 63), ...change('r', '1', '11')],
        },
      ],
    },
    {
      slug: 'bac-ari-super',
      title: 'Le super premier',
      chest: true,
      statement: code`
        Un nombre est super premier s'il est premier et s'il reste premier quand on supprime
        ses chiffres à partir de la droite. Exemple : 59399, 5939, 593, 59 et 5 sont premiers.
        Écrire la fonction Super(n) qui retourne Vrai si n est super premier.
      `,
      bitou: 'Mission el chapitre! Esta3mel fonction Premier mte3ek, w a7dhef chiffre chiffre.',
      python: `${PREMIER_PYTHON}\n\n\n${code`
        def Super(n):
            ok = True
            while n > 0 and ok:
                ok = Premier(n)
                n = n // 10
            return ok
      `}`,
      algo: code`
        Fonction Premier(n : Entier) : Booléen
        Début
            Si n < 2 Alors
                Retourner Faux
            FinSi
            i ← 2
            TantQue i * i ≤ n Faire
                Si n mod i = 0 Alors
                    Retourner Faux
                FinSi
                i ← i + 1
            FinTantQue
            Retourner Vrai
        Fin

        Fonction Super(n : Entier) : Booléen
        Début
            ok ← Vrai
            TantQue (n > 0) et ok Faire
                ok ← Premier(n)
                n ← n div 10
            FinTantQue
            Retourner ok
        Fin
      `,
      tdo: [...entiers('i'), { name: 'ok', type: 'Booléen' }],
      hints: [
        'Zouz modules : wa7ed lel premier, w wa7ed lel super.',
        'n div 10 yna77i chiffre mel ymin.',
      ],
      tests: [
        vaut('Super(59399)', 'True', '59399 est super premier', { watch: ['n'] }),
        vaut('Super(59393)', 'True', '59393', { hidden: true }),
        vaut('Super(59)', 'True', '59', { hidden: true }),
        vaut('Super(19)', 'False', '19 : 1 n\'est pas premier'),
      ],
      stage: { type: 'machine', vars: ['n'] },
      objective: 'Tverifi n w kol nombre yo5rej menou.',
      principle: [
        'Tchouf n premier wala la.',
        'Tna77i chiffre mel ymin, w t3awed.',
      ],
      intro: [
        { say: '59399, 5939, 593, 59, 5 : kol-hom premiers.', events: change('n', 59399, 5939, 593, 59, 5, 0) },
      ],
    },
  ],
);

// ---------- Approximation ----------

const RACINE_PYTHON = code`
  def f(x):
      return x * x - 2


  def Zero(a, b, eps):
      m = (a + b) / 2
      while b - a > eps and f(m) != 0:
          if f(a) * f(m) > 0:
              a = m
          else:
              b = m
          m = (a + b) / 2
      return m
`;
const RACINE_ALGO = code`
  Fonction f(x : Réel) : Réel
  Début
      Retourner x * x - 2
  Fin

  Fonction Zero(a : Réel, b : Réel, eps : Réel) : Réel
  Début
      m ← (a + b) / 2
      TantQue (b - a > eps) et (f(m) ≠ 0) Faire
          Si f(a) * f(m) > 0 Alors
              a ← m
          Sinon
              b ← m
          FinSi
          m ← (a + b) / 2
      FinTantQue
      Retourner m
  Fin
`;

const proche = (
  expr: string,
  exact: number,
  eps: number,
  label: string,
  watch?: string[],
): PythonTest => ({
  expr: `abs(${expr} - ${exact}) < ${eps}`,
  expected: 'True',
  label,
  ...(watch && { watch }),
});

const APPROXIMATION = chapitre(
  'bac-approximation',
  'Les algorithmes d’approximation',
  'La cible : se rapprocher de la vraie valeur, à epsilon près.',
  [
    {
      slug: 'bac-app-zero',
      title: 'Le zéro d’une fonction',
      statement: code`
        f(x) = x² - 2 s'annule une seule fois sur [1, 2].
        Écrire f, puis la fonction Zero(a, b, eps) qui retourne une valeur approchée de ce zéro,
        par dichotomie.
      `,
      bitou: SOLVED_BITOU,
      python: RACINE_PYTHON,
      algo: RACINE_ALGO,
      tdo: [{ name: 'm', type: 'Réel' }],
      hints: [
        'Kif el dichotomie mta3 el pingouins, ama 3la intervalle.',
        'Ken f(a) w f(m) nafs el signe, el zéro mouch fi [a, m].',
      ],
      tests: [
        proche('Zero(1, 2, 0.0001)', 1.41421356, 0.001, 'Zéro proche de 1.4142', ['m']),
        proche('Zero(1, 2, 0.000001)', 1.41421356, 0.00001, 'Plus précis avec un epsilon plus petit'),
      ],
      stage: { type: 'target', variable: 'm', exact: 1.41421356, min: 1, max: 2 },
      objective: 'Tkarrab el sahm mel zéro, w el intervalle yon9os b noss.',
      principle: [
        'm west [a, b].',
        'Tchouf el zéro fi anehi noss 7asb el signe.',
        'To9ef ki b - a as8ar men epsilon.',
      ],
      intro: [
        {
          say: '1.5, 1.25, 1.375, 1.4375... kol mara a9reb.',
          events: change('m', 1.5, 1.25, 1.375, 1.4375, 1.40625, 1.421875, 1.4140625),
        },
      ],
      notes: [
        { code: 'm ← (a + b) / 2', why: 'West el intervalle.' },
        {
          code: 'Si f(a) * f(m) > 0 Alors',
          why: 'Nafs el signe : el zéro mouch fi [a, m].',
        },
        {
          code: 'TantQue (b - a > eps) et (f(m) ≠ 0) Faire',
          why: 'Nkammlou ma dam el intervalle kbir.',
        },
      ],
    },
    {
      slug: 'bac-app-fixe',
      title: 'Le point fixe',
      statement: code`
        f(x) = 1 + 1 / x a un point fixe : le nombre d'or (environ 1.618).
        Écrire f, puis la fonction PointFixe(eps) qui part de x = 1
        et répète x ← f(x) jusqu'à ce que deux valeurs soient à moins de eps.
      `,
      bitou: 'Lezmek zouz variables : el 9dima w el jdida.',
      python: code`
        def f(x):
            return 1 + 1 / x


        def PointFixe(eps):
            xact = 1
            fin = False
            while not fin:
                xpre = xact
                xact = f(xact)
                fin = abs(xact - xpre) < eps
            return xact
      `,
      algo: code`
        Fonction f(x : Réel) : Réel
        Début
            Retourner 1 + 1 / x
        Fin

        Fonction PointFixe(eps : Réel) : Réel
        Début
            xact ← 1
            Répéter
                xpre ← xact
                xact ← f(xact)
            Jusqu'à Abs(xact - xpre) < eps
            Retourner xact
        Fin
      `,
      tdo: reels('xact', 'xpre'),
      hints: [
        'Répéter ... Jusqu\'à kif el cours.',
        'Abs ta3tik el farek bin el zouz.',
      ],
      tests: [
        proche('PointFixe(0.0001)', 1.61803399, 0.001, 'Proche de 1.618', ['xact']),
      ],
      stage: {
        type: 'target',
        variable: 'xact',
        exact: 1.61803399,
        min: 1,
        max: 2,
      },
      objective: 'T3awed f 7atta x ma ya3dech yetbaddel.',
      principle: [
        'Point fixe : f(x) = x.',
        'T3awed x ← f(x).',
        'To9ef ki el farek as8ar men epsilon.',
      ],
      intro: [
        {
          say: '1, 2, 1.5, 1.667, 1.6... tetmaywej w tkarreb.',
          events: change('xact', 1, 2, 1.5, 1.6667, 1.6, 1.625, 1.6154),
        },
      ],
    },
    {
      slug: 'bac-app-rectangles',
      title: 'Aire : les rectangles',
      statement: code`
        Écrire f(x) = x², puis la fonction Rect(a, b, n) qui calcule l'aire sous f sur [a, b]
        par la méthode des rectangles (point milieu). Sur [0, 1], l'aire vaut 1/3.
      `,
      bitou: 'Kol rectangle 3arthou h, w tulou f fel west.',
      python: code`
        def f(x):
            return x * x


        def Rect(a, b, n):
            somme = 0
            h = (b - a) / n
            x = a + h / 2
            for i in range(n):
                somme = somme + f(x)
                x = x + h
            return somme * h
      `,
      algo: code`
        Fonction f(x : Réel) : Réel
        Début
            Retourner x * x
        Fin

        Fonction Rect(a : Réel, b : Réel, n : Entier) : Réel
        Début
            somme ← 0
            h ← (b - a) / n
            x ← a + h / 2
            Pour i de 1 à n Faire
                somme ← somme + f(x)
                x ← x + h
            FinPour
            Retourner somme * h
        Fin
      `,
      tdo: [...reels('somme', 'h', 'x'), ...entiers('i')],
      hints: [
        '3ardh kol rectangle : tul el intervalle 3la n.',
        'x yebda fel west mta3 el rectangle el louwel.',
      ],
      tests: [
        proche('Rect(0, 1, 20)', 0.33333333, 0.001, 'Aire proche de 1/3', ['x']),
        proche('Rect(0, 2, 1000)', 2.66666667, 0.0001, 'Sur [0, 2] : 8/3'),
      ],
      stage: { type: 'target', variable: 'x', exact: 1, min: 0, max: 1 },
      objective: 'Tjamma3 rectangles bech ta7seb el aire.',
      principle: [
        'T9assem [a, b] l n morceaux.',
        'Fi kol morceau rectangle.',
        'Kol ma n kbir, kol ma el natija a9reb.',
      ],
      intro: [
        { say: 'x yet9addem b h, w kol mara rectangle yetzad.', events: change('x', 0.1, 0.3, 0.5, 0.7, 0.9) },
      ],
    },
    {
      slug: 'bac-app-trapezes',
      title: 'Aire : les trapèzes',
      statement: code`
        Écrire f(x) = x², puis la fonction Trapezes(a, b, n) qui calcule la même aire
        par la méthode des trapèzes.
      `,
      bitou: 'Blaset tul wa7ed, moyenne el zouz jwneb.',
      python: code`
        def f(x):
            return x * x


        def Trapezes(a, b, n):
            somme = 0
            h = (b - a) / n
            x = a
            for i in range(n):
                somme = somme + (f(x) + f(x + h)) / 2
                x = x + h
            return somme * h
      `,
      algo: code`
        Fonction f(x : Réel) : Réel
        Début
            Retourner x * x
        Fin

        Fonction Trapezes(a : Réel, b : Réel, n : Entier) : Réel
        Début
            somme ← 0
            h ← (b - a) / n
            x ← a
            Pour i de 1 à n Faire
                somme ← somme + (f(x) + f(x + h)) / 2
                x ← x + h
            FinPour
            Retourner somme * h
        Fin
      `,
      tdo: [...reels('somme', 'h', 'x'), ...entiers('i')],
      hints: ['x yebda men a.', 'Aire trapèze = (f(x) + f(x + h)) / 2 × h.'],
      tests: [
        proche('Trapezes(0, 1, 50)', 0.33333333, 0.001, 'Aire proche de 1/3', ['x']),
      ],
      stage: { type: 'target', variable: 'x', exact: 1, min: 0, max: 1 },
      objective: 'Ta7seb el aire b trapèzes.',
      principle: [
        'Trapèze y9arreb a7sen men rectangle.',
        'Kol morceau : moyenne f fel zouz bornes.',
      ],
      intro: [{ say: 'Morceau morceau, men a lel b.', events: change('x', 0, 0.2, 0.4, 0.6, 0.8) }],
    },
    {
      slug: 'bac-app-pi',
      title: 'Approcher π',
      chest: true,
      statement: code`
        La formule de Gregory donne π / 4 = 1 - 1/3 + 1/5 - 1/7 + ...
        Écrire la fonction Pi(eps) qui ajoute les termes jusqu'à ce qu'un terme
        (fois 4) soit plus petit que eps, puis retourne la valeur approchée de π.
      `,
      bitou: 'Mission el chapitre! Signe yetbaddel, w dénominateur yzid b 2.',
      python: code`
        def Pi(eps):
            s = 0
            k = 1
            signe = 1
            while 4 / k >= eps:
                s = s + signe * 4 / k
                signe = -signe
                k = k + 2
            return s
      `,
      algo: code`
        Fonction Pi(eps : Réel) : Réel
        Début
            s ← 0
            k ← 1
            signe ← 1
            TantQue 4 / k ≥ eps Faire
                s ← s + signe * 4 / k
                signe ← -signe
                k ← k + 2
            FinTantQue
            Retourner s
        Fin
      `,
      tdo: [...reels('s'), ...entiers('k', 'signe')],
      hints: [
        'Variable lel signe : 1 ba3d -1.',
        'Boucle to9ef ki el terme ywalli sghir.',
      ],
      tests: [
        proche('Pi(0.01)', 3.14159265, 0.02, 'π à 0.02 près', ['s']),
        proche('Pi(0.001)', 3.14159265, 0.002, 'Plus précis'),
      ],
      stage: { type: 'target', variable: 's', exact: 3.14159265, min: 2.5, max: 4 },
      objective: 'Tkarrab π terme b terme.',
      principle: [
        'Kol terme yfout π men jiha.',
        'El sahm yetmaywej, w yo93od a9reb.',
      ],
      intro: [
        {
          say: '4, 2.67, 3.47, 2.9, 3.34... tkarreb men el zouz jihat.',
          events: change('s', 4, 2.6667, 3.4667, 2.8952, 3.3397, 2.9760, 3.2837),
        },
      ],
    },
  ],
);

export const SUITE: PackChapter[] = [
  BINAIRES,
  RECURSIVITE,
  RECURRENCE,
  ARITHMETIQUE,
  APPROXIMATION,
];

// ---------- Defis ajoutes aux premiers chapitres (avant la mission du coffre) ----------

const SHELL_VALUES = [45, 80, 30, 65, 95, 20, 55];

/** Le tri Shell du plus grand au plus petit. */
function shell(values: number[]): TraceEvent[] {
  const t = [...values];
  const events: TraceEvent[] = [];
  let p = 0;
  while (p < t.length) p = 3 * p + 1;
  while (p > 1) {
    p = Math.floor(p / 3);
    for (let i = p; i < t.length; i++) {
      const aux = t[i];
      let j = i;
      events.push({ t: 'get', i });
      while (j >= p && t[j - p] < aux) {
        t[j] = t[j - p];
        events.push({ t: 'get', i: j - p }, { t: 'set', i: j, v: t[j] });
        j -= p;
      }
      t[j] = aux;
      if (j !== i) events.push({ t: 'set', i: j, v: aux });
    }
  }
  return events;
}

const triangle = (first: number[]) =>
  first.map((_, i) => (i === 0 ? first : first.map(() => 0)));

const DEFIS: Record<string, Mission[]> = {
  'bac-enregistrements': [
    {
      slug: 'bac-enr-codes',
      title: 'Les codes valides',
      statement: code`
        Une clé C a trois champs : nb, somme et diviseur. Un code (chaîne de chiffres) est valide
        s'il a nb chiffres, si la somme de ses chiffres vaut somme, et si diviseur le divise.
        Saisir C, puis n codes, et afficher les codes valides.
      `,
      bitou: 'Défi! Carte wa7da, w barcha codes t9arenhom m3aha.',
      python: code`
        C = dict()
        C["nb"] = int(input("nb : "))
        C["somme"] = int(input("somme : "))
        C["diviseur"] = int(input("diviseur : "))
        n = int(input("n : "))
        for i in range(n):
            ch = input("Code : ")
            s = 0
            for j in range(len(ch)):
                s = s + int(ch[j])
            if len(ch) == C["nb"] and s == C["somme"] and int(ch) % C["diviseur"] == 0:
                print(ch)
      `,
      algo: code`
        Type
            Cle = Enregistrement
                nb, somme, diviseur : Entier
            Fin

        ALGORITHME Codes
        DEBUT
            Ecrire("nb : "), Lire(C.nb)
            Ecrire("somme : "), Lire(C.somme)
            Ecrire("diviseur : "), Lire(C.diviseur)
            Ecrire("n : "), Lire(n)
            Pour i de 1 à n Faire
                Ecrire("Code : "), Lire(ch)
                s ← 0
                Pour j de 0 à Long(ch) - 1 Faire
                    s ← s + Valeur(ch[j])
                FinPour
                Si (Long(ch) = C.nb) et (s = C.somme) et (Valeur(ch) mod C.diviseur = 0) Alors
                    Ecrire(ch)
                FinSi
            FinPour
        FIN
      `,
      tdo: [...objets('Cle', 'C'), ...entiers('n', 'i', 'j', 's'), ...chaines('ch')],
      hints: [
        'Boucle wost boucle : wa7da lel codes, w wa7da lel chiffres.',
        'Thletha chourout m3a b3adhhom.',
      ],
      tests: [
        {
          inputs: ['6', '22', '11', '4', '11542331', '109516', '514326', '451203'],
          output: ['109516'],
          absent: ['11542331', '514326', '451203'],
          label: 'Seul 109516 est valide',
        },
      ],
      stage: {
        type: 'cards',
        title: 'Clé',
        fields: ['nb', 'somme', 'diviseur'],
        count: 1,
      },
      objective: 'Tfarrez el codes el s7a7 b carte el clé.',
      principle: [
        'El clé enregistrement b thletha champs.',
        'Kol code tverifi 3lih el thletha.',
      ],
      intro: [
        {
          say: 'El clé : 6 chiffres, somme 22, diviseur 11.',
          events: [
            { t: 'field', r: 0, k: 'nb', v: 6 },
            { t: 'field', r: 0, k: 'somme', v: 22 },
            { t: 'field', r: 0, k: 'diviseur', v: 11 },
          ],
        },
      ],
    },
  ],
  'bac-matrices': [
    {
      slug: 'bac-mat-triangle',
      title: 'Le triangle des sommes',
      statement: code`
        La première ligne de la matrice carrée M est remplie. Écrire la procédure Triangle(@M, n) :
        pour i ≥ 1, chaque case M[i, j] (j de 0 à n - 1 - i) est la somme des éléments
        de la ligne i - 1, de la colonne j à la colonne n - i.
        Exemple : M[1, 2] = 1 + 8 + 3 + 1 = 13.
      `,
      bitou: 'Défi! Thletha boucles : ligne, colonne, w somme.',
      python: code`
        def Triangle(M, n):
            for i in range(1, n):
                for j in range(n - i):
                    s = 0
                    for k in range(j, n - i + 1):
                        s = s + M[i - 1][k]
                    M[i][j] = s
      `,
      algo: code`
        Procedure Triangle(@M : Mat, n : Entier)
        Début
            Pour i de 1 à n - 1 Faire
                Pour j de 0 à n - 1 - i Faire
                    s ← 0
                    Pour k de j à n - i Faire
                        s ← s + M[i - 1, k]
                    FinPour
                    M[i, j] ← s
                FinPour
            FinPour
        Fin
      `,
      tdo: entiers('i', 'j', 'k', 's'),
      hints: [
        'Kol ligne fiha case a9all men eli fou9ha.',
        'El somme tebda b 0 9bal kol case.',
      ],
      tests: [
        {
          setup: `M = _matrice(${JSON.stringify(triangle([2, 5, 1, 8, 3, 1]))})`,
          expr: '(Triangle(M, 6), M.tolist()[1][:5], M.tolist()[5][0])',
          expected: '(None, [20, 18, 13, 12, 4], 433)',
          label: 'Ligne 1 : 20 18 13 12 4 ; dernière case : 433',
        },
      ],
      stage: { type: 'cinema', rows: triangle([2, 5, 1, 8, 3, 1]), mode: 'numbers' },
      objective: 'T3abbi el triangle men el ligne el louwla.',
      principle: [
        'Kol ligne tet7seb men eli fou9ha.',
        'Case = majmou3 eli fou9ha men colonne-ha lel ekher.',
      ],
      intro: [
        {
          say: '2 + 5 + 1 + 8 + 3 + 1 = 20, ba3d 5 + 1 + 8 + 3 + 1 = 18...',
          events: [
            { t: 'mset', i: 1, j: 0, v: 20 },
            { t: 'mset', i: 1, j: 1, v: 18 },
            { t: 'mset', i: 1, j: 2, v: 13 },
          ],
        },
      ],
    },
  ],
  'bac-fichiers': [
    {
      slug: 'bac-fic-numeroter',
      title: 'Numéroter les lignes',
      statement: code`
        Copier "sac.txt" dans "copie.txt" en numérotant les lignes.
        Exemple : la première ligne devient "1 pomme".
      `,
      bitou: 'Défi! Compteur yemchi m3a el lecture.',
      python: code`
        F = open("sac.txt", "r")
        G = open("copie.txt", "w")
        n = 0
        ch = F.readline()
        while ch != "":
            n = n + 1
            G.write(str(n) + " " + ch)
            ch = F.readline()
        F.close()
        G.close()
      `,
      algo: code`
        ALGORITHME Copie
        DEBUT
            Ouvrir("sac.txt", F, "r")
            Ouvrir("copie.txt", G, "w")
            n ← 0
            TantQue Non Fin_fichier(F) Faire
                Lire_ligne(F, ch)
                n ← n + 1
                Ecrire_nl(G, Convch(n) + " " + ch)
            FinTantQue
            Fermer(F)
            Fermer(G)
        FIN
      `,
      tdo: [...objets('Fichier', 'F', 'G'), ...chaines('ch'), ...entiers('n')],
      hints: ['Convch y7awwel el nombre l chaîne.', 'Zouz Fermer fel ekher.'],
      tests: [
        {
          files: { 'sac.txt': 'pomme\nlait\n' },
          expr: '_texte("copie.txt")',
          expected: '"1 pomme\\n2 lait\\n"',
          closed: true,
          label: 'copie.txt numérotée',
        },
      ],
      stage: {
        type: 'shop',
        bags: { 'sac.txt': ['pomme', 'lait'], 'copie.txt': [] },
      },
      objective: 'Tensakh el sac, w kol produit b numérou.',
      principle: ['Ta9ra men fichier w tekteb fi fichier.', 'Compteur yzid fi kol ligne.'],
      intro: [
        {
          say: 'Pomme ywalli "1 pomme".',
          events: [
            { t: 'open', file: 'sac.txt', mode: 'r' },
            { t: 'open', file: 'copie.txt', mode: 'w' },
            { t: 'read', file: 'sac.txt', text: 'pomme\n' },
            { t: 'write', file: 'copie.txt', text: '1 pomme\n' },
          ],
        },
      ],
    },
    {
      slug: 'bac-fic-supprimer',
      title: 'Supprimer une ligne',
      statement: code`
        Saisir p, puis supprimer la ligne numéro p de "sac.txt" (la première ligne a le numéro 1).
        Le fichier doit garder les autres lignes, dans le même ordre.
      `,
      bitou: 'Défi! Ma tnajemch tfassa5 ligne fi west fichier texte : chnouwa el 7all?',
      python: code`
        from numpy import *
        p = int(input("p : "))
        T = array([str()] * 50, dtype=object)
        F = open("sac.txt", "r")
        n = 0
        ch = F.readline()
        while ch != "":
            T[n] = ch
            n = n + 1
            ch = F.readline()
        F.close()
        F = open("sac.txt", "w")
        for i in range(n):
            if i != p - 1:
                F.write(T[i])
        F.close()
      `,
      algo: code`
        ALGORITHME Supprimer
        DEBUT
            Ecrire("p : "), Lire(p)
            Ouvrir("sac.txt", F, "r")
            n ← 0
            TantQue Non Fin_fichier(F) Faire
                Lire_ligne(F, T[n])
                n ← n + 1
            FinTantQue
            Fermer(F)
            Ouvrir("sac.txt", F, "w")
            Pour i de 0 à n - 1 Faire
                Si i ≠ p - 1 Alors
                    Ecrire_nl(F, T[i])
                FinSi
            FinPour
            Fermer(F)
        FIN
      `,
      tdo: [
        ...objets('Fichier', 'F'),
        ...entiers('p', 'n', 'i'),
        { name: 'T', type: 'Tableau', elem: 'Chaîne', size: 50 },
      ],
      hints: [
        'Ehfedh el lignes fi tableau 9bal.',
        'Ba3d 3awed ekteb el fichier men jdid.',
      ],
      tests: [
        {
          files: { 'sac.txt': 'pomme\nlait\npain\n' },
          inputs: ['2'],
          expr: '_texte("sac.txt")',
          expected: '"pomme\\npain\\n"',
          closed: true,
          label: 'Supprimer la ligne 2',
        },
        {
          files: { 'sac.txt': 'pomme\nlait\n' },
          inputs: ['1'],
          expr: '_texte("sac.txt")',
          expected: '"lait\\n"',
          closed: true,
          hidden: true,
        },
      ],
      stage: { type: 'shop', bags: { 'sac.txt': ['pomme', 'lait', 'pain'] } },
      objective: 'Tna77i produit men west el sac.',
      principle: [
        'Fichier texte yet9ra b tartib, ma tnajem tbaddel fi westou.',
        'T9ra el kol fi tableau.',
        'T3awed tekteb el kol bla el ligne p.',
      ],
      intro: [
        {
          say: 'Nfarrghou el sac, ba3d nraj3ou ken eli n7ebbou.',
          events: [
            { t: 'open', file: 'sac.txt', mode: 'r' },
            { t: 'read', file: 'sac.txt', text: 'pomme\n' },
            { t: 'read', file: 'sac.txt', text: 'lait\n' },
            { t: 'read', file: 'sac.txt', text: 'pain\n' },
            { t: 'close', file: 'sac.txt' },
          ],
        },
      ],
    },
  ],
  'bac-tris': [
    {
      slug: 'bac-tri-shell',
      title: 'Tri Shell',
      statement: code`
        Écrire la procédure Tri_Shell(@T, n) qui range T du plus grand au plus petit.
        Le pas P suit la suite P = 3 × P + 1 : on choisit le premier pas ≥ n,
        puis on le divise par 3 à chaque tour, et on fait un tri par insertion de pas P.
      `,
      bitou: 'Défi! Insertion, ama el pingouins yenaggzou b pas kbir 9bal.',
      python: code`
        def Tri_Shell(T, n):
            p = 0
            while p < n:
                p = 3 * p + 1
            while p > 1:
                p = p // 3
                for i in range(p, n):
                    aux = T[i]
                    j = i
                    while j >= p and T[j - p] < aux:
                        T[j] = T[j - p]
                        j = j - p
                    T[j] = aux
      `,
      algo: code`
        Procedure Tri_Shell(@T : Tab, n : Entier)
        Début
            p ← 0
            TantQue p < n Faire
                p ← 3 * p + 1
            FinTantQue
            TantQue p > 1 Faire
                p ← p div 3
                Pour i de p à n - 1 Faire
                    aux ← T[i]
                    j ← i
                    TantQue (j ≥ p) et (T[j - p] < aux) Faire
                        T[j] ← T[j - p]
                        j ← j - p
                    FinTantQue
                    T[j] ← aux
                FinPour
            FinTantQue
        Fin
      `,
      tdo: entiers('p', 'i', 'j', 'aux'),
      hints: [
        'Kif tri par insertion, ama 1 ywalli p.',
        'El dernier pas lezem ykoun 1.',
      ],
      tests: [
        {
          setup: `T = _suivi([${SHELL_VALUES.join(', ')}])`,
          expr: '(Tri_Shell(T, 7), list(T))[1]',
          expected: '[95, 80, 65, 55, 45, 30, 20]',
          label: 'Ranger 7 pingouins',
        },
        {
          setup: 'T = _suivi([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])',
          expr: '(Tri_Shell(T, 10), list(T))[1]',
          expected: '[10, 9, 8, 7, 6, 5, 4, 3, 2, 1]',
          hidden: true,
        },
      ],
      stage: { type: 'penguins', values: SHELL_VALUES, target: 'desc' },
      objective: 'Tnaddhem el saf b tabdilat b3ida, ba3d 9riba.',
      principle: [
        'Pas kbir : el pingouins el b3ad yetbaddlou louwel.',
        'P ← 3 × P + 1 bech tal9a el pas.',
        'Ba3d P div 3 fi kol tour, 7atta 1.',
      ],
      intro: [
        { say: 'Pas 4 louwel, ba3d pas 1.', events: shell(SHELL_VALUES) },
      ],
    },
  ],
};

/** Ajoute les defis avant la derniere mission de chaque chapitre. */
export const avecDefis = (chapters: PackChapter[]): PackChapter[] =>
  chapters.map((chapter) => {
    const defis = (DEFIS[chapter.slug] ?? []).map(mission);
    const levels = [...chapter.levels];
    levels.splice(levels.length - 1, 0, ...defis);
    return { ...chapter, levels };
  });
