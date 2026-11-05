# Coder : kifech el algorithme w el Python yetexécutaw fel navigateur

Hedha el fichier ychra7 el partie **Coder** mta3 Najahni. Fiha **zouz jeux**, kol wa7ed fi carte :

- **Mission Souris** : el élève yekteb Python (`avancer()`, `tourner_gauche()`, `for`, `if`, `while`) bech
  ywassel el fara l darha fi jardin. Commun lel parcours lkol.
- **Portes du Code** : el élève yekteb **l'algorithme (notation tounsia)** wala **Python** mel programme
  mta3 9esmou. Ki el programme ykoun s7i7, el **bab** (wala el **sandou9**) yet7al.

El zouz ma ya3tiw 7atta correction : **énoncé + indices** bark. El code yetexécuta **fel navigateur
mta3 el élève**, en temps réel.

---

## 1. El fekra el kbira

Ma fama 7atta serveur Python. Kol chay yemchi **fi navigateur el élève** :

```
 El élève yekteb (CodeMirror)            TDO (objet / type)
   Algorithme  ──────────────┐               │
                              ▼               ▼
                   transpile.ts : algorithme ──► Python
                   (+ vérification mta3 el TDO, + lignes)
                              │
   Python  ───────────────────┤
                              ▼
 runner.ts (fel page)  ──postMessage──►  python.worker.ts (Web Worker)
                                                │
                                                ▼
                                      Pyodide = Python compilé en WebAssembly
                                                │
                                                ▼
                                      harness.ts (Python) : yexécuti w yverifi les tests
          ◄──────────postMessage (résultat)─────┘
          │
          ▼
 DoorScene.tsx : el bab yet7al (ken les tests lkol s7a7) w el fara tet3adda
 API NestJS : tsajjel l'essai (code, langage, TDO) w te7seb les étoiles
```

**3lech fel navigateur w mouch fel serveur?**
- **Sécurité** : code mta3 élève ma yexécuta 7atta chay 3al serveur mte3na.
- **Rapidité** : ma fama 7atta aller-retour réseau, el résultat yjik f millisecondes.
- **Coût** : 100 élève y5admou fi nafs el wa9t = 100 navigateur, el serveur ma y7ess bihom.

---

## 2. Les bibliothèques

| Bibliothèque | Version | Chnouwa ta3mel |
|---|---|---|
| **Pyodide** | 314.0.7 (Python 3.14.2) | Python kemel compilé en **WebAssembly**. El navigateur yexécutih kif programme natif. Fih el stdlib lkol (math, random…). |
| **numpy** | 2.4.6 (wheel Pyodide) | Les tableaux (`from numpy import *`, `array([int()] * n)`) kif fel programme. Yetcharga ken el code yesta3mlou. |
| **pandas** | 3.0.2 (wheel Pyodide) | Lel parcours Bac Eco (jehez, mazal ma fama exercices). |
| **CodeMirror 6** | `codemirror` 6.0.2, `@codemirror/lang-python` 6.2.1, `view`, `state`, `commands` | L'éditeur de code : coloration, numéros de lignes, indentation b Tab, w el ligne mta3 el ghalta tod7or b a7mar. |
| **Web Worker** | API mta3 el navigateur | Thread wa7dou. Python yemchi fih bech boucle infinie ma tblokich el page. |
| **Traducteur algo** | mte3na (`frontend/src/core/algo/`) | Ma fama 7atta bibliothèque lel notation tounsia, donc ktebtou : tokenizer + parser + générateur Python. |

### Pyodide : kifech y7otouh fel projet

- `npm install pyodide@314.0.7` : el paquet npm fih el moteur (`pyodide.asm.wasm` ~9.6 Mo, `python_stdlib.zip`…).
- El script [frontend/scripts/fetch-pyodide.mjs](../frontend/scripts/fetch-pyodide.mjs) :
  1. ycopi el moteur men `node_modules/pyodide` l `frontend/public/pyodide/` ;
  2. ycharji numpy, pandas w les dépendances mte3hom **mara wa7da** men jsDelivr, w yverifi el
     **sha256** mta3 kol fichier m3a `pyodide-lock.json`.
- Yetlanca wa7dou 9bal `npm run dev` w `npm run build` (scripts `predev` / `prebuild`).
- `public/pyodide` fel `.gitignore` (21 Mo).

Ya3ni Pyodide yetserva **men el serveur mte3na**, mouch men CDN.

---

## 3. El traducteur algorithme → Python

Fichiers fi [frontend/src/core/algo/](../frontend/src/core/algo/) :

| Fichier | Dour-ou |
|---|---|
| [tokens.ts](../frontend/src/core/algo/tokens.ts) | Y9atta3 kol ligne l **jetons** : nombres, chaînes, noms, opérateurs (`←`, `≠`, `≤`, `∈`, `..`…). Yefhem `Jusqu'à` (el apostrophe ma tebdach chaîne), w yjamma3 `Fin Si` → `FinSi`, `Tant que` → `TantQue`, `Sinon si`… Les accents w les majuscules ma yhemmouch (`Répéter` = `repeter`). |
| [expr.ts](../frontend/src/core/algo/expr.ts) | **Parser** mta3 les expressions (priorités : `ou` < `et` < `non` < comparaisons < `+ -` < `* / div mod`), w ytarjem l Python : `div` → `//`, `mod` → `%`, `=` → `==`, `x ∈ ["A".."Z"]` → `"A" <= x <= "Z"`… W les fonctions prédéfinies kif fel cours : `Long(ch)` → `len(ch)`, `Pos(a, ch)` → `ch.find(a)`, `Sous_Chaine(ch, d, f)` → `ch[d:f]`, `Effacer`, `Majus`, `Convch`, `Valeur`, `Estnum`, `Ord`, `Chr`, `Aléa`, `Ent`, `Arrondi`, `RacineCarré`, `Abs`. |
| [transpile.ts](../frontend/src/core/algo/transpile.ts) | Les **instructions** : `←`, `Lire`, `Ecrire`, `Si / Sinon si / Sinon / FinSi`, `Pour i de a à b (Pas = p) Faire`, `TantQue`, `Répéter … Jusqu'à`, `Retourner`, `Fonction`, `Procédure` (b `@`). W yverifi el **TDO**. |
| [toAlgo.ts](../frontend/src/core/algo/toAlgo.ts) | El 3aks : **Python → algorithme** (bouton "Traduire en algorithme"), w y9tare7 TDO (types devinés men `int(input())`, `float(...)`, `array(...)`…). |

### Mithel

```
ALGORITHME Somme                         n = int(input("Donner n : "))
DEBUT                                    s = 0
    Ecrire("Donner n : "), Lire(n)       for i in range(1, n + 1):
    s ← 0                         ──►        s = s + i
    Pour i de 1 à n Faire                print("S = ", s)
        s ← s + i
    FinPour
    Ecrire("S = ", s)
FIN
```

- `Ecrire("Donner n : "), Lire(n)` fi ligne wa7da ywalli `n = int(input("Donner n : "))`.
- `Lire(n)` yesta3mel **el type mta3 el TDO** : Entier → `int(input())`, Réel → `float(input())`,
  Chaîne / Caractère → `input()`.
- Les tableaux mta3 el TDO yet3amlou fel bdeya : `T = array([int()] * 50)` (+ `from numpy import *`).
- `Répéter … Jusqu'à c` ywalli `while True: … if c: break`.
- `Pour i de 9 à 0 (Pas = -1)` ywalli `range(9, -1, -1)`.
- **Procédure b `@`** : kif fel cours mta3 Python, `Procédure Saisir(@n : Entier)` ywalli
  `def Saisir(): … return n`, w l'appel `Saisir(n)` ywalli `n = Saisir()`. Ken el procédure ta9ra el
  9ima mta3 el paramètre 9bal ma tbaddalha (kif `Permuter(@a, @b)`), el paramètre yo93od :
  `a, b = Permuter(a, b)`.
- Les **modules** yetkatbou 9bal el programme principal fel Python (Python lezmou ya3ref el fonction
  9bal ma y3ayetlha), ama fel algorithme tnajem tekteb-hom ba3d `FIN` kif fel Bac.

### El TDO (obligatoire)

Kol objet eli yet3abba (`←`, `Lire`, compteur mta3 `Pour`) wala yet9ra lezem ykoun fel TDO, ken
les paramètres mta3 les modules. Sinon :

```
Ligne 5 : « s » n'est pas declare dans le TDO
```

Fama zeda erreurs kif el correction : `FinSi manquant`, `« Alors » manquant`, `Affectation : utilisez ←`,
`Le module « f » n'existe pas`…

### Les lignes

Kol ligne Python ta3ref mnin jét fel algorithme (`lineMap`). Ki Python yaffichi erreur fel ligne 7
mta3 el Python, el page traja3ha lel ligne mte3ha fel algorithme w tlawwenha fel éditeur.

---

## 4. Les fichiers (moteur, interface, backend)

### Frontend : el moteur (`frontend/src/core/python/`)

| Fichier | Dour-ou |
|---|---|
| [grid.ts](../frontend/src/core/python/grid.ts) | El monde mta3 el fara : y9ra el grille (`#` mur, `S` départ, `H` dar, `C` fromage, `X` 9attous), w `GridSimulation` ta3mel kol instruction w tsajjel **frame** (position, direction, fromages, ligne du code). |
| [harness.ts](../frontend/src/core/python/harness.ts) | Code **Python** yetcharga mara wa7da fi Pyodide : yexécuti el code (fichier virtuel `<eleve>`), y9a33ad `print`, ybaddel `input()`, w yverifi les tests. Fih zeda `avancer()` w les instructions lokhrin. |
| [engine.ts](../frontend/src/core/python/engine.ts) | Yrabbet Pyodide m3a el harness w m3a `GridSimulation` : `runGrid` (Lancer), `runFree` (Exécuter) w `runTests` (Ouvrir la porte). |
| [python.worker.ts](../frontend/src/core/python/python.worker.ts) | El Web Worker : ycharji Pyodide (`/pyodide/pyodide.mjs`) w yjaweb 3la les messages mta3 el page. |
| [runner.ts](../frontend/src/core/python/runner.ts) | Fel page : yab3ath el code lel worker, w **yo9tel el worker** ken ma jewbech fi wa9tou (boucle infinie). |

### Frontend : l'interface (`frontend/src/components/shared/coding/`)

| Fichier | Dour-ou |
|---|---|
| [GameStage.tsx](../frontend/src/components/shared/coding/GameStage.tsx) | El jaw mta3 el jeu : écran plein, décor animé, musique, barre du haut, écran de mission (Bitou yekteb w7da b w7da), indices, w écran de victoire (confettis, étoiles wa7da wa7da). |
| [sound.ts](../frontend/src/core/game/sound.ts) | Les sons w el musique, **msan3in b WebAudio** (ma fama 7atta fichier audio). Musique jardin (pentatonique) w temple (maqam hijaz), w bouton yosket el son. |
| [MouseWorkspace.tsx](../frontend/src/components/shared/coding/MouseWorkspace.tsx) | Mission Souris : instructions (clic yzidhom fel code), éditeur, "Lancer", animation pas par pas m3a son lkol khatwa. |
| [GridBoard.tsx](../frontend/src/components/shared/coding/GridBoard.tsx) | El jardin (SVG) : haies, fromage, 9attous, dar, w el fara. |
| [CodeWorkspace.tsx](../frontend/src/components/shared/coding/CodeWorkspace.tsx) | Portes du Code : onglets Algorithme / Python, symboles (`←`, `≠`, `≤`…) w squelettes (`Si`, `Pour`…) b clic, éditeur, TDO, "Exécuter", "Ouvrir la porte", "Voir en Python", "Traduire en algorithme", console w résultats des tests. |
| [TdoEditor.tsx](../frontend/src/components/shared/coding/TdoEditor.tsx) | El TDO : objet + type (Entier, Réel, Booléen, Caractère, Chaîne, Tableau b taille w type des éléments). |
| [DoorScene.tsx](../frontend/src/components/shared/coding/DoorScene.tsx) | El salle du temple (SVG) : mur, torches, el fara, el bab wala el sandou9. Ken s7i7 : el bab yet7al w el dhaw yod5ol (wala el sandou9 yet7al w yodhhor el mafte7). Ken ghalet : el cadenas yer3ech. |
| [CodeEditor.tsx](../frontend/src/components/shared/coding/CodeEditor.tsx) | L'éditeur CodeMirror : couleurs lel Python w lel notation algorithmique (`Si`, `Pour`, `div`, `Long`…). |
| [bitou.tsx](../frontend/src/components/shared/coding/bitou.tsx) | Bitou : avatar, bulle, w les messages bel derja (kol erreur Python 3andha chra7). |

### Backend (`api/src/core/coding/`)

| Fichier | Dour-ou |
|---|---|
| [content/mouse.ts](../api/src/core/coding/content/mouse.ts) | **Mission Souris** : 3 chapitres, 12 mission. |
| [content/doors.ts](../api/src/core/coding/content/doors.ts) | **Portes du Code**, parcours Bases : 6 chapitres, 22 bab. |
| [coding.service.ts](../api/src/core/coding/coding.service.ts) | Ki tetlanca l'API, yrecopi el contenu fel base (par `slug`). Fih zeda el carte, el déblocage, l'enregistrement des essais, w el suivi. **Ma yab3athch** lel élève la solution Python wala la solution algo wala el TDO mta3 el correction. |
| [rules.ts](../api/src/core/coding/rules.ts) | Chkoun yemchi l ana parcours (niveau + section), w les étoiles. |
| [content/content.spec.ts](../api/src/core/coding/content/content.spec.ts) | Test : kol niveau yetjarreb b el moteur w el traducteur el 7a9i9iyin, w yverifi eli ni Bitou ni les indices ma fihom ligne mel correction. |
| [content/algo.spec.ts](../api/src/core/coding/content/algo.spec.ts) | Tests mta3 el traducteur (TDO, Répéter, procédures @, ∈, Python → algo). |

Fel base (Prisma) : `CodeChapter`, `CodeLevel`, `CodeProgress` (essais, étoiles, akher code, **langage**
(PYTHON / ALGO), **TDO**, a7sen code).

---

## 5. Les zouz jeux

| | Mission Souris | Portes du Code |
|---|---|---|
| **Decor** | Jardin la nuit | Temple b torches |
| **El élève yekteb** | Python + instructions (`avancer()` = `move()`…) | **Algorithme + TDO**, wala Python |
| **Win ynaje7** | El fara fel dar, fromage lkol, fi grilles lkol | Les tests lkol yet3addew |
| **Chkoun** | Parcours lkol (`track` null) | 7asb el parcours |

Kol jeu 3andou carte (`/student/coding/mouse`, `/student/coding/doors`), w les niveaux yet7allou
wa7ed ba3d wa7ed **fi kol jeu wa7dou**. Kol niveau fih : énoncé, indices (wa7ed wa7ed), w ma fama 7atta
algorithme wala correction m3atti. Lel Portes, kol chapitre yekmel b **sandou9** (`scene: 'chest'`).

---

## 6. Chnouwa ysir ki el élève yenzel "Ouvrir la porte"

1. **Ken b l'algorithme** : `transpile(code, tdo)` → Python + `lineMap` + erreurs. Ken fama erreurs
   (TDO, FinSi manquant…), yodhhrou b les lignes, w el bab yo93od msakker.
2. `python.runTests(python, tests)` : **runner.ts** yab3ath message lel worker, w ylanci minuterie
   (10 s, wala 120 s fel awel mara 5ater Pyodide yetcharga).
3. **El worker** (ken mazal) ycharji Pyodide, ba3d `loadPackagesFromImports(code)` (numpy ken lezem).
4. **El harness (Python)** yexécuti el code lkol test fi namespace jdid, b `input()` yetbaddel b
   liste mta3 el entrées mta3 el test, w y9aren.
5. El résultat yarja3 : test b test (`ok`, `got`, `error`).
6. Ken kol chay s7i7 : `DoorScene` y7ell el bab, el fara tet3adda, w ba3d fenêtre "Porte ouverte !".
   Sinon : el cadenas yer3ech, w Bitou y9oul chnouwa ghalet ("Attendu" / "Obtenu").
7. El page tab3ath l'essai lel API : `POST /student/coding/levels/:id/attempts { code, success, language, tdo }`.

---

## 7. Les tests

Kol niveau 3andou tests (fel `data.tests`) :

| Type | Mithel | Kifech yetverifa |
|---|---|---|
| **Appel de fonction** | `{ expr: 'somcarre(312)', expected: '14' }` | `eval(expr) == eval(expected)`. Les réels b tolérance, w numpy yetbaddel l Python. |
| **Texte affiché** | `{ inputs: ['7'], output: ['Impair'] }` | Kol texte lezem yod7or fel `print`, bel tartib. |
| **Nombres affichés** | `{ inputs: ['4000'], numbers: ['1','6','40'] }` | Ken les nombres yetverifiw : `Ecrire(h, " h ", mn)` w `Ecrire(h, mn)` yet3addew zouz. |

`hidden: true` = **test caché** : el élève ychouf ken yet3adda wala le, bla les valeurs.

---

## 8. Boucle infinie

`TantQue Vrai` bla sortie tblokki Python. Fel page ma ysir chay, 5ater Python fel worker. Ama
`runner.ts` 3andou minuterie : ba3d 10 s ya3mel `worker.terminate()` w Bitou y9oul eli fama boucle
ma toufach. El exécution eli ba3dha ta3mel worker jdid.

---

## 9. Les étoiles w el déblocage (fel API)

- **Portes** : 7asb 3add les essais ("Ouvrir la porte") : ≤ 2 = 3 étoiles, ≤ 5 = 2, sinon 1.
- **Souris** : 7asb 3add les lignes de code. `stars: [5, 7]` ya3ni ≤ 5 lignes = 3 étoiles, ≤ 7 = 2, sinon 1.
- Nkhalliw dima **a7sen** natija. Kol niveau yet7al ki eli 9balou fi nafs el jeu yet3adda.
- **Parcours** (`trackOf`) : Bac/4ème Info → Bac Info · Bac Eco → Bac Eco · Bac Sc/Math/Tech,
  3ème Sc, 2ème Info → Bases · 3ème Info → 3ème SI.

**Limite :** el navigateur houwa eli y9oul `success: true`. Élève ya3ref el informatique barcha ynajem
yab3ath requête b yeddou. El prof ychouf **el code eli tba3ath** (w el TDO) fel suivi.

---

## 10. Kifech tzid niveau

1. Zid niveau fel [content/mouse.ts](../api/src/core/coding/content/mouse.ts) wala
   [content/doors.ts](../api/src/core/coding/content/doors.ts) :
   - `slug` : ma tbaddlouch ba3d (el progression mta3 les élèves marbouta bih).
   - Souris : `data: { worlds: [{ map: [...] }], stars: [3, 4] }`
   - Porte : `data: { scene, tests, algo: { starter, solution, tdo } }`
   - `hints` : **pistes bark**, mouch el réponse.
2. Lanci `npm test` fel `api/`. El test yverifi :
   - el solution tet3adda w el code de départ la ;
   - el solution algorithmique **m3a el TDO** tetterjem bla erreurs w tet3adda ;
   - ni Bitou ni les indices ma fihom ligne mel solution.
3. 3awed lanci l'API : el contenu yetsynchroniser wa7dou fel base.

---

## 11. Kifech tlanci kol chay

```bash
cd api && npx prisma migrate deploy  # tables + colonnes Coder
npm run start:dev                    # l'API (synchronise el contenu ki tebda)

cd ../frontend && npm run dev        # predev ycopi Pyodide l public/pyodide
```

Ba3d odkhel b compte élève (ex. niveau "Bac", section "Sciences") → menu **Coder**.
El prof w l'admin 3andhom menu **Coder** zeda (suivi des élèves).
