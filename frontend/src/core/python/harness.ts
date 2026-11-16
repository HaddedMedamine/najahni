// Code Python charge une seule fois dans Pyodide : il execute le code de l'eleve
// (fichier virtuel "<eleve>"), capture print / input, et verifie les tests.
// Les instructions de la souris appellent le module JS `_jeu` fourni par le moteur.
// Aventure Bac : le tableau suivi et les fichiers notent chaque operation (la "trace"),
// que la scene rejoue ensuite : l'eleve voit ce que son propre code a fait.

export const HARNESS = String.raw`
import builtins, io, json, os, pickle, sys, traceback


class _Stop(BaseException):
    """La souris ne peut plus avancer (mur, chat, limite) : on arrete le programme."""


class _Console(io.TextIOBase):
    """print() ecrit a la fois dans la sortie verifiee et dans la console affichee."""

    def __init__(self):
        self.out = []
        self.transcript = []

    def write(self, s):
        self.out.append(s)
        self.transcript.append(s)
        return len(s)


def _ligne_eleve():
    f = sys._getframe(1)
    while f is not None:
        if f.f_code.co_filename == "<eleve>":
            return f.f_lineno
        f = f.f_back
    return None


_trace = []
_ouverts = []
_TRACE_MAX = 4000
_DOSSIER = "/tmp/najahni"


def _noter(**evenement):
    if len(_trace) < _TRACE_MAX:
        evenement["line"] = _ligne_eleve()
        _trace.append(evenement)


class _Suivi:
    """Tableau dont chaque lecture et chaque ecriture sont notees."""

    def __init__(self, valeurs):
        self.v = list(valeurs)
        self.lectures = 0
        self.ecritures = 0

    def _case(self, i):
        i = int(i)
        if i < 0 or i >= len(self.v):
            raise IndexError(f"indice {i} : le tableau va de 0 a {len(self.v) - 1}")
        return i

    def __getitem__(self, i):
        if isinstance(i, slice):
            return self.v[i]
        i = self._case(i)
        self.lectures += 1
        _noter(t="get", i=i)
        return self.v[i]

    def __setitem__(self, i, valeur):
        i = self._case(i)
        self.ecritures += 1
        self.v[i] = _python(valeur)
        _noter(t="set", i=i, v=self.v[i])

    def __len__(self):
        return len(self.v)

    def __iter__(self):
        return iter(list(self.v))

    def tolist(self):
        return list(self.v)


_fiches = []


def _numero(fiche):
    for n, f in enumerate(_fiches):
        if f is fiche:
            return n
    _fiches.append(fiche)
    return len(_fiches) - 1


def _simple(valeur):
    valeur = _python(valeur)
    return valeur if isinstance(valeur, (str, int, float, bool)) else str(valeur)


class _Fiche(dict):
    """Enregistrement (dict du programme) dont chaque champ lu ou ecrit est note."""

    def __setitem__(self, champ, valeur):
        dict.__setitem__(self, champ, valeur)
        _noter(t="field", r=_numero(self), k=str(champ), v=_simple(valeur))

    def __getitem__(self, champ):
        valeur = dict.__getitem__(self, champ)
        _noter(t="look", r=_numero(self), k=str(champ))
        return valeur


class _Ligne:
    def __init__(self, matrice, i):
        self.m = matrice
        self.i = i

    def __getitem__(self, j):
        return self.m.lire(self.i, j)

    def __setitem__(self, j, valeur):
        self.m.ecrire(self.i, j, valeur)

    def __len__(self):
        return len(self.m.v[self.i])

    def __iter__(self):
        return iter(list(self.m.v[self.i]))


class _Matrice:
    """Matrice dont chaque lecture et chaque ecriture sont notees : M[i][j] ou M[i, j]."""

    def __init__(self, lignes):
        self.v = [list(ligne) for ligne in lignes]

    def _case(self, i, j):
        i, j = int(i), int(j)
        if not (0 <= i < len(self.v) and 0 <= j < len(self.v[0])):
            raise IndexError(f"case [{i}, {j}] : la matrice a {len(self.v)} lignes et {len(self.v[0])} colonnes")
        return i, j

    def lire(self, i, j):
        i, j = self._case(i, j)
        _noter(t="mget", i=i, j=j)
        return self.v[i][j]

    def ecrire(self, i, j, valeur):
        i, j = self._case(i, j)
        self.v[i][j] = _python(valeur)
        _noter(t="mset", i=i, j=j, v=self.v[i][j])

    def __getitem__(self, k):
        if isinstance(k, tuple):
            return self.lire(*k)
        self._case(k, 0)
        return _Ligne(self, int(k))

    def __setitem__(self, k, valeur):
        self.ecrire(*k, valeur)

    def __len__(self):
        return len(self.v)

    def tolist(self):
        return [list(ligne) for ligne in self.v]


class _Fichier:
    """Fichier texte dont chaque operation est notee (les donnees sont dans un vrai fichier)."""

    def __init__(self, nom, mode, reel):
        self.nom = nom
        self.reel = reel
        _ouverts.append(self)
        _noter(t="open", file=nom, mode=mode)

    def write(self, texte):
        n = self.reel.write(texte)
        if isinstance(texte, str):
            _noter(t="write", file=self.nom, text=texte)
        return n

    def readline(self):
        ligne = self.reel.readline()
        if ligne:
            _noter(t="read", file=self.nom, text=ligne)
        else:
            _noter(t="eof", file=self.nom)
        return ligne

    def read(self):
        texte = self.reel.read()
        if texte:
            _noter(t="read", file=self.nom, text=texte)
        _noter(t="eof", file=self.nom)
        return texte

    def readlines(self):
        return list(self)

    def __iter__(self):
        return self

    def __next__(self):
        ligne = self.readline()
        if not ligne:
            raise StopIteration
        return ligne

    def fin(self):
        position = self.reel.tell()
        vide = not self.reel.read(1)
        self.reel.seek(position)
        if vide:
            _noter(t="eof", file=self.nom)
        return vide

    def close(self):
        if self in _ouverts:
            _ouverts.remove(self)
            _noter(t="close", file=self.nom)
        self.reel.close()

    def __enter__(self):
        return self

    def __exit__(self, *erreur):
        self.close()


def _ouvrir(nom, mode="r", *args, **options):
    if "b" not in mode:
        options.setdefault("encoding", "utf-8")
    return _Fichier(str(nom), mode, builtins.open(nom, mode, *args, **options))


_dump_vrai = pickle.dump
_load_vrai = pickle.load


def _etiquette(objet):
    """Ce qu'on lit sur la fiche rangee dans le fichier."""
    if isinstance(objet, dict):
        return " ".join(str(v) for v in dict.values(objet))
    return str(objet)


def _dump(objet, fichier, *args, **options):
    objet = dict(objet) if isinstance(objet, dict) else _python(objet)
    _dump_vrai(objet, getattr(fichier, "reel", fichier), *args, **options)
    if isinstance(fichier, _Fichier):
        _noter(t="write", file=fichier.nom, text=_etiquette(objet) + "\n")


def _load(fichier, *args, **options):
    nom = fichier.nom if isinstance(fichier, _Fichier) else None
    try:
        objet = _load_vrai(getattr(fichier, "reel", fichier), *args, **options)
    except EOFError:
        if nom:
            _noter(t="eof", file=nom)
        raise
    if nom:
        _noter(t="read", file=nom, text=_etiquette(objet) + "\n")
    return _Fiche(objet) if isinstance(objet, dict) else objet


# "from pickle import *" donne ces versions au programme de l'eleve
pickle.dump = _dump
pickle.load = _load


def _objets(nom):
    """Objets d'un fichier de donnees apres le programme."""
    if not os.path.exists(nom):
        return None
    resultat = []
    with builtins.open(nom, "rb") as f:
        while True:
            try:
                resultat.append(_load_vrai(f))
            except EOFError:
                return resultat


def _fin_fichier(fichier):
    return fichier.fin()


def _texte(nom):
    """Contenu d'un fichier apres le programme (None s'il n'existe pas)."""
    if not os.path.exists(nom):
        return None
    with builtins.open(nom, encoding="utf-8") as f:
        return f.read()


def _preparer(fichiers, donnees=None):
    """Dossier vide pour chaque essai, avec les fichiers de depart du test."""
    _trace.clear()
    _fiches.clear()
    for f in _ouverts:
        f.reel.close()
    _ouverts.clear()
    os.makedirs(_DOSSIER, exist_ok=True)
    os.chdir(_DOSSIER)
    for nom in os.listdir("."):
        os.remove(nom)
    for nom, texte in (fichiers or {}).items():
        with builtins.open(nom, "w", encoding="utf-8") as f:
            f.write(texte)
    for nom, objets in (donnees or {}).items():
        with builtins.open(nom, "wb") as f:
            for objet in objets:
                _dump_vrai(objet, f)


def _montrer(valeur):
    if isinstance(valeur, (_Suivi, _Matrice)):
        return "T"
    return repr(_python(valeur))


def _suivre_appels(ns, noms):
    """Note chaque appel et chaque retour : les appels recursifs passent aussi par ici."""
    etat = {"niveau": 0, "max": 0}

    def envelopper(nom, fonction):
        def appel(*args):
            _noter(t="call", f=nom, a=", ".join(_montrer(a) for a in args), d=etat["niveau"])
            etat["niveau"] += 1
            etat["max"] = max(etat["max"], etat["niveau"])
            try:
                resultat = fonction(*args)
            finally:
                etat["niveau"] -= 1
            _noter(t="ret", f=nom, v=_simple(resultat) if resultat is not None else "", d=etat["niveau"])
            return resultat

        return appel

    for nom in noms:
        if callable(ns.get(nom)):
            ns[nom] = envelopper(nom, ns[nom])
    return etat


def _surveiller(noms):
    """Note chaque changement de valeur des variables surveillees."""
    vues = {}

    def ligne(frame, evenement, arg):
        variables = frame.f_locals
        for nom in noms:
            if nom in variables:
                valeur = _simple(variables[nom])
                if vues.get(nom, vues) != valeur:
                    vues[nom] = valeur
                    _noter(t="var", k=nom, v=valeur)
        return ligne

    def appel(frame, evenement, arg):
        return ligne if frame.f_code.co_filename == "<eleve>" else None

    return appel


def _erreur(e):
    line = None
    if isinstance(e, SyntaxError) and e.filename == "<eleve>":
        line = e.lineno
    for fr in traceback.extract_tb(e.__traceback__):
        if fr.filename == "<eleve>":
            line = fr.lineno
    return {"type": type(e).__name__, "message": str(e), "line": line}


def _executer(code, ns, entrees, console):
    feed = list(entrees or [])

    def input(prompt=""):
        if not feed:
            raise EOFError("input() : pas de donnee a lire")
        value = str(feed.pop(0))
        console.transcript.append(str(prompt) + value + "\n")
        return value

    ns["input"] = input
    ns["open"] = _ouvrir
    ns["Fin_fichier"] = _fin_fichier
    ns["_suivi"] = _Suivi
    ns["_matrice"] = _Matrice
    ns["dict"] = _Fiche
    ns["_texte"] = _texte
    ns["_objets"] = _objets
    old = sys.stdout
    sys.stdout = console
    try:
        exec(compile(code, "<eleve>", "exec"), ns)
        return None
    except _Stop:
        return None
    except BaseException as e:
        return _erreur(e)
    finally:
        sys.stdout = old


def _instruction(nom, capteur):
    import _jeu

    def f():
        r = _jeu.act(nom, _ligne_eleve())
        if r == "stop":
            raise _Stop()
        return bool(r) if capteur else None

    f.__name__ = nom
    return f


def _executer_grille(code, commandes, capteurs):
    ns = {"__name__": "__main__"}
    for fr, en in json.loads(commandes).items():
        ns[fr] = ns[en] = _instruction(fr, False)
    for fr, en in json.loads(capteurs).items():
        ns[fr] = ns[en] = _instruction(fr, True)
    console = _Console()
    err = _executer(code, ns, [], console)
    return json.dumps({"stdout": "".join(console.transcript), "error": err})


def _executer_libre(code, entrees):
    _preparer(None)
    console = _Console()
    err = _executer(code, {"__name__": "__main__"}, json.loads(entrees), console)
    return json.dumps({"stdout": "".join(console.transcript), "error": err})


def _norm(s):
    return " ".join(str(s).replace(",", " ").split())


def _nombres(s):
    import re

    return [float(n.replace(",", ".")) for n in re.findall(r"-?\d+(?:[.,]\d+)?", s)]


def _contient_dans_l_ordre(liste, attendus):
    pos = 0
    for a in attendus:
        while pos < len(liste) and abs(liste[pos] - a) > 1e-6:
            pos += 1
        if pos == len(liste):
            return False
        pos += 1
    return True


def _python(v):
    """Valeur numpy (np.int64, array...) -> valeur Python simple."""
    return v.tolist() if hasattr(v, "tolist") else v


def _egal(a, b):
    a, b = _python(a), _python(b)
    if isinstance(a, float) or isinstance(b, float):
        try:
            return abs(float(a) - float(b)) < 1e-6
        except (TypeError, ValueError):
            return False
    return bool(a == b)


def _un_test(code, t, premier=True):
    _preparer(t.get("files"), t.get("records"))
    console = _Console()
    ns = {"__name__": "__main__"}
    # Le suivi des variables ralentit Python : seul le premier test est rejoue
    if premier and t.get("watch"):
        sys.settrace(_surveiller(t["watch"]))
    try:
        return _tester(code, t, ns, console)
    finally:
        sys.settrace(None)


def _tester(code, t, ns, console):
    err = _executer(code, ns, t.get("inputs"), console)
    resultat = {"ok": False, "stdout": "".join(console.transcript), "error": err, "trace": _trace}
    if err:
        return resultat
    appels = _suivre_appels(ns, t.get("calls", []))
    old = sys.stdout
    sys.stdout = console
    try:
        if "expr" in t:
            # Appel de fonction : on compare la valeur obtenue a la valeur attendue
            if t.get("setup"):
                exec(t["setup"], ns)
            obtenu = eval(t["expr"], ns)
            resultat["got"] = repr(_python(obtenu))
            resultat["ok"] = _egal(obtenu, eval(t["expected"], ns))
        elif "numbers" in t:
            # Programme complet : les nombres attendus doivent etre affiches, dans l'ordre
            # (le texte autour est libre : print(s) ou print("La somme =", s))
            attendus = [float(n) for n in t["numbers"]]
            resultat["ok"] = _contient_dans_l_ordre(_nombres("".join(console.out)), attendus)
            resultat["got"] = "".join(console.out).strip()
        else:
            # Programme complet : chaque texte attendu doit apparaitre, dans l'ordre
            sortie = _norm("".join(console.out))
            pos = 0
            resultat["ok"] = True
            for attendu in t["output"]:
                i = sortie.find(_norm(attendu), pos)
                if i < 0:
                    resultat["ok"] = False
                    break
                pos = i + len(_norm(attendu))
            resultat["got"] = "".join(console.out).strip()
        if t.get("recursive") and appels["max"] < 2:
            resultat["ok"] = False
            resultat["got"] = "La fonction ne s'appelle pas elle-meme"
        sortie = _norm("".join(console.out))
        for mot in t.get("absent", []):
            if _norm(mot) in sortie:
                resultat["ok"] = False
                resultat["got"] = f"{mot} ne doit pas etre affiche"
        if t.get("closed") and _ouverts:
            resultat["ok"] = False
            resultat["got"] = f"{_ouverts[0].nom} : fichier non ferme"
    except BaseException as e:
        resultat["error"] = _erreur(e)
    finally:
        sys.stdout = old
    resultat["stdout"] = "".join(console.transcript)
    return resultat


def _executer_tests(code, tests):
    # Seule la trace du premier test est rejouee par la scene
    resultats = []
    for i, t in enumerate(json.loads(tests)):
        r = _un_test(code, t, i == 0)
        r["trace"] = list(r["trace"]) if i == 0 else []
        resultats.append(r)
    return json.dumps(resultats)
`
