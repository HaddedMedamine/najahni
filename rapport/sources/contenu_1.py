"""Pages de garde, introduction generale et chapitres 1 a 3."""
from pathlib import Path
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Pt, Cm, RGBColor
from docx_kit import field, border_bottom, page_numbering, BLUE

D = Path(__file__).resolve().parent.parent / "diagrammes"
AUTEURS = ["Mohamed Amine Hadded", "Sofien Essghaier", "Jihad Mazrani", "Montassar Tentouch"]

# ---------------------------------------------------------------------------
# Backlog produit : (fonctionnalite, id, user story, priorite, duree, implementee)
# ---------------------------------------------------------------------------
BACKLOG = [
 ("Authentification et gestion des comptes", [
  ("US1.1", "En tant qu'**utilisateur**, je veux m'authentifier avec mon email ou mon numéro de téléphone afin d'accéder à mon espace selon mon rôle.", "Élevée", 2, True),
  ("US1.2", "En tant qu'**utilisateur** connecté, je veux me déconnecter afin de fermer ma session en toute sécurité.", "Moyenne", 1, True),
  ("US1.3", "En tant qu'**utilisateur**, je veux réinitialiser mon mot de passe oublié par email ou WhatsApp afin de retrouver l'accès à mon compte.", "Élevée", 2, True),
  ("US1.4", "En tant qu'**utilisateur**, je veux changer mon mot de passe afin de sécuriser mon compte.", "Moyenne", 1, True),
  ("US1.5", "En tant qu'**administrateur**, je veux créer, modifier, archiver, restaurer et supprimer un élève afin de tenir à jour les inscriptions du centre.", "Élevée", 3, True),
  ("US1.6", "En tant qu'**administrateur**, je veux gérer les comptes des enseignants afin d'organiser l'équipe pédagogique.", "Élevée", 2, True),
  ("US1.7", "En tant qu'**administrateur**, je veux gérer les parents et les lier à leurs enfants afin qu'ils suivent leur scolarité.", "Élevée", 2, True),
  ("US1.8", "En tant qu'**administrateur**, je veux générer un mot de passe temporaire pour un compte afin de débloquer un utilisateur.", "Moyenne", 1, True),
  ("US1.9", "En tant qu'**administrateur**, je veux que les actions sensibles soient journalisées afin de pouvoir les retracer.", "Moyenne", 1, True),
 ]),
 ("Groupes, salles et planning", [
  ("US2.1", "En tant qu'**administrateur**, je veux créer et modifier un groupe (niveau, section, matière, séances par série, tarif, capacité) afin d'organiser les cours.", "Élevée", 2, True),
  ("US2.2", "En tant qu'**administrateur**, je veux inscrire et retirer des élèves d'un groupe en respectant sa capacité afin d'éviter les sureffectifs.", "Élevée", 2, True),
  ("US2.3", "En tant qu'**administrateur**, je veux archiver, restaurer ou supprimer un groupe afin de garder l'historique des groupes terminés.", "Moyenne", 1, True),
  ("US2.4", "En tant qu'**administrateur**, je veux gérer les salles et leur capacité afin de les réserver aux séances.", "Moyenne", 1, True),
  ("US2.5", "En tant qu'**enseignant** ou **administrateur**, je veux planifier une séance, ou une série hebdomadaire, afin de construire le planning.", "Élevée", 3, True),
  ("US2.6", "En tant qu'**enseignant** ou **administrateur**, je veux déplacer une séance par glisser-déposer avec détection des conflits afin d'adapter le planning sans erreur.", "Élevée", 3, True),
  ("US2.7", "En tant qu'**administrateur**, je veux annuler ou supprimer une séance, ou la suite de sa série, afin de corriger le planning.", "Moyenne", 1, True),
  ("US2.8", "En tant qu'**enseignant**, je veux consulter mes groupes et leurs élèves afin de préparer mes séances.", "Moyenne", 1, True),
 ]),
 ("Séances, présences et notifications", [
  ("US3.1", "En tant qu'**enseignant**, je veux démarrer une séance afin d'ouvrir la feuille d'appel.", "Élevée", 2, True),
  ("US3.2", "En tant qu'**enseignant**, je veux faire l'appel et le corriger afin d'enregistrer les présences.", "Élevée", 2, True),
  ("US3.3", "En tant qu'**enseignant**, je veux saisir le contenu traité et les devoirs afin de garder la trace de la séance.", "Moyenne", 1, True),
  ("US3.4", "En tant qu'**enseignant**, je veux terminer la séance afin de valider les présences et faire avancer les séries.", "Élevée", 2, True),
  ("US3.5", "En tant que **parent**, je veux recevoir une alerte WhatsApp quand mon enfant est absent afin de réagir rapidement.", "Élevée", 3, True),
  ("US3.6", "En tant qu'**administrateur**, je veux connecter le WhatsApp du centre par QR code afin d'envoyer les notifications.", "Élevée", 2, True),
  ("US3.7", "En tant qu'**administrateur**, je veux suivre, renvoyer ou annuler les messages afin de contrôler les envois.", "Moyenne", 2, True),
  ("US3.8", "En tant qu'**élève** ou **parent**, je veux consulter le planning et les présences afin de suivre les cours.", "Moyenne", 2, True),
  ("US3.9", "En tant qu'**enseignant**, je veux organiser une séance en ligne avec un lien de réunion afin d'assurer un cours à distance.", "Moyenne", 1, False),
 ]),
 ("Paiements et suivi parent", [
  ("US4.1", "En tant qu'**enseignant** ou **administrateur**, je veux consulter l'état des paiements d'un groupe afin de repérer les séries à payer.", "Élevée", 2, True),
  ("US4.2", "En tant qu'**enseignant** ou **administrateur**, je veux enregistrer le paiement d'une série afin de tenir la caisse à jour.", "Élevée", 2, True),
  ("US4.3", "En tant qu'**enseignant** ou **administrateur**, je veux annuler le dernier paiement afin de corriger une erreur de saisie.", "Moyenne", 1, True),
  ("US4.4", "En tant qu'**enseignant**, je veux consulter la feuille de présence et de paiement par mois afin de vérifier les séances payées.", "Moyenne", 2, True),
  ("US4.5", "En tant qu'**administrateur** ou **enseignant**, je veux consulter les revenus du mois et des douze derniers mois afin de suivre l'activité.", "Moyenne", 2, True),
  ("US4.6", "En tant que **parent** ou **élève**, je veux recevoir un rappel de paiement la veille de la séance qui termine la série afin de payer à temps.", "Élevée", 3, True),
  ("US4.7", "En tant que **parent**, je veux suivre mon enfant (groupes, séances, présences, paiements) afin de connaître sa situation.", "Élevée", 3, True),
  ("US4.8", "En tant qu'**élève**, je veux consulter mes paiements afin de connaître ma situation financière.", "Moyenne", 1, False),
 ]),
 ("Contenus pédagogiques et correction par IA", [
  ("US5.1", "En tant qu'**enseignant**, je veux publier un exercice ou un document (PDF, image, Word) pour mes groupes afin de le partager avec mes élèves.", "Élevée", 2, True),
  ("US5.2", "En tant qu'**élève**, je veux consulter et télécharger les exercices de mes groupes afin de travailler.", "Élevée", 1, True),
  ("US5.3", "En tant qu'**enseignant**, je veux publier une vidéo de cours afin que mes élèves revoient les explications.", "Moyenne", 2, False),
  ("US5.4", "En tant qu'**enseignant**, je veux demander une période de révision afin d'organiser une semaine spéciale.", "Moyenne", 2, False),
  ("US5.5", "En tant qu'**administrateur**, je veux accepter ou refuser une demande de période de révision afin de contrôler le planning du centre.", "Moyenne", 2, False),
  ("US5.6", "En tant qu'**enseignant**, je veux planifier des séances de révision dans un planning séparé afin de ne pas perturber le planning normal.", "Moyenne", 2, False),
  ("US5.7", "En tant qu'**enseignant**, je veux créer des questions avec un barème et une réponse modèle afin de préparer la correction.", "Élevée", 3, False),
  ("US5.8", "En tant qu'**élève**, je veux réaliser et soumettre un exercice afin d'être évalué.", "Élevée", 3, False),
  ("US5.9", "En tant que **système**, je veux corriger automatiquement les QCM et proposer une note par IA pour les autres questions afin d'accélérer la correction.", "Élevée", 4, False),
  ("US5.10", "En tant qu'**enseignant**, je veux accepter, modifier ou rejeter la note proposée par l'IA afin de garder le contrôle de l'évaluation.", "Élevée", 2, False),
 ]),
 ("Coder, agent IA et pilotage", [
  ("US6.1", "En tant qu'**élève**, je veux consulter la carte des missions de mon parcours afin de choisir la mission suivante.", "Élevée", 2, True),
  ("US6.2", "En tant qu'**élève**, je veux résoudre une mission en Python ou en algorithme, exécutée dans le navigateur, afin d'apprendre en jouant.", "Élevée", 5, True),
  ("US6.3", "En tant qu'**élève**, je veux gagner des étoiles et débloquer la mission suivante afin de mesurer ma progression.", "Moyenne", 2, True),
  ("US6.4", "En tant qu'**enseignant** ou **administrateur**, je veux suivre la progression Coder des élèves afin d'identifier les difficultés.", "Moyenne", 2, True),
  ("US6.5", "En tant que **contact WhatsApp**, je veux poser une question au centre et recevoir une réponse automatique afin d'être informé à toute heure.", "Moyenne", 3, True),
  ("US6.6", "En tant que **contact WhatsApp**, je veux demander à être rappelé afin d'obtenir une réponse de l'équipe.", "Moyenne", 1, True),
  ("US6.7", "En tant que **contact WhatsApp**, je veux commander le livre du centre afin de le recevoir.", "Faible", 1, True),
  ("US6.8", "En tant qu'**administrateur**, je veux traiter les rappels et les commandes laissés par l'agent afin d'y donner suite.", "Moyenne", 2, True),
  ("US6.9", "En tant qu'**administrateur**, je veux consulter un tableau de bord afin d'avoir une vue d'ensemble du centre.", "Moyenne", 2, True),
  ("US6.10", "En tant qu'**utilisateur**, je veux une interface en français ou en arabe et un mode sombre afin de l'utiliser confortablement.", "Moyenne", 2, True),
 ]),
]


def sprint_backlog(r, idx, caption):
    feat, items = BACKLOG[idx]
    rows = [(i, s, "Haute" if p == "Élevée" else p, "Terminé" if done else "En cours") for i, s, p, _, done in items]
    r.table(caption, ["ID", "User Story", "Priorité", "Statut"], rows, [1.6, 10.4, 2, 2])


# ---------------------------------------------------------------------------
def front(r):
    doc = r.doc
    # ----- page de garde -----
    for t in ["République Tunisienne", "Ministère de l'Enseignement Supérieur et de la Recherche Scientifique",
              "École Supérieure Privée d'Ingénierie et de Technologie", "TEK-UP"]:
        r.p(t, bold=True, align="center", size=12, after=0)
    r.p("")
    r.p("[Logo TEK-UP]", italic=True, align="center", size=10, color=RGBColor(0x90, 0x90, 0x90))
    r.p("")
    r.p("RAPPORT DE PROJET DE FIN D'ANNÉE (PFA)", bold=True, align="center", size=18, after=4)
    r.p("Spécialité : Génie Logiciel", bold=True, align="center", size=13, after=18)
    r.p("Réalisé par", italic=True, align="center", size=11, after=2)
    for a in AUTEURS:
        r.p(a, bold=True, align="center", size=13, after=0)
    r.p("")
    t = r.p("Najahni : plateforme de gestion d'un centre d'étude privé avec espace parent, exercices, correction par intelligence artificielle et apprentissage ludique de la programmation",
            bold=True, align="center", size=17, before=12, after=12, color=BLUE)
    border_bottom(t, "1F3A5F", 18, top=True)
    r.p("")
    tb = doc.add_table(rows=1, cols=2)
    tb.rows[0].cells[0].text = "Encadrant académique :"
    tb.rows[0].cells[1].text = "M. Oussama MANSOURI"
    tb.rows[0].cells[1].paragraphs[0].runs[0].bold = True
    for _ in range(5):
        r.p("")
    r.p("Année universitaire 2026 – 2027", align="center", size=12)

    # ----- signature -----
    r.new_section("", fmt="lowerRoman", start=1)
    for _ in range(3):
        r.p("")
    r.p("J'autorise les étudiants à faire le dépôt de leur rapport de projet de fin d'année en vue d'une soutenance.", align="left")
    r.p("")
    r.p("Encadrant académique, M. Oussama MANSOURI", bold=True, align="left")
    r.p("Signature", align="left")

    # ----- resume / abstract -----
    r.new_section("")
    r.title("Résumé")
    r.p("Ce projet de fin d'année, réalisé par une équipe de quatre étudiants en Génie Logiciel à TEK-UP sur une durée de trois mois, "
        "porte sur la conception et le développement de **Najahni**, une plateforme web de gestion d'un centre d'étude privé. "
        "La plateforme réunit quatre espaces (administrateur, enseignant, élève et parent) et couvre la gestion des élèves, des groupes, "
        "des salles et du planning avec détection des conflits, la conduite des séances et de l'appel, le suivi des paiements par séries "
        "de présences et les revenus du centre. Des notifications WhatsApp automatiques préviennent les parents des absences et des "
        "paiements à venir. La plateforme intègre aussi un espace d'exercices avec correction assistée par intelligence artificielle "
        "validée par l'enseignant, un module ludique « Coder » qui fait exécuter le code Python des élèves directement dans le navigateur, "
        "et un agent conversationnel WhatsApp qui répond aux familles. La solution repose sur un frontend React, une API NestJS "
        "organisée par acteur, une base PostgreSQL gérée par Prisma et une authentification JWT avec rotation des jetons.")
    r.p("**Mots clés :** gestion de centre d'étude, React, NestJS, PostgreSQL, Prisma, WhatsApp, intelligence artificielle, Pyodide, Scrum, UML.")
    r.title("Abstract")
    r.p("This end-of-year project, carried out by a team of four Software Engineering students at TEK-UP over three months, focuses on "
        "the design and development of **Najahni**, a web platform for managing a private tutoring centre. The platform offers four spaces "
        "(administrator, teacher, student and parent) and covers students, groups, rooms and scheduling with conflict detection, session "
        "and attendance management, payment tracking based on attendance series, and the centre's revenue. Automatic WhatsApp "
        "notifications inform parents about absences and upcoming payments. The platform also includes an exercise space with "
        "AI-assisted grading validated by the teacher, a game-based « Coder » module that runs students' Python code directly in the "
        "browser, and a WhatsApp conversational agent that answers families. The solution relies on a React frontend, a NestJS API "
        "organised by actor, a PostgreSQL database managed with Prisma and JWT authentication with token rotation.")
    r.p("**Keywords:** tutoring centre management, React, NestJS, PostgreSQL, Prisma, WhatsApp, artificial intelligence, Pyodide, Scrum, UML.")

    # ----- dedicace -----
    r.new_section("")
    r.title("Dédicace")
    r.p("À nos chers parents, pour leurs sacrifices, leur soutien et leurs encouragements tout au long de nos études. Que ce travail "
        "soit le fruit de leurs efforts et l'expression de notre profonde reconnaissance.")
    r.p("À nos frères et sœurs, pour leur présence et leurs encouragements.")
    r.p("À nos amis et à tous ceux qui nous ont soutenus pendant ce projet.")
    r.p("")
    r.p(", ".join(AUTEURS[:-1]) + " et " + AUTEURS[-1], italic=True, align="right")

    # ----- remerciements -----
    r.new_section("")
    r.title("Remerciements")
    r.p("Nous tenons à exprimer notre profonde gratitude à notre encadrant académique, **M. Oussama MANSOURI**, pour la qualité de "
        "son encadrement, sa disponibilité, ses conseils et la rigueur avec laquelle il a suivi l'avancement de ce projet.")
    r.p("Nous remercions également l'ensemble du corps enseignant de l'École Supérieure Privée d'Ingénierie et de Technologie TEK-UP "
        "pour la formation dont nous avons bénéficié.")
    r.p("Enfin, nous adressons nos remerciements aux membres du jury pour l'intérêt qu'ils porteront à ce travail, en espérant qu'ils "
        "y trouveront les qualités de clarté et de rigueur qu'ils attendent.")

    # ----- tables -----
    r.new_section("")
    r.title("Table des matières")
    field(r.doc.add_paragraph(), 'TOC \\o "1-3" \\h \\z \\u', "Clic droit puis « Mettre à jour les champs » pour afficher la table des matières.")
    r.new_section("")
    r.title("Table des figures")
    field(r.doc.add_paragraph(), 'TOC \\h \\z \\t "Légende figure,1"', "Mettre à jour le champ pour afficher la table des figures.")
    r.new_section("")
    r.title("Liste des tableaux")
    field(r.doc.add_paragraph(), 'TOC \\h \\z \\t "Légende tableau,1"', "Mettre à jour le champ pour afficher la liste des tableaux.")
    r.new_section("")
    r.title("Liste des abréviations")
    abbr = [("API", "Application Programming Interface"), ("CRUD", "Create, Read, Update, Delete"), ("DTO", "Data Transfer Object"),
            ("HTTP(S)", "HyperText Transfer Protocol (Secure)"), ("IA", "Intelligence Artificielle"), ("JSON", "JavaScript Object Notation"),
            ("JWT", "JSON Web Token"), ("LLM", "Large Language Model"), ("ORM", "Object Relational Mapping"), ("PFA", "Projet de Fin d'Année"),
            ("QCM", "Questionnaire à Choix Multiples"), ("REST", "Representational State Transfer"), ("RTL", "Right To Left"),
            ("SMTP", "Simple Mail Transfer Protocol"), ("SPA", "Single Page Application"), ("SQL", "Structured Query Language"),
            ("TDO", "Tableau de Déclaration des Objets"), ("TND", "Dinar Tunisien"), ("UML", "Unified Modeling Language"),
            ("UUID", "Universally Unique Identifier")]
    for a, b in abbr:
        para = r.p(f"**{a}** = {b}", align="left", after=2)
        para.paragraph_format.tab_stops.add_tab_stop(Cm(3))


# ---------------------------------------------------------------------------
def intro(r):
    r.unnumbered("Introduction générale", header="Introduction générale")
    page_numbering(r.doc.sections[-1], "decimal", 1)
    r.p("En Tunisie, les centres d'étude privés occupent une place importante dans l'accompagnement scolaire des élèves, en particulier "
        "pour les classes de deuxième, de troisième année et du baccalauréat. Leur fonctionnement quotidien repose sur de nombreuses "
        "tâches répétitives : inscrire les élèves, composer les groupes, construire le planning des salles et des enseignants, faire "
        "l'appel, encaisser les paiements, prévenir les parents et partager les exercices. Lorsque ces tâches sont menées à la main, "
        "sur des cahiers, des tableurs ou des conversations WhatsApp dispersées, elles deviennent sources d'erreurs, d'oublis et de "
        "pertes de temps.")
    r.p("C'est dans ce contexte que s'inscrit notre projet de fin d'année, réalisé dans le cadre de la formation en Génie Logiciel à "
        "l'École Supérieure Privée d'Ingénierie et de Technologie TEK-UP. Son objectif est la conception et le développement de "
        "**Najahni**, une plateforme web qui centralise la gestion d'un centre d'étude privé et offre un espace dédié à chacun de ses "
        "acteurs : l'administrateur, l'enseignant, l'élève et le parent.")
    r.p("La solution couvre l'ensemble du cycle de vie d'un cours. L'administrateur gère les comptes, les groupes et les salles. "
        "L'enseignant planifie ses séances, fait l'appel et suit les paiements de ses groupes. Les parents sont automatiquement prévenus "
        "par WhatsApp des absences et des paiements à venir, et peuvent suivre leurs enfants en ligne. La plateforme propose également "
        "des exercices corrigés avec l'aide de l'intelligence artificielle sous le contrôle de l'enseignant, un module ludique pour "
        "apprendre l'algorithmique et Python, et un agent conversationnel qui répond aux questions des familles sur WhatsApp.")
    r.p("Sur le plan technique, le frontend est développé avec React et TypeScript, et le backend avec NestJS selon une organisation "
        "par acteur. Les données sont conservées dans PostgreSQL au moyen de Prisma ORM. Le projet a été conduit selon la démarche "
        "agile Scrum, en six sprints de deux semaines regroupés en trois releases.")
    r.p("Ce rapport est organisé comme suit. Le **chapitre 1** présente le cadre général du projet, l'étude de l'existant et la "
        "méthodologie adoptée. Le **chapitre 2** détaille l'analyse et la spécification des besoins ainsi que la planification des "
        "releases. Le **chapitre 3** décrit l'environnement de travail, l'architecture et les technologies retenues. Les **chapitres 4, "
        "5 et 6** présentent les trois releases du projet : pour chaque sprint, nous détaillons le backlog, la conception, les cas "
        "d'utilisation et leurs scénarios, puis les tests. Enfin, une conclusion générale dresse le bilan du travail et présente les "
        "perspectives d'évolution.")


# ---------------------------------------------------------------------------
def chapitre1(r):
    r.chapter(1, "Cadre général du projet", ["Introduction", "1.1 Contexte général", "1.2 Présentation du projet",
                                              "1.3 Présentation de la méthodologie de travail", "Conclusion"])
    r.h(2, "Introduction")
    r.p("Dans ce chapitre, nous présentons le contexte général de notre projet de fin d'année. Nous décrivons ensuite le projet, "
        "l'étude de l'existant, la problématique et la solution proposée. Nous terminons par le formalisme de modélisation et la "
        "méthodologie de développement adoptés.")
    r.h(2, "1.1 Contexte général")
    r.p("Ce projet de fin d'année (PFA) s'inscrit dans le cadre de la formation d'ingénieur en informatique, spécialité **Génie "
        "Logiciel**, à l'École Supérieure Privée d'Ingénierie et de Technologie TEK-UP, au titre de l'année universitaire 2026-2027. "
        "Il a été réalisé par une équipe de quatre étudiants, sous l'encadrement académique de M. Oussama MANSOURI, sur une durée de "
        "trois mois. Le projet a été mené de manière autonome, sans organisme d'accueil : l'équipe a pris en charge l'ensemble du cycle, "
        "de l'analyse des besoins jusqu'aux tests.")
    r.h(2, "1.2 Présentation du projet")
    r.h(3, "1.2.1 Cadre général")
    r.p("Les centres d'étude privés accueillent chaque semaine des dizaines, voire des centaines d'élèves répartis en petits groupes "
        "selon leur niveau, leur section et la matière étudiée. Chaque groupe suit un nombre fixe de séances par mois, payées par "
        "séries. La réussite d'un tel centre dépend autant de la qualité pédagogique que de la rigueur de son organisation : un "
        "planning sans conflit, un appel fiable, des paiements suivis et des parents bien informés.")
    r.h(3, "1.2.2 Description du projet")
    r.p("Najahni (« je réussis ») est une application web complète de gestion d'un centre d'étude privé. Ses principales "
        "réalisations sont les suivantes :")
    r.bullets([
        "**Quatre espaces sécurisés** (administrateur, enseignant, élève, parent) avec une authentification par jetons et un contrôle d'accès par rôle.",
        "**Gestion de l'organisation du centre** : élèves, enseignants, parents, groupes, salles et planning hebdomadaire avec glisser-déposer et détection automatique des conflits.",
        "**Conduite des séances** : démarrage, appel, notes de séance et clôture, avec un suivi des présences par élève.",
        "**Paiements par séries de présences** : chaque élève règle une série de N séances ; la plateforme calcule les séries dues, enregistre les paiements et présente les revenus du centre.",
        "**Notifications WhatsApp automatiques** aux parents pour les absences et les rappels de paiement, avec une file d'attente qui respecte les heures de nuit.",
        "**Espace exercices et correction par IA** : publication d'exercices, de documents et de vidéos, soumission des réponses par l'élève, correction proposée par l'intelligence artificielle et validée par l'enseignant, et gestion des périodes de révision.",
        "**Module « Coder »** : trois jeux pour apprendre l'algorithmique et Python, dont le code est exécuté directement dans le navigateur de l'élève.",
        "**Agent IA conversationnel WhatsApp** qui répond aux questions des familles à partir de la fiche du centre et enregistre les demandes de rappel et les commandes.",
    ])
    r.h(3, "1.2.3 Étude de l'existant")
    r.p("Avant de concevoir la solution, nous avons analysé la manière dont un centre d'étude privé fonctionne habituellement. "
        "La gestion repose le plus souvent sur un ensemble d'outils séparés :")
    r.bullets([
        "des **cahiers** ou des **feuilles imprimées** pour l'appel et les paiements ;",
        "des **tableurs** pour la liste des élèves et le calcul des montants dus ;",
        "des **conversations WhatsApp** individuelles ou de groupe pour prévenir les parents, envoyer les exercices et répondre aux questions ;",
        "un **tableau mural** ou un calendrier partagé pour le planning des salles.",
    ])
    r.p("Cette organisation présente plusieurs limites :")
    r.bullets([
        "Les informations sont **dispersées** et dupliquées, ce qui rend difficile une vision globale du centre.",
        "Le **planning** est construit sans contrôle automatique : une salle ou un enseignant peuvent être réservés deux fois.",
        "Le calcul des **séries à payer** dépend des présences réelles de chaque élève et devient vite source d'erreurs.",
        "Les **parents** ne sont prévenus des absences que si un membre de l'équipe y pense, souvent avec retard.",
        "Les questions répétitives des familles (tarifs, horaires, inscriptions) mobilisent l'équipe en dehors des heures de travail.",
        "La **correction des exercices** reste entièrement manuelle et les élèves reçoivent peu de retours personnalisés.",
    ])
    r.p("Les logiciels de gestion scolaire génériques existent, mais ils sont conçus pour des écoles et ne prennent pas en compte les "
        "particularités des centres d'étude tunisiens : paiement par séries de séances, groupes par section du baccalauréat, "
        "communication par WhatsApp et interface en français et en arabe.")
    r.h(3, "1.2.4 Problématique")
    r.p("Comment offrir à un centre d'étude privé un outil unique, simple et fiable, qui automatise son organisation quotidienne "
        "(planning, appel, paiements), informe les parents en temps utile par le canal qu'ils utilisent réellement, et enrichit "
        "l'accompagnement pédagogique des élèves, tout en garantissant la sécurité des données de mineurs ?")
    r.h(3, "1.2.5 Solution proposée")
    r.p("Nous proposons Najahni, une plateforme web multi-acteurs. Le planning détecte automatiquement les conflits d'enseignant, de "
        "salle et de groupe. L'appel fait avancer la série de chaque élève et signale les séries à payer. Une file de notifications "
        "WhatsApp prévient les parents des absences et des paiements, sans jamais envoyer de message la nuit. L'espace parent donne "
        "accès en lecture au suivi de chaque enfant. Sur le plan pédagogique, la correction des exercices est assistée par une "
        "intelligence artificielle dont la proposition est toujours validée par l'enseignant, et le module Coder rend l'apprentissage "
        "de la programmation plus motivant. L'interface est responsive, disponible en français et en arabe (sens de lecture de droite "
        "à gauche) et propose un mode sombre.")
    r.h(2, "1.3 Présentation de la méthodologie de travail")
    r.p("Dans ce volet, nous présentons le formalisme de modélisation adopté pour la conception, puis la méthodologie de "
        "développement choisie pour la réalisation.")
    r.h(3, "1.3.1 Formalisme de modélisation")
    r.p("Nous avons utilisé le langage **UML** (Unified Modeling Language), langage standard de modélisation graphique orienté "
        "objet [1]. La représentation graphique complète la description textuelle et facilite la compréhension de la structure et du "
        "comportement du système. Les diagrammes retenus sont :")
    r.bullets([
        "le **diagramme de cas d'utilisation**, qui représente les utilisations possibles du système par les différents acteurs ;",
        "le **diagramme de classes**, qui regroupe les entités du système et les associations entre elles ;",
        "le **diagramme de séquence**, qui détaille les scénarios d'utilisation et les échanges entre les acteurs et les composants dans le temps.",
    ])
    r.p("Tous les diagrammes ont été réalisés avec draw.io et sont fournis avec le rapport dans un format modifiable.")
    r.h(3, "1.3.2 Méthodologie adoptée")
    r.p("Dès qu'un projet gagne en complexité, l'adoption d'une méthodologie devient nécessaire pour garantir la qualité du résultat "
        "et maîtriser les délais. Parmi les méthodes agiles (XP, Kanban, FDD, Scrum), nous avons choisi **Scrum**, un cadre de travail "
        "itératif et incrémental organisé autour d'une équipe, d'événements et d'artefacts clairement définis [2]. Ce choix est adapté "
        "à notre contexte pour plusieurs raisons :")
    r.bullets([
        "le projet comporte de nombreux modules qui peuvent être livrés progressivement ;",
        "les besoins ont évolué pendant le projet, par exemple l'ajout de l'agent conversationnel WhatsApp et du module Coder ;",
        "le travail d'une équipe de quatre personnes demande une visibilité régulière sur l'avancement de chacun.",
    ])
    r.p("Le projet, d'une durée de trois mois, a été découpé en **six sprints de deux semaines** regroupés en **trois releases**. "
        "Chaque sprint commence par une planification qui sélectionne les user stories prioritaires du backlog produit et se termine "
        "par une revue de sprint, où les fonctionnalités terminées sont présentées à l'encadrant, puis par une rétrospective qui permet "
        "d'améliorer l'organisation du sprint suivant.")
    r.h(2, "Conclusion")
    r.p("Dans ce chapitre, nous avons situé le projet dans son contexte, présenté l'étude de l'existant, la problématique et la "
        "solution proposée, puis la méthodologie suivie. Le chapitre suivant est consacré à l'analyse et à la spécification des besoins.")


# ---------------------------------------------------------------------------
def chapitre2(r):
    r.chapter(2, "Analyse et spécification des besoins", ["Introduction", "2.1 Spécification des besoins",
              "2.2 Diagramme de cas d'utilisation global", "2.3 Diagramme de classes global", "2.4 Structure et découpage du projet", "Conclusion"])
    r.h(2, "Introduction")
    r.p("Ce chapitre est consacré à l'analyse et à la spécification des besoins de Najahni. Nous identifions d'abord les acteurs du "
        "système ainsi que leurs besoins fonctionnels et non fonctionnels. Nous présentons ensuite les diagrammes de cas d'utilisation "
        "et de classes globaux, avant d'aborder le backlog produit et la planification des releases.")
    r.h(2, "2.1 Spécification des besoins")
    r.h(3, "2.1.1 Identification des acteurs")
    r.p("Un acteur représente toute entité externe qui interagit avec le système. Nous distinguons quatre acteurs principaux :")
    r.bullets([
        "**Administrateur** : il gère l'ensemble du centre, c'est-à-dire les comptes, les groupes, les salles, le planning, les paiements, la connexion WhatsApp et les demandes de période de révision. Dans un centre où il enseigne lui-même, il peut activer son propre espace enseignant.",
        "**Enseignant** : il planifie et conduit ses séances, fait l'appel, suit les paiements de ses groupes, publie des exercices, des documents et des vidéos, et valide les corrections proposées par l'IA.",
        "**Élève** : il consulte son planning et ses présences, réalise les exercices, reçoit ses corrections et apprend la programmation avec le module Coder.",
        "**Parent** : il suit un ou plusieurs enfants (séances, présences, paiements) et reçoit les notifications WhatsApp.",
    ])
    r.p("Le système interagit aussi avec des acteurs secondaires :")
    r.bullets([
        "le **Système IA pour correction**, fournisseur de modèle de langage qui propose une note et un commentaire ;",
        "l'**Agent de notification**, composant qui envoie les messages WhatsApp depuis le numéro du centre ;",
        "l'**Agent IA conversationnel** (n8n), qui répond aux messages reçus sur WhatsApp ;",
        "le **Contact WhatsApp**, toute personne (parent, visiteur) qui écrit au centre sans être forcément inscrite.",
    ])
    r.h(3, "2.1.2 Spécification des besoins fonctionnels par acteur")
    r.p("Les besoins fonctionnels sont décrits ci-dessous du point de vue de chaque acteur.")
    r.h(4, "L'Administrateur")
    r.bullets([
        "**Gestion des comptes** : créer, modifier, archiver, restaurer et supprimer les élèves, les enseignants et les parents ; lier un parent à ses enfants ; générer un mot de passe temporaire.",
        "**Organisation** : gérer les groupes et leurs inscriptions dans la limite de leur capacité, gérer les salles, construire le planning.",
        "**Finances** : consulter l'état des paiements de tous les groupes, enregistrer ou annuler un paiement, consulter les revenus mensuels.",
        "**Communication** : connecter le WhatsApp du centre, suivre les messages envoyés, traiter les rappels et commandes laissés par l'agent IA.",
        "**Pilotage** : consulter le tableau de bord, suivre la progression Coder, accepter ou refuser les demandes de période de révision.",
    ])
    r.h(4, "L'Enseignant")
    r.bullets([
        "**Planning et séances** : planifier ses séances, démarrer une séance, faire l'appel, saisir le contenu traité et les devoirs, terminer la séance.",
        "**Paiements** : suivre l'état des séries de ses élèves, enregistrer les paiements, consulter sa feuille de présence et ses revenus.",
        "**Contenus** : publier des exercices, des documents et des vidéos ; créer des questions avec barème ; valider les corrections IA.",
        "**Révisions** : demander une période de révision et planifier ses séances de révision.",
        "**Suivi** : consulter ses groupes et la progression Coder de ses élèves.",
    ])
    r.h(4, "L'Élève")
    r.bullets([
        "consulter son planning, ses présences et ses paiements ;",
        "consulter et télécharger les exercices et les vidéos, réaliser et soumettre un exercice, consulter sa correction ;",
        "jouer aux jeux Coder et suivre ses étoiles.",
    ])
    r.h(4, "Le Parent")
    r.bullets([
        "suivre chacun de ses enfants : groupes, séances à venir, présences et paiements ;",
        "recevoir les alertes d'absence et les rappels de paiement sur WhatsApp.",
    ])
    r.h(3, "2.1.3 Les besoins non fonctionnels")
    r.bullets([
        "**Sécurité et protection des données** : les mots de passe sont hachés avec Argon2id, l'accès repose sur des jetons JWT de courte durée renouvelés par des refresh tokens à usage unique, chaque route vérifie le rôle de l'utilisateur et le nombre de tentatives de connexion est limité. Les élèves étant mineurs, aucune donnée nominative n'est transmise au service d'IA.",
        "**Fiabilité** : les opérations sensibles (inscription dans un groupe, paiement) sont protégées contre les doubles clics et les requêtes simultanées par des transactions et des contraintes d'unicité.",
        "**Performance** : les listes sont paginées et les requêtes fréquentes s'appuient sur des index (planning par groupe, enseignant ou salle et par date).",
        "**Ergonomie** : l'interface est responsive, disponible en français et en arabe avec le sens de lecture de droite à gauche, et propose un mode sombre.",
        "**Maintenabilité** : le code est typé de bout en bout avec TypeScript, organisé par acteur, documenté par Swagger et couvert par des tests unitaires.",
        "**Évolutivité** : le fournisseur d'IA et le canal de notification sont isolés derrière des services dédiés afin de pouvoir être remplacés.",
    ])
    r.h(2, "2.2 Diagramme de cas d'utilisation global")
    r.p("Le diagramme de cas d'utilisation global offre une vue d'ensemble des interactions entre les acteurs et le système. Il "
        "délimite le périmètre fonctionnel de la plateforme.")
    r.figure(D / "01_cas_utilisation_global.png", "Diagramme de cas d'utilisation global", 15.5)
    r.p("Les acteurs principaux sont placés à gauche. Chaque cas d'utilisation accessible après connexion inclut le cas « S'authentifier ». "
        "Les cas « Réinitialiser le mot de passe » et ceux du Contact WhatsApp n'en dépendent pas, car ils sont utilisés sans session. "
        "Les trois systèmes externes apparaissent à droite : le système IA participe à la correction des exercices, l'agent de "
        "notification envoie les messages WhatsApp déclenchés par la gestion des séances et des paiements, et l'agent IA "
        "conversationnel répond aux contacts.")
    r.h(2, "2.3 Diagramme de classes global")
    r.p("Le diagramme de classes global présente la structure statique de la plateforme. Il met en évidence les classes User, Student, "
        "Parent, Teacher, Group, Session, Attendance, Installment, Payment, Exercise, Submission, Correction, ReviewPeriod, "
        "CourseVideo, Notification, CodeLevel et CodeProgress, ainsi que leurs associations.")
    r.figure(D / "02_classes_global.png", "Diagramme de classes global", 16)
    r.p("La classe **User** porte l'identité et le rôle de chaque compte ; les profils Student, Parent et Teacher la complètent. Un "
        "élève rejoint un groupe à travers la classe **GroupStudent**, qui conserve la date d'entrée et de sortie et garde ainsi "
        "l'historique. Un groupe se compose de séances, chacune pouvant occuper une salle et donnant lieu à une présence par élève. "
        "Les séries payées sont représentées par **Installment** et réglées par un ou plusieurs **Payment**. Le volet pédagogique relie "
        "les exercices à leurs questions, à leurs affectations, aux soumissions des élèves et à leur correction.")
    r.h(2, "2.4 Structure et découpage du projet")
    r.h(3, "2.4.1 Le backlog du produit global")
    r.p("Le backlog regroupe l'ensemble des fonctionnalités attendues, organisées par ordre de priorité. Chaque élément est décrit "
        "sous forme de user story qui précise l'acteur, l'action souhaitée et la valeur métier associée. La durée est exprimée en "
        "jours de travail de l'équipe.")
    rows = []
    for k, (feat, items) in enumerate(BACKLOG, 1):
        for j, (i, s, p, d, _) in enumerate(items):
            rows.append((str(k) if j == 0 else "", feat if j == 0 else "", i, s, p, f"{d} jour{'s' if d > 1 else ''}"))
    r.table("Backlog du produit global", ["N°", "Fonctionnalité", "ID", "User Story", "Priorité", "Durée"], rows,
            [0.8, 2.8, 1.4, 8, 1.6, 1.6], font=9.5)
    r.h(3, "2.4.2 Planification des releases")
    r.p("Sur la base du backlog, le projet a été découpé en six sprints de deux semaines, regroupés en trois releases. Chaque "
        "sprint cible un ensemble cohérent de fonctionnalités.")
    r.table("Planification des releases", ["Release", "Sprint", "Fonctionnalités du sprint", "Durée"], [
        ("Release 1 : Socle fonctionnel", "Sprint 1", "Authentification et gestion des comptes", "2 semaines"),
        ("", "Sprint 2", "Groupes, salles et planning", "2 semaines"),
        ("Release 2 : Suivi pédagogique et financier", "Sprint 3", "Séances, présences et notifications WhatsApp", "2 semaines"),
        ("", "Sprint 4", "Paiements, revenus et suivi parent", "2 semaines"),
        ("Release 3 : Contenus pédagogiques et intelligence artificielle", "Sprint 5", "Exercices, vidéos, périodes de révision et correction par IA", "2 semaines"),
        ("", "Sprint 6", "Module Coder, agent IA conversationnel et tableau de bord", "2 semaines"),
        ("Clôture", "–", "Tests finaux, corrections et rédaction du rapport", "1 semaine"),
        ("Total", "", "", "13 semaines"),
    ], [4.5, 1.8, 7.5, 2.2])
    r.h(2, "Conclusion")
    r.p("Ce chapitre a défini le périmètre fonctionnel de la plateforme en identifiant les acteurs, leurs besoins fonctionnels et non "
        "fonctionnels, ainsi que les cas d'utilisation et les classes du système. Le backlog produit et le découpage en trois releases "
        "et six sprints donnent une vision claire du plan de développement. Le chapitre suivant présente l'environnement de travail, "
        "l'architecture et les technologies utilisées.")


# ---------------------------------------------------------------------------
def chapitre3(r):
    r.chapter(3, "Environnement de travail", ["Introduction", "3.1 Architecture logicielle", "3.2 Outils et technologies",
                                               "3.3 Environnement de développement", "Conclusion"])
    r.h(2, "Introduction")
    r.p("Ce chapitre présente l'architecture logicielle de Najahni, puis les outils et technologies utilisés pour sa réalisation, et "
        "enfin l'environnement de développement.")
    r.h(2, "3.1 Architecture logicielle")
    r.h(3, "3.1.1 Description de l'architecture monorepo")
    r.p("Le code source est rassemblé dans un dépôt Git unique (monorepo) composé de quatre parties : `api/` pour le backend NestJS "
        "et le schéma Prisma, `frontend/` pour l'application React, `automation/` pour le workflow n8n de l'agent conversationnel et la "
        "fiche du centre, et `docs/` pour la documentation technique. À la racine, le fichier `docker-compose.yml` démarre les services "
        "d'infrastructure.")
    r.figure(D / "04_architecture_monorepo.png", "Organisation du monorepo", 12)
    r.h(3, "3.1.2 Avantages de notre choix")
    r.bullets([
        "**Cohérence** : le frontend et le backend évoluent ensemble ; une modification de l'API et de l'interface se fait dans un même commit.",
        "**Typage partagé** : TypeScript est utilisé des deux côtés, ce qui réduit les erreurs de format entre l'interface et l'API.",
        "**Simplicité** : un seul dépôt à cloner, un seul historique et une organisation identique par acteur dans les deux applications.",
    ])
    r.h(3, "3.1.3 Architecture technique")
    r.p("La plateforme suit une architecture client-serveur en trois niveaux. Le navigateur charge une application monopage (SPA) "
        "React qui dialogue avec l'API REST NestJS en JSON. L'API applique les règles métier et accède à PostgreSQL au moyen de Prisma. "
        "Elle communique aussi avec des services externes : le serveur SMTP pour les emails, WhatsApp pour les notifications, le "
        "service d'IA pour la correction et n8n pour l'agent conversationnel.")
    r.figure(D / "03_architecture_technique.png", "Schéma de l'architecture technique", 16)
    r.p("Le backend est organisé en trois couches :")
    r.bullets([
        "`routes/` : les contrôleurs REST, regroupés par acteur (`admin`, `teacher`, `student`, `parent`), qui déclarent les routes, les rôles autorisés et les DTO validés ;",
        "`actors/` : les services métier propres à chaque acteur (par exemple la conduite des séances de l'enseignant) ;",
        "`core/` : les modules partagés, c'est-à-dire l'authentification, la base de données, les paiements, le planning, les notifications, WhatsApp, le stockage, le module Coder et l'agent.",
    ])
    r.p("Trois gardes globaux sont appliqués à chaque requête, dans cet ordre : la limitation du nombre de requêtes, la vérification "
        "du jeton JWT (sauf pour les routes marquées publiques) et le contrôle du rôle déclaré sur la route. Un filtre global traduit "
        "les erreurs de la base de données en codes HTTP compréhensibles, et un pipe de validation renvoie les erreurs champ par champ "
        "pour qu'elles s'affichent sous les bons champs des formulaires.")
    r.h(2, "3.2 Outils et technologies")
    r.h(3, "3.2.1 Développement frontend")
    r.bullets([
        "**React 18** et **TypeScript**, avec **Vite** comme outil de build et serveur de développement [5].",
        "**Tailwind CSS 4** et des composants de type shadcn/ui (Radix UI) pour l'interface, avec mode sombre.",
        "**TanStack Query** pour les appels à l'API et le cache, **Zustand** pour l'état global (session de l'utilisateur, thème) [7].",
        "**React Hook Form** et **Zod** pour les formulaires et leur validation.",
        "**FullCalendar** pour le planning hebdomadaire avec glisser-déposer [8].",
        "**react-i18next** pour l'interface en français et en arabe (sens de lecture de droite à gauche).",
        "**CodeMirror 6** comme éditeur de code et **Pyodide** pour exécuter Python dans le navigateur grâce à WebAssembly [9].",
    ])
    r.h(3, "3.2.2 Développement backend")
    r.bullets([
        "**NestJS 12** sur Node.js, framework TypeScript modulaire fondé sur l'injection de dépendances [4].",
        "**class-validator** et **class-transformer** pour la validation des données reçues.",
        "**@nestjs/schedule** pour les tâches planifiées (rappels de paiement) et **@nestjs/swagger** pour la documentation de l'API.",
        "**Nodemailer** pour l'envoi d'emails par SMTP et **Baileys** pour la connexion WhatsApp [10].",
    ])
    r.h(3, "3.2.3 Authentification et sécurité")
    r.bullets([
        "**JSON Web Token (JWT)** signé, d'une durée de 15 minutes, pour authentifier chaque requête [11].",
        "**Refresh tokens opaques** de 30 jours, stockés hachés (SHA-256) et renouvelés à chaque utilisation ; la réutilisation d'un jeton déjà utilisé révoque toutes les sessions du compte.",
        "**Argon2id** pour le hachage des mots de passe, conformément aux recommandations de l'OWASP [12].",
        "**@nestjs/throttler** pour limiter les tentatives de connexion à 5 par minute et par compte.",
    ])
    r.h(3, "3.2.4 Base de données et persistance")
    r.bullets([
        "**PostgreSQL 17**, système de gestion de base de données relationnelle [6].",
        "**Prisma ORM 7**, qui génère un client typé à partir du schéma et gère les migrations (dix migrations à ce jour) [3].",
        "Les montants sont stockés en `Decimal(10,3)`, car le dinar tunisien compte 1000 millimes, et jamais en nombre flottant.",
    ])
    r.h(3, "3.2.5 Intelligence artificielle et automatisation")
    r.bullets([
        "**Service de correction IA** : les réponses des élèves sont envoyées, sans nom ni téléphone, à un fournisseur de modèle de langage avec l'énoncé, le barème et la réponse modèle ; la réponse attendue est un JSON contenant la note, le commentaire, les erreurs, les conseils et un niveau de confiance.",
        "**n8n** avec un modèle de langage **Groq** pour l'agent conversationnel WhatsApp [13].",
    ])
    r.h(3, "3.2.6 Outils logiciels et collaboration")
    r.bullets([
        "**Visual Studio Code** comme éditeur de code.",
        "**Git** pour la gestion des versions.",
        "**Docker** et **Docker Compose** pour démarrer PostgreSQL, Redis et MinIO en local [14].",
        "**Swagger** pour documenter et tester l'API (`/api/docs`).",
        "**Vitest** et **Supertest** pour les tests unitaires et d'intégration [15].",
        "**draw.io** pour la réalisation des diagrammes UML.",
    ])
    r.h(2, "3.3 Environnement de développement")
    r.h(3, "3.3.1 Environnement matériel")
    r.p("Le tableau suivant présente les caractéristiques du poste de développement principal utilisé pendant le projet.")
    r.table("Caractéristiques de l'environnement matériel", ["Caractéristique", "Valeur"], [
        ("Processeur", "AMD Ryzen 7 7435HS"), ("Mémoire vive", "16 Go"), ("Système d'exploitation", "Windows 11"),
        ("Environnement d'exécution", "Node.js 24, PostgreSQL 17 (Docker)")], [6, 10])
    r.h(2, "Conclusion")
    r.p("Ce chapitre a présenté l'architecture monorepo et l'architecture technique de Najahni, ainsi que les outils et technologies "
        "utilisés. Les chapitres suivants présentent la réalisation du projet, release par release, en commençant par le socle "
        "fonctionnel.")
