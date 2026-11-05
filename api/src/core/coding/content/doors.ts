import type { PackChapter, TdoRow } from '../types.js';
import { code } from './text.js';

/**
 * Jeu "Portes du code", parcours "Bases" : 2eme Info, 3eme Sciences, Bac Math / Sc / Tech.
 * Programme : donnees et operations, fonctions predefinies, structures conditionnelles
 * et iteratives, tableaux (numpy) et sous-programmes.
 * Chaque niveau donne l'enonce et des indices, jamais la reponse : l'eleve ecrit
 * l'algorithme (avec TDO) ou le programme Python, et la porte s'ouvre s'il est juste.
 */

const entiers = (...names: string[]): TdoRow[] =>
  names.map((name) => ({ name, type: 'Entier' }));

const tableau: TdoRow = {
  name: 'T',
  type: 'Tableau',
  elem: 'Entier',
  size: 50,
};

export const DOORS: PackChapter[] = [
  {
    slug: 'bases-donnees',
    kind: 'PYTHON',
    track: 'BASES',
    title: 'Variables, types et opérations',
    description:
      'Lire des données, calculer avec div et mod, afficher un résultat.',
    levels: [
      {
        slug: 'bases-don-1',
        kind: 'PYTHON',
        title: 'Conversion du temps',
        statement: code`
          Écrire un programme qui saisit une durée t en secondes, puis affiche son
          équivalent en heures, minutes et secondes.
          Exemple : pour t = 4000, le programme affiche : 1 h 6 mn 40 s
        `,
        bitou: code`
          Ahla bik! El bab hedha msakker, w ma y7ellou ken programme s7i7.
          div ta3tik el 9esma el kemla, w mod ta3tik el ba9i.
        `,
        starterCode: code`
          t = int(input("Donner t : "))
        `,
        solution: code`
          t = int(input("Donner t : "))
          h = t // 3600
          mn = (t % 3600) // 60
          s = t % 60
          print(h, "h", mn, "mn", s, "s")
        `,
        hints: [
          '9addech men seconde fi saa? W fi d9i9a?',
          'Ba3d ma tna77i les heures, chnouwa yo93od men t?',
        ],
        data: {
          scene: 'door',
          tests: [
            { inputs: ['4000'], numbers: ['1', '6', '40'] },
            { inputs: ['59'], numbers: ['0', '0', '59'] },
            { inputs: ['3600'], numbers: ['1', '0', '0'] },
            { inputs: ['7322'], numbers: ['2', '2', '2'], hidden: true },
          ],
          algo: {
            starter: code`
              ALGORITHME Conversion
              DEBUT
                  Ecrire("Donner t : "), Lire(t)
              FIN
            `,
            solution: code`
              ALGORITHME Conversion
              DEBUT
                  Ecrire("Donner t : "), Lire(t)
                  h ← t div 3600
                  mn ← (t mod 3600) div 60
                  s ← t mod 60
                  Ecrire(h, " h ", mn, " mn ", s, " s")
              FIN
            `,
            tdo: entiers('t', 'h', 'mn', 's'),
          },
        },
      },
      {
        slug: 'bases-don-2',
        kind: 'PYTHON',
        title: 'Somme des chiffres',
        statement: code`
          Écrire un programme qui saisit un entier n formé de 3 chiffres, puis calcule
          et affiche la somme de ses chiffres.
          Exemple : pour n = 123, le programme affiche : Somme = 6
        `,
        bitou: code`
          Nombre b 3 chiffres : unités, dizaines w centaines.
          Kifech tfaseel-hom b div w mod?
        `,
        starterCode: code`
          n = int(input("Donner n : "))
        `,
        solution: code`
          n = int(input("Donner n : "))
          c = n // 100
          d = (n // 10) % 10
          u = n % 10
          print("Somme =", c + d + u)
        `,
        hints: [
          'Chnouwa ta3tik el 9esma 3la 10? W el ba9i mta3ha?',
          'Jarreb 3la 123 b yeddek 9bal ma tekteb.',
        ],
        data: {
          scene: 'door',
          tests: [
            { inputs: ['123'], numbers: ['6'] },
            { inputs: ['905'], numbers: ['14'] },
            { inputs: ['100'], numbers: ['1'] },
            { inputs: ['999'], numbers: ['27'], hidden: true },
          ],
          algo: {
            starter: code`
              ALGORITHME Somme_chiffres
              DEBUT
                  Ecrire("Donner n : "), Lire(n)
              FIN
            `,
            solution: code`
              ALGORITHME Somme_chiffres
              DEBUT
                  Ecrire("Donner n : "), Lire(n)
                  c ← n div 100
                  d ← (n div 10) mod 10
                  u ← n mod 10
                  Ecrire("Somme = ", c + d + u)
              FIN
            `,
            tdo: entiers('n', 'c', 'd', 'u'),
          },
        },
      },
      {
        slug: 'bases-don-3',
        kind: 'PYTHON',
        title: 'Inverser un nombre',
        statement: code`
          Écrire un programme qui saisit un entier n formé de 4 chiffres, puis affiche
          le nombre inversé.
          Exemple : pour n = 1234, le programme affiche : 4321
        `,
        bitou: code`
          Akher bab fel chapitre : sandou9 fih mafte7!
          Fakek el nombre, ba3d rakkbou bel 3aks.
        `,
        starterCode: code`
          n = int(input("Donner n : "))
        `,
        solution: code`
          n = int(input("Donner n : "))
          m = n // 1000
          c = (n // 100) % 10
          d = (n // 10) % 10
          u = n % 10
          print(u * 1000 + d * 100 + c * 10 + m)
        `,
        hints: [
          'Louel 7ajja : 5arrej el 4 chiffres wa7ed wa7ed.',
          'El unités ywalliw chnouwa fel nombre el jdid?',
        ],
        data: {
          scene: 'chest',
          tests: [
            { inputs: ['1234'], numbers: ['4321'] },
            { inputs: ['2581'], numbers: ['1852'] },
            { inputs: ['9001'], numbers: ['1009'] },
            { inputs: ['4567'], numbers: ['7654'], hidden: true },
          ],
          algo: {
            starter: code`
              ALGORITHME Inverse
              DEBUT
                  Ecrire("Donner n : "), Lire(n)
              FIN
            `,
            solution: code`
              ALGORITHME Inverse
              DEBUT
                  Ecrire("Donner n : "), Lire(n)
                  m ← n div 1000
                  c ← (n div 100) mod 10
                  d ← (n div 10) mod 10
                  u ← n mod 10
                  inv ← u * 1000 + d * 100 + c * 10 + m
                  Ecrire(inv)
              FIN
            `,
            tdo: entiers('n', 'm', 'c', 'd', 'u', 'inv'),
          },
        },
      },
    ],
  },
  {
    slug: 'bases-predefinies',
    kind: 'PYTHON',
    track: 'BASES',
    title: 'Les fonctions prédéfinies',
    description:
      'Long, Majus, Pos, Sous_Chaine, Ord, Chr, Convch... et leurs équivalents en Python.',
    levels: [
      {
        slug: 'bases-pre-1',
        kind: 'PYTHON',
        title: 'Longueur et majuscules',
        statement: code`
          Écrire un programme qui saisit une chaîne ch, puis affiche sa longueur et
          ch en majuscules.
          Exemple : pour ch = "bonjour", le programme affiche :
          7
          BONJOUR
        `,
        bitou: code`
          Fama fonctions prédéfinies 7adhrin lel chaînes.
          Rod belek : el longueur t3odd kol chay, 7atta el espaces!
        `,
        starterCode: code`
          ch = input("Donner ch : ")
        `,
        solution: code`
          ch = input("Donner ch : ")
          print(len(ch))
          print(ch.upper())
        `,
        hints: [
          'Ana fonction t3odd les caractères?',
          'Ana fonction ta3mel el 7rouf kbar?',
        ],
        data: {
          scene: 'door',
          tests: [
            { inputs: ['bonjour'], output: ['7', 'BONJOUR'] },
            { inputs: ['Najahni 2026'], output: ['12', 'NAJAHNI 2026'] },
            { inputs: ['a'], output: ['1', 'A'], hidden: true },
          ],
          algo: {
            starter: code`
              ALGORITHME Chaine
              DEBUT
                  Ecrire("Donner ch : "), Lire(ch)
              FIN
            `,
            solution: code`
              ALGORITHME Chaine
              DEBUT
                  Ecrire("Donner ch : "), Lire(ch)
                  Ecrire(Long(ch))
                  Ecrire(Majus(ch))
              FIN
            `,
            tdo: [{ name: 'ch', type: 'Chaîne' }],
          },
        },
      },
      {
        slug: 'bases-pre-2',
        kind: 'PYTHON',
        title: 'Le code ASCII',
        statement: code`
          Écrire un programme qui saisit une lettre minuscule c, puis affiche la lettre
          majuscule correspondante, sans utiliser Majus (upper).
          Exemple : pour c = "b", le programme affiche : B
        `,
        bitou: code`
          Kol 7arf 3andou numéro : el code ASCII. 'a' = 97 w 'A' = 65.
          Chnouwa el far9 binethom?
        `,
        starterCode: code`
          c = input("Donner c : ")
        `,
        solution: code`
          c = input("Donner c : ")
          print(chr(ord(c) - 32))
        `,
        hints: [
          'Fama fonction ta3tik el numéro mta3 7arf, w fonction ta3mel el 3aks.',
          'El far9 bin minuscule w majuscule howa nafsou lel 7rouf lkol.',
        ],
        data: {
          scene: 'door',
          tests: [
            { inputs: ['b'], output: ['B'] },
            { inputs: ['z'], output: ['Z'] },
            { inputs: ['a'], output: ['A'], hidden: true },
          ],
          algo: {
            starter: code`
              ALGORITHME Majuscule
              DEBUT
                  Ecrire("Donner c : "), Lire(c)
              FIN
            `,
            solution: code`
              ALGORITHME Majuscule
              DEBUT
                  Ecrire("Donner c : "), Lire(c)
                  Ecrire(Chr(Ord(c) - 32))
              FIN
            `,
            tdo: [{ name: 'c', type: 'Caractère' }],
          },
        },
      },
      {
        slug: 'bases-pre-3',
        kind: 'PYTHON',
        title: "Le nom d'utilisateur",
        statement: code`
          Écrire un programme qui saisit une adresse email ch, puis affiche le nom
          d'utilisateur : la partie qui se trouve avant le caractère "@".
          Exemple : pour ch = "ali.ben@gmail.com", le programme affiche : ali.ben
        `,
        bitou: code`
          Lezmek 7ajtin : win el "@" fel chaîne, w kifech te9ta3 el partie eli 9balha.
        `,
        starterCode: code`
          ch = input("Donner ch : ")
        `,
        solution: code`
          ch = input("Donner ch : ")
          p = ch.find("@")
          print(ch[0:p])
        `,
        hints: [
          'Ana fonction ta3tik el position mta3 caractère fi chaîne?',
          'Sous_Chaine : el position el ekhra mahich m3aha.',
        ],
        data: {
          scene: 'door',
          tests: [
            { inputs: ['ali.ben@gmail.com'], output: ['ali.ben'] },
            { inputs: ['prof@najahni.tn'], output: ['prof'] },
            { inputs: ['x@y.z'], output: ['x'], hidden: true },
          ],
          algo: {
            starter: code`
              ALGORITHME Utilisateur
              DEBUT
                  Ecrire("Donner ch : "), Lire(ch)
              FIN
            `,
            solution: code`
              ALGORITHME Utilisateur
              DEBUT
                  Ecrire("Donner ch : "), Lire(ch)
                  p ← Pos("@", ch)
                  Ecrire(Sous_Chaine(ch, 0, p))
              FIN
            `,
            tdo: [
              { name: 'ch', type: 'Chaîne' },
              { name: 'p', type: 'Entier' },
            ],
          },
        },
      },
      {
        slug: 'bases-pre-4',
        kind: 'PYTHON',
        title: 'Le mot de passe du coffre',
        statement: code`
          Le code du coffre est formé de la première lettre d'un mot ch, en majuscule,
          suivie du nombre de lettres de ch.
          Écrire un programme qui saisit ch puis affiche ce code.
          Exemple : pour ch = "najahni", le programme affiche : N7
        `,
        bitou: code`
          Sandou9 el chapitre! El code fih 7arf w nombre, w lezem yetlas9ou.
        `,
        starterCode: code`
          ch = input("Donner ch : ")
        `,
        solution: code`
          ch = input("Donner ch : ")
          print(ch[0:1].upper() + str(len(ch)))
        `,
        hints: [
          'Kifech te5ou awel 7arf mel chaîne?',
          'Ma tnajemch tlas9 chaîne w nombre : lezem tbaddel el nombre l chaîne 9bal.',
        ],
        data: {
          scene: 'chest',
          tests: [
            { inputs: ['najahni'], output: ['N7'] },
            { inputs: ['ali'], output: ['A3'] },
            { inputs: ['Tunis'], output: ['T5'] },
            { inputs: ['informatique'], output: ['I12'], hidden: true },
          ],
          algo: {
            starter: code`
              ALGORITHME Code_coffre
              DEBUT
                  Ecrire("Donner ch : "), Lire(ch)
              FIN
            `,
            solution: code`
              ALGORITHME Code_coffre
              DEBUT
                  Ecrire("Donner ch : "), Lire(ch)
                  code ← Majus(Sous_Chaine(ch, 0, 1)) + Convch(Long(ch))
                  Ecrire(code)
              FIN
            `,
            tdo: [
              { name: 'ch', type: 'Chaîne' },
              { name: 'code', type: 'Chaîne' },
            ],
          },
        },
      },
    ],
  },
  {
    slug: 'bases-conditions',
    kind: 'PYTHON',
    track: 'BASES',
    title: 'Les structures conditionnelles',
    description: 'Si ... Alors ... Sinon : le programme choisit.',
    levels: [
      {
        slug: 'bases-cond-3',
        kind: 'PYTHON',
        title: 'Pair ou impair',
        statement: code`
          Écrire un programme qui saisit un entier n, puis affiche "Pair" si n est pair,
          sinon "Impair".
        `,
        bitou: code`
          Nombre pair : ki ta9smou 3la 2, chnouwa yo93od?
          Fel Python, == lel comparaison w = lel affectation. Ma t5alt-houmch!
        `,
        starterCode: code`
          n = int(input("Donner n : "))
        `,
        solution: code`
          n = int(input("Donner n : "))
          if n % 2 == 0:
              print("Pair")
          else:
              print("Impair")
        `,
        hints: [
          'Ana opération ta3tik el ba9i?',
          'Zouz 7alet : structure conditionnelle b Sinon.',
        ],
        data: {
          scene: 'door',
          tests: [
            { inputs: ['4'], output: ['Pair'] },
            { inputs: ['7'], output: ['Impair'] },
            { inputs: ['0'], output: ['Pair'] },
            { inputs: ['-3'], output: ['Impair'], hidden: true },
          ],
          algo: {
            starter: code`
              ALGORITHME Parite
              DEBUT
                  Ecrire("Donner n : "), Lire(n)
              FIN
            `,
            solution: code`
              ALGORITHME Parite
              DEBUT
                  Ecrire("Donner n : "), Lire(n)
                  Si n mod 2 = 0 Alors
                      Ecrire("Pair")
                  Sinon
                      Ecrire("Impair")
                  FinSi
              FIN
            `,
            tdo: entiers('n'),
          },
        },
      },
      {
        slug: 'bases-cond-4',
        kind: 'PYTHON',
        title: 'La mention',
        statement: code`
          Écrire un programme qui saisit une note (réel entre 0 et 20) et affiche la mention :
          "Tres bien" (note >= 16), "Bien" (>= 14), "Assez bien" (>= 12),
          "Passable" (>= 10), sinon "Refuse".
        `,
        bitou: code`
          Barcha toro9 : el programme y9ra el conditions mel fou9 l louta, w awel wa7da
          s7i7a ye5ou-ha w yfout el ba9i.
        `,
        starterCode: code`
          note = float(input("Donner la note : "))
        `,
        solution: code`
          note = float(input("Donner la note : "))
          if note >= 16:
              print("Tres bien")
          elif note >= 14:
              print("Bien")
          elif note >= 12:
              print("Assez bien")
          elif note >= 10:
              print("Passable")
          else:
              print("Refuse")
        `,
        hints: [
          'Mel ana note lezem tebda : el akbar wala el asghar?',
          'Sinon si (elif) yemchi b barcha conditions wara ba3dhom.',
        ],
        data: {
          scene: 'door',
          tests: [
            { inputs: ['17'], output: ['Tres bien'] },
            { inputs: ['15.5'], output: ['Bien'] },
            { inputs: ['12'], output: ['Assez bien'] },
            { inputs: ['10'], output: ['Passable'] },
            { inputs: ['8.75'], output: ['Refuse'], hidden: true },
          ],
          algo: {
            starter: code`
              ALGORITHME Mention
              DEBUT
                  Ecrire("Donner la note : "), Lire(note)
              FIN
            `,
            solution: code`
              ALGORITHME Mention
              DEBUT
                  Ecrire("Donner la note : "), Lire(note)
                  Si note ≥ 16 Alors
                      Ecrire("Tres bien")
                  Sinon si note ≥ 14 Alors
                      Ecrire("Bien")
                  Sinon si note ≥ 12 Alors
                      Ecrire("Assez bien")
                  Sinon si note ≥ 10 Alors
                      Ecrire("Passable")
                  Sinon
                      Ecrire("Refuse")
                  FinSi
              FIN
            `,
            tdo: [{ name: 'note', type: 'Réel' }],
          },
        },
      },
      {
        slug: 'bases-cond-5',
        kind: 'PYTHON',
        title: 'Le plus grand des trois',
        statement: code`
          Écrire un programme qui saisit trois entiers a, b et c, puis affiche le plus
          grand, sans utiliser la fonction max.
          Exemple : pour a = 4, b = 9 et c = 2, le programme affiche : Max = 9
        `,
        bitou: code`
          Ma testa7a9ch barcha conditions : variable wa7da tnajem tchedd el akbar
          eli l9itou 7atta lel tawa.
        `,
        starterCode: code`
          a = int(input("a = "))
          b = int(input("b = "))
          c = int(input("c = "))
        `,
        solution: code`
          a = int(input("a = "))
          b = int(input("b = "))
          c = int(input("c = "))
          mx = a
          if b > mx:
              mx = b
          if c > mx:
              mx = c
          print("Max =", mx)
        `,
        hints: [
          'Fardh eli el awel howa el akbar, w ba3d 9aren.',
          'Ken tal9a wa7ed akbar, chnouwa tbaddel?',
        ],
        data: {
          scene: 'door',
          tests: [
            { inputs: ['4', '9', '2'], numbers: ['9'] },
            { inputs: ['7', '3', '5'], numbers: ['7'] },
            { inputs: ['1', '2', '8'], numbers: ['8'] },
            { inputs: ['-5', '-2', '-9'], numbers: ['-2'], hidden: true },
          ],
          algo: {
            starter: code`
              ALGORITHME Maximum
              DEBUT
                  Ecrire("a = "), Lire(a)
                  Ecrire("b = "), Lire(b)
                  Ecrire("c = "), Lire(c)
              FIN
            `,
            solution: code`
              ALGORITHME Maximum
              DEBUT
                  Ecrire("a = "), Lire(a)
                  Ecrire("b = "), Lire(b)
                  Ecrire("c = "), Lire(c)
                  mx ← a
                  Si b > mx Alors
                      mx ← b
                  FinSi
                  Si c > mx Alors
                      mx ← c
                  FinSi
                  Ecrire("Max = ", mx)
              FIN
            `,
            tdo: entiers('a', 'b', 'c', 'mx'),
          },
        },
      },
      {
        slug: 'bases-cond-6',
        kind: 'PYTHON',
        title: 'Année bissextile',
        statement: code`
          Une année est bissextile si elle est divisible par 4 et non divisible par 100,
          ou si elle est divisible par 400.
          Écrire un programme qui saisit une année a puis affiche "Bissextile" ou
          "Non bissextile".
        `,
        bitou: code`
          Condition kbira b et w ou. 7ott les parenthèses bech ma ytla5btouch!
        `,
        starterCode: code`
          a = int(input("Donner l'annee : "))
        `,
        solution: code`
          a = int(input("Donner l'annee : "))
          if (a % 4 == 0 and a % 100 != 0) or a % 400 == 0:
              print("Bissextile")
          else:
              print("Non bissextile")
        `,
        hints: [
          'Divisible ya3ni chnouwa fel ba9i?',
          'A9ra el énoncé kelma b kelma : "et", "non", "ou".',
        ],
        data: {
          scene: 'chest',
          tests: [
            { inputs: ['2024'], output: ['Bissextile'] },
            { inputs: ['2023'], output: ['Non bissextile'] },
            { inputs: ['1900'], output: ['Non bissextile'] },
            { inputs: ['2000'], output: ['Bissextile'], hidden: true },
          ],
          algo: {
            starter: code`
              ALGORITHME Bissextile
              DEBUT
                  Ecrire("Donner l'annee : "), Lire(a)
              FIN
            `,
            solution: code`
              ALGORITHME Bissextile
              DEBUT
                  Ecrire("Donner l'annee : "), Lire(a)
                  Si ((a mod 4 = 0) et (a mod 100 ≠ 0)) ou (a mod 400 = 0) Alors
                      Ecrire("Bissextile")
                  Sinon
                      Ecrire("Non bissextile")
                  FinSi
              FIN
            `,
            tdo: entiers('a'),
          },
        },
      },
    ],
  },
  {
    slug: 'bases-iteratives',
    kind: 'PYTHON',
    track: 'BASES',
    title: 'Les structures itératives',
    description: 'Pour, TantQue et Répéter : répéter sans recopier.',
    levels: [
      {
        slug: 'bases-it-6',
        kind: 'PYTHON',
        title: 'La factorielle',
        statement: code`
          Écrire un programme qui saisit un entier n (n >= 0), puis calcule et affiche n!
          (n! = 1 x 2 x ... x n et 0! = 1).
          Exemple : pour n = 5, le programme affiche : 5! = 120
        `,
        bitou: code`
          Nombre de tours ma3rouf : hedhi khedma lel boucle Pour.
          Rod belek lel 9ima el louwla mta3 el natija!
        `,
        starterCode: code`
          n = int(input("Donner n : "))
        `,
        solution: code`
          n = int(input("Donner n : "))
          f = 1
          for i in range(1, n + 1):
              f = f * i
          print(n, "! =", f)
        `,
        hints: [
          'Ken tebda b 0, chnouwa ysir fel darb?',
          'Fel Python, range ma ye5ouch el borne el ekhra.',
        ],
        data: {
          scene: 'door',
          tests: [
            { inputs: ['5'], numbers: ['5', '120'] },
            { inputs: ['0'], numbers: ['0', '1'] },
            { inputs: ['1'], numbers: ['1', '1'] },
            { inputs: ['10'], numbers: ['10', '3628800'], hidden: true },
          ],
          algo: {
            starter: code`
              ALGORITHME Factorielle
              DEBUT
                  Ecrire("Donner n : "), Lire(n)
              FIN
            `,
            solution: code`
              ALGORITHME Factorielle
              DEBUT
                  Ecrire("Donner n : "), Lire(n)
                  f ← 1
                  Pour i de 1 à n Faire
                      f ← f * i
                  FinPour
                  Ecrire(n, "! = ", f)
              FIN
            `,
            tdo: entiers('n', 'f', 'i'),
          },
        },
      },
      {
        slug: 'bases-it-7',
        kind: 'PYTHON',
        title: 'Somme des chiffres (TantQue)',
        statement: code`
          Écrire un programme qui saisit un entier positif n (de taille quelconque), puis
          calcule et affiche la somme de ses chiffres.
          Exemple : pour n = 12345, le programme affiche : Somme = 15
        `,
        bitou: code`
          Taw ma ta3refch 9addech men chiffre fel nombre, donc ma ta3refch 9addech men tour.
          Ana boucle tsal7ek?
        `,
        starterCode: code`
          n = int(input("Donner n : "))
        `,
        solution: code`
          n = int(input("Donner n : "))
          s = 0
          while n > 0:
              s = s + n % 10
              n = n // 10
          print("Somme =", s)
        `,
        hints: [
          'Kifech te5ou ekher chiffre mta3 nombre?',
          'Kifech tna77i ekher chiffre? W wa9tech to9ef?',
        ],
        data: {
          scene: 'door',
          tests: [
            { inputs: ['12345'], numbers: ['15'] },
            { inputs: ['7'], numbers: ['7'] },
            { inputs: ['0'], numbers: ['0'] },
            { inputs: ['90909'], numbers: ['27'], hidden: true },
          ],
          algo: {
            starter: code`
              ALGORITHME Somme_chiffres
              DEBUT
                  Ecrire("Donner n : "), Lire(n)
              FIN
            `,
            solution: code`
              ALGORITHME Somme_chiffres
              DEBUT
                  Ecrire("Donner n : "), Lire(n)
                  s ← 0
                  TantQue n > 0 Faire
                      s ← s + n mod 10
                      n ← n div 10
                  FinTantQue
                  Ecrire("Somme = ", s)
              FIN
            `,
            tdo: entiers('n', 's'),
          },
        },
      },
      {
        slug: 'bases-it-8',
        kind: 'PYTHON',
        title: 'Saisie contrôlée',
        statement: code`
          Écrire un programme qui saisit un entier n avec 5 <= n <= 20 (la saisie est
          répétée tant que n n'est pas valide), puis affiche la somme 1 + 2 + ... + n.
          Exemple : si l'utilisateur tape 3, puis 25, puis 10, le programme affiche : S = 55
        `,
        bitou: code`
          Répéter ... Jusqu'à fel algo. Fel Python ma famech "repeat" :
          fama while True m3a break, wala while b el condition el 3aks.
        `,
        starterCode: code`
          # Saisie controlee, puis la somme
        `,
        solution: code`
          while True:
              n = int(input("Donner n : "))
              if 5 <= n <= 20:
                  break
          s = 0
          for i in range(1, n + 1):
              s = s + i
          print("S =", s)
        `,
        hints: [
          'Zouz parties : el saisie, ba3d el 7seb.',
          'El saisie to9ef wa9tech b dhabt?',
        ],
        data: {
          scene: 'door',
          tests: [
            { inputs: ['3', '25', '10'], numbers: ['55'] },
            { inputs: ['5'], numbers: ['15'] },
            { inputs: ['0', '-4', '21', '20'], numbers: ['210'] },
            { inputs: ['100', '7'], numbers: ['28'], hidden: true },
          ],
          algo: {
            starter: code`
              ALGORITHME Somme
              DEBUT
              FIN
            `,
            solution: code`
              ALGORITHME Somme
              DEBUT
                  Répéter
                      Ecrire("Donner n : "), Lire(n)
                  Jusqu'à (5 ≤ n) et (n ≤ 20)
                  s ← 0
                  Pour i de 1 à n Faire
                      s ← s + i
                  FinPour
                  Ecrire("S = ", s)
              FIN
            `,
            tdo: entiers('n', 's', 'i'),
          },
        },
      },
      {
        slug: 'bases-it-9',
        kind: 'PYTHON',
        title: 'Le nombre parfait',
        statement: code`
          Un entier n est parfait s'il est égal à la somme de ses diviseurs autres que
          lui-même. Exemple : 6 = 1 + 2 + 3.
          Écrire un programme qui saisit n (n > 1) puis affiche "n est parfait" ou
          "n n'est pas parfait".
          Exemple : pour n = 28, le programme affiche : 28 est parfait
        `,
        bitou: code`
          Sandou9 el chapitre : 9awi barcha ken t7ell-ou!
          Boucle, condition, w 9arna fel ekher.
        `,
        starterCode: code`
          n = int(input("Donner n : "))
        `,
        solution: code`
          n = int(input("Donner n : "))
          s = 0
          for i in range(1, n):
              if n % i == 0:
                  s = s + i
          if s == n:
              print(n, "est parfait")
          else:
              print(n, "n'est pas parfait")
        `,
        hints: [
          'Kifech ta3ref i diviseur mta3 n wala le?',
          'n wa7dou ma ye7sebch : win lezem to9ef el boucle?',
        ],
        data: {
          scene: 'chest',
          tests: [
            { inputs: ['6'], output: ['est parfait'] },
            { inputs: ['28'], output: ['est parfait'] },
            { inputs: ['12'], output: ["n'est pas parfait"] },
            { inputs: ['496'], output: ['est parfait'], hidden: true },
          ],
          algo: {
            starter: code`
              ALGORITHME Parfait
              DEBUT
                  Ecrire("Donner n : "), Lire(n)
              FIN
            `,
            solution: code`
              ALGORITHME Parfait
              DEBUT
                  Ecrire("Donner n : "), Lire(n)
                  s ← 0
                  Pour i de 1 à n - 1 Faire
                      Si n mod i = 0 Alors
                          s ← s + i
                      FinSi
                  FinPour
                  Si s = n Alors
                      Ecrire(n, " est parfait")
                  Sinon
                      Ecrire(n, " n'est pas parfait")
                  FinSi
              FIN
            `,
            tdo: entiers('n', 's', 'i'),
          },
        },
      },
    ],
  },
  {
    slug: 'bases-tableaux',
    kind: 'PYTHON',
    track: 'BASES',
    title: 'Les tableaux',
    description: 'Ranger plusieurs valeurs du même type.',
    levels: [
      {
        slug: 'bases-tab-1',
        kind: 'PYTHON',
        title: 'Remplir et additionner',
        statement: code`
          Écrire un programme qui saisit un entier n, remplit un tableau T par n entiers,
          puis affiche la somme de ses éléments.
          Exemple : pour n = 4 et T = 3, 5, 1, 6, le programme affiche : Somme = 15
        `,
        bitou: code`
          El tableau howa barcha sanade9 wara ba3dhom, kol wa7ed 3andou indice (yebda men 0).
          Fel TDO, T type-ou Tableau. Fel Python : T = array([int()] * n) m3a from numpy import *
        `,
        starterCode: code`
          from numpy import *

          n = int(input("n = "))
          T = array([int()] * n)
        `,
        solution: code`
          from numpy import *

          n = int(input("n = "))
          T = array([int()] * n)
          for i in range(n):
              T[i] = int(input())
          s = 0
          for i in range(n):
              s = s + T[i]
          print("Somme =", s)
        `,
        hints: [
          'Louel 3ammer el tableau case b case.',
          'El indices yemchiw men 0 l ana 9ima?',
        ],
        data: {
          scene: 'door',
          tests: [
            { inputs: ['4', '3', '5', '1', '6'], numbers: ['15'] },
            { inputs: ['1', '42'], numbers: ['42'] },
            { inputs: ['3', '-2', '7', '0'], numbers: ['5'], hidden: true },
          ],
          algo: {
            starter: code`
              ALGORITHME Somme_tableau
              DEBUT
                  Ecrire("n = "), Lire(n)
              FIN
            `,
            solution: code`
              ALGORITHME Somme_tableau
              DEBUT
                  Ecrire("n = "), Lire(n)
                  Pour i de 0 à n - 1 Faire
                      Lire(T[i])
                  FinPour
                  s ← 0
                  Pour i de 0 à n - 1 Faire
                      s ← s + T[i]
                  FinPour
                  Ecrire("Somme = ", s)
              FIN
            `,
            tdo: [...entiers('n', 'i', 's'), tableau],
          },
        },
      },
      {
        slug: 'bases-tab-2',
        kind: 'PYTHON',
        title: 'Le maximum et sa position',
        statement: code`
          Écrire un programme qui saisit un entier n, remplit un tableau T par n entiers,
          puis affiche le plus grand élément et sa première position.
          Exemple : pour T = 3, 9, 2, 9, 1 le programme affiche : Max = 9 , position = 1
        `,
        bitou: code`
          Kif el max mta3 thletha, ama b boucle.
          Lezmek tchedd zouz 7ajet : el 9ima w el position.
        `,
        starterCode: code`
          from numpy import *

          n = int(input("n = "))
          T = array([int()] * n)
          for i in range(n):
              T[i] = int(input())
        `,
        solution: code`
          from numpy import *

          n = int(input("n = "))
          T = array([int()] * n)
          for i in range(n):
              T[i] = int(input())
          mx = T[0]
          p = 0
          for i in range(1, n):
              if T[i] > mx:
                  mx = T[i]
                  p = i
          print("Max =", mx, ", position =", p)
        `,
        hints: [
          'Mel ana case tebda?',
          'Bech te5ou el position el louwla : > wala ≥ ?',
        ],
        data: {
          scene: 'door',
          tests: [
            { inputs: ['5', '3', '9', '2', '9', '1'], numbers: ['9', '1'] },
            { inputs: ['3', '8', '4', '1'], numbers: ['8', '0'] },
            {
              inputs: ['4', '-5', '-1', '-7', '-1'],
              numbers: ['-1', '1'],
              hidden: true,
            },
          ],
          algo: {
            starter: code`
              ALGORITHME Maximum
              DEBUT
                  Ecrire("n = "), Lire(n)
                  Pour i de 0 à n - 1 Faire
                      Lire(T[i])
                  FinPour
              FIN
            `,
            solution: code`
              ALGORITHME Maximum
              DEBUT
                  Ecrire("n = "), Lire(n)
                  Pour i de 0 à n - 1 Faire
                      Lire(T[i])
                  FinPour
                  mx ← T[0]
                  p ← 0
                  Pour i de 1 à n - 1 Faire
                      Si T[i] > mx Alors
                          mx ← T[i]
                          p ← i
                      FinSi
                  FinPour
                  Ecrire("Max = ", mx, " , position = ", p)
              FIN
            `,
            tdo: [...entiers('n', 'i', 'mx', 'p'), tableau],
          },
        },
      },
      {
        slug: 'bases-tab-3',
        kind: 'PYTHON',
        title: "Nombre d'occurrences",
        statement: code`
          Écrire un programme qui saisit n, remplit un tableau T par n entiers, saisit un
          entier x, puis affiche le nombre d'apparitions de x dans T.
          Exemple : pour T = 4, 2, 4, 7, 4 et x = 4, le programme affiche : 3
        `,
        bitou: code`
          Sandou9 el chapitre! Hedhi khedma lel compteur.
        `,
        starterCode: code`
          from numpy import *

          n = int(input("n = "))
          T = array([int()] * n)
          for i in range(n):
              T[i] = int(input())
          x = int(input("x = "))
        `,
        solution: code`
          from numpy import *

          n = int(input("n = "))
          T = array([int()] * n)
          for i in range(n):
              T[i] = int(input())
          x = int(input("x = "))
          nb = 0
          for i in range(n):
              if T[i] == x:
                  nb = nb + 1
          print(nb)
        `,
        hints: ['Compteur yebda b chnouwa?', 'Wa9tech yzid el compteur?'],
        data: {
          scene: 'chest',
          tests: [
            { inputs: ['5', '4', '2', '4', '7', '4', '4'], numbers: ['3'] },
            { inputs: ['3', '1', '2', '3', '9'], numbers: ['0'] },
            {
              inputs: ['4', '5', '5', '5', '5', '5'],
              numbers: ['4'],
              hidden: true,
            },
          ],
          algo: {
            starter: code`
              ALGORITHME Occurrences
              DEBUT
                  Ecrire("n = "), Lire(n)
                  Pour i de 0 à n - 1 Faire
                      Lire(T[i])
                  FinPour
                  Ecrire("x = "), Lire(x)
              FIN
            `,
            solution: code`
              ALGORITHME Occurrences
              DEBUT
                  Ecrire("n = "), Lire(n)
                  Pour i de 0 à n - 1 Faire
                      Lire(T[i])
                  FinPour
                  Ecrire("x = "), Lire(x)
                  nb ← 0
                  Pour i de 0 à n - 1 Faire
                      Si T[i] = x Alors
                          nb ← nb + 1
                      FinSi
                  FinPour
                  Ecrire(nb)
              FIN
            `,
            tdo: [...entiers('n', 'i', 'x', 'nb'), tableau],
          },
        },
      },
    ],
  },
  {
    slug: 'bases-modules',
    kind: 'PYTHON',
    track: 'BASES',
    title: 'Les sous-programmes',
    description: 'Fonctions et procédures : découper un problème en modules.',
    levels: [
      {
        slug: 'bases-mod-1',
        kind: 'PYTHON',
        title: 'Fonction SOMCARRE',
        statement: code`
          Écrire une fonction somcarre(x) qui retourne la somme des carrés des chiffres
          d'un entier naturel x.
          Exemple : somcarre(312) retourne 14 (3² + 1² + 2² = 14)
          Écrire seulement la fonction (sans programme principal).
        `,
        bitou: code`
          Fonction = machina : te5ou x, ta3mel el 7seb, w traja3 natija.
          Tfakker el exercice mta3 somme des chiffres?
        `,
        starterCode: code`
          def somcarre(x):
              pass
        `,
        solution: code`
          def somcarre(x):
              s = 0
              while x > 0:
                  c = x % 10
                  s = s + c * c
                  x = x // 10
              return s
        `,
        hints: [
          'Nafs el boucle mta3 somme des chiffres.',
          'Chnouwa tzid lel somme blaset el chiffre?',
        ],
        data: {
          scene: 'door',
          tests: [
            { expr: 'somcarre(312)', expected: '14' },
            { expr: 'somcarre(7)', expected: '49' },
            { expr: 'somcarre(0)', expected: '0' },
            { expr: 'somcarre(999)', expected: '243', hidden: true },
          ],
          algo: {
            starter: code`
              Fonction somcarre(x : Entier) : Entier
              DEBUT
              FIN
            `,
            solution: code`
              Fonction somcarre(x : Entier) : Entier
              DEBUT
                  s ← 0
                  TantQue x > 0 Faire
                      c ← x mod 10
                      s ← s + c * c
                      x ← x div 10
                  FinTantQue
                  Retourner s
              FIN
            `,
            tdo: entiers('s', 'c'),
          },
        },
      },
      {
        slug: 'bases-mod-2',
        kind: 'PYTHON',
        title: 'Le nombre heureux',
        statement: code`
          Un entier n > 0 est heureux si, en remplaçant n par la somme des carrés de ses
          chiffres et en répétant, on finit par obtenir 1. Sinon on tombe dans un cycle qui
          contient toujours 4.
          Exemple : 7 → 49 → 97 → 130 → 10 → 1, donc 7 est heureux.
          Écrire la fonction somcarre(x) puis la fonction heureux(n) qui retourne Vrai si n
          est heureux, sinon Faux.
        `,
        bitou: code`
          Hedhi el fekra mta3 les modules : kol fonction sghira ta3mel 7aja wa7da,
          w fonction ta3ayet lokhra.
        `,
        starterCode: code`
          def somcarre(x):
              pass


          def heureux(n):
              pass
        `,
        solution: code`
          def somcarre(x):
              s = 0
              while x > 0:
                  c = x % 10
                  s = s + c * c
                  x = x // 10
              return s


          def heureux(n):
              while n != 1 and n != 4:
                  n = somcarre(n)
              return n == 1
        `,
        hints: [
          'Wa9tech lezem to9ef el boucle? (zouz 7alet)',
          'Fel ekher, n 9addech lezem ykoun bech yet7seb heureux?',
        ],
        data: {
          scene: 'door',
          tests: [
            { expr: 'heureux(7)', expected: 'True' },
            { expr: 'heureux(19)', expected: 'True' },
            { expr: 'heureux(4)', expected: 'False' },
            { expr: 'heureux(20)', expected: 'False' },
            { expr: 'heureux(100)', expected: 'True', hidden: true },
          ],
          algo: {
            starter: code`
              Fonction somcarre(x : Entier) : Entier
              DEBUT
              FIN

              Fonction heureux(n : Entier) : Booléen
              DEBUT
              FIN
            `,
            solution: code`
              Fonction somcarre(x : Entier) : Entier
              DEBUT
                  s ← 0
                  TantQue x > 0 Faire
                      c ← x mod 10
                      s ← s + c * c
                      x ← x div 10
                  FinTantQue
                  Retourner s
              FIN

              Fonction heureux(n : Entier) : Booléen
              DEBUT
                  TantQue (n ≠ 1) et (n ≠ 4) Faire
                      n ← somcarre(n)
                  FinTantQue
                  Retourner n = 1
              FIN
            `,
            tdo: entiers('s', 'c'),
          },
        },
      },
      {
        slug: 'bases-mod-3',
        kind: 'PYTHON',
        title: 'La fonction premier',
        statement: code`
          Écrire une fonction premier(n) qui retourne Vrai si l'entier n (n >= 1) est
          premier, sinon Faux. Un nombre premier a exactement deux diviseurs : 1 et lui-même.
          Exemple : premier(7) retourne Vrai, premier(9) retourne Faux, premier(1) retourne Faux.
        `,
        bitou: code`
          A9ra el définition mli7 : "exactement deux diviseurs".
          1 mouch premier, rod belek!
        `,
        starterCode: code`
          def premier(n):
              pass
        `,
        solution: code`
          def premier(n):
              nb = 0
              for i in range(1, n + 1):
                  if n % i == 0:
                      nb = nb + 1
              return nb == 2
        `,
        hints: [
          'Chnouwa lezem ta3odd?',
          'El fonction traja3 condition, mouch nombre.',
        ],
        data: {
          scene: 'door',
          tests: [
            { expr: 'premier(7)', expected: 'True' },
            { expr: 'premier(9)', expected: 'False' },
            { expr: 'premier(1)', expected: 'False' },
            { expr: 'premier(2)', expected: 'True' },
            { expr: 'premier(97)', expected: 'True', hidden: true },
          ],
          algo: {
            starter: code`
              Fonction premier(n : Entier) : Booléen
              DEBUT
              FIN
            `,
            solution: code`
              Fonction premier(n : Entier) : Booléen
              DEBUT
                  nb ← 0
                  Pour i de 1 à n Faire
                      Si n mod i = 0 Alors
                          nb ← nb + 1
                      FinSi
                  FinPour
                  Retourner nb = 2
              FIN
            `,
            tdo: entiers('nb', 'i'),
          },
        },
      },
      {
        slug: 'bases-mod-4',
        kind: 'PYTHON',
        title: 'Procédure inverser',
        statement: code`
          Écrire une procédure inverser(T, n) qui inverse l'ordre des n éléments du
          tableau T (T est modifié, rien n'est retourné).
          Exemple : pour T = [1, 2, 3, 4], après inverser(T, 4) on a T = [4, 3, 2, 1].
        `,
        bitou: code`
          Akher sandou9 fel parcours! Procédure = module ma yraja3 chay,
          ama ybaddel fel tableau eli ta3tih.
        `,
        starterCode: code`
          from numpy import *


          def inverser(T, n):
              pass
        `,
        solution: code`
          from numpy import *


          def inverser(T, n):
              for i in range(n // 2):
                  aux = T[i]
                  T[i] = T[n - 1 - i]
                  T[n - 1 - i] = aux
        `,
        hints: [
          'Kifech tbaddel 9imet zouz cases bla ma tkhassar wa7da?',
          'Ken tkammel lel ekher, chnouwa ysir?',
        ],
        data: {
          scene: 'chest',
          tests: [
            {
              setup:
                'from numpy import array\nT = array([1, 2, 3, 4])\ninverser(T, 4)',
              expr: 'T',
              expected: '[4, 3, 2, 1]',
            },
            {
              setup:
                'from numpy import array\nT = array([5, 8, 1])\ninverser(T, 3)',
              expr: 'T',
              expected: '[1, 8, 5]',
            },
            {
              setup: 'from numpy import array\nT = array([9])\ninverser(T, 1)',
              expr: 'T',
              expected: '[9]',
              hidden: true,
            },
          ],
          algo: {
            starter: code`
              Procédure inverser(@T : Tab, n : Entier)
              DEBUT
              FIN
            `,
            solution: code`
              Procédure inverser(@T : Tab, n : Entier)
              DEBUT
                  Pour i de 0 à (n div 2) - 1 Faire
                      aux ← T[i]
                      T[i] ← T[n - 1 - i]
                      T[n - 1 - i] ← aux
                  FinPour
              FIN
            `,
            tdo: entiers('i', 'aux'),
          },
        },
      },
    ],
  },
];
