"""Petit moteur de diagrammes UML pour le rapport Najahni.

Chaque diagramme est ecrit en trois fichiers :
  - .drawio : modifiable dans draw.io (formes natives)
  - .svg    : apercu vectoriel
  - .png    : image inseree dans le rapport Word
"""
import html
import math
from pathlib import Path

FILL, STROKE, TEXT = "#B5DEE1", "#3D7F86", "#1F1F1F"
FONT = "Arial"
CHAR_W = 6.4  # largeur moyenne d'un caractere a 11 px


def esc(s):
    return html.escape(str(s), quote=True)


def text_w(s, size=11):
    return len(str(s)) * CHAR_W * size / 11


class Diagram:
    def __init__(self, name, width, height, title=""):
        self.name, self.w, self.h, self.title = name, width, height, title
        self.svg, self.cells, self._n = [], [], 1

    def nid(self):
        self._n += 1
        return f"n{self._n}"

    # ---------- primitives SVG ----------
    def s(self, x):
        self.svg.append(x)

    def txt(self, x, y, s, size=11, anchor="middle", bold=False, italic=False, color=TEXT):
        b = ' font-weight="bold"' if bold else ""
        it = ' font-style="italic"' if italic else ""
        self.s(f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" text-anchor="{anchor}" fill="{color}"{b}{it}>{esc(s)}</text>')

    def mtxt(self, cx, cy, s, size=11, bold=False):
        parts = str(s).split("|")
        y0 = cy - (len(parts) - 1) * (size + 3) / 2 + size * 0.35
        for k, p in enumerate(parts):
            self.txt(cx, y0 + k * (size + 3), p, size, bold=bold)

    def head(self, x1, y1, x2, y2, kind):
        """Pointe dessinee en (x2, y2), dans la direction (x1, y1) -> (x2, y2).
        kind : fill (triangle plein) | open (chevron) | tri (triangle vide, heritage) | dfill / dvoid (losange)."""
        L = math.hypot(x2 - x1, y2 - y1) or 1
        ux, uy = (x2 - x1) / L, (y2 - y1) / L
        nx, ny = -uy, ux
        if kind in ("fill", "open"):
            a, b = 10, 4.5
            p1 = (x2 - ux * a + nx * b, y2 - uy * a + ny * b)
            p2 = (x2 - ux * a - nx * b, y2 - uy * a - ny * b)
            if kind == "fill":
                self.s(f'<path d="M{p1[0]:.1f},{p1[1]:.1f} L{x2:.1f},{y2:.1f} L{p2[0]:.1f},{p2[1]:.1f} Z" fill="{STROKE}" stroke="{STROKE}"/>')
            else:
                self.s(f'<path d="M{p1[0]:.1f},{p1[1]:.1f} L{x2:.1f},{y2:.1f} L{p2[0]:.1f},{p2[1]:.1f}" fill="none" stroke="{STROKE}" stroke-width="1.2"/>')
        elif kind == "tri":
            a, b = 15, 7.5
            p1 = (x2 - ux * a + nx * b, y2 - uy * a + ny * b)
            p2 = (x2 - ux * a - nx * b, y2 - uy * a - ny * b)
            self.s(f'<path d="M{p1[0]:.1f},{p1[1]:.1f} L{x2:.1f},{y2:.1f} L{p2[0]:.1f},{p2[1]:.1f} Z" fill="white" stroke="{STROKE}"/>')
        else:
            a, b = 18, 6
            m = (x2 - ux * a / 2, y2 - uy * a / 2)
            pts = [(x2, y2), (m[0] + nx * b, m[1] + ny * b), (x2 - ux * a, y2 - uy * a), (m[0] - nx * b, m[1] - ny * b)]
            fill = STROKE if kind == "dfill" else "white"
            self.s('<path d="M' + " L".join(f"{p[0]:.1f},{p[1]:.1f}" for p in pts) + f' Z" fill="{fill}" stroke="{STROKE}"/>')

    def actor_svg(self, x, y, label):
        cx = x + 15
        self.s(f'<g stroke="{STROKE}" fill="{FILL}" stroke-width="1.2"><circle cx="{cx}" cy="{y+8}" r="8"/>'
               f'<line x1="{cx}" y1="{y+16}" x2="{cx}" y2="{y+40}"/><line x1="{x}" y1="{y+24}" x2="{x+30}" y2="{y+24}"/>'
               f'<line x1="{cx}" y1="{y+40}" x2="{x}" y2="{y+60}"/><line x1="{cx}" y1="{y+40}" x2="{x+30}" y2="{y+60}"/></g>')
        self.mtxt(cx, y + 76, label)

    # ---------- primitives draw.io ----------
    def cell(self, value, style, x, y, w, h, parent="1"):
        i = self.nid()
        self.cells.append(f'<mxCell id="{i}" value="{esc(value)}" style="{style}" vertex="1" parent="{parent}">'
                          f'<mxGeometry x="{x:.0f}" y="{y:.0f}" width="{w:.0f}" height="{h:.0f}" as="geometry"/></mxCell>')
        return i

    def edge(self, style, value="", src=None, tgt=None, p1=None, p2=None, pts=None, children=()):
        i = self.nid()
        st = f' source="{src}"' if src else ""
        tg = f' target="{tgt}"' if tgt else ""
        geo = ""
        if p1:
            geo += f'<mxPoint x="{p1[0]:.0f}" y="{p1[1]:.0f}" as="sourcePoint"/>'
        if p2:
            geo += f'<mxPoint x="{p2[0]:.0f}" y="{p2[1]:.0f}" as="targetPoint"/>'
        if pts:
            geo += '<Array as="points">' + "".join(f'<mxPoint x="{a:.0f}" y="{b:.0f}"/>' for a, b in pts) + "</Array>"
        self.cells.append(f'<mxCell id="{i}" value="{esc(value)}" style="{style}" edge="1" parent="1"{st}{tg}>'
                          f'<mxGeometry relative="1" as="geometry">{geo}</mxGeometry></mxCell>')
        for pos, label in children:
            self.cells.append(f'<mxCell id="{self.nid()}" value="{esc(label)}" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontSize=10;labelBackgroundColor=none;" vertex="1" connectable="0" parent="{i}">'
                              f'<mxGeometry x="{pos}" relative="1" as="geometry"><mxPoint as="offset" y="-10"/></mxGeometry></mxCell>')
        return i

    # ---------- sortie ----------
    def save(self, out_dir, zoom=2.0):
        out = Path(out_dir)
        out.mkdir(parents=True, exist_ok=True)
        head = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w:.0f}" height="{self.h:.0f}" font-family="{FONT}" font-size="11">'
                '<rect width="100%" height="100%" fill="white"/><defs>'
                f'<marker id="open" markerWidth="11" markerHeight="9" refX="10" refY="4.5" orient="auto"><path d="M0,0 L10,4.5 L0,9" fill="none" stroke="{STROKE}"/></marker>'
                f'<marker id="fill" markerWidth="11" markerHeight="9" refX="10" refY="4.5" orient="auto"><path d="M0,0 L10,4.5 L0,9 Z" fill="{STROKE}" stroke="{STROKE}"/></marker>'
                f'<marker id="tri" markerWidth="16" markerHeight="14" refX="15" refY="7" orient="auto"><path d="M0,0 L15,7 L0,14 Z" fill="white" stroke="{STROKE}"/></marker>'
                f'<marker id="dfill" markerWidth="20" markerHeight="12" refX="1" refY="6" orient="auto"><path d="M1,6 L10,1 L19,6 L10,11 Z" fill="{STROKE}" stroke="{STROKE}"/></marker>'
                f'<marker id="dvoid" markerWidth="20" markerHeight="12" refX="1" refY="6" orient="auto"><path d="M1,6 L10,1 L19,6 L10,11 Z" fill="white" stroke="{STROKE}"/></marker>'
                '</defs>')
        svg = head + "".join(self.svg) + "</svg>"
        (out / f"{self.name}.svg").write_text(svg, encoding="utf-8")
        xml = (f'<mxfile host="app.diagrams.net"><diagram name="{esc(self.title or self.name)}" id="{self.name}">'
               f'<mxGraphModel dx="{self.w:.0f}" dy="{self.h:.0f}" grid="1" gridSize="10" guides="1" page="1" pageScale="1" '
               f'pageWidth="{self.w:.0f}" pageHeight="{self.h:.0f}" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>'
               + "".join(self.cells) + "</root></mxGraphModel></diagram></mxfile>")
        (out / f"{self.name}.drawio").write_text(xml, encoding="utf-8")
        import pymupdf
        doc = pymupdf.open(out / f"{self.name}.svg")
        doc[0].get_pixmap(matrix=pymupdf.Matrix(zoom, zoom)).save(out / f"{self.name}.png")
        return out / f"{self.name}.png"


# =====================================================================
# Diagramme de sequence
# =====================================================================
def sequence(name, title, parts, items, gap=None):
    """parts : [(id, libelle, type)] type = actor | sys | db | ext
    items : ("m", a, b, txt) appel ; ("r", a, b, txt) retour ; ("s", a, txt) message a soi-meme ;
            ("alt", [(garde, [items]), ...]) ; ("opt", garde, [items]) ; ("loop", garde, [items]) ; ("ref", txt)"""
    labels = [p[1] for p in parts]
    gap = gap or max(170, max(text_w(l) for l in labels) + 40)
    x0 = 90
    X = {p[0]: x0 + i * gap for i, p in enumerate(parts)}
    width = x0 + (len(parts) - 1) * gap + 150
    top = 95
    counter = [0]
    rows = []  # liste d'operations de dessin calculees au premier passage

    def measure(items, y, depth):
        for it in items:
            k = it[0]
            if k in ("m", "r"):
                rows.append((k, it[1], it[2], it[3], y, depth))
                y += 34
            elif k == "s":
                rows.append(("s", it[1], None, it[2], y, depth))
                y += 46
            elif k == "ref":
                rows.append(("ref", None, None, it[1], y, depth))
                y += 46
            elif k in ("alt", "opt", "loop"):
                branches = it[1] if k == "alt" else [(it[1], it[2])]
                start = y
                y += 24
                seps = []
                for bi, (guard, sub) in enumerate(branches):
                    if bi:
                        seps.append(y)
                        y += 6
                    rows.append(("guard", None, None, guard, y, depth + 1))
                    y += 18
                    y = measure(sub, y, depth + 1)
                y += 8
                rows.append(("frame", k, seps, None, start, depth, y))
                y += 12
        return y

    bottom = measure(items, top + 20, 0) + 20
    d = Diagram(name, width, bottom + 20, title)
    minx = min(X.values()) - 70
    maxx = max(X.values()) + 70

    # en-tetes et lignes de vie
    for pid, label, kind in parts:
        x = X[pid]
        if kind == "actor":
            d.actor_svg(x - 15, 8, label)
            d.cell(label, f"shape=umlLifeline;participant=umlActor;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=0;collapsible=0;size=60;fillColor={FILL};strokeColor={STROKE};verticalAlign=top;labelPosition=center;", x - 20, 8, 40, bottom - 8)
        else:
            w = max(110, text_w(label) + 24)
            if kind == "db":
                d.s(f'<path d="M{x-w/2},{30} a{w/2},8 0 0,0 {w},0 a{w/2},8 0 0,0 {-w},0 v40 a{w/2},8 0 0,0 {w},0 v-40" fill="{FILL}" stroke="{STROKE}"/>')
                d.mtxt(x, 58, label)
            else:
                d.s(f'<rect x="{x-w/2:.1f}" y="30" width="{w:.1f}" height="44" fill="{FILL}" stroke="{STROKE}" rx="2"/>')
                d.mtxt(x, 52, label)
            d.cell(label, f"shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=0;collapsible=0;size=44;fillColor={FILL};strokeColor={STROKE};", x - w / 2, 30, w, bottom - 30)
        d.s(f'<line x1="{x}" y1="{82 if kind=="actor" else 74}" x2="{x}" y2="{bottom}" stroke="{STROKE}" stroke-dasharray="5,4"/>')

    # cadres d'abord (sous les fleches)
    for r in rows:
        if r[0] == "frame":
            _, kind, seps, _, y1, depth, y2 = r
            fx1, fx2 = minx + depth * 8, maxx - depth * 8
            d.s(f'<rect x="{fx1}" y="{y1}" width="{fx2-fx1}" height="{y2-y1}" fill="none" stroke="#555"/>')
            d.s(f'<path d="M{fx1},{y1} h44 v12 l-6,8 h-38 z" fill="#EEF6F7" stroke="#555"/>')
            d.txt(fx1 + 18, y1 + 14, kind, 10, bold=True)
            d.cell(kind, "shape=umlFrame;whiteSpace=wrap;html=1;width=44;height=20;boundedLbl=1;verticalAlign=top;align=left;spacingLeft=5;fontStyle=1;fillColor=none;", fx1, y1, fx2 - fx1, y2 - y1)
            for sy in seps:
                d.s(f'<line x1="{fx1}" y1="{sy}" x2="{fx2}" y2="{sy}" stroke="#555" stroke-dasharray="6,4"/>')
                d.edge("endArrow=none;dashed=1;html=1;strokeColor=#555555;", p1=(fx1, sy), p2=(fx2, sy))
    for r in rows:
        k = r[0]
        if k == "frame":
            continue
        _, a, b, label, y, depth = r[:6]
        if k == "guard":
            fx1 = minx + (depth - 1) * 8
            d.txt(fx1 + 52, y + 10, f"[{label}]", 10, anchor="start", italic=True)
            d.cell(f"[{label}]", "text;html=1;align=left;verticalAlign=middle;fontSize=10;fontStyle=2;", fx1 + 50, y, text_w(label) + 30, 16)
            continue
        if k == "ref":
            fx1, fx2 = minx + depth * 8 + 20, maxx - depth * 8 - 20
            d.s(f'<rect x="{fx1}" y="{y}" width="{fx2-fx1}" height="34" fill="white" stroke="#555"/>')
            d.s(f'<path d="M{fx1},{y} h36 v12 l-6,6 h-30 z" fill="#EEF6F7" stroke="#555"/>')
            d.txt(fx1 + 14, y + 13, "ref", 10, bold=True)
            d.txt((fx1 + fx2) / 2, y + 22, label, 11)
            d.cell(label, "shape=umlFrame;whiteSpace=wrap;html=1;width=36;height=18;boundedLbl=1;fillColor=#FFFFFF;", fx1, y, fx2 - fx1, 34)
            continue
        counter[0] += 1
        num = f"{counter[0]}: {label}"
        if k == "s":
            x = X[a]
            d.s(f'<path d="M{x},{y+8} h34 v20 h-34" fill="none" stroke="{STROKE}"/>')
            d.head(x + 34, y + 28, x, y + 28, "fill")
            d.txt(x + 40, y + 21, num, 10, anchor="start")
            d.edge(f"html=1;endArrow=block;endFill=1;strokeColor={STROKE};align=left;spacingLeft=4;fontSize=10;", num,
                   p1=(x, y + 8), p2=(x, y + 28), pts=[(x + 34, y + 8), (x + 34, y + 28)])
            continue
        xa, xb = X[a], X[b]
        dash = ' stroke-dasharray="5,4"' if k == "r" else ""
        mk = "open" if k == "r" else "fill"
        d.s(f'<line x1="{xa}" y1="{y+16}" x2="{xb}" y2="{y+16}" stroke="{STROKE}"{dash}/>')
        d.head(xa, y + 16, xb, y + 16, mk)
        tw = text_w(num, 10) + 6
        d.s(f'<rect x="{(xa+xb)/2 - tw/2:.1f}" y="{y+1}" width="{tw:.1f}" height="13" fill="white" fill-opacity="0.9"/>')
        d.txt((xa + xb) / 2, y + 11, num, 10)
        style = (f"html=1;verticalAlign=bottom;endArrow=open;dashed=1;endSize=8;strokeColor={STROKE};fontSize=10;" if k == "r"
                 else f"html=1;verticalAlign=bottom;endArrow=block;endFill=1;strokeColor={STROKE};fontSize=10;")
        d.edge(style, num, p1=(xa, y + 16), p2=(xb, y + 16))
    d.txt(width / 2, bottom + 14, "", 1)
    return d


# =====================================================================
# Diagramme de classes
# =====================================================================
def class_diagram(name, title, classes, rels, width, height, enums=()):
    """classes : {id: (nom, [attributs], [methodes], x, y)}
    rels : (a, b, type, mult_a, mult_b, libelle)  type = assoc | comp | aggr | gen
    comp/aggr : le losange est du cote de a ; gen : a herite de b."""
    d = Diagram(name, width, height, title)
    box, ids = {}, {}
    for cid, (cname, attrs, meths, x, y) in classes.items():
        lines = [cname] + attrs + meths
        w = max(text_w(l, 10.5) for l in lines) + 22
        w = max(w, 120)
        h = 24 + 15 * len(attrs) + 8 + 15 * len(meths) + (8 if meths else 4)
        box[cid] = (x, y, w, h)
    for cid, (cname, attrs, meths, x, y) in classes.items():
        bx, by, w, h = box[cid]
        d.s(f'<rect x="{bx}" y="{by}" width="{w:.1f}" height="{h}" fill="white" stroke="{STROKE}"/>')
        d.s(f'<rect x="{bx}" y="{by}" width="{w:.1f}" height="24" fill="{FILL}" stroke="{STROKE}"/>')
        d.txt(bx + w / 2, by + 16, cname, 11, bold=True)
        yy = by + 24
        d.s(f'<line x1="{bx}" y1="{yy}" x2="{bx+w:.1f}" y2="{yy}" stroke="{STROKE}"/>')
        for k, a in enumerate(attrs):
            d.txt(bx + 6, yy + 14 + 15 * k, a, 10.5, anchor="start")
        yy += 15 * len(attrs) + 6
        if meths:
            d.s(f'<line x1="{bx}" y1="{yy}" x2="{bx+w:.1f}" y2="{yy}" stroke="{STROKE}"/>')
            for k, m in enumerate(meths):
                d.txt(bx + 6, yy + 14 + 15 * k, m, 10.5, anchor="start")
        lab = (f'<p style="margin:0px;margin-top:4px;text-align:center;"><b>{esc(cname)}</b></p><hr size="1"/>'
               f'<p style="margin:0px;margin-left:4px;">' + "<br/>".join(esc(a) for a in attrs) + "</p>"
               + ('<hr size="1"/><p style="margin:0px;margin-left:4px;">' + "<br/>".join(esc(m) for m in meths) + "</p>" if meths else ""))
        ids[cid] = d.nid()
        d.cells.append(f'<mxCell id="{ids[cid]}" value="{esc(lab)}" style="verticalAlign=top;align=left;overflow=fill;html=1;whiteSpace=wrap;fontSize=10;fillColor=#FFFFFF;strokeColor={STROKE};" vertex="1" parent="1">'
                       f'<mxGeometry x="{bx}" y="{by}" width="{w:.0f}" height="{h}" as="geometry"/></mxCell>')
    for eid, (ename, vals, x, y) in dict(enums).items():
        w = max(text_w(v, 10.5) for v in vals + [ename, "«enumeration»"]) + 22
        h = 38 + 15 * len(vals)
        d.s(f'<rect x="{x}" y="{y}" width="{w:.1f}" height="{h}" fill="#F4FAFB" stroke="{STROKE}"/>')
        d.txt(x + w / 2, y + 13, "«enumeration»", 9.5, italic=True)
        d.txt(x + w / 2, y + 27, ename, 11, bold=True)
        d.s(f'<line x1="{x}" y1="{y+33}" x2="{x+w:.1f}" y2="{y+33}" stroke="{STROKE}"/>')
        for k, v in enumerate(vals):
            d.txt(x + 6, y + 47 + 15 * k, v, 10.5, anchor="start")
        lab = (f'<p style="margin:0px;text-align:center;"><i>«enumeration»</i><br/><b>{esc(ename)}</b></p><hr size="1"/>'
               f'<p style="margin:0px;margin-left:4px;">' + "<br/>".join(esc(v) for v in vals) + "</p>")
        d.cells.append(f'<mxCell id="{d.nid()}" value="{esc(lab)}" style="verticalAlign=top;align=left;overflow=fill;html=1;whiteSpace=wrap;fontSize=10;fillColor=#F4FAFB;strokeColor={STROKE};" vertex="1" parent="1">'
                       f'<mxGeometry x="{x}" y="{y}" width="{w:.0f}" height="{h}" as="geometry"/></mxCell>')

    def center(c):
        x, y, w, h = box[c]
        return (x + w / 2, y + h / 2)

    def clip(c, toward):
        x, y, w, h = box[c]
        cx, cy = x + w / 2, y + h / 2
        dx, dy = toward[0] - cx, toward[1] - cy
        if dx == 0 and dy == 0:
            return (cx, cy)
        t = min(abs((w / 2) / dx) if dx else 9e9, abs((h / 2) / dy) if dy else 9e9)
        return (cx + dx * t, cy + dy * t)

    for a, b, kind, ma, mb, label in rels:
        pa, pb = clip(a, center(b)), clip(b, center(a))
        d.s(f'<line x1="{pa[0]:.1f}" y1="{pa[1]:.1f}" x2="{pb[0]:.1f}" y2="{pb[1]:.1f}" stroke="{STROKE}"/>')
        if kind in ("comp", "aggr"):
            d.head(pb[0], pb[1], pa[0], pa[1], "dfill" if kind == "comp" else "dvoid")
        elif kind == "gen":
            d.head(pa[0], pa[1], pb[0], pb[1], "tri")
        L = math.hypot(pb[0] - pa[0], pb[1] - pa[1]) or 1
        ux, uy = (pb[0] - pa[0]) / L, (pb[1] - pa[1]) / L
        nx, ny = -uy, ux
        if ma:
            d.txt(pa[0] + ux * 22 + nx * 9, pa[1] + uy * 22 + ny * 9 + 3, ma, 10)
        if mb:
            d.txt(pb[0] - ux * 22 + nx * 9, pb[1] - uy * 22 + ny * 9 + 3, mb, 10)
        if label:
            d.txt((pa[0] + pb[0]) / 2 - nx * 9, (pa[1] + pb[1]) / 2 - ny * 9 + 3, label, 10, italic=True)
        style = {"comp": "startArrow=diamondThin;startFill=1;startSize=14;endArrow=none;",
                 "aggr": "startArrow=diamondThin;startFill=0;startSize=14;endArrow=none;",
                 "gen": "endArrow=block;endFill=0;endSize=12;",
                 "assoc": "endArrow=none;"}[kind]
        ch = []
        if ma:
            ch.append(("-0.8", ma))
        if mb:
            ch.append(("0.8", mb))
        d.edge(f"{style}html=1;strokeColor={STROKE};fontSize=10;fontStyle=2;", label, src=ids[a], tgt=ids[b], children=ch)
    return d


# =====================================================================
# Diagramme de cas d'utilisation (style de l'equipe)
# =====================================================================
def usecase(name, title, actors, ucs, assoc, inc=(), ext=(), boxes=(), sys_links=(), auth=None, auth_inc=(),
            width=1100, height=None, uc_w=175, uc_h=58):
    """actors : [(id, libelle, x, y)] ; ucs : [(id, libelle, x, y)] ; boxes : [(id, titre, x, y)]
    auth : (x, y) position de S'authentifier ; auth_inc : cas d'utilisation qui l'incluent."""
    W, H = uc_w, uc_h
    P = {u[0]: (u[2], u[3]) for u in ucs}
    L = {u[0]: u[1] for u in ucs}
    if auth:
        P["auth"], L["auth"] = auth, "S'authentifier"
    A = {a[0]: (a[2], a[3]) for a in actors}
    B = {b[0]: (b[2], b[3]) for b in boxes}
    BW, BH = 200, 80
    height = height or max([y for _, y in P.values()] + [y for _, y in A.values()]) + 120
    d = Diagram(name, width, height, title)
    ids = {}

    def uc_center(u):
        x, y = P[u]
        return (x + W / 2, y + H / 2)

    def clip(u, t):
        cx, cy = uc_center(u)
        dx, dy = t[0] - cx, t[1] - cy
        if dx == 0 and dy == 0:
            return (cx, cy)
        k = 1 / math.sqrt((dx / (W / 2)) ** 2 + (dy / (H / 2)) ** 2)
        return (cx + dx * k, cy + dy * k)

    for u in P:
        x, y = P[u]
        ids[u] = d.cell(L[u].replace("|", "\n"), f"ellipse;whiteSpace=wrap;html=1;fontSize=11;fillColor={FILL};strokeColor={STROKE};", x, y, W, H)
    for a, lbl, x, y in actors:
        ids[a] = d.cell(lbl, f"shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fontSize=11;fillColor={FILL};strokeColor={STROKE};", x, y, 30, 60)
    for b, t, x, y in boxes:
        ids[b] = d.cell(t, f"swimlane;fontStyle=1;startSize=22;html=1;fontSize=11;fillColor={FILL};strokeColor={STROKE};swimlaneFillColor=#FFFFFF;", x, y, BW, BH)
    # liens
    for a, u in assoc:
        ax, ay = A[a]
        c = (ax + 15, ay + 26)
        p2 = clip(u, c)
        start = (c[0] + (16 if p2[0] > c[0] else -16), c[1])
        d.s(f'<line x1="{start[0]:.1f}" y1="{start[1]:.1f}" x2="{p2[0]:.1f}" y2="{p2[1]:.1f}" stroke="{STROKE}"/>')
        d.edge(f"endArrow=none;html=1;strokeColor={STROKE};", src=ids[a], tgt=ids[u])
    for u, b in sys_links:
        bx, by = B[b]
        t = (bx if bx > uc_center(u)[0] else bx + BW, by + BH / 2)
        p1 = clip(u, t)
        d.s(f'<line x1="{p1[0]:.1f}" y1="{p1[1]:.1f}" x2="{t[0]:.1f}" y2="{t[1]:.1f}" stroke="{STROKE}"/>')
        d.edge(f"endArrow=none;html=1;strokeColor={STROKE};", src=ids[u], tgt=ids[b])
    if auth:
        ax, ay = auth[0], auth[1] + H / 2
        cxm = auth[0] - 170
        for u in auth_inc:
            cx, cy = uc_center(u)
            p1 = (cx + W / 2, cy)
            d.s(f'<path d="M{p1[0]:.1f},{p1[1]:.1f} Q{cxm:.1f},{cy:.1f} {ax:.1f},{ay:.1f}" fill="none" stroke="{STROKE}" stroke-dasharray="4,3"/>')
            d.head(cxm, cy, ax, ay, "open")
            mx, my = 0.25 * p1[0] + 0.5 * cxm + 0.25 * ax, 0.25 * p1[1] + 0.5 * cy + 0.25 * ay
            d.txt(mx, my - 3, "«include»", 9, color="#333")
            d.edge(f"dashed=1;endArrow=open;curved=1;html=1;strokeColor={STROKE};fontSize=9;", "«include»", src=ids[u], tgt=ids["auth"], pts=[(cxm, cy)])
    for kind, rel in (("«include»", inc), ("«extend»", ext)):
        for s_, t_ in rel:
            p1, p2 = clip(s_, uc_center(t_)), clip(t_, uc_center(s_))
            d.s(f'<line x1="{p1[0]:.1f}" y1="{p1[1]:.1f}" x2="{p2[0]:.1f}" y2="{p2[1]:.1f}" stroke="{STROKE}" stroke-dasharray="4,3"/>')
            d.head(p1[0], p1[1], p2[0], p2[1], "open")
            d.txt((p1[0] + p2[0]) / 2 + 4, (p1[1] + p2[1]) / 2 - 4, kind, 9, anchor="start", color="#333")
            d.edge(f"dashed=1;endArrow=open;html=1;strokeColor={STROKE};fontSize=9;", kind, src=ids[s_], tgt=ids[t_])
    # formes par-dessus
    for u in P:
        x, y = P[u]
        d.s(f'<ellipse cx="{x+W/2}" cy="{y+H/2}" rx="{W/2}" ry="{H/2}" fill="{FILL}" stroke="{STROKE}"/>')
        d.mtxt(x + W / 2, y + H / 2, L[u], 10.5)
    for a, lbl, x, y in actors:
        d.actor_svg(x, y, lbl)
    for b, t, x, y in boxes:
        d.s(f'<rect x="{x}" y="{y}" width="{BW}" height="{BH}" fill="white" stroke="{STROKE}"/><rect x="{x}" y="{y}" width="{BW}" height="22" fill="{FILL}" stroke="{STROKE}"/>')
        d.mtxt(x + BW / 2, y + 11, t, 10.5, bold=True)
    return d


# =====================================================================
# Schema d'architecture (boites et fleches)
# =====================================================================
def blocks(name, title, nodes, links, width, height, groups=()):
    """nodes : [(id, libelle, x, y, w, h, couleur)] ; links : [(a, b, libelle, pointilles)]
    groups : [(libelle, x, y, w, h)] cadres de regroupement."""
    d = Diagram(name, width, height, title)
    N = {n[0]: n for n in nodes}
    ids = {}
    for g, x, y, w, h in groups:
        d.s(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#FAFDFD" stroke="{STROKE}" stroke-dasharray="6,4" rx="8"/>')
        d.txt(x + 10, y + 18, g, 12, anchor="start", bold=True, color=STROKE)
        d.cell(g, f"rounded=1;arcSize=4;whiteSpace=wrap;html=1;dashed=1;fillColor=#FAFDFD;strokeColor={STROKE};verticalAlign=top;align=left;spacingLeft=8;fontStyle=1;fontColor={STROKE};", x, y, w, h)

    def center(i):
        _, _, x, y, w, h, _ = N[i]
        return (x + w / 2, y + h / 2)

    def clip(i, t):
        _, _, x, y, w, h, _ = N[i]
        cx, cy = x + w / 2, y + h / 2
        dx, dy = t[0] - cx, t[1] - cy
        k = min(abs((w / 2) / dx) if dx else 9e9, abs((h / 2) / dy) if dy else 9e9)
        return (cx + dx * k, cy + dy * k)

    for i, lbl, x, y, w, h, col in nodes:
        ids[i] = d.cell(lbl.replace("|", "\n"), f"rounded=1;whiteSpace=wrap;html=1;fontSize=11;fillColor={col};strokeColor={STROKE};", x, y, w, h)
    for a, b, lbl, dashed in links:
        p1, p2 = clip(a, center(b)), clip(b, center(a))
        da = ' stroke-dasharray="5,4"' if dashed else ""
        d.s(f'<line x1="{p1[0]:.1f}" y1="{p1[1]:.1f}" x2="{p2[0]:.1f}" y2="{p2[1]:.1f}" stroke="{STROKE}" stroke-width="1.4"{da}/>')
        d.head(p1[0], p1[1], p2[0], p2[1], "fill")
        if lbl.startswith("<>"):
            d.head(p2[0], p2[1], p1[0], p1[1], "fill")
        text = lbl[2:] if lbl.startswith("<>") else lbl
        if text:
            mx, my = (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2
            tw = text_w(text, 10) + 8
            d.s(f'<rect x="{mx-tw/2:.1f}" y="{my-9:.1f}" width="{tw:.1f}" height="15" fill="white"/>')
            d.txt(mx, my + 2, text, 10, color="#333")
        st = "startArrow=block;startFill=1;" if lbl.startswith("<>") else ""
        d.edge(f"{st}endArrow=block;endFill=1;html=1;strokeColor={STROKE};fontSize=10;" + ("dashed=1;" if dashed else ""), text, src=ids[a], tgt=ids[b])
    for i, lbl, x, y, w, h, col in nodes:
        d.s(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{col}" stroke="{STROKE}" rx="6"/>')
        parts = lbl.split("|")
        d.mtxt(x + w / 2, y + h / 2, lbl, 11)
    return d
