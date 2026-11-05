import type { PackChapter } from '../types.js';
import { code } from './text.js';

/**
 * Jeu "Mission souris" : le code guide la souris sur une grille jusqu'a sa maison.
 * Commun a tous les parcours. Bitou presente les instructions, jamais la reponse.
 * Grille : # mur, . vide, S depart, H maison, C fromage, X chat.
 */
const START = '# Ekteb el code mte3ek lena\n';

export const MOUSE: PackChapter[] = [
  {
    slug: 'souris-sequences',
    kind: 'GRID',
    track: null,
    title: 'La sortie du trou',
    description: "Une instruction après l'autre : la séquence.",
    levels: [
      {
        slug: 'souris-seq-1',
        kind: 'GRID',
        title: 'Awel khatwa',
        statement: "Guide la souris jusqu'à sa maison.",
        bitou: code`
          Ahla bik! Ena Bitou. El fara hedhi tayha 3la darha, w enti eli bech twassel-ha.
          Kol avancer() (wala move()) temchi biha case wa7da l 9eddemha.
        `,
        starterCode: START,
        solution: code`
          avancer()
          avancer()
          avancer()
        `,
        hints: ['A3ed el cases bin el fara w el dar.'],
        data: {
          worlds: [{ map: ['#######', '#S..H.#', '#######'] }],
          stars: [3, 4],
        },
      },
      {
        slug: 'souris-seq-2',
        kind: 'GRID',
        title: 'Dour!',
        statement: "La maison n'est pas en face. Trouve le chemin.",
        bitou: code`
          tourner_droite() w tourner_gauche() ydawrou el fara fi blasetha, bla ma temchi.
          Rod belek : el ymin mta3 el fara, mouch el ymin mte3ek!
        `,
        starterCode: START,
        solution: code`
          avancer()
          avancer()
          tourner_droite()
          avancer()
          avancer()
        `,
        hints: [
          'Emchi 7atta toussel lel 7it.',
          'Tkhayel rou7ek blaset el fara : el dar 3la ymin-ha wala 3la ysar-ha?',
        ],
        data: {
          worlds: [{ map: ['######', '#S..##', '###.##', '###H##', '######'] }],
          stars: [5, 6],
        },
      },
      {
        slug: 'souris-seq-3',
        kind: 'GRID',
        title: 'El fromage',
        statement: 'Ramasse le fromage, puis rentre à la maison.',
        bitou: code`
          El fara jay3a! Ki tkoun fou9 el fromage, ramasser() (wala pick()) tlemmou.
          Ma tod5olch l darha ken ma lammet el fromage el kol.
          Ama ramasser() fi blasa ma fihech fromage = ghalta!
        `,
        starterCode: START,
        solution: code`
          avancer()
          avancer()
          ramasser()
          avancer()
          avancer()
          tourner_droite()
          avancer()
        `,
        hints: [
          'Ramasser lezem tsir wa9t el fara fou9 el fromage b dhabt.',
          'Ba3d el fromage, win el 7it eli lezem tdour 3ando?',
        ],
        data: {
          worlds: [{ map: ['#######', '#S.C..#', '#####H#', '#######'] }],
          stars: [7, 8],
        },
      },
      {
        slug: 'souris-seq-4',
        kind: 'GRID',
        title: 'Ras belek mel 9attous',
        statement: 'Rentre à la maison sans croiser le chat.',
        bitou: code`
          Chouf chouf : 9attous fel thniya! Ken el fara t3adda 3lih, yekelha.
          Lawwej 3la thniya okhra.
        `,
        starterCode: START,
        solution: code`
          tourner_droite()
          avancer()
          avancer()
          tourner_gauche()
          avancer()
          avancer()
          avancer()
        `,
        hints: ['El thniya el soufla fergha : kifech tahbet liha?'],
        data: {
          worlds: [{ map: ['######', '#S.X.#', '#.##.#', '#...H#', '######'] }],
          stars: [7, 8],
        },
      },
    ],
  },
  {
    slug: 'souris-conditions',
    kind: 'GRID',
    track: null,
    title: 'Le carrefour',
    description: "Si ... Alors : la souris regarde avant d'agir.",
    levels: [
      {
        slug: 'souris-cond-1',
        kind: 'GRID',
        title: 'Fama fromage wala le?',
        statement: code`
          Le même programme doit réussir sur les deux grilles :
          parfois il y a un fromage, parfois non.
        `,
        bitou: code`
          Taw code wa7ed lezem ynaje7 fi zouz grilles. sur_fromage() traja3 True ken el fara
          fou9 fromage. El if ya3mel el 7aja ken el condition s7i7a :
          if condition:
              instruction
          Ma tensech el ":" w el 4 espaces.
        `,
        starterCode: START,
        solution: code`
          avancer()
          if sur_fromage():
              ramasser()
          avancer()
        `,
        hints: ['Chouf el zouz grilles : win yetbaddel chay binethom?'],
        data: {
          worlds: [
            { map: ['#####', '#SCH#', '#####'] },
            { map: ['#####', '#S.H#', '#####'] },
          ],
          stars: [4, 5],
        },
      },
      {
        slug: 'souris-cond-2',
        kind: 'GRID',
        title: '7it wala thniya?',
        statement: code`
          Après deux pas, un mur apparaît dans une grille mais pas dans l'autre.
          Un seul programme pour les deux.
        `,
        bitou: code`
          devant_mur() traja3 True ken fama 7it 9eddem el fara.
          Ichouf 9bal ma tchouf : el decision lezem tsir fel blasa el s7i7a.
        `,
        starterCode: START,
        solution: code`
          avancer()
          avancer()
          if devant_mur():
              tourner_gauche()
          avancer()
          avancer()
        `,
        hints: [
          'El bdeya w el ekher kif kif fel zouz grilles.',
          'Chnouwa el 7aja eli ma lezemhech tsir ken fi grille wa7da?',
        ],
        data: {
          worlds: [
            { map: ['#####', '###H#', '###.#', '#S..#', '#####'] },
            { map: ['#######', '#S...H#', '#######'] },
          ],
          stars: [6, 8],
        },
      },
    ],
  },
  {
    slug: 'souris-boucles',
    kind: 'GRID',
    track: null,
    title: 'La grande traversée',
    description: 'for et while : répéter sans recopier.',
    levels: [
      {
        slug: 'souris-boucle-1',
        kind: 'GRID',
        title: 'El couloir et-twil',
        statement:
          'La maison est loin. Pour 3 étoiles, ton code tient en 2 lignes.',
        bitou: code`
          Bla boucle, lezmek tekteb nafs el ligne barcha marrat. Barcha!
          for i in range(5): ya3ni "3awed 5 marrat". Eli yet3awed yetkteb ta7tha b 4 espaces.
        `,
        starterCode: START,
        solution: code`
          for i in range(8):
              avancer()
        `,
        hints: ['9addech men case lezem el fara t3addi?'],
        data: {
          worlds: [{ map: ['###########', '#S.......H#', '###########'] }],
          stars: [2, 3],
        },
      },
      {
        slug: 'souris-boucle-2',
        kind: 'GRID',
        title: 'Ed-daraj',
        statement: "Monte l'escalier de 3 marches avec une boucle.",
        bitou: code`
          Chouf el daraj : kol marche hiya nafs el 7arakat. Lawwej 3al motif eli yet3awed,
          w ekteb-ou mara wa7da wost el boucle.
        `,
        starterCode: START,
        solution: code`
          for i in range(3):
              avancer()
              tourner_gauche()
              avancer()
              tourner_droite()
        `,
        hints: [
          'Ekteb marche wa7da 9bal bla boucle, w jarrebha.',
          'Ba3d el marche, lezem el fara tarja3 tchouf nafs el jiha eli bdet biha.',
        ],
        data: {
          worlds: [
            {
              map: ['######', '####H#', '###..#', '##..##', '#S.###', '######'],
            },
          ],
          stars: [5, 7],
        },
      },
      {
        slug: 'souris-boucle-3',
        kind: 'GRID',
        title: 'TantQue mazelt',
        statement:
          "La distance change d'une grille à l'autre. Un seul programme pour les trois.",
        bitou: code`
          Ma ta3refch 9addech men khatwa. while ta3mel el 7aja tant que el condition s7i7a :
          while condition:
              instruction
          a_la_maison() traja3 True ki el fara twassel, w not y9allebha.
        `,
        starterCode: START,
        solution: code`
          while not a_la_maison():
              avancer()
        `,
        hints: ['Chnouwa el condition eli t9oul "mazelt ma wsoltech"?'],
        data: {
          worlds: [
            { map: ['######', '#S..H#', '######'] },
            { map: ['#########', '#S.....H#', '#########'] },
            { map: ['############', '#S........H#', '############'] },
          ],
          stars: [2, 3],
        },
      },
      {
        slug: 'souris-boucle-4',
        kind: 'GRID',
        title: 'Lemm el fromage el kol',
        statement:
          'Les fromages changent de place. Ramasse-les tous sur ta route.',
        bitou: code`
          Taw tlem el boucle m3a el condition : el fara tchouf fi kol khatwa.
          Hedhi el fekra mta3 barcha exercices fel Bac!
        `,
        starterCode: START,
        solution: code`
          while not a_la_maison():
              if sur_fromage():
                  ramasser()
              avancer()
        `,
        hints: [
          'Chnouwa lezem ta3mel el fara fi kol case?',
          'Ramasser 9bal ma temchi, sinon tfoutek el case.',
        ],
        data: {
          worlds: [
            { map: ['########', '#SC.C.H#', '########'] },
            { map: ['###########', '#S.CC..C.H#', '###########'] },
            { map: ['#######', '#SCCCH#', '#######'] },
          ],
          stars: [4, 6],
        },
      },
      {
        slug: 'souris-boucle-5',
        kind: 'GRID',
        title: 'El couloir idour',
        statement:
          'Le couloir tourne, mais pas au même endroit dans les deux grilles.',
        bitou: code`
          Ma ta3refch win el couloir bech idour. Ama ta3ref chnouwa ta3mel ki tal9a 7it.
          if ... else ... wost el boucle : hedha howa el "algorithme" mta3 el fara.
        `,
        starterCode: START,
        solution: code`
          while not a_la_maison():
              if devant_mur():
                  tourner_droite()
              else:
                  avancer()
        `,
        hints: [
          'Fi kol khatwa fama zouz 7alet ken : 7it wala fergh.',
          'El couloir dima idour 3al nafs el jiha.',
        ],
        data: {
          worlds: [
            {
              map: ['######', '#S..##', '###.##', '###.##', '###H##', '######'],
            },
            {
              map: ['########', '#S.....#', '######.#', '######H#', '########'],
            },
          ],
          stars: [5, 7],
        },
      },
      {
        slug: 'souris-boucle-6',
        kind: 'GRID',
        title: 'El fara w el 9attous',
        statement:
          'Dernière mission : ni mur ni chat ne doivent arrêter la souris.',
        bitou: code`
          Akher mission! devant_chat() traja3 True ken el 9attous 9eddem el fara.
          El condition tnajem tkoun b zouz 7ajet m3a b3adhhom b or.
        `,
        starterCode: START,
        solution: code`
          while not a_la_maison():
              if devant_mur() or devant_chat():
                  tourner_gauche()
              else:
                  avancer()
        `,
        hints: [
          'Kif el mission eli 9balha, ama el fara lezem tkhaf zeda mel 9attous.',
          'Chouf 3la ana jiha idour el couloir hna.',
        ],
        data: {
          worlds: [
            { map: ['#######', '#.H..##', '####.##', '#S...X#', '#######'] },
            {
              map: [
                '########',
                '#H...###',
                '####.###',
                '####.###',
                '#S...###',
                '########',
              ],
            },
          ],
          stars: [5, 7],
        },
      },
    ],
  },
];
