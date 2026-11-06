import type { PackChapter, PythonTest, TdoRow, TraceEvent } from '../types.js';
import { code, START } from './text.js';

/**
 * Jeu "Aventure Bac", parcours Bac Info. Chaque mission raconte une histoire : objectif,
 * principe, petite video, puis la scene rejoue ce que le code de l'eleve a vraiment fait.
 * La premiere mission de chaque chapitre est resolue et expliquee (`story.solved`).
 * Notation : cours "Les fichiers" et "Algorithme de tri" du professeur.
 */

const entiers = (...names: string[]): TdoRow[] =>
  names.map((name) => ({ name, type: 'Entier' }));
const chaines = (...names: string[]): TdoRow[] =>
  names.map((name) => ({ name, type: 'Chaîne' }));
const fichiers = (...names: string[]): TdoRow[] =>
  names.map((name) => ({ name, type: 'Fichier' }));

// ---------- Fichiers ----------

const SAC = ['pomme', 'lait', 'pain', 'fromage'];
const lignes = (items: string[]) => items.map((item) => `${item}\n`).join('');
const sac = (items: string[]) => ({ 'sac.txt': lignes(items) });

/** Test : le fichier contient exactement ces lignes et il est ferme. */
const contient = (nom: string, items: string[]) => ({
  expr: `_texte(${JSON.stringify(nom)})`,
  expected: JSON.stringify(lignes(items)),
  closed: true,
  label: `${nom} contient : ${items.join(', ') || '(rien)'}`,
});

const ecrire = (file: string, items: string[]): TraceEvent[] =>
  items.map((item) => ({ t: 'write', file, text: `${item}\n` }));
const lire = (file: string, items: string[]): TraceEvent[] =>
  items.map((item) => ({ t: 'read', file, text: `${item}\n` }));

// ---------- Tris ----------

/** Ecritures d'un echange avec aux, comme dans le cours. */
function echange(t: number[], i: number, j: number): TraceEvent[] {
  const [a, b] = [t[i], t[j]];
  t[i] = b;
  t[j] = a;
  return [
    { t: 'set', i, v: b },
    { t: 'set', i: j, v: a },
  ];
}

/** Du plus grand au plus petit : les premiers tours, ou tous. */
function bulles(values: number[], passes = values.length): TraceEvent[] {
  const t = [...values];
  const events: TraceEvent[] = [];
  for (let p = 0; p < passes; p++) {
    for (let i = 0; i < t.length - 1 - p; i++) {
      events.push({ t: 'get', i }, { t: 'get', i: i + 1 });
      if (t[i] < t[i + 1]) events.push(...echange(t, i, i + 1));
    }
  }
  return events;
}

function selection(values: number[]): TraceEvent[] {
  const t = [...values];
  const events: TraceEvent[] = [];
  for (let i = 0; i < t.length - 1; i++) {
    let m = i;
    for (let j = i + 1; j < t.length; j++) {
      events.push({ t: 'get', i: m }, { t: 'get', i: j });
      if (t[j] > t[m]) m = j;
    }
    if (m !== i) events.push(...echange(t, i, m));
  }
  return events;
}

function insertion(values: number[]): TraceEvent[] {
  const t = [...values];
  const events: TraceEvent[] = [];
  for (let i = 1; i < t.length; i++) {
    const aux = t[i];
    let j = i;
    events.push({ t: 'get', i });
    while (j > 0 && t[j - 1] < aux) {
      t[j] = t[j - 1];
      events.push({ t: 'get', i: j - 1 }, { t: 'set', i: j, v: t[j] });
      j--;
    }
    t[j] = aux;
    if (j !== i) events.push({ t: 'set', i: j, v: aux });
  }
  return events;
}

const DEPART = [45, 80, 30, 65, 95];
const decroissant = (values: number[]) => [...values].sort((a, b) => b - a);

/** Test : apres l'appel du tri, le tableau est du plus grand au plus petit. */
const trie = (nom: string, values: number[], hidden = false): PythonTest => ({
  setup: `T = _suivi([${values.join(', ')}])`,
  expr: `(${nom}(T, ${values.length}), list(T))[1]`,
  expected: JSON.stringify(decroissant(values)),
  label: `Ranger ${values.join(', ')}`,
  hidden,
});

const REMPLIR_PYTHON = code`
  F = open("sac.txt", "w")
  rep = "oui"
  while rep != "non":
      p = input("Produit : ")
      F.write(p + "\n")
      rep = input("Voulez-vous continuer ? ")
  F.close()
`;

const REMPLIR_ALGO = code`
  ALGORITHME Courses
  DEBUT
      Ouvrir("sac.txt", F, "w")
      Répéter
          Ecrire("Produit : "), Lire(p)
          Ecrire_nl(F, p)
          Ecrire("Voulez-vous continuer ? "), Lire(rep)
      Jusqu'à rep = "non"
      Fermer(F)
  FIN
`;

const BULLES_PYTHON = code`
  def Tri_Bulles(T, n):
      ok = False
      while not ok:
          ok = True
          for i in range(n - 1):
              if T[i] < T[i + 1]:
                  aux = T[i]
                  T[i] = T[i + 1]
                  T[i + 1] = aux
                  ok = False
`;

const BULLES_ALGO = code`
  Procedure Tri_Bulles(@T : Tab, n : Entier)
  Début
      ok ← Faux
      TantQue Non ok Faire
          ok ← Vrai
          Pour i de 0 à n - 2 Faire
              Si T[i] < T[i + 1] Alors
                  aux ← T[i]
                  T[i] ← T[i + 1]
                  T[i + 1] ← aux
                  ok ← Faux
              FinSi
          FinPour
      FinTantQue
  Fin
`;

const PREMIER_TOUR = bulles(DEPART, 1);

export const BAC: PackChapter[] = [
  {
    slug: 'bac-fichiers',
    kind: 'STORY',
    track: 'BAC_INFO',
    title: 'Les fichiers texte',
    description:
      'Le sac des courses : Ouvrir, remplir, vider jusqu’à la fin du fichier, Fermer.',
    levels: [
      {
        slug: 'bac-fic-remplir',
        kind: 'STORY',
        title: 'Remplir le sac',
        statement: code`
          Écrire un programme qui saisit des produits et les enregistre, un par ligne,
          dans le fichier "sac.txt". Après chaque produit, le programme demande
          "Voulez-vous continuer ?" : la saisie s'arrête quand on répond "non".
        `,
        bitou: code`
          Hedhi el mission el louwla : el 7all mawjoud ken t7eb tchoufou.
          Ama el programme, enti eli tektbou, ba3d enzel "Lancer" w chouf el sac kifeh yet3abba.
        `,
        starterCode: START,
        solution: REMPLIR_PYTHON,
        hints: [
          'Ma tnajem t7ott chay fel sac 9bal ma t7ellou.',
          'Fama dima produit wa7ed 3al a9all : anehi el boucle el mounesba?',
          'Ma tensech tsakkar el sac fel ekher.',
        ],
        data: {
          scene: 'door',
          tests: [
            {
              inputs: ['pomme', 'oui', 'lait', 'oui', 'pain', 'non'],
              ...contient('sac.txt', ['pomme', 'lait', 'pain']),
            },
            {
              inputs: ['thon', 'non'],
              ...contient('sac.txt', ['thon']),
              hidden: true,
            },
          ],
          algo: {
            starter: code`
              ALGORITHME Courses
              DEBUT

              FIN
            `,
            solution: REMPLIR_ALGO,
            tdo: [...fichiers('F'), ...chaines('p', 'rep')],
          },
          story: {
            stage: { type: 'shop', bags: { 'sac.txt': [] } },
            objective:
              'Te5ou produits men 3and el bayya3, w t7ottehom fel sac wa7ed wa7ed. Ba3d kol produit yes2lek "Voulez-vous continuer ?", 7atta tjaweb "non".',
            principle: [
              'El sac howa el fichier "sac.txt", w F howa esmou fel programme (nom logique).',
              'Ma tnajem t7ott chay 9bal ma t7ell el sac : Ouvrir("sac.txt", F, "w").',
              'Kol produit yod5ol fi ligne wa7dou : Ecrire_nl(F, p).',
              'Ki tkammel, tsakkar el sac : Fermer(F). Ken la, el produits ma yetsajjlouch.',
            ],
            intro: [
              {
                say: 'Haw el bayya3, w haw el sac el fergh mte3ek.',
                events: [],
              },
              {
                say: 'Louwel t7ell el sac b Ouvrir.',
                events: [{ t: 'open', file: 'sac.txt', mode: 'w' }],
              },
              {
                say: 'El bayya3 ya3tik produit, w enti t7ottou fel sac. Kol mara produit...',
                events: ecrire('sac.txt', ['pomme', 'lait', 'pain']),
              },
              {
                say: 'Ki tjaweb "non", tsakkar el sac b Fermer.',
                events: [{ t: 'close', file: 'sac.txt' }],
              },
            ],
            solved: {
              python: REMPLIR_PYTHON,
              algo: REMPLIR_ALGO,
              tdo: [...fichiers('F'), ...chaines('p', 'rep')],
              notes: [
                {
                  code: 'Ouvrir("sac.txt", F, "w")',
                  why: 'N7ell el sac bech nekteb fih. "w" ya3ni écriture : ken el fichier mawjoud yetfassa5.',
                },
                {
                  code: 'Répéter',
                  why: 'Répéter 5ater fama dima produit wa7ed 3al a9all.',
                },
                {
                  code: 'Ecrire_nl(F, p)',
                  why: 'N7ott el produit fel fichier, w ba3dou retour à la ligne.',
                },
                {
                  code: 'Ecrire("Voulez-vous continuer ? "), Lire(rep)',
                  why: 'Nes2lou ken y7eb yzid : yjaweb oui wala non.',
                },
                {
                  code: 'Jusqu\'à rep = "non"',
                  why: 'El boucle to9ef ki yjaweb non.',
                },
                {
                  code: 'Fermer(F)',
                  why: 'Nsakkar el sac : tawa el produits tsajjlou fel fichier.',
                },
              ],
            },
          },
        },
      },
      {
        slug: 'bac-fic-vider',
        kind: 'STORY',
        title: 'Vider le sac',
        statement: code`
          Le fichier "sac.txt" contient un produit par ligne.
          Écrire un programme qui affiche tous ses produits, jusqu'à la fin du fichier.
        `,
        bitou: code`
          Tawa dourek! El rajel lezmou yejbed el produits mel sac, wa7ed wa7ed,
          7atta yefregh. Ki yefregh, chouf chnouwa yodhhor fou9 rasou.
        `,
        starterCode: START,
        solution: code`
          F = open("sac.txt", "r")
          ch = F.readline()
          while ch != "":
              print(ch.strip())
              ch = F.readline()
          F.close()
        `,
        hints: [
          'Ma ta3refch 9addech men produit fel sac : chnouwa el boucle eli ma t7ebech 3add?',
          'El fonction mta3 fin du fichier ta3tik Vrai ki el sac yefregh. Enti t7eb tkammel ma dam mouch hakka.',
          'Fi kol tour tejbed ligne wa7da. Ma tensech tsakkar el sac.',
        ],
        data: {
          scene: 'door',
          tests: [
            {
              files: sac(SAC),
              output: SAC,
              closed: true,
              label: 'Afficher les 4 produits',
            },
            {
              files: sac(['thon']),
              output: ['thon'],
              closed: true,
              hidden: true,
            },
          ],
          algo: {
            starter: code`
              ALGORITHME Vider
              DEBUT

              FIN
            `,
            solution: code`
              ALGORITHME Vider
              DEBUT
                  Ouvrir("sac.txt", F, "r")
                  TantQue Non Fin_fichier(F) Faire
                      Lire_ligne(F, ch)
                      Ecrire(ch)
                  FinTantQue
                  Fermer(F)
              FIN
            `,
            tdo: [...fichiers('F'), ...chaines('ch')],
          },
          story: {
            stage: { type: 'shop', bags: { 'sac.txt': SAC } },
            objective:
              'Tejbed el produits mel sac wa7ed wa7ed w t7ottehom 3al tawla, 7atta el sac yefregh.',
            principle: [
              'T7ell el sac bech ta9ra bark : el mode "r".',
              'Tkammel tejbed ma dam el sac mouch fergh : "tant que non fin fichier".',
              'Kol mara tejbed ligne b Lire_ligne, w t2affichiha.',
              'Ki yefregh, "!" fou9 ras el rajel : Fin_fichier wallet Vrai. Tsakkar el sac.',
            ],
            intro: [
              {
                say: 'El sac m3abbi, w ma na3refch 9addech fih.',
                events: [],
              },
              {
                say: 'N7ellou bech na9raw, ba3d nejbed produit produit...',
                events: [
                  { t: 'open', file: 'sac.txt', mode: 'r' },
                  ...lire('sac.txt', SAC),
                ],
              },
              {
                say: 'El sac fregh : "!" ya3ni wsolna l fin du fichier.',
                events: [{ t: 'eof', file: 'sac.txt' }],
              },
              {
                say: 'W kif dima, nsakkrou b Fermer.',
                events: [{ t: 'close', file: 'sac.txt' }],
              },
            ],
          },
        },
      },
      {
        slug: 'bac-fic-compter',
        kind: 'STORY',
        title: 'Compter les produits',
        statement: code`
          Écrire un programme qui affiche le nombre de produits du fichier "sac.txt".
        `,
        bitou: code`
          El bayya3 yes2el : 9addech men produit 5dhit?
          Ma tnajem ta3ref ken ki tfarragh el sac w t3idd.
        `,
        starterCode: START,
        solution: code`
          F = open("sac.txt", "r")
          n = 0
          ch = F.readline()
          while ch != "":
              n = n + 1
              ch = F.readline()
          F.close()
          print(n)
        `,
        hints: [
          'Nafs el boucle mta3 mission "Vider le sac".',
          'Compteur yebda b 0, w yzid 1 ki tejbed produit.',
        ],
        data: {
          scene: 'door',
          tests: [
            {
              files: sac(SAC),
              numbers: ['4'],
              closed: true,
              label: '4 produits dans le sac',
            },
            { files: sac([]), numbers: ['0'], closed: true, hidden: true },
            {
              files: sac(['thon', 'lait']),
              numbers: ['2'],
              closed: true,
              hidden: true,
            },
          ],
          algo: {
            starter: code`
              ALGORITHME Compter
              DEBUT

              FIN
            `,
            solution: code`
              ALGORITHME Compter
              DEBUT
                  Ouvrir("sac.txt", F, "r")
                  n ← 0
                  TantQue Non Fin_fichier(F) Faire
                      Lire_ligne(F, ch)
                      n ← n + 1
                  FinTantQue
                  Fermer(F)
                  Ecrire(n)
              FIN
            `,
            tdo: [...fichiers('F'), ...chaines('ch'), ...entiers('n')],
          },
          story: {
            stage: { type: 'shop', bags: { 'sac.txt': SAC } },
            objective: 'Ta3ref 9addech men produit fel sac.',
            principle: [
              'Fel fichier texte, ma fama 7atta fonction ta3tik 3add el lignes.',
              'Lezmek t9ra ligne ligne 7atta el fin, w t3idd kol ligne.',
            ],
            intro: [
              {
                say: 'Kol produit yo5rej, n3iddouh : 1, 2, 3...',
                events: [
                  { t: 'open', file: 'sac.txt', mode: 'r' },
                  ...lire('sac.txt', SAC),
                  { t: 'eof', file: 'sac.txt' },
                  { t: 'close', file: 'sac.txt' },
                ],
              },
            ],
          },
        },
      },
      {
        slug: 'bac-fic-ajouter',
        kind: 'STORY',
        title: 'Ajouter sans tout perdre',
        statement: code`
          Le fichier "sac.txt" contient déjà des produits. Écrire un programme qui saisit
          un produit p et l'ajoute à la fin du fichier, sans effacer les autres.
        `,
        bitou: code`
          Nsit el harissa! El sac fih produits, w ma t7ebech tfarrghou.
          Mode "w" yfassakh kol chay... chouf el principe.
        `,
        starterCode: START,
        solution: code`
          p = input("Produit : ")
          F = open("sac.txt", "a")
          F.write(p + "\n")
          F.close()
        `,
        hints: [
          'Chouf les modes fel cours : "r", "w", w mode theleth.',
          'Ba3d ma t7ell el sac, el écriture hiya hiya.',
        ],
        data: {
          scene: 'door',
          tests: [
            {
              files: sac(['pomme', 'lait']),
              inputs: ['harissa'],
              ...contient('sac.txt', ['pomme', 'lait', 'harissa']),
            },
            {
              files: sac(SAC),
              inputs: ['thon'],
              ...contient('sac.txt', [...SAC, 'thon']),
              hidden: true,
            },
          ],
          algo: {
            starter: code`
              ALGORITHME Ajouter
              DEBUT

              FIN
            `,
            solution: code`
              ALGORITHME Ajouter
              DEBUT
                  Ecrire("Produit : "), Lire(p)
                  Ouvrir("sac.txt", F, "a")
                  Ecrire_nl(F, p)
                  Fermer(F)
              FIN
            `,
            tdo: [...fichiers('F'), ...chaines('p')],
          },
          story: {
            stage: { type: 'shop', bags: { 'sac.txt': ['pomme', 'lait'] } },
            objective:
              'Tzid produit lel sac, w el produits el 9dom yo93dou fih.',
            principle: [
              '"w" yfarragh el sac 9bal ma yekteb.',
              'Fama mode ekher y7ell el sac w yekteb fel ekher (ajout).',
            ],
            intro: [
              {
                say: 'Ken n7ellou b "w", el sac yetfarragh kol-ou!',
                events: [
                  { t: 'open', file: 'sac.txt', mode: 'w' },
                  { t: 'close', file: 'sac.txt' },
                ],
              },
            ],
          },
        },
      },
      {
        slug: 'bac-fic-chercher',
        kind: 'STORY',
        title: 'Le produit est-il là ?',
        statement: code`
          Écrire un programme qui saisit un produit x, puis affiche "Trouvé" s'il existe
          dans "sac.txt" et "Non trouvé" sinon. La lecture s'arrête dès qu'il est trouvé.
        `,
        bitou: code`
          Ma t7ebech tfarragh el sac kol-ou ken el produit 5raj men louwel!
          El boucle to9ef ki tal9ah, wala ki el sac yefregh.
        `,
        starterCode: START,
        solution: code`
          x = input("Produit : ")
          F = open("sac.txt", "r")
          trv = False
          ch = F.readline()
          while ch != "" and not trv:
              trv = ch.strip() == x
              ch = F.readline()
          F.close()
          if trv:
              print("Trouvé")
          else:
              print("Non trouvé")
        `,
        hints: [
          'Variable booléenne tebda Faux, w t3awedh Vrai ki tal9a el produit.',
          'El boucle 3andha zouz chourout : fin du fichier, wala l9ineh.',
        ],
        data: {
          scene: 'door',
          tests: [
            {
              files: sac(SAC),
              inputs: ['lait'],
              output: ['Trouvé'],
              closed: true,
              label: '"lait" est dans le sac',
            },
            {
              files: sac(SAC),
              inputs: ['thon'],
              output: ['Non trouvé'],
              closed: true,
              label: '"thon" n\'est pas dans le sac',
            },
            {
              files: sac([]),
              inputs: ['pain'],
              output: ['Non trouvé'],
              closed: true,
              hidden: true,
            },
          ],
          algo: {
            starter: code`
              ALGORITHME Recherche
              DEBUT

              FIN
            `,
            solution: code`
              ALGORITHME Recherche
              DEBUT
                  Ecrire("Produit : "), Lire(x)
                  Ouvrir("sac.txt", F, "r")
                  Trv ← Faux
                  TantQue Non (Fin_fichier(F) ou Trv) Faire
                      Lire_ligne(F, ch)
                      Trv ← ch = x
                  FinTantQue
                  Fermer(F)
                  Si Trv Alors
                      Ecrire("Trouvé")
                  Sinon
                      Ecrire("Non trouvé")
                  FinSi
              FIN
            `,
            tdo: [
              ...fichiers('F'),
              ...chaines('x', 'ch'),
              { name: 'Trv', type: 'Booléen' },
            ],
          },
          story: {
            stage: { type: 'shop', bags: { 'sac.txt': SAC } },
            objective:
              'Tchouf el produit mawjoud wala la, bla ma tfarragh el sac bla fayda.',
            principle: [
              'Tejbed produit produit, w t9arnou m3a x.',
              'To9ef ki tal9ah (mouch lezem tkammel), wala ki el sac yefregh.',
            ],
            intro: [
              {
                say: 'N7awsou 3al lait : pomme la... lait ey! Nwa99fou houni.',
                events: [
                  { t: 'open', file: 'sac.txt', mode: 'r' },
                  ...lire('sac.txt', ['pomme', 'lait']),
                  { t: 'close', file: 'sac.txt' },
                ],
              },
            ],
          },
        },
      },
      {
        slug: 'bac-fic-frigo',
        kind: 'STORY',
        title: 'Du sac au frigo',
        statement: code`
          Dans "sac.txt", un produit abîmé commence par le caractère "*".
          Écrire un programme qui copie les bons produits dans "frigo.txt".
          Les produits abîmés ne sont pas copiés.
        `,
        bitou: code`
          Mission el chapitre! Zouz fichiers m7loulin fi nafs el wa9t :
          wa7ed ta9ra menou, w wa7ed tekteb fih. Rodd belek tsakkar el zouz.
        `,
        starterCode: START,
        solution: code`
          F = open("sac.txt", "r")
          G = open("frigo.txt", "w")
          ch = F.readline()
          while ch != "":
              if ch[0:1] != "*":
                  G.write(ch)
              ch = F.readline()
          F.close()
          G.close()
        `,
        hints: [
          'Zouz noms logiques, kol wa7ed b mode mte3ou.',
          'Sous_Chaine ta3tik el caractère el louwel mta3 el ligne.',
        ],
        data: {
          scene: 'chest',
          tests: [
            {
              files: sac(['pomme', '*lait', 'pain', '*thon', 'fromage']),
              ...contient('frigo.txt', ['pomme', 'pain', 'fromage']),
            },
            {
              files: sac(['*lait']),
              ...contient('frigo.txt', []),
              hidden: true,
            },
          ],
          algo: {
            starter: code`
              ALGORITHME Frigo
              DEBUT

              FIN
            `,
            solution: code`
              ALGORITHME Frigo
              DEBUT
                  Ouvrir("sac.txt", F, "r")
                  Ouvrir("frigo.txt", G, "w")
                  TantQue Non Fin_fichier(F) Faire
                      Lire_ligne(F, ch)
                      Si Sous_Chaine(ch, 0, 1) ≠ "*" Alors
                          Ecrire_nl(G, ch)
                      FinSi
                  FinTantQue
                  Fermer(F)
                  Fermer(G)
              FIN
            `,
            tdo: [...fichiers('F', 'G'), ...chaines('ch')],
          },
          story: {
            stage: {
              type: 'shop',
              bags: {
                'sac.txt': ['pomme', '*lait', 'pain', '*thon', 'fromage'],
                'frigo.txt': [],
              },
            },
            objective:
              'T3addi el produits el bahyin mel sac lel frigo, w el produits el fesdin yo93dou barra.',
            principle: [
              'Fichier ta9ra menou ("r"), w fichier tekteb fih ("w").',
              'Kol produit tejbdou : ken mouch fased, tektbou fel frigo.',
              'Fi ekher el programme tsakkar el zouz.',
            ],
            intro: [
              {
                say: 'El pomme behia : lel frigo. El lait fased : la.',
                events: [
                  { t: 'open', file: 'sac.txt', mode: 'r' },
                  { t: 'open', file: 'frigo.txt', mode: 'w' },
                  ...lire('sac.txt', ['pomme']),
                  ...ecrire('frigo.txt', ['pomme']),
                  ...lire('sac.txt', ['*lait']),
                ],
              },
            ],
          },
        },
      },
    ],
  },
  {
    slug: 'bac-tris',
    kind: 'STORY',
    track: 'BAC_INFO',
    title: 'Les tris et la recherche',
    description:
      'Les pingouins : tri à bulles, sélection, insertion, puis recherche dichotomique.',
    levels: [
      {
        slug: 'bac-tri-bulles',
        kind: 'STORY',
        title: 'Tri à bulles',
        statement: code`
          La procédure Tri_Bulles(@T, n) range les n pingouins du tableau T,
          du plus grand au plus petit.
        `,
        bitou: code`
          Hedhi el mission el louwla : el 7all mawjoud ken t7eb tchoufou.
          Ama el procédure, enti eli tektebha, w el pingouins ya3mlou eli t9ollhom 3lih.
        `,
        starterCode: code`
          def Tri_Bulles(T, n):
              pass
        `,
        solution: BULLES_PYTHON,
        hints: [
          'Tour wa7ed ma yekfich : chnouwa ya3lmek eli el saf wfé?',
          'Booléen ychouf ken sar tabdil fel tour.',
          'El tabdil lezmou variable tesstanna fiha 9ima (aux).',
        ],
        data: {
          scene: 'door',
          tests: [
            trie('Tri_Bulles', DEPART),
            trie('Tri_Bulles', [10, 20, 30, 40, 50, 60], true),
          ],
          algo: {
            starter: code`
              Procedure Tri_Bulles(@T : Tab, n : Entier)
              Début

              Fin
            `,
            solution: BULLES_ALGO,
            tdo: [{ name: 'ok', type: 'Booléen' }, ...entiers('i', 'aux')],
          },
          story: {
            stage: { type: 'penguins', values: DEPART, target: 'desc' },
            objective:
              'Tnaddhem el pingouins, kol wa7ed 7dhe 5ouh, men el twil lel sghir.',
            principle: [
              'Tchouf zouz pingouins jiran, men el ysar lel ymin.',
              'Ken eli 3al ysar a9sar : ybaddlou blayes-hom.',
              'Fi kol tour, el a9sar yemchi lel ekher kif el bulle.',
              'T3awed el tours 7atta tour kemel bla 7atta tabdil.',
            ],
            intro: [
              {
                say: 'Pingouins mkhaltin : twil, sghir, metwasset...',
                events: [],
              },
              {
                say: 'Nchoufou zouz jiran : ken eli 3al ysar a9sar, ybaddlou blayes.',
                events: PREMIER_TOUR,
              },
              {
                say: 'El a9sar wsel lel ekher! W n3awdou tour ekher, w ekher...',
                events: bulles(DEPART).slice(PREMIER_TOUR.length),
              },
              {
                say: 'Haw el kol mnaddhmin, men el twil lel sghir.',
                events: [],
              },
            ],
            solved: {
              python: BULLES_PYTHON,
              algo: BULLES_ALGO,
              tdo: [{ name: 'ok', type: 'Booléen' }, ...entiers('i', 'aux')],
              notes: [
                {
                  code: 'TantQue Non ok Faire',
                  why: 'N3awdou tour ekher ma dam mazal tabdil fel tour eli fet.',
                },
                {
                  code: 'ok ← Vrai',
                  why: 'Fi bdeya kol tour nfarrdhou eli el tableau mrattab.',
                },
                {
                  code: 'Si T[i] < T[i + 1] Alors',
                  why: 'Eli 3al ysar a9sar men jarou : lezem ybaddlou.',
                },
                {
                  code: 'aux ← T[i]',
                  why: 'El pingouin yo5rej mel saf w yestanna (aux), sinon yedh3a3.',
                },
                {
                  code: 'ok ← Faux',
                  why: 'Sar tabdil : ya3ni lezem tour ekher.',
                },
              ],
            },
          },
        },
      },
      {
        slug: 'bac-tri-selection',
        kind: 'STORY',
        title: 'Tri par sélection',
        statement: code`
          Écrire la procédure Tri_Selection(@T, n) qui range les n pingouins du tableau T,
          du plus grand au plus petit, par la méthode du tri par sélection.
          Il faut au plus un échange par position.
        `,
        bitou: code`
          Tawa bla bulles : t5ayyer el akbar w t7ottou fi blastou mara wa7da.
          Ken 3malt barcha tabdilat, el test ma y3addikch!
        `,
        starterCode: code`
          def Tri_Selection(T, n):
              pass
        `,
        solution: code`
          def Tri_Selection(T, n):
              for i in range(n - 1):
                  m = i
                  for j in range(i + 1, n):
                      if T[j] > T[m]:
                          m = j
                  aux = T[i]
                  T[i] = T[m]
                  T[m] = aux
        `,
        hints: [
          'Zouz boucles : wa7da lel blasa eli t3abbiha, w wa7da t7aws 3al akbar fel ba9i.',
          'Ehfedh el indice mta3 el akbar, mouch el 9ima.',
          'El tabdil yetsir mara wa7da, ba3d el boucle eli t7aws.',
        ],
        data: {
          scene: 'door',
          tests: [
            trie('Tri_Selection', DEPART),
            {
              setup: 'T = _suivi([1, 2, 3, 4, 5, 6, 7])',
              expr: '(Tri_Selection(T, 7), list(T), T.ecritures <= 18)[1:]',
              expected: '([7, 6, 5, 4, 3, 2, 1], True)',
              label: 'Au plus un échange par position',
              hidden: true,
            },
          ],
          algo: {
            starter: code`
              Procedure Tri_Selection(@T : Tab, n : Entier)
              Début

              Fin
            `,
            solution: code`
              Procedure Tri_Selection(@T : Tab, n : Entier)
              Début
                  Pour i de 0 à n - 2 Faire
                      m ← i
                      Pour j de i + 1 à n - 1 Faire
                          Si T[j] > T[m] Alors
                              m ← j
                          FinSi
                      FinPour
                      aux ← T[i]
                      T[i] ← T[m]
                      T[m] ← aux
                  FinPour
              Fin
            `,
            tdo: entiers('i', 'j', 'm', 'aux'),
          },
          story: {
            stage: { type: 'penguins', values: DEPART, target: 'desc' },
            objective:
              'Tnaddhem el pingouins men el twil lel sghir, b a9all 3add men tabdilat.',
            principle: [
              'Tchouf el saf el kol, w tal9a el akbar.',
              'Tbaddlou m3a el pingouin eli fel blasa el louwla.',
              'Ba3d, el blasa el louwla kemlet : t3awed men el thenia, 7atta el ekher.',
            ],
            intro: [
              {
                say: 'Nchoufou kol el saf, w n7awsou 3al akbar, ba3d n7ottouh fi blastou mara wa7da.',
                events: selection(DEPART),
              },
            ],
          },
        },
      },
      {
        slug: 'bac-tri-insertion',
        kind: 'STORY',
        title: 'Tri par insertion',
        statement: code`
          Écrire la procédure Tri_Insertion(@T, n) qui range les n pingouins du tableau T,
          du plus grand au plus petit, par la méthode du tri par insertion.
        `,
        bitou: code`
          Kif el kartat fi yeddek : te5ou karta jdida, w tzarrhha fi blastha.
          El pingouin yo5rej mel saf, w el o5rin ya3tiwh blasa b décalage.
        `,
        starterCode: code`
          def Tri_Insertion(T, n):
              pass
        `,
        solution: code`
          def Tri_Insertion(T, n):
              for i in range(1, n):
                  aux = T[i]
                  j = i
                  while j > 0 and T[j - 1] < aux:
                      T[j] = T[j - 1]
                      j = j - 1
                  T[j] = aux
        `,
        hints: [
          'El boucle el kbira tebda mel pingouin el thani : el louwel wa7dou mrattab.',
          'Ehfedh el pingouin fi variable bech el décalage ma yfassa5ouch.',
          'El boucle eli wost-ha to9ef ki tousel lel bdeya, wala ki tal9a a7ad akbar menou.',
        ],
        data: {
          scene: 'door',
          tests: [
            trie('Tri_Insertion', DEPART),
            trie('Tri_Insertion', [5, 4, 3, 2, 1, 9], true),
            trie('Tri_Insertion', [1, 2, 3, 4, 5, 6], true),
          ],
          algo: {
            starter: code`
              Procedure Tri_Insertion(@T : Tab, n : Entier)
              Début

              Fin
            `,
            solution: code`
              Procedure Tri_Insertion(@T : Tab, n : Entier)
              Début
                  Pour i de 1 à n - 1 Faire
                      aux ← T[i]
                      j ← i
                      TantQue (j > 0) et (T[j - 1] < aux) Faire
                          T[j] ← T[j - 1]
                          j ← j - 1
                      FinTantQue
                      T[j] ← aux
                  FinPour
              Fin
            `,
            tdo: entiers('i', 'j', 'aux'),
          },
          story: {
            stage: { type: 'penguins', values: DEPART, target: 'desc' },
            objective:
              'Kol pingouin yod5ol fi blastou el s7i7a, fi west el pingouins eli 9ablou.',
            principle: [
              'Eli 3al ysar dima mnaddhmin.',
              'El pingouin el jey yo5rej mel saf (aux).',
              'Eli a9sar menou yetza7zou b blasa (décalage).',
              'Ba3d yod5ol fel blasa el fergha.',
            ],
            intro: [
              {
                say: 'Pingouin yo5rej mel saf, el o5rin yetza7zou, w howa yod5ol fi blastou.',
                events: insertion(DEPART),
              },
            ],
          },
        },
      },
      {
        slug: 'bac-tri-dicho',
        kind: 'STORY',
        title: 'Recherche dichotomique',
        statement: code`
          Les n pingouins du tableau T sont rangés du plus petit au plus grand.
          Écrire la fonction Chercher(T, n, x) qui retourne l'indice du pingouin de taille x,
          ou -1 s'il n'existe pas, par recherche dichotomique.
        `,
        bitou: code`
          Mission el chapitre! El saf mrattab : ma t3addich 3lihom wa7ed wa7ed.
          Chouf eli fel west, w a7dhef noss el saf fi kol mara.
        `,
        starterCode: code`
          def Chercher(T, n, x):
              pass
        `,
        solution: code`
          def Chercher(T, n, x):
              g = 0
              d = n - 1
              while g <= d:
                  m = (g + d) // 2
                  if T[m] == x:
                      return m
                  elif T[m] < x:
                      g = m + 1
                  else:
                      d = m - 1
              return -1
        `,
        hints: [
          'Zouz bornes : wa7da lel bdeya w wa7da lel ekher.',
          'El west howa nos el mejmou3 mta3 el bornes (div).',
          'Ken el west a9sar men x, x fel noss el ymin : anehi borne tbaddel?',
        ],
        data: {
          scene: 'chest',
          tests: [
            {
              setup: 'T = _suivi([20, 35, 40, 55, 70, 85, 95])',
              expr: 'Chercher(T, 7, 70)',
              expected: '4',
              label: 'Trouver le pingouin de taille 70',
            },
            {
              setup: 'T = _suivi([20, 35, 40, 55, 70, 85, 95])',
              expr: 'Chercher(T, 7, 50)',
              expected: '-1',
              label: 'Pas de pingouin de taille 50',
            },
            {
              setup: 'T = _suivi(list(range(1, 62, 2)))',
              expr: '(Chercher(T, 31, 61), T.lectures <= 15)',
              expected: '(30, True)',
              label: 'Peu de pingouins regardés',
              hidden: true,
            },
          ],
          algo: {
            starter: code`
              Fonction Chercher(T : Tab, n : Entier, x : Entier) : Entier
              Début

              Fin
            `,
            solution: code`
              Fonction Chercher(T : Tab, n : Entier, x : Entier) : Entier
              Début
                  g ← 0
                  d ← n - 1
                  TantQue g ≤ d Faire
                      m ← (g + d) div 2
                      Si T[m] = x Alors
                          Retourner m
                      Sinon si T[m] < x Alors
                          g ← m + 1
                      Sinon
                          d ← m - 1
                      FinSi
                  FinTantQue
                  Retourner -1
              Fin
            `,
            tdo: entiers('g', 'd', 'm'),
          },
          story: {
            stage: {
              type: 'penguins',
              values: [20, 35, 40, 55, 70, 85, 95],
              target: 'asc',
            },
            objective:
              'Tal9a el pingouin eli tulou x, b a9all 3add men nadharat.',
            principle: [
              'El saf mrattab men el sghir lel twil.',
              'Tchouf el pingouin eli fel west.',
              'Ken a9sar men x, x 3al ymin ; ken atwal, x 3al ysar.',
              'Fi kol mara a7dhef noss el saf, 7atta tal9ah wala el saf yekmel.',
            ],
            intro: [
              {
                say: 'N7awsou 3al 70. Nchoufou el west : 55, a9sar. Ya3ni 3al ymin.',
                events: [{ t: 'get', i: 3 }],
              },
              {
                say: 'West el noss el ymin : 85, atwal. Ya3ni 3al ysar.',
                events: [{ t: 'get', i: 5 }],
              },
              {
                say: 'W haw 70! Thletha nadharat bark.',
                events: [{ t: 'get', i: 4 }],
              },
            ],
          },
        },
      },
    ],
  },
];
