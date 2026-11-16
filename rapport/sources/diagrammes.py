"""Toutes les figures du rapport Najahni. Usage : python diagrammes.py <dossier_sortie>"""
import sys
from uml import sequence, class_diagram, usecase, blocks

OUT = sys.argv[1] if len(sys.argv) > 1 else "../diagrammes"
made = []


def save(d):
    made.append(d.save(OUT))


# =====================================================================
# Diagramme de cas d'utilisation global (style de l'equipe)
# =====================================================================
G1 = [
 ("comptes", "Gérer les comptes", ["admin"]), ("salles", "Gérer les salles", ["admin"]),
 ("dash", "Consulter le tableau|de bord", ["admin"]), ("wa", "Gérer la connexion|WhatsApp", ["admin"]),
 ("leads", "Traiter les rappels|et les commandes", ["admin"]), ("demande", "Gérer la demande de|période de révision", ["admin"]),
 ("eleves", "Gestion des élèves", ["admin", "teach"]), ("groupes", "Gestion des groupes", ["admin", "teach"]),
 ("planning", "Planning", ["admin", "teach"]), ("seances", "Gestion des séances", ["admin", "teach"]),
 ("revenus", "Consulter les revenus", ["admin", "teach"]), ("cfollow", "Suivre la progression|Coder", ["admin", "teach"]),
 ("demper", "Demander une période|de révision", ["teach"]), ("exo", "Soumettre un exercice|ou un document", ["teach"]),
 ("video", "Soumettre une vidéo", ["teach"]), ("valid", "Valider la correction", ["teach"]),
 ("reset", "Réinitialiser le|mot de passe", ["teach", "student", "parent"]),
 ("pay", "Gestion des paiements", ["admin", "teach", "student", "parent"]),
 ("suivi", "Suivi de la séance", ["student", "parent"]), ("listexo", "Voir la liste|des exercices", ["student"]),
 ("submit", "Réaliser et soumettre|un exercice", ["student"]), ("game", "Jouer aux jeux|Coder", ["student"]),
 ("child", "Suivi de l'enfant", ["parent"]), ("ask", "Poser une question|au centre", ["contact"]),
 ("call", "Demander un rappel", ["contact"]), ("book", "Commander un livre", ["contact"]),
]
GY = {u[0]: 30 + k * 82 for k, u in enumerate(G1)}
g_ucs = [(u, l, 320, GY[u]) for u, l, _ in G1] + [
 ("gper", "Gestion des périodes|de révision", 590, GY["demper"]),
 ("corr", "Corriger l'exercice", 590, (GY["valid"] + GY["submit"]) / 2),
 ("notif", "Envoyer des|notifications", 590, (GY["seances"] + GY["pay"]) / 2 + 40)]
mid = lambda a, b: (GY[a] + GY[b]) / 2
g_actors = [("admin", "Administrateur", 60, mid("comptes", "cfollow")), ("teach", "Enseignant", 60, mid("eleves", "reset")),
            ("student", "Élève", 60, mid("reset", "game")), ("parent", "Parent", 60, mid("pay", "child") + 20),
            ("contact", "Contact WhatsApp", 60, GY["call"])]
corr_y = (GY["valid"] + GY["submit"]) / 2
notif_y = (GY["seances"] + GY["pay"]) / 2 + 40
save(usecase("01_cas_utilisation_global", "Cas d'utilisation global", g_actors, g_ucs,
 [(a, u) for u, _, acts in G1 for a in acts],
 inc=[("submit", "corr"), ("seances", "notif"), ("pay", "notif")],
 ext=[("demper", "gper"), ("valid", "corr"), ("call", "ask")],
 boxes=[("bot", "Agent IA conversationnel (n8n)", 1000, GY["call"] - 15), ("ia", "Système IA pour correction", 1000, corr_y - 10),
        ("agent", "Agent de notification", 1000, notif_y - 10)],
 sys_links=[("corr", "ia"), ("notif", "agent"), ("ask", "bot"), ("call", "bot"), ("book", "bot")],
 auth=(1000, mid("comptes", "child")),
 auth_inc=[u for u, _, _ in G1 if u not in ("reset", "ask", "call", "book")] + ["gper"],
 width=1240, height=GY["book"] + 110))

# =====================================================================
# Diagramme de classes global
# =====================================================================
C = {
 "user": ("User", ["- id : UUID", "- email : String", "- phone : String", "- passwordHash : String", "- role : Role",
                   "- firstName : String", "- lastName : String", "- locale : String", "- isActive : Boolean"],
          ["+ seConnecter()", "+ reinitialiserMotDePasse()"], 640, 10),
 "parent": ("Parent", ["- notificationPreferences : Json"], ["+ suivreEnfant()"], 300, 120),
 "notif": ("Notification", ["- channel : NotificationChannel", "- type : String", "- content : String",
                            "- status : NotificationStatus", "- scheduledAt : DateTime", "- sentAt : DateTime"], ["+ envoyer()"], 20, 30),
 "student": ("Student", ["- level : String", "- section : String", "- parentPhone : String",
                         "- monthlyFee : Decimal", "- archivedAt : DateTime"], ["+ archiver()"], 560, 290),
 "teacher": ("Teacher", ["- subjects : String[]"], ["+ demarrerSeance()"], 1010, 160),
 "gs": ("GroupStudent", ["- joinedAt : DateTime", "- leftAt : DateTime"], [], 860, 330),
 "group": ("Group", ["- name : String", "- level : String", "- section : String", "- subject : String",
                     "- monthlySessions : Int", "- monthlyFee : Decimal", "- capacity : Int"],
           ["+ inscrireEleves()", "+ archiver()"], 1100, 330),
 "review": ("ReviewPeriod", ["- name : String", "- startDate : Date", "- endDate : Date",
                             "- status : ReviewStatus", "- reason : String"], ["+ accepter()", "+ refuser()"], 1440, 150),
 "room": ("Room", ["- name : String", "- capacity : Int", "- isActive : Boolean"], [], 1520, 600),
 "session": ("Session", ["- startsAt : DateTime", "- endsAt : DateTime", "- status : SessionStatus",
                         "- isOnline : Boolean", "- meetingUrl : String", "- contentCovered : String", "- homework : String"],
             ["+ demarrer()", "+ terminer()"], 1150, 610),
 "att": ("Attendance", ["- status : AttendanceStatus", "- note : String", "- markedAt : DateTime"], [], 860, 640),
 "inst": ("Installment", ["- number : Int", "- amountDue : Decimal", "- amountPaid : Decimal", "- status : InstallmentStatus"],
          [], 300, 470),
 "pay": ("Payment", ["- amount : Decimal", "- method : PaymentMethod", "- receiptNumber : Int", "- paidAt : DateTime"],
         ["+ annuler()"], 20, 470),
 "ex": ("Exercise", ["- title : String", "- description : String", "- subject : String", "- level : String",
                     "- difficulty : Difficulty"], ["+ publier()"], 560, 860),
 "q": ("ExerciseQuestion", ["- order : Int", "- type : QuestionType", "- points : Decimal", "- modelAnswer : String",
                            "- criteria : Json"], [], 250, 860),
 "asg": ("ExerciseAssignment", ["- publishAt : DateTime", "- dueAt : DateTime", "- maxAttempts : Int"], [], 860, 880),
 "video": ("CourseVideo", ["- title : String", "- url : String", "- publishedAt : DateTime"], ["+ publier()"], 1160, 900),
 "sub": ("Submission", ["- attempt : Int", "- status : SubmissionStatus", "- submittedAt : DateTime"], ["+ soumettre()"], 860, 1060),
 "corr": ("Correction", ["- source : CorrectionSource", "- status : CorrectionStatus", "- proposedScore : Decimal",
                         "- finalScore : Decimal", "- comment : String", "- confidence : Float"], ["+ valider()"], 520, 1080),
 "level": ("CodeLevel", ["- title : String", "- kind : CodeLevelKind", "- statement : String", "- data : Json"], [], 1460, 880),
 "prog": ("CodeProgress", ["- attempts : Int", "- stars : Int", "- completedAt : DateTime", "- lastCode : String"],
          ["+ enregistrerEssai()"], 1440, 1080),
 "lead": ("AgentLead", ["- name : String", "- phone : String", "- reason : AgentLeadReason", "- status : AgentLeadStatus"], [], 20, 860),
 "order": ("AgentOrder", ["- name : String", "- phone : String", "- location : String", "- status : AgentOrderStatus"], [], 20, 1080),
}
R = [
 ("user", "student", "assoc", "1", "0..1", ""), ("user", "parent", "assoc", "1", "0..1", ""),
 ("user", "teacher", "assoc", "1", "0..1", ""), ("user", "notif", "assoc", "0..1", "*", "reçoit"),
 ("parent", "student", "assoc", "*", "1..*", "suit"),
 ("group", "gs", "comp", "1", "*", ""), ("student", "gs", "assoc", "1", "*", ""),
 ("teacher", "group", "assoc", "1", "*", "anime"), ("group", "session", "comp", "1", "*", ""),
 ("room", "session", "assoc", "0..1", "*", ""), ("session", "att", "comp", "1", "*", ""),
 ("student", "att", "assoc", "1", "*", ""), ("student", "inst", "assoc", "1", "*", ""),
 ("inst", "pay", "comp", "1", "1..*", ""), ("teacher", "review", "assoc", "1", "*", "demande"),
 ("review", "session", "assoc", "0..1", "*", ""), ("ex", "q", "comp", "1", "*", ""),
 ("ex", "asg", "assoc", "1", "*", ""), ("group", "asg", "assoc", "0..1", "*", ""),
 ("asg", "sub", "comp", "1", "*", ""), ("student", "sub", "assoc", "1", "*", ""),
 ("sub", "corr", "comp", "1", "0..1", ""), ("group", "video", "assoc", "1..*", "*", ""),
 ("level", "prog", "assoc", "1", "*", ""), ("student", "prog", "assoc", "1", "*", ""),
]
save(class_diagram("02_classes_global", "Diagramme de classes global", C, R, 1760, 1240))

# =====================================================================
# Architecture
# =====================================================================
save(blocks("03_architecture_technique", "Architecture technique", [
 ("users", "Navigateur|Administrateur, Enseignant,|Élève, Parent", 20, 200, 190, 70, "#FFFFFF"),
 ("front", "Frontend React 18 (SPA)|Vite · TanStack Query · Zustand|Pyodide (Python WebAssembly)", 280, 190, 250, 90, "#B5DEE1"),
 ("api", "API REST NestJS 12|Guards JWT + rôles · Swagger|Services métier · tâches planifiées", 620, 190, 260, 90, "#B5DEE1"),
 ("db", "PostgreSQL 17|Prisma ORM 7", 990, 100, 190, 64, "#FFF4D6"),
 ("files", "Stockage fichiers|(exercices, pièces jointes)", 990, 200, 190, 64, "#FFF4D6"),
 ("ia", "Service IA de correction|(fournisseur LLM)", 990, 300, 190, 64, "#FBE3D3"),
 ("wa", "WhatsApp|(Baileys, numéro du centre)", 620, 400, 260, 60, "#E3F1E5"),
 ("n8n", "n8n + modèle Groq|Agent IA conversationnel", 990, 410, 190, 64, "#E3F1E5"),
 ("smtp", "Serveur SMTP|(emails)", 620, 60, 260, 56, "#E3F1E5"),
], [
 ("users", "front", "<>HTTPS", False), ("front", "api", "<>REST / JSON + JWT", False),
 ("api", "db", "<>SQL", False), ("api", "files", "<>", False), ("api", "ia", "<>HTTPS", True),
 ("api", "wa", "<>messages", False), ("wa", "n8n", "webhook", False), ("n8n", "api", "x-agent-key", True),
 ("api", "smtp", "", False),
], 1210, 500))

save(blocks("04_architecture_monorepo", "Organisation du monorepo", [
 ("root", "Najahni/ (dépôt Git)", 330, 20, 220, 46, "#FFF4D6"),
 ("api", "api/|NestJS + Prisma|routes · actors · core", 20, 130, 200, 74, "#B5DEE1"),
 ("front", "frontend/|React + Vite|actors · core · components", 245, 130, 200, 74, "#B5DEE1"),
 ("auto", "automation/|workflow n8n|fiche du centre", 470, 130, 180, 74, "#E3F1E5"),
 ("docs", "docs/ et|docker-compose.yml", 675, 130, 180, 74, "#E3F1E5"),
], [("root", "api", "", False), ("root", "front", "", False), ("root", "auto", "", False), ("root", "docs", "", False)], 880, 230))

# =====================================================================
# Sprint 1 : acces et comptes
# =====================================================================
save(usecase("10_uc_sprint1", "Cas d'utilisation - Sprint 1", [
 ("admin", "Administrateur", 30, 120), ("teach", "Enseignant", 30, 330), ("student", "Élève", 30, 470), ("parent", "Parent", 30, 590)],
 [("comptes", "Gérer les élèves", 260, 30), ("ens", "Gérer les enseignants", 260, 105), ("par", "Gérer les parents", 260, 180),
  ("lier", "Lier un parent|à un enfant", 500, 180), ("rst", "Générer un mot de passe|temporaire", 260, 255),
  ("chg", "Changer son|mot de passe", 260, 360), ("out", "Se déconnecter", 260, 440), ("fgt", "Réinitialiser le|mot de passe oublié", 260, 560)],
 [("admin", u) for u in ["comptes", "ens", "par", "rst"]] + [(a, u) for a in ["teach", "student", "parent"] for u in ["chg", "out", "fgt"]] + [("admin", "chg"), ("admin", "out")],
 ext=[("lier", "par")], auth=(820, 300), auth_inc=["comptes", "ens", "par", "rst", "chg", "out"], width=1030, height=680))

save(class_diagram("11_classes_sprint1", "Classes - Sprint 1", {
 "user": ("User", ["- id : UUID", "- email : String", "- phone : String", "- passwordHash : String", "- role : Role",
                   "- firstName : String", "- lastName : String", "- isActive : Boolean", "- lastLoginAt : DateTime"],
          ["+ seConnecter()", "+ changerMotDePasse()"], 360, 20),
 "rt": ("RefreshToken", ["- tokenHash : String", "- expiresAt : DateTime", "- revokedAt : DateTime", "- ip : String"], ["+ revoquer()"], 30, 20),
 "pr": ("PasswordReset", ["- tokenHash : String", "- expiresAt : DateTime", "- usedAt : DateTime"], [], 30, 220),
 "audit": ("AuditLog", ["- action : String", "- entity : String", "- entityId : String", "- metadata : Json", "- ip : String"], [], 720, 20),
 "student": ("Student", ["- level : String", "- section : String", "- parentPhone : String", "- monthlyFee : Decimal", "- archivedAt : DateTime"],
             ["+ archiver()", "+ restaurer()"], 250, 400),
 "parent": ("Parent", ["- notificationPreferences : Json"], [], 30, 420),
 "teacher": ("Teacher", ["- subjects : String[]"], [], 560, 420),
}, [("user", "rt", "comp", "1", "*", ""), ("user", "pr", "comp", "1", "*", ""), ("user", "audit", "assoc", "0..1", "*", "auteur"),
    ("user", "student", "assoc", "1", "0..1", ""), ("user", "parent", "assoc", "1", "0..1", ""), ("user", "teacher", "assoc", "1", "0..1", ""),
    ("parent", "student", "assoc", "*", "1..*", "suit")], 960, 560,
 enums={"role": ("Role", ["ADMIN", "TEACHER", "STUDENT", "PARENT"], 780, 220)}))

PART_STD = lambda actor, label: [(actor, label, "actor"), ("ui", "Interface React", "sys"), ("api", "API NestJS", "sys"), ("db", "Base de données", "db")]

save(sequence("12_seq_authentification", "Séquence - S'authentifier", PART_STD("u", "Utilisateur"), [
 ("m", "u", "ui", "Saisir identifiant et mot de passe"),
 ("m", "ui", "api", "POST /auth/login"),
 ("s", "api", "Vérifier la limite d'essais (5/min)"),
 ("m", "api", "db", "Chercher l'utilisateur (email ou téléphone)"),
 ("r", "db", "api", "Utilisateur"),
 ("s", "api", "Vérifier le mot de passe (Argon2id)"),
 ("alt", [("identifiants invalides ou compte désactivé", [
     ("m", "api", "db", "Journaliser auth.login_failed"),
     ("r", "api", "ui", "401 Identifiants invalides"),
     ("r", "ui", "u", "Afficher le message d'erreur")]),
   ("identifiants valides", [
     ("m", "api", "db", "Mettre à jour lastLoginAt et journaliser"),
     ("s", "api", "Signer le jeton d'accès JWT (15 min)"),
     ("m", "api", "db", "Enregistrer le refresh token haché"),
     ("r", "api", "ui", "accessToken, refreshToken, profil"),
     ("r", "ui", "u", "Rediriger vers l'espace du rôle")])]),
]))

save(sequence("13_seq_mot_de_passe_oublie", "Séquence - Réinitialiser le mot de passe", [
 ("u", "Utilisateur", "actor"), ("ui", "Interface React", "sys"), ("api", "API NestJS", "sys"), ("db", "Base de données", "db"), ("ext", "Email / WhatsApp", "ext")], [
 ("m", "u", "ui", "Saisir l'email ou le téléphone"),
 ("m", "ui", "api", "POST /auth/forgot-password"),
 ("r", "api", "ui", "200 (réponse immédiate)"),
 ("m", "api", "db", "Chercher le compte actif"),
 ("opt", "compte trouvé et pas de demande depuis 5 min", [
     ("m", "api", "db", "Invalider les anciens liens, créer un jeton (1 h)"),
     ("m", "api", "ext", "Envoyer le lien (email, sinon WhatsApp)")]),
 ("m", "u", "ui", "Ouvrir le lien et saisir le nouveau mot de passe"),
 ("m", "ui", "api", "POST /auth/reset-password"),
 ("m", "api", "db", "Vérifier le jeton (non utilisé, non expiré)"),
 ("alt", [("jeton invalide", [("r", "api", "ui", "400 Lien invalide ou expiré")]),
          ("jeton valide", [("m", "api", "db", "Enregistrer le hash, marquer le jeton, révoquer les sessions"),
                            ("r", "api", "ui", "200"), ("r", "ui", "u", "Retour à la connexion")])]),
]))

save(sequence("14_seq_creer_eleve", "Séquence - Créer un élève", PART_STD("a", "Administrateur"), [
 ("ref", "S'authentifier"),
 ("m", "a", "ui", "Remplir le formulaire de l'élève"),
 ("s", "ui", "Valider le formulaire (Zod)"),
 ("m", "ui", "api", "POST /admin/students"),
 ("s", "api", "Valider le DTO (class-validator)"),
 ("m", "api", "db", "Vérifier que l'email et le téléphone sont libres"),
 ("alt", [("email ou téléphone déjà utilisé", [("r", "api", "ui", "409 erreurs par champ"), ("r", "ui", "a", "Afficher les erreurs sous les champs")]),
          ("données valides", [
              ("s", "api", "Générer un mot de passe temporaire"),
              ("m", "api", "db", "Créer User + Student (+ liens parents) en transaction"),
              ("m", "api", "db", "Inscrire dans les groupes (contrôle de capacité)"),
              ("m", "api", "db", "Journaliser student.create"),
              ("r", "api", "ui", "Élève créé + mot de passe temporaire"),
              ("r", "ui", "a", "Afficher le mot de passe à transmettre")])]),
]))

# =====================================================================
# Sprint 2 : groupes, salles, planning
# =====================================================================
save(usecase("20_uc_sprint2", "Cas d'utilisation - Sprint 2", [
 ("admin", "Administrateur", 30, 150), ("teach", "Enseignant", 30, 470)],
 [("grp", "Gérer les groupes", 260, 30), ("ins", "Inscrire des élèves|dans un groupe", 500, 30), ("arc", "Archiver / restaurer|un groupe", 500, 105),
  ("salle", "Gérer les salles", 260, 140), ("plan", "Planifier une séance", 260, 260), ("serie", "Répéter chaque|semaine", 500, 230),
  ("move", "Déplacer une séance|(glisser-déposer)", 260, 340), ("ann", "Annuler / supprimer|une séance", 260, 420), ("mes", "Consulter ses groupes", 260, 520)],
 [("admin", u) for u in ["grp", "salle", "plan", "move", "ann"]] + [("teach", u) for u in ["plan", "move", "ann", "mes"]],
 ext=[("ins", "grp"), ("arc", "grp"), ("serie", "plan")], auth=(820, 280), auth_inc=["grp", "salle", "plan", "move", "ann", "mes"], width=1030, height=620))

save(class_diagram("21_classes_sprint2", "Classes - Sprint 2", {
 "teacher": ("Teacher", ["- subjects : String[]"], [], 30, 30),
 "group": ("Group", ["- name : String", "- level : String", "- section : String", "- subject : String", "- monthlySessions : Int",
                     "- monthlyFee : Decimal", "- capacity : Int", "- archivedAt : DateTime"], ["+ inscrireEleves()", "+ archiver()"], 300, 20),
 "gs": ("GroupStudent", ["- joinedAt : DateTime", "- leftAt : DateTime"], [], 640, 40),
 "student": ("Student", ["- level : String", "- section : String"], [], 640, 200),
 "session": ("Session", ["- startsAt : DateTime", "- endsAt : DateTime", "- status : SessionStatus", "- seriesId : String",
                         "- isOnline : Boolean", "- meetingUrl : String"], ["+ deplacer()", "+ annuler()"], 300, 330),
 "room": ("Room", ["- name : String", "- capacity : Int", "- isActive : Boolean"], [], 30, 360),
}, [("teacher", "group", "assoc", "1", "*", "anime"), ("group", "gs", "comp", "1", "*", ""), ("student", "gs", "assoc", "1", "*", ""),
    ("group", "session", "comp", "1", "*", ""), ("room", "session", "assoc", "0..1", "*", ""), ("teacher", "session", "assoc", "1", "*", "")],
 900, 560, enums={"st": ("SessionStatus", ["PLANNED", "IN_PROGRESS", "DONE", "CANCELLED"], 680, 360)}))

save(sequence("22_seq_inscrire_eleves", "Séquence - Inscrire des élèves dans un groupe", PART_STD("a", "Administrateur"), [
 ("ref", "S'authentifier"),
 ("m", "a", "ui", "Choisir des élèves pour le groupe"),
 ("m", "ui", "api", "POST /admin/groups/:id/students"),
 ("m", "api", "db", "Verrouiller la ligne du groupe (SELECT ... FOR UPDATE)"),
 ("alt", [("groupe archivé", [("r", "api", "ui", "400 Le groupe est archivé")]),
          ("groupe actif", [
              ("m", "api", "db", "Compter les inscrits actifs"),
              ("alt", [("capacité dépassée", [("r", "api", "ui", "400 Capacité du groupe dépassée")]),
                       ("places suffisantes", [("m", "api", "db", "Créer ou réactiver GroupStudent"),
                                               ("m", "api", "db", "Journaliser group.add_students"),
                                               ("r", "api", "ui", "Groupe mis à jour"),
                                               ("r", "ui", "a", "Afficher la liste des élèves")])])])]),
]))

save(sequence("23_seq_planifier_seance", "Séquence - Planifier une séance", PART_STD("e", "Enseignant / Admin"), [
 ("ref", "S'authentifier"),
 ("m", "e", "ui", "Glisser le groupe sur le calendrier (FullCalendar)"),
 ("m", "ui", "api", "POST /teacher/sessions (groupe, créneau, salle, semaines)"),
 ("s", "api", "Vérifier le créneau (fin > début, 6 h max)"),
 ("m", "api", "db", "Vérifier la salle (active, capacité suffisante)"),
 ("s", "api", "Calculer les créneaux hebdomadaires"),
 ("m", "api", "db", "Chercher les séances qui chevauchent (enseignant, salle, groupe)"),
 ("alt", [("conflit trouvé", [("r", "api", "ui", "409 Conflit de planning + détail"), ("r", "ui", "e", "Afficher le conflit et annuler le déplacement")]),
          ("aucun conflit", [("m", "api", "db", "Créer les séances (même seriesId)"), ("m", "api", "db", "Journaliser session.create"),
                             ("r", "api", "ui", "Séances créées"), ("r", "ui", "e", "Afficher les séances sur le calendrier")])]),
]))

# =====================================================================
# Sprint 3 : seances, presences, notifications
# =====================================================================
save(usecase("30_uc_sprint3", "Cas d'utilisation - Sprint 3", [
 ("teach", "Enseignant", 30, 150), ("admin", "Administrateur", 30, 440), ("student", "Élève", 30, 560), ("parent", "Parent", 30, 650)],
 [("start", "Démarrer une séance", 260, 30), ("call", "Faire l'appel", 260, 105), ("notes", "Saisir les notes|de séance", 260, 180),
  ("end", "Terminer la séance", 260, 255), ("notif", "Envoyer les alertes|d'absence", 520, 330), ("wa", "Gérer la connexion|WhatsApp", 260, 400),
  ("msg", "Suivre les messages|WhatsApp", 260, 475), ("plan", "Consulter le planning|et les présences", 260, 600)],
 [("teach", u) for u in ["start", "call", "notes", "end"]] + [("admin", "wa"), ("admin", "msg"), ("student", "plan"), ("parent", "plan")],
 inc=[("end", "notif")], boxes=[("agent", "Agent de notification", 800, 430)], sys_links=[("notif", "agent")],
 auth=(800, 200), auth_inc=["start", "call", "notes", "end", "wa", "msg", "plan"], width=1030, height=720))

save(class_diagram("31_classes_sprint3", "Classes - Sprint 3", {
 "session": ("Session", ["- startsAt : DateTime", "- endsAt : DateTime", "- status : SessionStatus", "- contentCovered : String",
                         "- homework : String", "- startedAt : DateTime", "- endedAt : DateTime"], ["+ demarrer()", "+ faireAppel()", "+ terminer()"], 300, 20),
 "group": ("Group", ["- name : String", "- monthlySessions : Int"], [], 30, 40),
 "att": ("Attendance", ["- status : AttendanceStatus", "- note : String", "- markedAt : DateTime"], [], 640, 40),
 "student": ("Student", ["- parentPhone : String"], [], 660, 260),
 "notif": ("Notification", ["- channel : NotificationChannel", "- type : String", "- content : String", "- phone : String",
                            "- status : NotificationStatus", "- dedupeKey : String", "- scheduledAt : DateTime", "- attempts : Int"],
           ["+ mettreEnFile()", "+ envoyer()"], 280, 330),
 "teacher": ("Teacher", ["- subjects : String[]"], [], 30, 250),
}, [("group", "session", "comp", "1", "*", ""), ("session", "att", "comp", "1", "*", ""), ("student", "att", "assoc", "1", "*", ""),
    ("student", "notif", "assoc", "0..1", "*", "concerne"), ("teacher", "session", "assoc", "1", "*", "anime")], 900, 560,
 enums={"as": ("AttendanceStatus", ["PRESENT", "ABSENT"], 30, 400)}))

save(sequence("32_seq_demarrer_appel", "Séquence - Démarrer une séance et faire l'appel", PART_STD("e", "Enseignant"), [
 ("ref", "S'authentifier"),
 ("m", "e", "ui", "Ouvrir la séance et cliquer sur Démarrer"),
 ("m", "ui", "api", "POST /teacher/sessions/:id/start"),
 ("m", "api", "db", "Charger la séance de l'enseignant"),
 ("alt", [("séance non planifiée ou plus de 30 min avant le début", [("r", "api", "ui", "400 La séance ne peut pas être démarrée")]),
          ("démarrage autorisé", [
              ("m", "api", "db", "Passer la séance IN_PROGRESS"),
              ("m", "api", "db", "Créer une présence ABSENT pour chaque élève"),
              ("r", "api", "ui", "Feuille d'appel"),
              ("m", "e", "ui", "Cocher les élèves présents"),
              ("m", "ui", "api", "PUT /teacher/sessions/:id/attendance"),
              ("m", "api", "db", "Vérifier l'appartenance au groupe et enregistrer"),
              ("r", "api", "ui", "Feuille d'appel à jour")])]),
]))

save(sequence("33_seq_terminer_seance", "Séquence - Terminer une séance", [
 ("e", "Enseignant", "actor"), ("api", "API NestJS", "sys"), ("db", "Base de données", "db"), ("q", "File de notifications", "sys"), ("wa", "WhatsApp", "ext")], [
 ("m", "e", "api", "POST /teacher/sessions/:id/complete"),
 ("m", "api", "db", "Compter les élèves sans présence"),
 ("alt", [("appel incomplet", [("r", "api", "e", "400 Terminez l'appel")]),
          ("appel complet", [
              ("m", "api", "db", "Passer la séance DONE"),
              ("m", "api", "db", "Compter les présences de chaque élève"),
              ("s", "api", "Repérer les élèves qui terminent leur série"),
              ("m", "api", "q", "Mettre en file une alerte par parent d'absent (+5 min)"),
              ("r", "api", "e", "Séance terminée + séries terminées")])]),
 ("loop", "toutes les 15 à 30 s, hors heures de nuit, 150 messages par jour au maximum", [
     ("m", "q", "db", "Prendre le prochain message en attente"),
     ("m", "q", "db", "Vérifier qu'il est toujours utile (élève toujours absent)"),
     ("alt", [("devenu inutile", [("m", "q", "db", "Statut CANCELLED")]),
              ("toujours utile", [("m", "q", "wa", "Envoyer le message au parent"), ("m", "q", "db", "Statut SENT (ou nouvel essai, 3 au maximum)")])])]),
]))

# =====================================================================
# Sprint 4 : paiements, revenus, espace parent
# =====================================================================
save(usecase("40_uc_sprint4", "Cas d'utilisation - Sprint 4", [
 ("admin", "Administrateur", 30, 90), ("teach", "Enseignant", 30, 300), ("parent", "Parent", 30, 500), ("student", "Élève", 30, 620)],
 [("etat", "Consulter l'état des|paiements d'un groupe", 260, 30), ("payer", "Enregistrer un paiement", 260, 105),
  ("annul", "Annuler le dernier|paiement", 520, 105), ("sheet", "Consulter la feuille|présence / paiement", 260, 180),
  ("rev", "Consulter les revenus", 260, 255), ("rappel", "Envoyer les rappels|de paiement", 520, 330),
  ("child", "Suivre son enfant", 260, 480), ("spay", "Consulter ses paiements", 260, 600)],
 [(a, u) for a in ["admin", "teach"] for u in ["etat", "payer", "sheet", "rev"]] + [("parent", "child"), ("student", "spay")],
 ext=[("annul", "payer")], boxes=[("agent", "Agent de notification", 800, 430)], sys_links=[("rappel", "agent")],
 auth=(800, 200), auth_inc=["etat", "payer", "sheet", "rev", "child", "spay"], width=1030, height=720))

save(class_diagram("41_classes_sprint4", "Classes - Sprint 4", {
 "group": ("Group", ["- monthlySessions : Int", "- monthlyFee : Decimal"], [], 30, 30),
 "student": ("Student", ["- monthlyFee : Decimal"], ["+ etatSerie()"], 330, 30),
 "inst": ("Installment", ["- number : Int", "- amountDue : Decimal", "- amountPaid : Decimal", "- status : InstallmentStatus"], ["+ marquerPayee()"], 300, 230),
 "pay": ("Payment", ["- amount : Decimal", "- method : PaymentMethod", "- receiptNumber : Int", "- paidAt : DateTime"], ["+ annuler()"], 640, 230),
 "user": ("User", ["- firstName : String", "- lastName : String", "- role : Role"], [], 660, 30),
 "parent": ("Parent", ["- notificationPreferences : Json"], ["+ suivreEnfant()"], 30, 250),
}, [("group", "inst", "assoc", "1", "*", ""), ("student", "inst", "assoc", "1", "*", ""), ("inst", "pay", "comp", "1", "1..*", ""),
    ("user", "pay", "assoc", "0..1", "*", "reçoit"), ("parent", "student", "assoc", "*", "1..*", "suit")], 900, 440))

save(sequence("42_seq_enregistrer_paiement", "Séquence - Enregistrer un paiement", PART_STD("e", "Enseignant / Admin"), [
 ("ref", "S'authentifier"),
 ("m", "e", "ui", "Cliquer sur Payé pour un élève"),
 ("m", "ui", "api", "POST /teacher/payments/groups/:g/students/:s/pay (série)"),
 ("m", "api", "db", "Compter les présences et les séries payées"),
 ("s", "api", "Calculer la série à régler (nextToPay)"),
 ("alt", [("la série demandée n'est plus la prochaine (double clic)", [("r", "api", "ui", "Aucun changement")]),
          ("série à régler", [
              ("m", "api", "db", "Créer Installment + Payment (espèces, n° de reçu)"),
              ("alt", [("contrainte unique violée (requête simultanée)", [("r", "api", "ui", "Aucun changement")]),
                       ("enregistré", [("m", "api", "db", "Journaliser payment.create"), ("r", "api", "ui", "Série payée"),
                                       ("r", "ui", "e", "Mettre à jour la ligne de l'élève")])])])]),
]))

save(sequence("43_seq_suivre_enfant", "Séquence - Suivre son enfant", PART_STD("p", "Parent"), [
 ("ref", "S'authentifier"),
 ("m", "p", "ui", "Choisir un enfant"),
 ("m", "ui", "api", "GET /parent/children/:id"),
 ("m", "api", "db", "Vérifier le lien parent-enfant"),
 ("alt", [("enfant non lié", [("r", "api", "ui", "404 Introuvable")]),
          ("enfant lié", [
              ("r", "api", "ui", "Profil et groupes"),
              ("m", "ui", "api", "GET .../sessions, .../attendance, .../payments"),
              ("m", "api", "db", "Séances des 14 jours, présences, séries et paiements"),
              ("r", "api", "ui", "Données de suivi"),
              ("r", "ui", "p", "Afficher le tableau de bord de l'enfant")])]),
]))

# =====================================================================
# Sprint 5 : contenus pedagogiques, periodes de revision, correction IA
# =====================================================================
save(usecase("50_uc_sprint5", "Cas d'utilisation - Sprint 5", [
 ("teach", "Enseignant", 30, 170), ("admin", "Administrateur", 30, 420), ("student", "Élève", 30, 590)],
 [("dem", "Demander une période|de révision", 260, 30), ("gper", "Gestion des périodes|de révision", 520, 30),
  ("exo", "Publier un exercice|ou un document", 260, 105), ("video", "Publier une vidéo|de cours", 260, 180),
  ("valid", "Valider la correction", 260, 255), ("trait", "Traiter la demande|de période", 260, 420),
  ("list", "Consulter les exercices|et vidéos", 260, 520), ("submit", "Réaliser et soumettre|un exercice", 260, 600),
  ("corr", "Corriger l'exercice", 520, 600)],
 [("teach", u) for u in ["dem", "exo", "video", "valid"]] + [("admin", "trait"), ("student", "list"), ("student", "submit")],
 inc=[("submit", "corr")], ext=[("dem", "gper"), ("valid", "corr")],
 boxes=[("ia", "Système IA pour correction", 800, 590)], sys_links=[("corr", "ia")],
 auth=(800, 260), auth_inc=["dem", "exo", "video", "valid", "trait", "list", "submit"], width=1030, height=720))

save(class_diagram("51_classes_sprint5", "Classes - Sprint 5", {
 "review": ("ReviewPeriod", ["- name : String", "- startDate : Date", "- endDate : Date", "- status : ReviewStatus",
                             "- reason : String", "- rejectionReason : String"], ["+ accepter()", "+ refuser()"], 30, 20),
 "teacher": ("Teacher", ["- subjects : String[]"], [], 360, 40),
 "group": ("Group", ["- name : String", "- level : String"], [], 640, 40),
 "video": ("CourseVideo", ["- title : String", "- url : String", "- description : String", "- publishedAt : DateTime"], ["+ publier()"], 900, 30),
 "ex": ("Exercise", ["- title : String", "- description : String", "- level : String", "- difficulty : Difficulty", "- totalPoints : Decimal"],
        ["+ publier()"], 330, 240),
 "att": ("Attachment", ["- fileName : String", "- mimeType : String", "- size : Int", "- storageKey : String"], [], 30, 260),
 "q": ("ExerciseQuestion", ["- type : QuestionType", "- points : Decimal", "- options : Json", "- correctKeys : String[]",
                            "- modelAnswer : String", "- criteria : Json"], [], 30, 450),
 "asg": ("ExerciseAssignment", ["- publishAt : DateTime", "- dueAt : DateTime", "- maxAttempts : Int",
                                "- requiresTeacherValidation : Boolean"], [], 640, 240),
 "sub": ("Submission", ["- attempt : Int", "- status : SubmissionStatus", "- submittedAt : DateTime"], ["+ soumettre()"], 680, 450),
 "ans": ("SubmissionAnswer", ["- text : String", "- selectedKeys : String[]", "- ocrText : String"], [], 360, 470),
 "corr": ("Correction", ["- source : CorrectionSource", "- status : CorrectionStatus", "- proposedScore : Decimal", "- finalScore : Decimal",
                         "- comment : String", "- mistakes : Json", "- advice : Json", "- confidence : Float"], ["+ valider()", "+ publier()"], 960, 400),
 "log": ("AiCorrectionLog", ["- provider : String", "- model : String", "- inputTokens : Int", "- outputTokens : Int", "- costUsd : Decimal"], [], 960, 660),
}, [("teacher", "review", "assoc", "1", "*", "demande"), ("teacher", "ex", "assoc", "1", "*", "auteur"), ("ex", "att", "comp", "1", "*", ""),
    ("ex", "q", "comp", "1", "*", ""), ("ex", "asg", "assoc", "1", "*", ""), ("group", "asg", "assoc", "0..1", "*", ""),
    ("asg", "sub", "comp", "1", "*", ""), ("sub", "ans", "comp", "1", "*", ""), ("sub", "corr", "comp", "1", "0..1", ""),
    ("sub", "log", "assoc", "1", "*", ""), ("group", "video", "assoc", "1..*", "*", ""), ("q", "ans", "assoc", "1", "*", "")], 1230, 820))

save(sequence("52_seq_demande_revision", "Séquence - Demander et traiter une période de révision", [
 ("e", "Enseignant", "actor"), ("ui", "Interface React", "sys"), ("api", "API NestJS", "sys"), ("db", "Base de données", "db"), ("a", "Administrateur", "actor")], [
 ("ref", "S'authentifier"),
 ("m", "e", "ui", "Saisir nom, dates, groupes et motif"),
 ("m", "ui", "api", "POST /teacher/review-periods"),
 ("s", "api", "Vérifier les dates et les groupes de l'enseignant"),
 ("m", "api", "db", "Créer la demande (statut PENDING)"),
 ("r", "api", "ui", "Demande envoyée"),
 ("m", "a", "ui", "Ouvrir les demandes en attente"),
 ("m", "ui", "api", "PATCH /admin/review-periods/:id (décision)"),
 ("alt", [("refus", [("s", "api", "Exiger un motif de refus"), ("m", "api", "db", "Statut REJECTED + motif")]),
          ("acceptation", [("m", "api", "db", "Statut APPROVED"),
                           ("r", "api", "ui", "Planning de révision ouvert")])]),
 ("m", "api", "db", "Journaliser la décision et notifier l'enseignant"),
]))

save(sequence("53_seq_soumettre_correction", "Séquence - Soumettre un exercice et correction IA", [
 ("s", "Élève", "actor"), ("ui", "Interface React", "sys"), ("api", "API NestJS", "sys"), ("db", "Base de données", "db"), ("ia", "Système IA", "ext")], [
 ("ref", "S'authentifier"),
 ("m", "s", "ui", "Répondre aux questions et soumettre"),
 ("m", "ui", "api", "POST /student/assignments/:id/submissions"),
 ("m", "api", "db", "Vérifier la date limite et le nombre de tentatives"),
 ("alt", [("délai dépassé ou tentatives épuisées", [("r", "api", "ui", "400 Soumission refusée")]),
          ("soumission acceptée", [
              ("m", "api", "db", "Enregistrer la soumission (SUBMITTED)"),
              ("r", "api", "ui", "Soumission enregistrée"),
              ("s", "api", "Corriger les QCM automatiquement"),
              ("opt", "questions ouvertes", [
                  ("s", "api", "Anonymiser (sans nom ni téléphone)"),
                  ("m", "api", "ia", "Énoncé, barème, réponse modèle, réponse de l'élève"),
                  ("r", "ia", "api", "JSON : note, commentaire, erreurs, conseils, confiance"),
                  ("m", "api", "db", "Journaliser l'appel IA (jetons, coût)")]),
              ("m", "api", "db", "Créer la correction PROPOSED (statut PENDING_REVIEW)")])]),
]))

save(sequence("54_seq_valider_correction", "Séquence - Valider la correction", PART_STD("e", "Enseignant"), [
 ("ref", "S'authentifier"),
 ("m", "e", "ui", "Ouvrir les corrections à valider"),
 ("m", "ui", "api", "GET /teacher/corrections?status=PROPOSED"),
 ("r", "api", "ui", "Corrections proposées"),
 ("m", "e", "ui", "Accepter, modifier ou rejeter la note"),
 ("m", "ui", "api", "PATCH /teacher/corrections/:id"),
 ("alt", [("acceptée", [("m", "api", "db", "finalScore = proposedScore, ACCEPTED")]),
          ("modifiée", [("m", "api", "db", "finalScore saisi, MODIFIED")]),
          ("rejetée", [("m", "api", "db", "REJECTED, correction manuelle demandée")])]),
 ("m", "api", "db", "Publier : soumission PUBLISHED, date de publication"),
 ("r", "api", "ui", "Correction publiée"),
 ("r", "ui", "e", "Retirer de la liste à valider"),
]))

save(sequence("55_seq_publier_exercice", "Séquence - Publier un exercice", PART_STD("e", "Enseignant"), [
 ("ref", "S'authentifier"),
 ("m", "e", "ui", "Saisir titre, niveau, groupes et fichiers"),
 ("m", "ui", "api", "POST /teacher/exercises (multipart)"),
 ("s", "api", "Contrôler les fichiers (10 au max, 10 Mo, PDF/images/Word)"),
 ("m", "api", "db", "Vérifier que les groupes sont à l'enseignant et du même niveau"),
 ("alt", [("contrôle échoué", [("r", "api", "ui", "400 message explicite")]),
          ("contrôle réussi", [("s", "api", "Écrire les fichiers sur le disque"),
                               ("m", "api", "db", "Créer Exercise + affectations + pièces jointes"),
                               ("m", "api", "db", "Journaliser exercise.create"),
                               ("r", "api", "ui", "Exercice publié"), ("r", "ui", "e", "Afficher l'exercice dans la liste")])]),
]))

# =====================================================================
# Sprint 6 : Coder, agent IA, tableau de bord
# =====================================================================
save(usecase("60_uc_sprint6", "Cas d'utilisation - Sprint 6", [
 ("student", "Élève", 30, 90), ("teach", "Enseignant", 30, 260), ("admin", "Administrateur", 30, 400), ("contact", "Contact WhatsApp", 30, 600)],
 [("map", "Consulter la carte|des missions", 260, 30), ("play", "Résoudre une mission|(Python ou algorithme)", 260, 105),
  ("follow", "Suivre la progression|Coder", 260, 255), ("leads", "Traiter les rappels|et les commandes", 260, 380),
  ("dash", "Consulter le tableau|de bord", 260, 455), ("ask", "Poser une question|au centre", 260, 560),
  ("call", "Demander un rappel", 520, 560), ("book", "Commander un livre", 260, 640)],
 [("student", "map"), ("student", "play"), ("teach", "follow"), ("admin", "follow"), ("admin", "leads"), ("admin", "dash"),
  ("contact", "ask"), ("contact", "book")],
 ext=[("call", "ask")], boxes=[("bot", "Agent IA conversationnel|(n8n)", 800, 580)], sys_links=[("ask", "bot"), ("call", "bot"), ("book", "bot")],
 auth=(800, 220), auth_inc=["map", "play", "follow", "leads", "dash"], width=1030, height=740))

save(class_diagram("61_classes_sprint6", "Classes - Sprint 6", {
 "chap": ("CodeChapter", ["- slug : String", "- kind : CodeLevelKind", "- track : CodeTrack", "- order : Int", "- title : String"], [], 30, 20),
 "level": ("CodeLevel", ["- slug : String", "- kind : CodeLevelKind", "- statement : String", "- starterCode : String",
                         "- solution : String", "- hints : String[]", "- data : Json"], ["+ estOuvert()"], 320, 20),
 "prog": ("CodeProgress", ["- attempts : Int", "- stars : Int", "- completedAt : DateTime", "- lastCode : String",
                           "- language : CodeLanguage", "- bestCode : String"], ["+ enregistrerEssai()"], 640, 20),
 "student": ("Student", ["- level : String", "- section : String"], ["+ parcours() : CodeTrack"], 660, 270),
 "lead": ("AgentLead", ["- name : String", "- phone : String", "- channel : AgentChannel", "- reason : AgentLeadReason",
                        "- question : String", "- status : AgentLeadStatus"], ["+ changerStatut()"], 30, 300),
 "order": ("AgentOrder", ["- name : String", "- phone : String", "- location : String", "- items : String", "- status : AgentOrderStatus"],
           ["+ changerStatut()"], 330, 320),
}, [("chap", "level", "comp", "1", "*", ""), ("level", "prog", "assoc", "1", "*", ""), ("student", "prog", "assoc", "1", "*", "")], 900, 520,
 enums={"track": ("CodeTrack", ["BASES", "TROIS_SI", "BAC_INFO", "BAC_ECO"], 640, 400)}))

save(sequence("62_seq_mission_coder", "Séquence - Résoudre une mission Coder", [
 ("s", "Élève", "actor"), ("ui", "Interface React", "sys"), ("py", "Worker Pyodide", "sys"), ("api", "API NestJS", "sys"), ("db", "Base de données", "db")], [
 ("ref", "S'authentifier"),
 ("m", "s", "ui", "Ouvrir une mission"),
 ("m", "ui", "api", "GET /student/coding/levels/:id"),
 ("m", "api", "db", "Vérifier que la mission précédente est réussie"),
 ("r", "api", "ui", "Énoncé, indices, tests (sans solution)"),
 ("m", "s", "ui", "Écrire le code (Python ou algorithme)"),
 ("opt", "algorithme en notation tunisienne", [("s", "ui", "Traduire l'algorithme en Python et vérifier le TDO")]),
 ("m", "ui", "py", "Exécuter le code avec les tests"),
 ("r", "py", "ui", "Résultat des tests + trace pour la scène"),
 ("m", "ui", "api", "POST /student/coding/levels/:id/attempts"),
 ("s", "api", "Calculer les étoiles (lignes ou nombre d'essais)"),
 ("m", "api", "db", "Mettre à jour CodeProgress (meilleur résultat)"),
 ("r", "api", "ui", "Étoiles et mission suivante débloquée"),
 ("r", "ui", "s", "Rejouer la scène et afficher les étoiles"),
]))

save(sequence("63_seq_agent_whatsapp", "Séquence - Agent IA conversationnel", [
 ("c", "Contact", "actor"), ("wa", "WhatsApp", "ext"), ("api", "API NestJS", "sys"), ("n8n", "Agent n8n + LLM", "ext"), ("db", "Base de données", "db")], [
 ("m", "c", "wa", "Envoyer une question"),
 ("m", "wa", "api", "Message reçu (Baileys)"),
 ("s", "api", "Filtrer : numéro autorisé, limite par heure"),
 ("m", "api", "n8n", "Webhook : texte, numéro, nom"),
 ("m", "n8n", "api", "GET /agent/fiche (x-agent-key)"),
 ("r", "api", "n8n", "Fiche du centre"),
 ("alt", [("réponse dans la fiche", [("m", "n8n", "api", "POST /agent/reply")]),
          ("question hors fiche", [("m", "n8n", "api", "POST /agent/leads"), ("m", "api", "db", "Créer ou mettre à jour le rappel"),
                                   ("m", "n8n", "api", "POST /agent/reply (l'équipe va rappeler)")]),
          ("commande de livre", [("m", "n8n", "api", "POST /agent/orders"), ("m", "api", "db", "Créer la commande"),
                                 ("m", "n8n", "api", "POST /agent/reply (confirmation)")])]),
 ("m", "api", "wa", "Envoyer la réponse"),
 ("r", "wa", "c", "Réponse de l'agent"),
]))

print(len(made), "figures generees")
