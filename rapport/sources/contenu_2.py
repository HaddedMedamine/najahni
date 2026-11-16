"""Chapitres 4 a 6 (releases), conclusion generale et webographie."""
from contenu_1 import D, sprint_backlog

OK = "À valider"


def tests(r, caption, rows, start):
    r.table(caption, ["ID", "Scénario de test", "Résultat attendu", "Statut"],
            [(f"TEST-{start + i:02d}", s, e, OK) for i, (s, e) in enumerate(rows)], [1.8, 6.2, 6.2, 1.8], font=10)
    return start + len(rows)


# =====================================================================
def chapitre4(r):
    r.chapter(4, "Release 1 : Socle fonctionnel", ["Introduction", "4.1 Sprint 1 : Authentification et gestion des comptes",
              "4.2 Sprint 2 : Groupes, salles et planning", "4.3 Implémentation", "Conclusion"])
    r.h(2, "Introduction")
    r.p("Cette première release construit le socle indispensable à la plateforme. Elle s'articule autour de deux axes :")
    r.bullets(["la mise en place d'un accès sécurisé et de la gestion des comptes des quatre acteurs ;",
               "l'organisation du centre : groupes, salles et planning avec détection des conflits."])
    r.p("À l'issue de cette release, le centre peut enregistrer ses élèves, composer ses groupes et construire un planning fiable.")

    # ---------------- Sprint 1 ----------------
    r.h(2, "4.1 Sprint 1 : Authentification et gestion des comptes")
    r.h(3, "4.1.1 Objectifs et backlog du sprint")
    r.p("Ce sprint a pour objectif de sécuriser l'accès à la plateforme et d'adapter les fonctionnalités disponibles au rôle de "
        "chaque utilisateur. Il couvre également la gestion des comptes par l'administrateur et la récupération d'un mot de passe oublié.")
    sprint_backlog(r, 0, "Backlog du Sprint 1 : Authentification et gestion des comptes")
    r.h(3, "4.1.2 Diagramme de classes du Sprint 1")
    r.figure(D / "11_classes_sprint1.png", "Diagramme de classes du Sprint 1", 15)
    r.p("La classe **User** réunit les informations communes à tous les comptes et le rôle (énumération **Role**). Un compte peut se "
        "connecter avec son email ou son téléphone, ce qui convient aux élèves qui n'ont pas toujours d'adresse email. Les classes "
        "**RefreshToken** et **PasswordReset** ne conservent que l'empreinte (hash) des jetons, jamais le jeton lui-même. La classe "
        "**AuditLog** garde la trace des actions sensibles : connexions, échecs de connexion, réinitialisations, créations et "
        "suppressions.")
    r.h(3, "4.1.3 Flux d'authentification et gestion des accès")
    r.p("À la connexion, l'API vérifie le mot de passe avec Argon2id puis renvoie un jeton d'accès JWT de 15 minutes et un refresh "
        "token de 30 jours. Le frontend joint le jeton d'accès à chaque requête dans l'en-tête `Authorization`. Lorsqu'il expire, "
        "l'intercepteur Axios demande automatiquement de nouveaux jetons ; un verrou partagé entre les onglets du navigateur évite que "
        "deux onglets n'utilisent le même refresh token. Côté serveur, chaque refresh token n'est valable qu'une fois : s'il est "
        "présenté une seconde fois après un délai de grâce de dix secondes, le serveur considère qu'il a été volé et révoque toutes "
        "les sessions du compte.")
    r.h(3, "4.1.4 Raffinement et description des cas d'utilisation")
    r.figure(D / "10_uc_sprint1.png", "Diagramme de cas d'utilisation du Sprint 1", 15.5)
    r.p("Description textuelle du cas d'utilisation « S'authentifier »", bold=True, keep=True)
    r.uc_table("Cas d'utilisation : S'authentifier", {
        "nom": "S'authentifier", "acteurs": "Administrateur, Enseignant, Élève, Parent",
        "pre": "L'utilisateur possède un compte actif.",
        "post": "Une session est ouverte et l'utilisateur accède à l'espace de son rôle.",
        "nominal": ["L'utilisateur saisit son email ou son téléphone et son mot de passe.", "L'API vérifie la limite de tentatives.",
                    "L'API recherche le compte et vérifie le mot de passe.", "L'API met à jour la date de dernière connexion et journalise la connexion.",
                    "L'API génère le jeton d'accès et le refresh token.", "L'utilisateur est redirigé vers son espace."],
        "alt": ["Identifiants invalides ou compte désactivé : message d'erreur générique et journalisation de l'échec.",
                "Plus de 5 tentatives en une minute pour le même compte : la requête est refusée (code 429)."]})
    r.p("Diagramme de séquence du cas d'utilisation « S'authentifier »", bold=True, keep=True)
    r.figure(D / "12_seq_authentification.png", "Diagramme de séquence du cas d'utilisation « S'authentifier »", 15.5)
    r.p("Description textuelle du cas d'utilisation « Réinitialiser le mot de passe oublié »", bold=True, keep=True)
    r.uc_table("Cas d'utilisation : Réinitialiser le mot de passe oublié", {
        "nom": "Réinitialiser le mot de passe oublié", "acteurs": "Enseignant, Élève, Parent",
        "pre": "L'utilisateur possède un compte actif avec un email ou un téléphone.",
        "post": "Le mot de passe est modifié et toutes les sessions ouvertes sont fermées.",
        "nominal": ["L'utilisateur saisit son email ou son téléphone.", "L'API répond immédiatement, sans indiquer si le compte existe.",
                    "L'API crée un lien à usage unique valable une heure et l'envoie par email, sinon par WhatsApp.",
                    "L'utilisateur ouvre le lien et saisit un nouveau mot de passe.",
                    "L'API enregistre le nouveau mot de passe, marque le lien comme utilisé et révoque les sessions."],
        "alt": ["Compte inconnu ou demande déjà faite depuis moins de cinq minutes : aucun message n'est envoyé.",
                "Lien expiré ou déjà utilisé : message « Lien invalide ou expiré »."]})
    r.figure(D / "13_seq_mot_de_passe_oublie.png", "Diagramme de séquence du cas d'utilisation « Réinitialiser le mot de passe oublié »", 15.5)
    r.p("Description textuelle du cas d'utilisation « Gérer les élèves » (création)", bold=True, keep=True)
    r.uc_table("Cas d'utilisation : Créer un élève", {
        "nom": "Créer un élève", "acteurs": "Administrateur",
        "pre": "L'administrateur est authentifié.",
        "post": "Le compte et le profil de l'élève sont créés, liés à ses parents et inscrits dans ses groupes.",
        "nominal": ["L'administrateur saisit l'identité, le niveau, la section, le téléphone du parent et, si besoin, un tarif négocié.",
                    "Le frontend valide le formulaire.", "L'API vérifie que l'email et le téléphone ne sont pas déjà utilisés.",
                    "L'API génère un mot de passe temporaire et crée le compte dans une transaction.",
                    "L'élève est inscrit dans les groupes choisis, dans la limite de leur capacité.",
                    "Le mot de passe temporaire est affiché une seule fois à l'administrateur."],
        "alt": ["Email ou téléphone déjà utilisé : les deux champs sont signalés ensemble (code 409).",
                "Groupe complet ou archivé : la création est annulée et un message explicite est affiché."]})
    r.figure(D / "14_seq_creer_eleve.png", "Diagramme de séquence du cas d'utilisation « Créer un élève »", 15.5)
    r.h(3, "4.1.5 Tests et validation du sprint")
    r.p("La validation du Sprint 1 repose sur la campagne de tests fonctionnels résumée dans le tableau suivant.")
    n = tests(r, "Scénarios de test du Sprint 1", [
        ("Connexion avec un email et un mot de passe valides.", "Session ouverte et redirection vers l'espace du rôle."),
        ("Connexion avec un numéro de téléphone.", "Session ouverte : le téléphone est accepté comme identifiant."),
        ("Connexion avec un mot de passe erroné.", "Message « Identifiants invalides » et échec journalisé."),
        ("Six tentatives en une minute sur le même compte.", "La sixième tentative est refusée (429)."),
        ("Connexion d'un élève archivé.", "Accès refusé : le compte est désactivé."),
        ("Accès à une route d'administration avec un compte élève.", "Réponse 403 Forbidden."),
        ("Expiration du jeton d'accès pendant l'utilisation.", "Renouvellement transparent, sans déconnexion."),
        ("Réutilisation d'un refresh token déjà utilisé.", "Toutes les sessions du compte sont révoquées."),
        ("Demande de réinitialisation puis utilisation du lien.", "Mot de passe modifié et sessions fermées."),
        ("Utilisation d'un lien de réinitialisation expiré.", "Message « Lien invalide ou expiré »."),
        ("Création d'un élève avec un téléphone déjà utilisé.", "Erreur affichée sous le champ téléphone."),
        ("Liaison d'un parent à deux enfants.", "Le parent voit ses deux enfants dans son espace."),
        ("Génération d'un mot de passe temporaire.", "Nouveau mot de passe affiché et anciennes sessions révoquées."),
    ], 1)

    # ---------------- Sprint 2 ----------------
    r.h(2, "4.2 Sprint 2 : Groupes, salles et planning")
    r.h(3, "4.2.1 Objectifs et backlog du sprint")
    r.p("Ce sprint met en place l'organisation pédagogique du centre : la création des groupes et l'inscription des élèves, la "
        "gestion des salles et la construction du planning hebdomadaire. La règle centrale est qu'aucune séance ne doit entrer en "
        "conflit avec une autre séance du même enseignant, de la même salle ou du même groupe.")
    sprint_backlog(r, 1, "Backlog du Sprint 2 : Groupes, salles et planning")
    r.h(3, "4.2.2 Diagramme de classes du Sprint 2")
    r.figure(D / "21_classes_sprint2.png", "Diagramme de classes du Sprint 2", 14)
    r.p("Un **Group** est caractérisé par son niveau, sa section, sa matière, son nombre de séances par série, son tarif et sa "
        "capacité. L'association avec **Student** passe par **GroupStudent**, dont la date de sortie (`leftAt`) permet de retirer un "
        "élève sans perdre l'historique de ses présences et de ses paiements. Une **Session** peut appartenir à une série "
        "hebdomadaire (`seriesId`), ce qui permet de déplacer ou de supprimer d'un coup la suite d'une série.")
    r.h(3, "4.2.3 Raffinement et description des cas d'utilisation")
    r.figure(D / "20_uc_sprint2.png", "Diagramme de cas d'utilisation du Sprint 2", 15.5)
    r.p("Description textuelle du cas d'utilisation « Inscrire des élèves dans un groupe »", bold=True, keep=True)
    r.uc_table("Cas d'utilisation : Inscrire des élèves dans un groupe", {
        "nom": "Inscrire des élèves dans un groupe", "acteurs": "Administrateur",
        "pre": "Le groupe existe et n'est pas archivé ; les élèves ne sont pas archivés.",
        "post": "Les élèves font partie du groupe et commencent leur série de présences.",
        "nominal": ["L'administrateur choisit des élèves depuis la fiche du groupe.",
                    "L'API verrouille la ligne du groupe pour éviter deux inscriptions simultanées.",
                    "L'API compte les élèves déjà inscrits et vérifie la capacité.",
                    "L'API crée ou réactive l'inscription de chaque nouvel élève.", "La liste du groupe est mise à jour."],
        "alt": ["Groupe archivé : inscription refusée.", "Capacité dépassée : message « Capacité du groupe dépassée (inscrits/capacité) »."]})
    r.figure(D / "22_seq_inscrire_eleves.png", "Diagramme de séquence du cas d'utilisation « Inscrire des élèves dans un groupe »", 15.5)
    r.p("Description textuelle du cas d'utilisation « Planifier une séance »", bold=True, keep=True)
    r.uc_table("Cas d'utilisation : Planifier une séance", {
        "nom": "Planifier une séance", "acteurs": "Enseignant, Administrateur",
        "pre": "L'utilisateur est authentifié ; pour un enseignant, le groupe lui appartient.",
        "post": "La séance, ou la série de séances, est enregistrée avec le statut « planifiée ».",
        "nominal": ["L'utilisateur glisse un groupe sur le calendrier, ou remplit le formulaire de séance.",
                    "L'API vérifie que la fin suit le début et que la séance ne dépasse pas six heures.",
                    "L'API vérifie que la salle est active et assez grande pour le groupe.",
                    "L'API calcule les créneaux de chaque semaine demandée.",
                    "L'API recherche les séances non annulées qui chevauchent ces créneaux pour le même enseignant, la même salle ou le même groupe.",
                    "Les séances sont créées dans une transaction et affichées sur le calendrier."],
        "alt": ["Conflit trouvé : réponse 409 avec la date, la raison (enseignant, salle ou groupe) et le nombre d'autres conflits ; le déplacement est annulé dans le calendrier.",
                "Salle trop petite ou désactivée : erreur sous le champ salle."]})
    r.figure(D / "23_seq_planifier_seance.png", "Diagramme de séquence du cas d'utilisation « Planifier une séance »", 15.5)
    r.h(3, "4.2.4 Tests et validation du sprint")
    tests(r, "Scénarios de test du Sprint 2", [
        ("Création d'un groupe avec une capacité de 11 élèves.", "Groupe créé et visible dans la liste."),
        ("Inscription d'un douzième élève dans ce groupe.", "Refus : capacité dépassée."),
        ("Retrait d'un élève puis consultation de son historique.", "L'élève n'est plus inscrit mais ses présences restent visibles."),
        ("Modification du nombre de séances par série d'un groupe qui a déjà des séances.", "Refus avec un message sous le champ."),
        ("Suppression d'un groupe qui a un historique.", "Refus (409) : il faut l'archiver."),
        ("Planification d'une série de 8 semaines.", "Huit séances créées avec le même identifiant de série."),
        ("Déplacement d'une séance sur le créneau d'une autre séance du même enseignant.", "Conflit signalé et séance remise à sa place."),
        ("Réservation d'une salle de 10 places pour un groupe de 11 élèves.", "Erreur : salle trop petite."),
        ("Suppression de « cette séance et les suivantes » d'une série.", "Seules les séances futures de la série sont supprimées."),
        ("Modification d'une séance déjà terminée.", "Refus : seule une séance planifiée peut être modifiée."),
    ], n)

    # ---------------- Implementation ----------------
    r.h(2, "4.3 Implémentation")
    r.p("Cette section présente les principales interfaces réalisées au cours de la première release.")
    for c in ["Page de connexion", "Réinitialisation du mot de passe", "Liste des élèves", "Fiche d'un élève",
              "Liste des groupes et inscription des élèves", "Gestion des salles", "Planning hebdomadaire avec glisser-déposer",
              "Message de conflit de planning"]:
        r.placeholder(c, 5.5)
    r.h(2, "Conclusion")
    r.p("Au terme de cette première release, la plateforme dispose d'un accès sécurisé, de la gestion des comptes des quatre "
        "acteurs et d'un planning fiable qui empêche les conflits. Ces fondations permettent d'aborder, dans la release suivante, la "
        "conduite des séances, les notifications et les paiements.")


# =====================================================================
def chapitre5(r):
    r.chapter(5, "Release 2 : Suivi pédagogique et financier", ["Introduction", "5.1 Sprint 3 : Séances, présences et notifications WhatsApp",
              "5.2 Sprint 4 : Paiements, revenus et suivi parent", "5.3 Implémentation", "Conclusion"])
    r.h(2, "Introduction")
    r.p("La deuxième release porte sur le cœur de l'activité quotidienne du centre : la conduite des séances et l'appel, "
        "l'information des parents par WhatsApp, puis le suivi des paiements et l'espace parent.")

    # ---------------- Sprint 3 ----------------
    r.h(2, "5.1 Sprint 3 : Séances, présences et notifications WhatsApp")
    r.h(3, "5.1.1 Objectifs et backlog du sprint")
    r.p("Ce sprint permet à l'enseignant de conduire une séance de bout en bout et met en place les alertes d'absence envoyées "
        "automatiquement aux parents par WhatsApp.")
    sprint_backlog(r, 2, "Backlog du Sprint 3 : Séances, présences et notifications WhatsApp")
    r.h(3, "5.1.2 Diagramme de classes du Sprint 3")
    r.figure(D / "31_classes_sprint3.png", "Diagramme de classes du Sprint 3", 14)
    r.p("Une **Session** passe successivement par les états planifiée, en cours puis terminée (ou annulée). Chaque élève du groupe "
        "reçoit une **Attendance** par séance. La classe **Notification** joue le rôle de file d'attente : chaque message y est "
        "enregistré avant son envoi, avec une clé anti-doublon (`dedupeKey`), une date d'envoi prévue et un compteur de tentatives.")
    r.h(3, "5.1.3 Règles de gestion des notifications")
    r.bullets([
        "Une alerte d'absence est envoyée à chaque parent de l'élève absent, **cinq minutes après la fin de la séance**. Si l'élève n'a pas de parent avec un compte, le message part au téléphone du parent noté dans sa fiche.",
        "**Aucun message n'est envoyé la nuit** (de 21 h à 8 h, heure de Tunis) : un message prévu la nuit part le lendemain matin à 8 h.",
        "Les messages partent **un par un**, séparés par une pause aléatoire de 15 à 30 secondes, avec un maximum de **150 messages par jour**, pour protéger le numéro du centre.",
        "Juste avant l'envoi, la plateforme vérifie que le message est toujours utile : si l'élève a finalement été marqué présent, le message est annulé.",
        "Un échec est retenté jusqu'à trois fois, sauf si le numéro n'a pas WhatsApp.",
    ])
    r.h(3, "5.1.4 Raffinement et description des cas d'utilisation")
    r.figure(D / "30_uc_sprint3.png", "Diagramme de cas d'utilisation du Sprint 3", 15.5)
    r.p("Description textuelle du cas d'utilisation « Démarrer une séance et faire l'appel »", bold=True, keep=True)
    r.uc_table("Cas d'utilisation : Démarrer une séance et faire l'appel", {
        "nom": "Démarrer une séance et faire l'appel", "acteurs": "Enseignant",
        "pre": "La séance appartient à l'enseignant et a le statut « planifiée ».",
        "post": "La séance est en cours et chaque élève du groupe a une présence.",
        "nominal": ["L'enseignant ouvre la séance et clique sur « Démarrer ».",
                    "L'API vérifie que l'on se trouve au plus 30 minutes avant le début prévu.",
                    "La séance passe au statut « en cours » et tous les élèves sont marqués absents par défaut.",
                    "L'enseignant coche les élèves présents.", "L'API vérifie que chaque élève appartient au groupe et enregistre l'appel."],
        "alt": ["Séance déjà démarrée ou annulée : démarrage refusé.", "Plus de 30 minutes avant le début : démarrage refusé."]})
    r.figure(D / "32_seq_demarrer_appel.png", "Diagramme de séquence du cas d'utilisation « Démarrer une séance et faire l'appel »", 15.5)
    r.p("Description textuelle du cas d'utilisation « Terminer la séance »", bold=True, keep=True)
    r.uc_table("Cas d'utilisation : Terminer la séance", {
        "nom": "Terminer la séance", "acteurs": "Enseignant (Agent de notification en secondaire)",
        "pre": "La séance est en cours.",
        "post": "La séance est terminée, les séries avancent et les alertes d'absence sont en file d'attente.",
        "nominal": ["L'enseignant clique sur « Terminer ».", "L'API vérifie que tous les élèves ont une présence.",
                    "La séance passe au statut « terminée ».", "L'API repère les élèves qui viennent de terminer leur série.",
                    "Une alerte par parent d'élève absent est mise en file d'attente.",
                    "L'enseignant voit la liste des élèves dont la série est à payer."],
        "alt": ["Appel incomplet : message « N élève(s) sans présence : terminez l'appel ».",
                "WhatsApp non connecté : les messages restent en attente et partent à la reconnexion."]})
    r.figure(D / "33_seq_terminer_seance.png", "Diagramme de séquence du cas d'utilisation « Terminer la séance »", 15.5)
    r.h(3, "5.1.5 Tests et validation du sprint")
    n = tests(r, "Scénarios de test du Sprint 3", [
        ("Démarrage d'une séance une heure avant son début.", "Refus : démarrage possible 30 minutes avant."),
        ("Démarrage d'une séance à l'heure.", "Tous les élèves apparaissent absents par défaut."),
        ("Appel avec un élève qui n'appartient pas au groupe.", "Refus de l'enregistrement."),
        ("Clôture avec un appel incomplet.", "Message indiquant le nombre d'élèves sans présence."),
        ("Clôture avec deux absents.", "Deux alertes mises en file, une par parent."),
        ("Correction de l'appel après la fin : un absent devient présent.", "L'alerte en attente est annulée avant l'envoi."),
        ("Séance terminée à 21 h 30.", "Les alertes sont programmées pour 8 h le lendemain."),
        ("Connexion du WhatsApp du centre par QR code.", "Statut « connecté » affiché."),
        ("Renvoi d'un message échoué.", "Message remis dans la file d'attente."),
        ("Consultation du planning par un parent.", "Séances des 14 prochains jours de l'enfant affichées."),
    ], 1)

    # ---------------- Sprint 4 ----------------
    r.h(2, "5.2 Sprint 4 : Paiements, revenus et suivi parent")
    r.h(3, "5.2.1 Objectifs et backlog du sprint")
    r.p("Ce sprint met en place le suivi financier du centre et l'espace parent. Les paiements suivent la règle réelle du centre : "
        "un élève paie par **série de N présences** (N étant le nombre de séances par série de son groupe).")
    sprint_backlog(r, 3, "Backlog du Sprint 4 : Paiements, revenus et suivi parent")
    r.h(3, "5.2.2 Règles de gestion des paiements")
    r.bullets([
        "Seules les **présences** aux séances terminées font avancer le compteur d'un élève ; les absences ne comptent pas.",
        "Une série terminée et non payée passe à l'état **« à payer »** ; la série suivante commence aussitôt.",
        "L'élève peut payer **à l'avance**, pendant sa série, ou **après** l'avoir terminée.",
        "Le montant d'une série est le tarif négocié de l'élève s'il existe, sinon le tarif du groupe.",
        "Un paiement règle toujours la **plus ancienne série non payée** ; un second clic ne peut pas payer la série suivante.",
        "Le paiement est enregistré en espèces avec un numéro de reçu unique ; le dernier paiement peut être annulé en cas d'erreur.",
        "La veille de la séance qui terminera une série non payée, un **rappel WhatsApp** est envoyé au parent et à l'élève à 8 h.",
    ])
    r.h(3, "5.2.3 Diagramme de classes du Sprint 4")
    r.figure(D / "41_classes_sprint4.png", "Diagramme de classes du Sprint 4", 14)
    r.p("Une ligne **Installment** n'existe que pour une série payée ; la contrainte d'unicité (élève, groupe, numéro de série) "
        "empêche de payer deux fois la même série, même si deux requêtes arrivent en même temps. L'état « à payer » ou « en cours » est "
        "calculé à partir des présences, ce qui évite toute incohérence entre l'appel et la caisse. Chaque **Payment** garde "
        "l'utilisateur qui l'a reçu.")
    r.h(3, "5.2.4 Raffinement et description des cas d'utilisation")
    r.figure(D / "40_uc_sprint4.png", "Diagramme de cas d'utilisation du Sprint 4", 15.5)
    r.p("Description textuelle du cas d'utilisation « Enregistrer un paiement »", bold=True, keep=True)
    r.uc_table("Cas d'utilisation : Enregistrer un paiement", {
        "nom": "Enregistrer un paiement", "acteurs": "Enseignant, Administrateur",
        "pre": "L'élève est inscrit dans le groupe ; pour un enseignant, le groupe lui appartient.",
        "post": "La série est enregistrée comme payée avec un numéro de reçu.",
        "nominal": ["L'utilisateur ouvre l'état des paiements du groupe.", "Il clique sur « Payé » pour un élève.",
                    "L'API recalcule la série à régler à partir des présences.",
                    "L'API crée la série payée et le paiement en espèces.", "La ligne de l'élève est mise à jour."],
        "alt": ["La série affichée n'est plus la prochaine à payer (double clic) : aucun changement.",
                "Deux requêtes simultanées : la contrainte d'unicité n'en garde qu'une."]})
    r.figure(D / "42_seq_enregistrer_paiement.png", "Diagramme de séquence du cas d'utilisation « Enregistrer un paiement »", 15.5)
    r.p("Description textuelle du cas d'utilisation « Suivre son enfant »", bold=True, keep=True)
    r.uc_table("Cas d'utilisation : Suivre son enfant", {
        "nom": "Suivre son enfant", "acteurs": "Parent",
        "pre": "Le parent est authentifié et lié à l'enfant par l'administrateur.",
        "post": "Le parent consulte la situation de son enfant en lecture seule.",
        "nominal": ["Le parent choisit un enfant dans sa liste.", "L'API vérifie le lien entre le parent et l'enfant.",
                    "L'API renvoie les groupes, les séances des 14 prochains jours, les présences, l'état des séries et l'historique des paiements.",
                    "Le tableau de bord de l'enfant est affiché."],
        "alt": ["Enfant non lié au parent : réponse « introuvable », sans révéler l'existence de l'élève."]})
    r.figure(D / "43_seq_suivre_enfant.png", "Diagramme de séquence du cas d'utilisation « Suivre son enfant »", 15.5)
    r.h(3, "5.2.5 Tests et validation du sprint")
    tests(r, "Scénarios de test du Sprint 4", [
        ("Élève avec 4 présences dans un groupe de 4 séances par série.", "État « à payer » pour la série 1."),
        ("Paiement de la série 1.", "État « payé », reçu numéroté créé."),
        ("Double clic sur « Payé ».", "Une seule série payée."),
        ("Paiement à l'avance pendant la série en cours.", "La série en cours est marquée payée."),
        ("Annulation du dernier paiement.", "La série redevient « à payer »."),
        ("Élève avec un tarif négocié.", "Le montant dû utilise le tarif de l'élève."),
        ("Feuille de présence filtrée sur un mois.", "Seules les présences du mois, avec leur vraie série."),
        ("Rappel la veille de la séance qui termine une série non payée.", "Message au parent et à l'élève à 8 h."),
        ("Paiement fait avant l'envoi du rappel.", "Le rappel est annulé."),
        ("Parent qui consulte un enfant qui n'est pas le sien.", "Réponse « introuvable »."),
        ("Consultation des revenus d'un mois.", "Total, détail par groupe et historique de 12 mois."),
    ], n)

    r.h(2, "5.3 Implémentation")
    r.p("Cette section présente les principales interfaces réalisées au cours de la deuxième release.")
    for c in ["Conduite d'une séance et feuille d'appel", "Console WhatsApp de l'administrateur", "État des paiements d'un groupe",
              "Feuille de présence et de paiement", "Revenus du centre", "Espace parent : suivi d'un enfant"]:
        r.placeholder(c, 5.5)
    r.h(2, "Conclusion")
    r.p("Cette deuxième release automatise les tâches les plus répétitives du centre : l'appel, l'information des parents et le "
        "calcul des séries à payer. La dernière release enrichit la plateforme sur le plan pédagogique.")


# =====================================================================
def chapitre6(r):
    r.chapter(6, "Release 3 : Contenus pédagogiques et intelligence artificielle", ["Introduction",
              "6.1 Sprint 5 : Exercices, vidéos, périodes de révision et correction par IA",
              "6.2 Sprint 6 : Module Coder, agent IA conversationnel et tableau de bord", "6.3 Implémentation",
              "6.4 Tests unitaires et conteneurisation", "Conclusion"])
    r.h(2, "Introduction")
    r.p("La troisième release enrichit la plateforme sur le plan pédagogique et introduit l'intelligence artificielle à deux "
        "niveaux : la correction assistée des exercices et l'agent conversationnel WhatsApp. Elle comprend aussi le module ludique "
        "Coder et le tableau de bord de l'administrateur.")

    # ---------------- Sprint 5 ----------------
    r.h(2, "6.1 Sprint 5 : Exercices, vidéos, périodes de révision et correction par IA")
    r.h(3, "6.1.1 Objectifs et backlog du sprint")
    r.p("Ce sprint permet à l'enseignant de publier des contenus pour ses groupes, d'organiser des périodes de révision et de "
        "proposer des exercices corrigés avec l'aide de l'intelligence artificielle.")
    sprint_backlog(r, 4, "Backlog du Sprint 5 : Exercices, vidéos, périodes de révision et correction par IA")
    r.h(3, "6.1.2 Règles de gestion")
    r.h(4, "Exercices et documents")
    r.bullets([
        "Un exercice comporte un titre, des consignes et jusqu'à **10 fichiers** (PDF, images ou Word) de **10 Mo** au maximum chacun.",
        "Il est publié pour un ou plusieurs groupes de l'enseignant, **tous du même niveau**.",
        "L'élève ne voit que les exercices de ses groupes actuels ; les PDF et les images s'ouvrent dans le navigateur.",
    ])
    r.h(4, "Vidéos de cours")
    r.bullets([
        "L'enseignant publie une vidéo par un **lien** (plateforme de vidéo ou espace de stockage) avec un titre et une description, pour un ou plusieurs de ses groupes.",
        "Les élèves des groupes concernés consultent la vidéo depuis leur espace exercices.",
    ])
    r.h(4, "Périodes de révision")
    r.bullets([
        "L'enseignant demande une période pour un ou plusieurs de ses groupes, avec un nom, une date de début, une date de fin et un motif.",
        "L'administrateur **accepte ou refuse** la demande ; un refus exige un motif. L'enseignant est informé de la décision.",
        "Une fois la période acceptée, ses séances sont planifiées dans un **planning séparé**, avec la même détection des conflits.",
        "Les séances de révision **ne comptent pas** dans les séries de paiement ; l'appel et les alertes d'absence fonctionnent comme pour une séance normale.",
        "L'enseignant peut associer des exercices à la période.",
    ])
    r.h(4, "Correction par intelligence artificielle")
    r.bullets([
        "Les questions sont de cinq types : QCM, réponse courte, rédaction, problème et code. Chaque question a un barème, une réponse modèle et des critères.",
        "La soumission est refusée après la date limite ou lorsque le nombre de tentatives autorisées est atteint.",
        "Les **QCM sont corrigés automatiquement**, sans IA.",
        "Pour les autres questions, l'IA reçoit l'énoncé, le barème, la réponse modèle et la réponse de l'élève **sans son nom ni son téléphone**. Elle renvoie un JSON : note proposée, commentaire, points forts, erreurs, conseils et niveau de confiance.",
        "La note n'est **jamais publiée sans la validation de l'enseignant**, qui peut l'accepter, la modifier ou la rejeter.",
        "Chaque appel à l'IA est journalisé avec le modèle utilisé, le nombre de jetons et le coût, afin de suivre la consommation.",
        "Le fournisseur d'IA est isolé derrière une interface de service, ce qui permet de le remplacer sans modifier le reste du code.",
    ])
    r.h(3, "6.1.3 Diagramme de classes du Sprint 5")
    r.figure(D / "51_classes_sprint5.png", "Diagramme de classes du Sprint 5", 16)
    r.p("Un **Exercise** possède des pièces jointes (**Attachment**) et des questions (**ExerciseQuestion**). Il est affecté à des "
        "groupes par **ExerciseAssignment**, qui fixe la date limite, le nombre de tentatives et l'obligation de validation par "
        "l'enseignant. Chaque **Submission** d'un élève regroupe ses réponses (**SubmissionAnswer**) et reçoit au plus une "
        "**Correction**, dont la source (QCM automatique, IA ou enseignant) et le statut (proposée, acceptée, modifiée, rejetée) sont "
        "conservés. **AiCorrectionLog** trace chaque appel au fournisseur d'IA. **ReviewPeriod** porte le statut de la demande de "
        "révision et **CourseVideo** les vidéos publiées.")
    r.h(3, "6.1.4 Raffinement et description des cas d'utilisation")
    r.figure(D / "50_uc_sprint5.png", "Diagramme de cas d'utilisation du Sprint 5", 15.5)
    r.p("Description textuelle du cas d'utilisation « Publier un exercice »", bold=True, keep=True)
    r.uc_table("Cas d'utilisation : Publier un exercice", {
        "nom": "Publier un exercice ou un document", "acteurs": "Enseignant",
        "pre": "L'enseignant est authentifié et possède au moins un groupe actif.",
        "post": "L'exercice et ses fichiers sont visibles par les élèves des groupes choisis.",
        "nominal": ["L'enseignant saisit le titre, les consignes et le niveau, choisit ses groupes et ajoute les fichiers.",
                    "L'API contrôle le nombre, la taille et le type des fichiers.",
                    "L'API vérifie que les groupes appartiennent à l'enseignant et sont du niveau choisi.",
                    "Les fichiers sont enregistrés et l'exercice est créé avec ses affectations.",
                    "L'exercice apparaît dans la liste de l'enseignant et chez les élèves."],
        "alt": ["Fichier non accepté ou trop volumineux : message explicite.",
                "Groupe d'un autre niveau ou d'un autre enseignant : refus. En cas d'erreur, les fichiers déjà écrits sont supprimés."]})
    r.figure(D / "55_seq_publier_exercice.png", "Diagramme de séquence du cas d'utilisation « Publier un exercice »", 15.5)
    r.p("Description textuelle du cas d'utilisation « Demander et traiter une période de révision »", bold=True, keep=True)
    r.uc_table("Cas d'utilisation : Demander et traiter une période de révision", {
        "nom": "Demander une période de révision / Traiter la demande", "acteurs": "Enseignant, Administrateur",
        "pre": "L'enseignant est authentifié et anime les groupes concernés.",
        "post": "La demande est acceptée (planning de révision ouvert) ou refusée avec un motif.",
        "nominal": ["L'enseignant saisit le nom, les dates, les groupes et le motif.", "La demande est enregistrée en attente.",
                    "L'administrateur consulte les demandes en attente.", "Il accepte la demande.",
                    "La décision est journalisée et l'enseignant est informé ; il peut planifier ses séances de révision."],
        "alt": ["Dates incohérentes ou groupe d'un autre enseignant : demande refusée.", "Refus de l'administrateur : un motif est obligatoire."]})
    r.figure(D / "52_seq_demande_revision.png", "Diagramme de séquence du cas d'utilisation « Demander et traiter une période de révision »", 15.5)
    r.p("Description textuelle du cas d'utilisation « Réaliser et soumettre un exercice »", bold=True, keep=True)
    r.uc_table("Cas d'utilisation : Réaliser et soumettre un exercice", {
        "nom": "Réaliser et soumettre un exercice", "acteurs": "Élève (Système IA en secondaire)",
        "pre": "L'exercice est publié pour un groupe de l'élève.",
        "post": "La soumission est enregistrée et une correction est proposée à l'enseignant.",
        "nominal": ["L'élève répond aux questions (texte, choix, fichier ou photo de copie) et soumet.",
                    "L'API vérifie la date limite et le nombre de tentatives.", "La soumission est enregistrée.",
                    "Les QCM sont corrigés automatiquement.", "Les autres réponses sont anonymisées et envoyées au service d'IA.",
                    "La correction proposée est enregistrée et attend la validation de l'enseignant."],
        "alt": ["Délai dépassé ou tentatives épuisées : soumission refusée.",
                "Service d'IA indisponible : la soumission passe au statut « échec » et l'enseignant corrige manuellement."]})
    r.figure(D / "53_seq_soumettre_correction.png", "Diagramme de séquence du cas d'utilisation « Réaliser et soumettre un exercice »", 15.5)
    r.p("Description textuelle du cas d'utilisation « Valider la correction »", bold=True, keep=True)
    r.uc_table("Cas d'utilisation : Valider la correction", {
        "nom": "Valider la correction", "acteurs": "Enseignant",
        "pre": "Une correction proposée existe pour une soumission d'un élève de l'enseignant.",
        "post": "La note finale est publiée et visible par l'élève.",
        "nominal": ["L'enseignant ouvre la liste des corrections à valider.", "Il consulte la note proposée, le commentaire et le niveau de confiance.",
                    "Il accepte la note, la modifie ou la rejette.", "La correction est publiée."],
        "alt": ["Note rejetée : l'enseignant saisit lui-même la note et le commentaire."]})
    r.figure(D / "54_seq_valider_correction.png", "Diagramme de séquence du cas d'utilisation « Valider la correction »", 15.5)
    r.h(3, "6.1.5 Tests et validation du sprint")
    n = tests(r, "Scénarios de test du Sprint 5", [
        ("Publication d'un exercice avec deux PDF pour deux groupes de même niveau.", "Exercice visible par les élèves des deux groupes."),
        ("Publication avec un fichier non accepté (.exe).", "Refus avec un message explicite."),
        ("Publication pour un groupe d'un autre niveau.", "Refus : tous les groupes doivent être du même niveau."),
        ("Publication d'une vidéo par lien.", "Vidéo visible par les élèves des groupes choisis."),
        ("Demande de période de révision puis acceptation.", "Planning de révision ouvert pour l'enseignant."),
        ("Refus d'une demande sans motif.", "Refus de l'enregistrement : motif obligatoire."),
        ("Soumission d'un QCM.", "Note calculée automatiquement, sans appel à l'IA."),
        ("Soumission d'une rédaction.", "Correction proposée par l'IA, en attente de validation."),
        ("Soumission après la date limite.", "Soumission refusée."),
        ("Modification de la note proposée par l'enseignant.", "Note finale publiée avec le statut « modifiée »."),
        ("Vérification des données envoyées à l'IA.", "Aucun nom ni téléphone dans la requête."),
    ], 1)

    # ---------------- Sprint 6 ----------------
    r.h(2, "6.2 Sprint 6 : Module Coder, agent IA conversationnel et tableau de bord")
    r.h(3, "6.2.1 Objectifs et backlog du sprint")
    r.p("Ce sprint ajoute deux fonctionnalités qui distinguent Najahni : un module ludique pour apprendre l'algorithmique et Python, "
        "et un agent conversationnel qui répond aux familles sur WhatsApp. Il finalise aussi le tableau de bord et l'interface "
        "bilingue.")
    sprint_backlog(r, 5, "Backlog du Sprint 6 : Module Coder, agent IA conversationnel et tableau de bord")
    r.h(3, "6.2.2 Le module Coder")
    r.p("Le module Coder propose trois jeux :")
    r.bullets([
        "**Mission Souris** : l'élève écrit du Python (`avancer()`, `tourner_gauche()`, boucles et conditions) pour guider une souris sur une grille.",
        "**Portes du Code** : l'élève écrit un algorithme en notation tunisienne, ou du Python, pour résoudre un problème du programme ; la porte s'ouvre quand tous les tests passent.",
        "**Aventure Bac** (Bac Informatique) : chaque notion est racontée par une histoire, et une scène animée rejoue le code de l'élève.",
    ])
    r.p("Le parcours de l'élève (bases, 3e Sciences de l'informatique, Bac Informatique ou Bac Économie) est déduit de son niveau et "
        "de sa section. Le code n'est **jamais exécuté sur le serveur** : il tourne dans le navigateur de l'élève avec Pyodide, dans "
        "un Web Worker. L'algorithme écrit en notation tunisienne est traduit en Python et son tableau de déclaration des objets (TDO) "
        "est vérifié. Le serveur enregistre les essais, calcule les étoiles (selon la longueur du code pour Mission Souris, selon le "
        "nombre d'essais pour les autres jeux) et ne débloque une mission que si la précédente est réussie. Les solutions ne sont "
        "jamais envoyées à l'élève.")
    r.h(3, "6.2.3 L'agent IA conversationnel")
    r.p("Les messages reçus sur le WhatsApp du centre sont transmis à un workflow **n8n**. L'agent, fondé sur un modèle de langage "
        "Groq, ne répond qu'à partir de la **fiche du centre** (adresse, horaires, niveaux, tarifs, livre). Si la question sort de la "
        "fiche, il enregistre une demande de rappel ; si la personne veut commander le livre, il enregistre la commande. Il ne donne "
        "jamais d'information sur un élève. L'accès de n8n à l'API est protégé par une clé, les numéros autorisés sont filtrés et le "
        "nombre de messages par heure est limité.")
    r.h(3, "6.2.4 Diagramme de classes du Sprint 6")
    r.figure(D / "61_classes_sprint6.png", "Diagramme de classes du Sprint 6", 14)
    r.p("Une **CodeChapter** regroupe des **CodeLevel** d'un même jeu et d'un même parcours (**CodeTrack**). **CodeProgress** garde, "
        "pour chaque élève et chaque mission, le nombre d'essais, les étoiles, le dernier code et le meilleur code. **AgentLead** et "
        "**AgentOrder** représentent ce que l'agent laisse à l'équipe : les personnes à rappeler et les commandes de livres.")
    r.h(3, "6.2.5 Raffinement et description des cas d'utilisation")
    r.figure(D / "60_uc_sprint6.png", "Diagramme de cas d'utilisation du Sprint 6", 15.5)
    r.p("Description textuelle du cas d'utilisation « Résoudre une mission Coder »", bold=True, keep=True)
    r.uc_table("Cas d'utilisation : Résoudre une mission Coder", {
        "nom": "Résoudre une mission Coder", "acteurs": "Élève",
        "pre": "La mission appartient au parcours de l'élève et la mission précédente est réussie.",
        "post": "L'essai est enregistré ; en cas de réussite, les étoiles sont attribuées et la mission suivante est débloquée.",
        "nominal": ["L'élève ouvre une mission depuis la carte.", "L'API renvoie l'énoncé, les indices et les tests, sans la solution.",
                    "L'élève écrit son code en Python ou en algorithme.", "Le navigateur exécute le code avec Pyodide et vérifie les tests.",
                    "Le résultat est envoyé à l'API, qui calcule les étoiles et garde le meilleur résultat.",
                    "La scène rejoue le code et la mission suivante s'ouvre."],
        "alt": ["Mission verrouillée : accès refusé.", "Tests non réussis : l'essai est compté et l'élève peut réessayer."]})
    r.figure(D / "62_seq_mission_coder.png", "Diagramme de séquence du cas d'utilisation « Résoudre une mission Coder »", 15.5)
    r.p("Description textuelle du cas d'utilisation « Poser une question au centre »", bold=True, keep=True)
    r.uc_table("Cas d'utilisation : Poser une question au centre", {
        "nom": "Poser une question au centre", "acteurs": "Contact WhatsApp (Agent IA conversationnel en secondaire)",
        "pre": "Le WhatsApp du centre est connecté et l'agent est activé.",
        "post": "Le contact reçoit une réponse ; une demande de rappel ou une commande est enregistrée si besoin.",
        "nominal": ["Le contact envoie un message au numéro du centre.", "L'API filtre le message et le transmet à n8n.",
                    "L'agent lit la fiche du centre.", "L'agent répond à partir de la fiche.", "La réponse est envoyée sur WhatsApp."],
        "alt": ["Question hors fiche : l'agent enregistre une demande de rappel et indique que l'équipe va rappeler.",
                "Commande de livre : l'agent demande le nom, le numéro et l'adresse puis enregistre la commande.",
                "Numéro non autorisé ou trop de messages : le message est ignoré."]})
    r.figure(D / "63_seq_agent_whatsapp.png", "Diagramme de séquence du cas d'utilisation « Poser une question au centre »", 15.5)
    r.h(3, "6.2.6 Tests et validation du sprint")
    tests(r, "Scénarios de test du Sprint 6", [
        ("Ouverture d'une mission alors que la précédente n'est pas réussie.", "Accès refusé."),
        ("Réussite de Mission Souris avec un code court.", "Trois étoiles et mission suivante débloquée."),
        ("Solution écrite en algorithme avec un TDO correct.", "Traduction en Python et tests réussis."),
        ("Consultation du suivi Coder par un enseignant.", "Seuls les élèves de ses groupes sont affichés."),
        ("Question sur les tarifs envoyée sur WhatsApp.", "Réponse tirée de la fiche du centre."),
        ("Question hors fiche.", "Demande de rappel créée dans la page « À rappeler »."),
        ("Commande du livre.", "Commande créée avec nom, numéro et adresse."),
        ("Appel de l'API agent sans clé.", "Refus (401)."),
        ("Passage de l'interface en arabe.", "Textes traduits et sens de lecture de droite à gauche."),
    ], n)

    r.h(2, "6.3 Implémentation")
    r.p("Cette section présente les principales interfaces réalisées au cours de la troisième release.")
    for c in ["Publication d'un exercice", "Exercices de l'élève", "Correction proposée par l'IA et validation",
              "Demandes de période de révision", "Carte des missions Coder", "Résolution d'une mission (éditeur et scène)",
              "Suivi Coder de l'enseignant", "Page « À rappeler » de l'agent", "Tableau de bord de l'administrateur"]:
        r.placeholder(c, 5.5)

    r.h(2, "6.4 Tests unitaires et conteneurisation")
    r.h(3, "6.4.1 Tests unitaires")
    r.p("Afin de garantir la fiabilité des règles métier, le backend est couvert par des tests unitaires écrits avec **Vitest**. "
        "Ils valident les modules de manière isolée, en remplaçant la base de données par des objets simulés lorsque c'est nécessaire. "
        "Le tableau suivant présente le résultat de la dernière exécution de la suite (`npm test`).")
    r.table("Résultats des tests unitaires du backend", ["Fichier de test", "Ce qui est vérifié", "Tests", "Résultat"], [
        ("auth.service.spec.ts", "Rotation des refresh tokens, détection de rejeu, mot de passe oublié", "6", "6 réussis"),
        ("throttling.spec.ts", "Limitation des tentatives par compte et par IP", "3", "3 réussis"),
        ("field-errors.spec.ts", "Regroupement des erreurs de validation par champ", "2", "2 réussis"),
        ("groups.service.spec.ts", "Blocage du nombre de séances par série après le début du groupe", "4", "4 réussis"),
        ("payments.spec.ts", "Séries de présences, feuille du groupe, double clic et requêtes simultanées", "12", "12 réussis"),
        ("time.spec.ts", "Heures de Tunis et absence d'envoi la nuit", "6", "6 réussis"),
        ("whatsapp.service.spec.ts", "Numéros autorisés et filtrage des messages transmis à l'agent", "6", "6 réussis"),
        ("agent.service.spec.ts", "Clé d'accès de n8n", "3", "3 réussis"),
        ("rules.spec.ts", "Parcours Coder selon le niveau et la section, calcul des étoiles", "12", "12 réussis"),
        ("coding.service.spec.ts", "Verrouillage des missions", "2", "2 réussis"),
        ("coding.dto.spec.ts", "Validation des essais et des TDO envoyés par le navigateur", "77", "77 réussis"),
        ("algo.spec.ts", "Traduction des algorithmes en Python", "29", "29 réussis"),
        ("content.spec.ts", "Exécution réelle des solutions de chaque mission avec Python", "445", "445 réussis"),
        ("Total", "13 fichiers", "607", "607 réussis, 0 échec"),
    ], [4.2, 7.4, 1.6, 2.8], font=9.5)
    r.p("Les tests du contenu Coder exécutent réellement chaque solution avec l'interpréteur Python fourni avec le frontend : ils "
        "garantissent que chaque mission proposée aux élèves admet bien une solution qui passe tous ses tests.")
    r.h(3, "6.4.2 Conteneurisation des services")
    r.p("Le fichier `docker-compose.yml` démarre en une commande les services d'infrastructure nécessaires au développement : "
        "**PostgreSQL 17** avec un volume persistant et un contrôle de santé, **Redis 7** et **MinIO** pour le stockage objet. "
        "L'API et le frontend sont lancés en mode développement avec `npm run start:dev` et `npm run dev`, le serveur Vite redirigeant "
        "les appels `/api` vers NestJS.")
    r.h(2, "Conclusion")
    r.p("Cette dernière release donne à Najahni sa dimension pédagogique : contenus partagés, périodes de révision, correction "
        "assistée par l'intelligence artificielle sous le contrôle de l'enseignant, apprentissage ludique de la programmation et "
        "agent conversationnel au service des familles. La suite de tests unitaires confirme la fiabilité des règles métier les plus "
        "sensibles.")


# =====================================================================
def conclusion(r):
    r.unnumbered("Conclusion générale et perspectives", header="Conclusion générale et perspectives")
    r.p("Au terme de ce projet de fin d'année, nous avons conçu et développé Najahni, une plateforme web qui centralise la gestion "
        "d'un centre d'étude privé. Elle offre un espace à chacun des acteurs du centre : l'administrateur organise les comptes, les "
        "groupes, les salles et le planning ; l'enseignant conduit ses séances, fait l'appel, suit les paiements et publie ses "
        "contenus ; l'élève suit ses cours, réalise ses exercices et apprend la programmation en jouant ; le parent suit ses enfants "
        "et reçoit des notifications WhatsApp.")
    r.p("Sur le plan technique, la plateforme repose sur un frontend React et une API NestJS organisée par acteur, adossés à une base "
        "PostgreSQL gérée par Prisma. Une attention particulière a été portée à la sécurité (Argon2id, rotation des refresh tokens, "
        "limitation des tentatives, contrôle des rôles) et à la fiabilité des opérations sensibles (transactions, contraintes "
        "d'unicité, protection contre les doubles clics). La suite de 607 tests unitaires valide les règles métier les plus "
        "importantes.")
    r.p("Sur le plan méthodologique, la démarche Scrum a organisé le travail de l'équipe en six sprints répartis sur trois releases, "
        "et la modélisation UML a accompagné chaque étape de la conception. Ce projet nous a permis de consolider nos compétences en "
        "développement full-stack, en modélisation, en sécurité des applications web, en intégration de l'intelligence artificielle "
        "et en travail d'équipe.")
    r.p("Plusieurs perspectives d'évolution sont envisagées :")
    r.bullets([
        "ajouter des **graphiques** au tableau de bord (évolution des revenus, taux de présence, résultats des exercices) ;",
        "générer des **reçus et des rapports mensuels en PDF** pour les parents ;",
        "ajouter une **messagerie** entre les parents, les enseignants et l'administration ;",
        "permettre l'**import et l'export Excel** des élèves ;",
        "transformer l'application en **application installable (PWA)** et ajouter des notifications push ;",
        "mettre en place un **pipeline CI/CD** et un déploiement en production derrière un reverse proxy HTTPS ;",
        "compléter les tests par des **tests de bout en bout** de l'interface.",
    ])
    r.p("Najahni ne constitue donc pas seulement l'aboutissement d'un projet académique, mais une base solide pouvant évoluer vers "
        "une solution complète au service des centres d'étude et de la réussite de leurs élèves.")


def webographie(r):
    r.unnumbered("Webographie", header="Webographie")
    refs = [
        "Object Management Group, « Unified Modeling Language Specification, Version 2.5.1 ». https://www.omg.org/spec/UML/2.5.1/",
        "K. Schwaber et J. Sutherland, « The Scrum Guide ». https://scrumguides.org/scrum-guide.html",
        "Prisma, « Prisma ORM Documentation ». https://www.prisma.io/docs",
        "NestJS, « NestJS Documentation ». https://docs.nestjs.com",
        "React, « React Documentation ». https://react.dev",
        "PostgreSQL Global Development Group, « PostgreSQL Documentation ». https://www.postgresql.org/docs/",
        "TanStack, « TanStack Query Documentation ». https://tanstack.com/query/latest",
        "FullCalendar, « FullCalendar Documentation ». https://fullcalendar.io/docs",
        "Pyodide, « Pyodide Documentation ». https://pyodide.org/en/stable/",
        "WhiskeySockets, « Baileys : WhatsApp Web API ». https://github.com/WhiskeySockets/Baileys",
        "M. Jones, J. Bradley, N. Sakimura, « RFC 7519 : JSON Web Token (JWT) », IETF. https://www.rfc-editor.org/rfc/rfc7519",
        "OWASP, « Password Storage Cheat Sheet ». https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html",
        "n8n, « n8n Documentation ». https://docs.n8n.io",
        "Docker, « Docker Compose Documentation ». https://docs.docker.com/compose/",
        "Vitest, « Vitest Documentation ». https://vitest.dev",
    ]
    for i, ref in enumerate(refs, 1):
        para = r.p(f"[{i}] {ref}", align="left", after=4)
