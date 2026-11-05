// Code Python charge une seule fois dans Pyodide : il execute le code de l'eleve
// (fichier virtuel "<eleve>"), capture print / input, et verifie les tests.
// Les instructions de la souris appellent le module JS `_jeu` fourni par le moteur.

export const HARNESS = String.raw`
import builtins, io, json, sys, traceback


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


def _un_test(code, t):
    console = _Console()
    ns = {"__name__": "__main__"}
    err = _executer(code, ns, t.get("inputs"), console)
    resultat = {"ok": False, "stdout": "".join(console.transcript), "error": err}
    if err:
        return resultat
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
    except BaseException as e:
        resultat["error"] = _erreur(e)
    return resultat


def _executer_tests(code, tests):
    return json.dumps([_un_test(code, t) for t in json.loads(tests)])
`
