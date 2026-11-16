import type { PackChapter, PythonTest, TdoRow, TraceEvent } from '../types.js';
import { code, START } from './text.js';

/**
 * Jeu "Aventure Bac", rappels du debut d'annee : enregistrements et matrices.
 * Notation : Rappel.docx, "les enregistrements" et "matrice" du professeur
 * (bloc Type, E.nom, M[i, j] ; en Python dict() et M[i][j]).
 */

const entiers = (...names: string[]): TdoRow[] =>
  names.map((name) => ({ name, type: 'Entier' }));

const eleves: TdoRow = { name: 'T', type: 'Tableau', elem: 'Eleve', size: 50 };

// ---------- Enregistrements ----------

/** Evenements d'une fiche qui se remplit. */
const remplit = (r: number, fiche: Record<string, string | number>) =>
  Object.entries(fiche).map(
    ([k, v]): TraceEvent => ({ t: 'field', r, k, v }),
  );

const TYPE_ELEVE = code`
  Type
      Eleve = Enregistrement
          nom : Chaîne
          age : Entier
          moy : Réel
      Fin
`;

const FICHE_ALGO = `${TYPE_ELEVE}

${code`
  ALGORITHME Fiche
  DEBUT
      Ecrire("Nom : "), Lire(E.nom)
      Ecrire("Age : "), Lire(E.age)
      Ecrire("Moyenne : "), Lire(E.moy)
      Ecrire(E.nom, " a ", E.moy)
  FIN
`}`;

const FICHE_PYTHON = code`
  E = dict()
  E["nom"] = input("Nom : ")
  E["age"] = int(input("Age : "))
  E["moy"] = float(input("Moyenne : "))
  print(E["nom"], "a", E["moy"])
`;

const CLASSE = ['Salma', '14', 'Ali', '16.5', 'Rim', '12'];

// ---------- Matrices ----------

const SALLE = [
  [1, 0, 1, 1],
  [0, 0, 1, 0],
  [1, 1, 1, 0],
];

/** Regarde les cases d'une matrice, ligne par ligne. */
const balaye = (rows: number[][]): TraceEvent[] =>
  rows.flatMap((row, i) =>
    row.map((_, j): TraceEvent => ({ t: 'mget', i, j })),
  );

const matrice = (rows: number[][]) => `M = _matrice(${JSON.stringify(rows)})`;

/** Test : la fonction, appelee sur cette matrice, retourne cette valeur. */
const retourne = (
  rows: number[][],
  expr: string,
  expected: string,
  label: string,
  hidden = false,
): PythonTest => ({ setup: matrice(rows), expr, expected, label, hidden });

const LIBRES_ALGO = code`
  Fonction Libres(M : Mat, nl : Entier, nc : Entier) : Entier
  Début
      n ← 0
      Pour i de 0 à nl - 1 Faire
          Pour j de 0 à nc - 1 Faire
              Si M[i, j] = 0 Alors
                  n ← n + 1
              FinSi
          FinPour
      FinPour
      Retourner n
  Fin
`;

const LIBRES_PYTHON = code`
  def Libres(M, nl, nc):
      n = 0
      for i in range(nl):
          for j in range(nc):
              if M[i][j] == 0:
                  n = n + 1
      return n
`;

const MAGIQUE = [
  [8, 1, 6],
  [3, 5, 7],
  [4, 9, 2],
];

export const RAPPEL: PackChapter[] = [
  {
    slug: 'bac-enregistrements',
    kind: 'STORY',
    track: 'BAC_INFO',
    title: 'Les enregistrements',
    description:
      'La carte de l’élève : regrouper des champs, puis gérer toute une classe.',
    levels: [
      {
        slug: 'bac-enr-fiche',
        kind: 'STORY',
        title: 'La carte de l’élève',
        statement: code`
          Déclarer le type Eleve (nom, age, moy). Écrire un programme qui saisit les
          champs d'une variable E de type Eleve, puis affiche son nom et sa moyenne.
        `,
        bitou: code`
          Hedhi el mission el louwla : el 7all mawjoud ken t7eb tchoufou.
          Ama el programme, enti eli tektbou, w el carte tet3abba b eli ktebt.
        `,
        starterCode: START,
        solution: FICHE_PYTHON,
        hints: [
          'Louwel declari el type fel bloc Type, 9bal ALGORITHME.',
          'Fel TDO, E type-ha el type eli 3malt.',
          'Bech tousel l champ : esm el variable, ba3d point, ba3d esm el champ.',
        ],
        data: {
          scene: 'door',
          tests: [
            {
              inputs: ['Salma', '17', '14.5'],
              output: ['Salma', '14.5'],
              label: 'Salma, 17 ans, 14.5',
            },
            {
              inputs: ['Ali', '18', '9'],
              output: ['Ali', '9'],
              hidden: true,
            },
          ],
          algo: {
            starter: code`
              ALGORITHME Fiche
              DEBUT

              FIN
            `,
            solution: FICHE_ALGO,
            tdo: [{ name: 'E', type: 'Eleve' }],
          },
          story: {
            stage: {
              type: 'cards',
              title: 'Carte élève',
              fields: ['nom', 'age', 'moy'],
              count: 1,
            },
            objective:
              'T3abbi carte wa7da fiha nom, age w moyenne, 3awedh thletha variables mfar9in.',
            principle: [
              'El enregistrement type jdid enti tsan3ou, y7ott barcha champs m3a b3adhhom.',
              'Tdeclarih fel bloc Type : Eleve = Enregistrement ... Fin.',
              'Fel TDO, E type-ha Eleve.',
              'Kol champ yetkteb E.nom, E.age, E.moy. Fel Python : E["nom"].',
            ],
            intro: [
              {
                say: 'Haw carte fergha : fiha blasa lel nom, lel age w lel moyenne.',
                events: [],
              },
              {
                say: 'Kol champ yet3abba wa7dou : E.nom, ba3d E.age, ba3d E.moy.',
                events: remplit(0, { nom: 'Salma', age: 17, moy: 14.5 }),
              },
              {
                say: 'W tawa carte wa7da fiha kol ma na3rfou 3al élève.',
                events: [],
              },
            ],
            solved: {
              python: FICHE_PYTHON,
              algo: FICHE_ALGO,
              tdo: [{ name: 'E', type: 'Eleve' }],
              notes: [
                {
                  code: 'Eleve = Enregistrement',
                  why: 'Type jdid : el carte, b champs mte3ha. Yetsakkar b Fin.',
                },
                {
                  code: 'nom : Chaîne',
                  why: 'Kol champ 3andou esm w type. Lire ya9ra 7asb el type.',
                },
                {
                  code: 'Ecrire("Nom : "), Lire(E.nom)',
                  why: 'E.nom ya3ni el champ nom mta3 el carte E.',
                },
                {
                  code: 'Ecrire(E.nom, " a ", E.moy)',
                  why: 'Nesta3mlou el champ kif ay variable.',
                },
              ],
            },
          },
        },
      },
      {
        slug: 'bac-enr-deux',
        kind: 'STORY',
        title: 'Le meilleur des deux',
        statement: code`
          Avec un type Eleve (nom, moy), saisir deux élèves E1 et E2,
          puis afficher le nom de celui qui a la meilleure moyenne.
        `,
        bitou: code`
          Zouz cartes tawa. Kol wa7da 3andha champs mte3ha.
          Rodd belek : ma t9arench el cartes, 9aren el champ eli yhemmek.
        `,
        starterCode: START,
        solution: code`
          E1 = dict()
          E2 = dict()
          E1["nom"] = input("Nom : ")
          E1["moy"] = float(input("Moyenne : "))
          E2["nom"] = input("Nom : ")
          E2["moy"] = float(input("Moyenne : "))
          if E1["moy"] > E2["moy"]:
              print(E1["nom"])
          else:
              print(E2["nom"])
        `,
        hints: [
          'Type wa7ed yekfi lel zouz, w fel TDO zouz objets.',
          'Si ... Alors 3la el moyennes, mouch 3la el cartes.',
        ],
        data: {
          scene: 'door',
          tests: [
            {
              inputs: ['Salma', '14', 'Ali', '16'],
              output: ['Ali'],
              absent: ['Salma'],
              label: 'Ali 16 contre Salma 14',
            },
            {
              inputs: ['Rim', '18', 'Sami', '11'],
              output: ['Rim'],
              absent: ['Sami'],
              hidden: true,
            },
          ],
          algo: {
            starter: code`
              ALGORITHME Meilleur
              DEBUT

              FIN
            `,
            solution: code`
              Type
                  Eleve = Enregistrement
                      nom : Chaîne
                      moy : Réel
                  Fin

              ALGORITHME Meilleur
              DEBUT
                  Ecrire("Nom : "), Lire(E1.nom)
                  Ecrire("Moyenne : "), Lire(E1.moy)
                  Ecrire("Nom : "), Lire(E2.nom)
                  Ecrire("Moyenne : "), Lire(E2.moy)
                  Si E1.moy > E2.moy Alors
                      Ecrire(E1.nom)
                  Sinon
                      Ecrire(E2.nom)
                  FinSi
              FIN
            `,
            tdo: [
              { name: 'E1', type: 'Eleve' },
              { name: 'E2', type: 'Eleve' },
            ],
          },
          story: {
            stage: {
              type: 'cards',
              title: 'Carte élève',
              fields: ['nom', 'moy'],
              count: 2,
            },
            objective: 'T9aren zouz cartes w tal9a el a7sen moyenne.',
            principle: [
              'Type wa7ed, w zouz variables men nafs el type.',
              'Kol carte 3andha nom w moy mte3ha.',
              'T9aren champ b champ.',
            ],
            intro: [
              {
                say: 'Zouz cartes, w nchoufou el moyenne fi kol wa7da.',
                events: [
                  ...remplit(0, { nom: 'Salma', moy: 14 }),
                  ...remplit(1, { nom: 'Ali', moy: 16 }),
                  { t: 'look', r: 0, k: 'moy' },
                  { t: 'look', r: 1, k: 'moy' },
                ],
              },
            ],
          },
        },
      },
      {
        slug: 'bac-enr-classe',
        kind: 'STORY',
        title: 'Toute la classe',
        statement: code`
          Saisir n, puis le nom et la moyenne de n élèves dans un tableau T
          d'enregistrements. Afficher la moyenne de la classe.
          Exemple : 14, 16.5 et 12 donnent 14.1666...
        `,
        bitou: code`
          Classe kemla = tableau, w kol case fih carte.
          T[i] carte, w T[i].moy el moyenne mta3ha.
        `,
        starterCode: START,
        solution: code`
          from numpy import *
          n = int(input("n : "))
          T = array([dict()] * n)
          s = 0
          for i in range(n):
              T[i] = dict()
              T[i]["nom"] = input("Nom : ")
              T[i]["moy"] = float(input("Moyenne : "))
              s = s + T[i]["moy"]
          print(s / n)
        `,
        hints: [
          'Fel TDO, T Tableau w elements mte3ou men el type mte3ek.',
          'Boucle wa7da tekfi : ta9ra w tjamma3 fi nafs el wa9t.',
          'Fel ekher, 9assem 3la 3add el élèves.',
        ],
        data: {
          scene: 'door',
          tests: [
            {
              inputs: ['3', ...CLASSE],
              numbers: ['14.166666'],
              label: '3 élèves : 14, 16.5, 12',
            },
            {
              inputs: ['2', 'Sami', '10', 'Rim', '20'],
              numbers: ['15'],
              hidden: true,
            },
          ],
          algo: {
            starter: code`
              ALGORITHME Classe
              DEBUT

              FIN
            `,
            solution: code`
              Type
                  Eleve = Enregistrement
                      nom : Chaîne
                      moy : Réel
                  Fin

              ALGORITHME Classe
              DEBUT
                  Ecrire("n : "), Lire(n)
                  s ← 0
                  Pour i de 0 à n - 1 Faire
                      Ecrire("Nom : "), Lire(T[i].nom)
                      Ecrire("Moyenne : "), Lire(T[i].moy)
                      s ← s + T[i].moy
                  FinPour
                  Ecrire(s / n)
              FIN
            `,
            tdo: [eleves, ...entiers('n', 'i'), { name: 's', type: 'Réel' }],
          },
          story: {
            stage: {
              type: 'cards',
              title: 'Carte élève',
              fields: ['nom', 'moy'],
              count: 3,
            },
            objective:
              'T3abbi carte lkol élève, w ta7seb moyenne el classe.',
            principle: [
              'Tableau d\'enregistrements : kol case fiha carte.',
              'T[i].moy : champ moy mta3 el carte fel case i.',
              'Tjamma3 el moyennes fi somme, w t9assem 3la n.',
            ],
            intro: [
              {
                say: 'Kol élève carte, w el cartes el kol fi tableau wa7ed.',
                events: [
                  ...remplit(0, { nom: 'Salma', moy: 14 }),
                  ...remplit(1, { nom: 'Ali', moy: 16.5 }),
                  ...remplit(2, { nom: 'Rim', moy: 12 }),
                ],
              },
            ],
          },
        },
      },
      {
        slug: 'bac-enr-premier',
        kind: 'STORY',
        title: 'Le premier de la classe',
        statement: code`
          Saisir n, puis le nom et la moyenne de n élèves dans un tableau T.
          Afficher le nom et la moyenne du premier de la classe.
        `,
        bitou: code`
          Nafs el classe, ama el su2el tbaddel : chkoun el louwel?
          Ma tehfedhch el moyenne wa7dha : lezmek ta3ref mta3 chkoun.
        `,
        starterCode: START,
        solution: code`
          from numpy import *
          n = int(input("n : "))
          T = array([dict()] * n)
          for i in range(n):
              T[i] = dict()
              T[i]["nom"] = input("Nom : ")
              T[i]["moy"] = float(input("Moyenne : "))
          p = 0
          for i in range(1, n):
              if T[i]["moy"] > T[p]["moy"]:
                  p = i
          print(T[p]["nom"], T[p]["moy"])
        `,
        hints: [
          'Ehfedh el indice mta3 el louwel, mouch el moyenne.',
          'Tebda b el case 0, w t9aren el ba9i m3aha.',
        ],
        data: {
          scene: 'door',
          tests: [
            {
              inputs: ['3', ...CLASSE],
              output: ['Ali', '16.5'],
              absent: ['Salma', 'Rim'],
              label: 'Le premier est Ali',
            },
            {
              inputs: ['2', 'Sami', '19', 'Rim', '8'],
              output: ['Sami', '19'],
              absent: ['Rim'],
              hidden: true,
            },
          ],
          algo: {
            starter: code`
              ALGORITHME Premier
              DEBUT

              FIN
            `,
            solution: code`
              Type
                  Eleve = Enregistrement
                      nom : Chaîne
                      moy : Réel
                  Fin

              ALGORITHME Premier
              DEBUT
                  Ecrire("n : "), Lire(n)
                  Pour i de 0 à n - 1 Faire
                      Ecrire("Nom : "), Lire(T[i].nom)
                      Ecrire("Moyenne : "), Lire(T[i].moy)
                  FinPour
                  p ← 0
                  Pour i de 1 à n - 1 Faire
                      Si T[i].moy > T[p].moy Alors
                          p ← i
                      FinSi
                  FinPour
                  Ecrire(T[p].nom, T[p].moy)
              FIN
            `,
            tdo: [eleves, ...entiers('n', 'i', 'p')],
          },
          story: {
            stage: {
              type: 'cards',
              title: 'Carte élève',
              fields: ['nom', 'moy'],
              count: 3,
            },
            objective: 'Tal9a el carte mta3 el louwel fel classe.',
            principle: [
              'Tfarredh eli el louwel howa el case 0.',
              'T9aren kol carte m3a el louwel el tawa.',
              'Ken l9it a7sen, tbaddel el indice.',
            ],
            intro: [
              {
                say: 'Nchoufou el moyennes wa7da wa7da, w ne7fdhou win el a7sen.',
                events: [
                  ...remplit(0, { nom: 'Salma', moy: 14 }),
                  ...remplit(1, { nom: 'Ali', moy: 16.5 }),
                  ...remplit(2, { nom: 'Rim', moy: 12 }),
                  { t: 'look', r: 0, k: 'moy' },
                  { t: 'look', r: 1, k: 'moy' },
                  { t: 'look', r: 2, k: 'moy' },
                  { t: 'look', r: 1, k: 'nom' },
                ],
              },
            ],
          },
        },
      },
      {
        slug: 'bac-enr-films',
        kind: 'STORY',
        title: 'Le club vidéo',
        statement: code`
          Un film a un titre et une année de sortie. Saisir n films dans un tableau T,
          puis afficher les titres des films sortis entre 2010 et 2020 (inclus).
        `,
        bitou: code`
          Mission el chapitre! Type jdid hedhi el mara, 7ata el esm enti t5ayrou.
          El cartes el kol ytsajjlou, ama ma t2affichi ken eli yhemmek.
        `,
        starterCode: START,
        solution: code`
          from numpy import *
          n = int(input("n : "))
          T = array([dict()] * n)
          for i in range(n):
              T[i] = dict()
              T[i]["titre"] = input("Titre : ")
              T[i]["annee"] = int(input("Annee : "))
          for i in range(n):
              if 2010 <= T[i]["annee"] <= 2020:
                  print(T[i]["titre"])
        `,
        hints: [
          'Type b zouz champs : wa7ed Chaîne w wa7ed Entier.',
          'Zouz boucles : wa7da lel saisie, w wa7da lel affichage.',
          'Condition b zouz bornes, w el 2010 w el 2020 maqboulin.',
        ],
        data: {
          scene: 'chest',
          tests: [
            {
              inputs: ['3', 'Inception', '2010', 'Matrix', '1999', 'Dune', '2021'],
              output: ['Inception'],
              absent: ['Matrix', 'Dune'],
              label: 'Seul Inception est dans la période',
            },
            {
              inputs: ['2', 'Coco', '2017', 'Soul', '2020'],
              output: ['Coco', 'Soul'],
              hidden: true,
            },
          ],
          algo: {
            starter: code`
              ALGORITHME Club
              DEBUT

              FIN
            `,
            solution: code`
              Type
                  Film = Enregistrement
                      titre : Chaîne
                      annee : Entier
                  Fin

              ALGORITHME Club
              DEBUT
                  Ecrire("n : "), Lire(n)
                  Pour i de 0 à n - 1 Faire
                      Ecrire("Titre : "), Lire(T[i].titre)
                      Ecrire("Annee : "), Lire(T[i].annee)
                  FinPour
                  Pour i de 0 à n - 1 Faire
                      Si (T[i].annee ≥ 2010) et (T[i].annee ≤ 2020) Alors
                          Ecrire(T[i].titre)
                      FinSi
                  FinPour
              FIN
            `,
            tdo: [
              { name: 'T', type: 'Tableau', elem: 'Film', size: 200 },
              ...entiers('n', 'i'),
            ],
          },
          story: {
            stage: {
              type: 'cards',
              title: 'Film',
              fields: ['titre', 'annee'],
              count: 3,
            },
            objective:
              'Tsajjel el films, w tchouf ken eli kharjou bin 2010 w 2020.',
            principle: [
              'Kol film carte fiha titre w annee.',
              'Tsajjel el cartes el kol 9bal.',
              'Ba3d t3addi 3lihom, w t2affichi ken eli ya3ti el condition.',
            ],
            intro: [
              {
                say: 'Tsajjel el films, ba3d tchouf el annee fi kol carte.',
                events: [
                  ...remplit(0, { titre: 'Inception', annee: 2010 }),
                  ...remplit(1, { titre: 'Matrix', annee: 1999 }),
                  ...remplit(2, { titre: 'Dune', annee: 2021 }),
                  { t: 'look', r: 0, k: 'annee' },
                  { t: 'look', r: 1, k: 'annee' },
                  { t: 'look', r: 2, k: 'annee' },
                ],
              },
            ],
          },
        },
      },
    ],
  },
  {
    slug: 'bac-matrices',
    kind: 'STORY',
    track: 'BAC_INFO',
    title: 'Les matrices',
    description:
      'La salle de cinéma : lignes, colonnes, diagonales et carré magique.',
    levels: [
      {
        slug: 'bac-mat-libres',
        kind: 'STORY',
        title: 'Les places libres',
        statement: code`
          Dans la matrice M de nl lignes et nc colonnes, 1 = place occupée et 0 = place libre.
          Écrire la fonction Libres(M, nl, nc) qui retourne le nombre de places libres.
        `,
        bitou: code`
          Hedhi el mission el louwla : el 7all mawjoud ken t7eb tchoufou.
          Ama el fonction, enti eli tektebha, w el projecteur ya3mel eli 9oltlou 3lih.
        `,
        starterCode: code`
          def Libres(M, nl, nc):
              pass
        `,
        solution: LIBRES_PYTHON,
        hints: [
          'Zouz boucles, wa7da wost lokhra.',
          'El boucle el kbira 3al lignes, w eli wost-ha 3al colonnes.',
          'Compteur yebda b 0 9bal el zouz boucles.',
        ],
        data: {
          scene: 'door',
          tests: [
            retourne(SALLE, 'Libres(M, 3, 4)', '5', '5 places libres'),
            retourne([[1, 1], [1, 1]], 'Libres(M, 2, 2)', '0', 'Salle pleine', true),
          ],
          algo: {
            starter: code`
              Fonction Libres(M : Mat, nl : Entier, nc : Entier) : Entier
              Début

              Fin
            `,
            solution: LIBRES_ALGO,
            tdo: entiers('n', 'i', 'j'),
          },
          story: {
            stage: { type: 'cinema', rows: SALLE, mode: 'seats' },
            objective:
              'T3idd el blayes el fergha fel salle, rangée b rangée.',
            principle: [
              'Matrice = tableau b lignes w colonnes : M[i, j].',
              'i el rangée, w j el siège fi rangée.',
              'Lezmek zouz boucles bech tet3adda 3la kol siège.',
            ],
            intro: [
              {
                say: 'El salle hedhi matrice : kol siège 3andou ligne w colonne.',
                events: [],
              },
              {
                say: 'Nchoufou el rangée el louwla siège siège, ba3d eli ba3dha...',
                events: balaye(SALLE),
              },
            ],
            solved: {
              python: LIBRES_PYTHON,
              algo: LIBRES_ALGO,
              tdo: entiers('n', 'i', 'j'),
              notes: [
                {
                  code: 'Pour i de 0 à nl - 1 Faire',
                  why: 'i ymchi 3al rangées, men 0 7atta nl - 1.',
                },
                {
                  code: 'Pour j de 0 à nc - 1 Faire',
                  why: 'Fi kol rangée, j ymchi 3al sièges.',
                },
                {
                  code: 'Si M[i, j] = 0 Alors',
                  why: 'M[i, j] howa el siège fi ligne i w colonne j. Fel Python M[i][j].',
                },
                {
                  code: 'Retourner n',
                  why: 'Ba3d el zouz boucles, n fih el 3add el kemel.',
                },
              ],
            },
          },
        },
      },
      {
        slug: 'bac-mat-rangee',
        kind: 'STORY',
        title: 'La rangée la plus pleine',
        statement: code`
          Écrire la fonction Rangee(M, nl, nc) qui retourne le numéro de la ligne qui contient
          le plus de places occupées (la première en cas d'égalité).
        `,
        bitou: code`
          Fi kol rangée t3idd, w t9aren m3a a7sen rangée l9itha 9bal.
          Rodd belek win t7ott el compteur : lezmou yarja3 l 0 fi kol rangée.
        `,
        starterCode: code`
          def Rangee(M, nl, nc):
              pass
        `,
        solution: code`
          def Rangee(M, nl, nc):
              meilleure = 0
              maxi = -1
              for i in range(nl):
                  s = 0
                  for j in range(nc):
                      s = s + M[i][j]
                  if s > maxi:
                      maxi = s
                      meilleure = i
              return meilleure
        `,
        hints: [
          'El somme mta3 ligne tebda b 0 fi kol tour mta3 i.',
          'Ehfedh zouz 7ajet : a7sen somme, w el ligne mta3ha.',
        ],
        data: {
          scene: 'door',
          tests: [
            retourne(SALLE, 'Rangee(M, 3, 4)', '0', 'Rangées 0 et 2 à égalité : 0'),
            retourne(
              [[0, 0, 1], [1, 1, 0], [1, 1, 1]],
              'Rangee(M, 3, 3)',
              '2',
              'La dernière rangée est pleine',
            ),
          ],
          algo: {
            starter: code`
              Fonction Rangee(M : Mat, nl : Entier, nc : Entier) : Entier
              Début

              Fin
            `,
            solution: code`
              Fonction Rangee(M : Mat, nl : Entier, nc : Entier) : Entier
              Début
                  meilleure ← 0
                  maxi ← -1
                  Pour i de 0 à nl - 1 Faire
                      s ← 0
                      Pour j de 0 à nc - 1 Faire
                          s ← s + M[i, j]
                      FinPour
                      Si s > maxi Alors
                          maxi ← s
                          meilleure ← i
                      FinSi
                  FinPour
                  Retourner meilleure
              Fin
            `,
            tdo: entiers('meilleure', 'maxi', 'i', 'j', 's'),
          },
          story: {
            stage: { type: 'cinema', rows: SALLE, mode: 'seats' },
            objective: 'Tal9a el rangée eli fiha akther 3bed.',
            principle: [
              'Fi kol rangée, t3idd el blayes el m3ammra.',
              'T9aren el 3add m3a a7sen rangée.',
              'Trajja3 numéro el rangée, mouch el 3add.',
            ],
            intro: [
              {
                say: 'Rangée rangée, n3iddou el 3bed, w ne7fdhou a7sen wa7da.',
                events: balaye(SALLE),
              },
            ],
          },
        },
      },
      {
        slug: 'bac-mat-diagonale',
        kind: 'STORY',
        title: 'Les deux diagonales',
        statement: code`
          M est une matrice carrée d'ordre n. Écrire la fonction Diagonale(M, n) qui retourne
          la somme de la diagonale, et la fonction Anti(M, n) qui retourne celle de l'anti-diagonale.
          Exemple : pour 5 2 15 / 1 3 4 / 7 18 6, on obtient 14 et 25.
        `,
        bitou: code`
          Fel diagonale ma tlezmekch zouz boucles!
          Chouf el 3ale9a bin i w j fel cases el kol.
        `,
        starterCode: code`
          def Diagonale(M, n):
              pass


          def Anti(M, n):
              pass
        `,
        solution: code`
          def Diagonale(M, n):
              s = 0
              for i in range(n):
                  s = s + M[i][i]
              return s


          def Anti(M, n):
              s = 0
              for i in range(n):
                  s = s + M[i][n - 1 - i]
              return s
        `,
        hints: [
          'Fel diagonale, ligne w colonne kif kif.',
          'Fel anti-diagonale, ki i yzid, j yon9os : tebda men n - 1.',
        ],
        data: {
          scene: 'door',
          tests: [
            retourne(
              [[5, 2, 15], [1, 3, 4], [7, 18, 6]],
              '(Diagonale(M, 3), Anti(M, 3))',
              '(14, 25)',
              'Diagonale 14, anti-diagonale 25',
            ),
            retourne(
              [[1, 2], [3, 4]],
              '(Diagonale(M, 2), Anti(M, 2))',
              '(5, 5)',
              'Matrice d\'ordre 2',
              true,
            ),
          ],
          algo: {
            starter: code`
              Fonction Diagonale(M : Mat, n : Entier) : Entier
              Début

              Fin

              Fonction Anti(M : Mat, n : Entier) : Entier
              Début

              Fin
            `,
            solution: code`
              Fonction Diagonale(M : Mat, n : Entier) : Entier
              Début
                  s ← 0
                  Pour i de 0 à n - 1 Faire
                      s ← s + M[i, i]
                  FinPour
                  Retourner s
              Fin

              Fonction Anti(M : Mat, n : Entier) : Entier
              Début
                  s ← 0
                  Pour i de 0 à n - 1 Faire
                      s ← s + M[i, n - 1 - i]
                  FinPour
                  Retourner s
              Fin
            `,
            tdo: entiers('s', 'i'),
          },
          story: {
            stage: {
              type: 'cinema',
              rows: [[5, 2, 15], [1, 3, 4], [7, 18, 6]],
              mode: 'numbers',
            },
            objective:
              'Tjamma3 el cases fel diagonale, w el cases fel anti-diagonale.',
            principle: [
              'El diagonale temchi men foug ysar l ta7t ymin.',
              'El anti-diagonale temchi men foug ymin l ta7t ysar.',
              'Boucle wa7da tekfi, 5ater j mahsouba men i.',
            ],
            intro: [
              {
                say: 'El diagonale : 5, 3, 6.',
                events: [
                  { t: 'mget', i: 0, j: 0 },
                  { t: 'mget', i: 1, j: 1 },
                  { t: 'mget', i: 2, j: 2 },
                ],
              },
              {
                say: 'El anti-diagonale : 15, 3, 7.',
                events: [
                  { t: 'mget', i: 0, j: 2 },
                  { t: 'mget', i: 1, j: 1 },
                  { t: 'mget', i: 2, j: 0 },
                ],
              },
            ],
          },
        },
      },
      {
        slug: 'bac-mat-reserver',
        kind: 'STORY',
        title: 'Réserver des places',
        statement: code`
          Écrire la procédure Reserver(@M, nl, nc, k) qui occupe les k premières places libres,
          ligne par ligne. Une place occupée vaut 1. On suppose qu'il y a assez de places.
        `,
        bitou: code`
          Tawa tekteb fel matrice! Ama k bech yon9os fi kol réservation,
          w ki yousel l 0 ma lezmek t3ammer 7atta siège.
        `,
        starterCode: code`
          def Reserver(M, nl, nc, k):
              pass
        `,
        solution: code`
          def Reserver(M, nl, nc, k):
              for i in range(nl):
                  for j in range(nc):
                      if M[i][j] == 0 and k > 0:
                          M[i][j] = 1
                          k = k - 1
        `,
        hints: [
          'Nafs el zouz boucles, w condition b zouz chourout.',
          'Ba3d kol réservation, 9addech yo93od?',
        ],
        data: {
          scene: 'door',
          tests: [
            {
              ...retourne(
                SALLE,
                '(Reserver(M, 3, 4, 3), M.tolist())[1]',
                '[[1, 1, 1, 1], [1, 1, 1, 0], [1, 1, 1, 0]]',
                'Réserver 3 places',
              ),
            },
            retourne(
              [[0, 0], [0, 0]],
              '(Reserver(M, 2, 2, 1), M.tolist())[1]',
              '[[1, 0], [0, 0]]',
              'Une seule place',
              true,
            ),
          ],
          algo: {
            starter: code`
              Procedure Reserver(@M : Mat, nl : Entier, nc : Entier, k : Entier)
              Début

              Fin
            `,
            solution: code`
              Procedure Reserver(@M : Mat, nl : Entier, nc : Entier, k : Entier)
              Début
                  Pour i de 0 à nl - 1 Faire
                      Pour j de 0 à nc - 1 Faire
                          Si (M[i, j] = 0) et (k > 0) Alors
                              M[i, j] ← 1
                              k ← k - 1
                          FinSi
                      FinPour
                  FinPour
              Fin
            `,
            tdo: entiers('i', 'j'),
          },
          story: {
            stage: { type: 'cinema', rows: SALLE, mode: 'seats' },
            objective:
              'Tga3ed k 3bed fel blayes el fergha, men el rangée el louwla.',
            principle: [
              'Tet3adda 3la el sièges bel tartib.',
              'Ken el siège fergh w mazal 3bed, t3ammrou.',
              'Fi kol mara k yon9os b wa7ed.',
            ],
            intro: [
              {
                say: 'El siège fergh? Yod5ol fih wa7ed. Mazal? Nkammlou.',
                events: [
                  { t: 'mget', i: 0, j: 0 },
                  { t: 'mget', i: 0, j: 1 },
                  { t: 'mset', i: 0, j: 1, v: 1 },
                  { t: 'mget', i: 0, j: 2 },
                  { t: 'mget', i: 0, j: 3 },
                  { t: 'mget', i: 1, j: 0 },
                  { t: 'mset', i: 1, j: 0, v: 1 },
                ],
              },
            ],
          },
        },
      },
      {
        slug: 'bac-mat-magique',
        kind: 'STORY',
        title: 'Le carré magique',
        statement: code`
          Une matrice carrée est magique si les sommes de chaque ligne, de chaque colonne
          et des deux diagonales sont toutes égales.
          Écrire la fonction Magique(M, n) qui retourne Vrai si M est magique, sinon Faux.
        `,
        bitou: code`
          Mission el chapitre! Kol ma t3allemtou fel matrices lezem hna :
          lignes, colonnes, w el zouz diagonales.
        `,
        starterCode: code`
          def Magique(M, n):
              pass
        `,
        solution: code`
          def Magique(M, n):
              d1 = 0
              d2 = 0
              for i in range(n):
                  d1 = d1 + M[i][i]
                  d2 = d2 + M[i][n - 1 - i]
              ok = d1 == d2
              for i in range(n):
                  sl = 0
                  sc = 0
                  for j in range(n):
                      sl = sl + M[i][j]
                      sc = sc + M[j][i]
                  ok = ok and sl == d1 and sc == d1
              return ok
        `,
        hints: [
          'Khouth somme wa7da kif référence, w 9aren el ba9i m3aha.',
          'Fi nafs el zouz boucles tnajem ta7seb ligne w colonne.',
          'Booléen yab9a Vrai ken el kol kif kif.',
        ],
        data: {
          scene: 'chest',
          tests: [
            retourne(MAGIQUE, 'Magique(M, 3)', 'True', 'Le carré 8 1 6 est magique'),
            retourne(
              [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
              'Magique(M, 3)',
              'False',
              'Ce carré n\'est pas magique',
            ),
            retourne(
              [[1, 2], [2, 1]],
              'Magique(M, 2)',
              'False',
              'Lignes et colonnes égales, diagonales différentes',
              true,
            ),
          ],
          algo: {
            starter: code`
              Fonction Magique(M : Mat, n : Entier) : Booléen
              Début

              Fin
            `,
            solution: code`
              Fonction Magique(M : Mat, n : Entier) : Booléen
              Début
                  d1 ← 0
                  d2 ← 0
                  Pour i de 0 à n - 1 Faire
                      d1 ← d1 + M[i, i]
                      d2 ← d2 + M[i, n - 1 - i]
                  FinPour
                  ok ← d1 = d2
                  Pour i de 0 à n - 1 Faire
                      sl ← 0
                      sc ← 0
                      Pour j de 0 à n - 1 Faire
                          sl ← sl + M[i, j]
                          sc ← sc + M[j, i]
                      FinPour
                      ok ← ok et (sl = d1) et (sc = d1)
                  FinPour
                  Retourner ok
              Fin
            `,
            tdo: [
              ...entiers('d1', 'd2', 'i', 'j', 'sl', 'sc'),
              { name: 'ok', type: 'Booléen' },
            ],
          },
          story: {
            stage: { type: 'cinema', rows: MAGIQUE, mode: 'numbers' },
            objective:
              'Tverifi eli kol ligne, kol colonne w el zouz diagonales 3andhom nafs el somme.',
            principle: [
              'Ta7seb somme el diagonale w taddihha référence.',
              'Lezem el anti-diagonale tsawiha.',
              'Kol ligne w kol colonne lezem tsawiha zeda.',
            ],
            intro: [
              {
                say: '8 + 1 + 6 = 15, 3 + 5 + 7 = 15... kol somme lezem ta3ti 15.',
                events: balaye(MAGIQUE),
              },
            ],
          },
        },
      },
    ],
  },
];
