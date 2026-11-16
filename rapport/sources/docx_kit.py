"""Outils de mise en page Word (python-docx) pour le rapport Najahni."""
from pathlib import Path
from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

BLUE = RGBColor(0x1F, 0x3A, 0x5F)
TEAL = "B5DEE1"
BODY_FONT = "Times New Roman"


def _set_font(style, name, size, bold=None, color=None, italic=None):
    style.font.name = name
    style.element.rPr.rFonts.set(qn("w:eastAsia"), name) if style.element.rPr is not None else None
    style.font.size = Pt(size)
    if bold is not None:
        style.font.bold = bold
    if italic is not None:
        style.font.italic = italic
    if color is not None:
        style.font.color.rgb = color


def field(paragraph, instr, placeholder=""):
    """Insere un champ Word (TOC, PAGE...)."""
    run = paragraph.add_run()
    for tag, text in (("begin", None), ("instr", instr), ("separate", None), ("text", placeholder), ("end", None)):
        if tag == "instr":
            el = OxmlElement("w:instrText")
            el.set(qn("xml:space"), "preserve")
            el.text = text
            run._r.append(el)
        elif tag == "text":
            t = OxmlElement("w:t")
            t.text = text
            run._r.append(t)
        else:
            el = OxmlElement("w:fldChar")
            el.set(qn("w:fldCharType"), tag)
            run._r.append(el)
    return run


def shade(cell, color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), color)
    tcPr.append(shd)


def border_bottom(paragraph, color="1F3A5F", size=12, top=False):
    pPr = paragraph._p.get_or_add_pPr()
    pbdr = OxmlElement("w:pBdr")
    for side in (("top", "bottom") if top else ("bottom",)):
        b = OxmlElement(f"w:{side}")
        b.set(qn("w:val"), "single")
        b.set(qn("w:sz"), str(size))
        b.set(qn("w:space"), "4")
        b.set(qn("w:color"), color)
        pbdr.append(b)
    pPr.append(pbdr)


def page_numbering(section, fmt="decimal", start=1):
    sectPr = section._sectPr
    pg = sectPr.find(qn("w:pgNumType"))
    if pg is None:
        pg = OxmlElement("w:pgNumType")
        sectPr.append(pg)
    pg.set(qn("w:fmt"), fmt)
    pg.set(qn("w:start"), str(start))


class Report:
    def __init__(self):
        self.doc = Document()
        self.fig_chapter, self.fig_n, self.tab_n = 0, 0, 0
        self._styles()
        s = self.doc.sections[0]
        s.page_height, s.page_width = Cm(29.7), Cm(21.0)
        s.left_margin = s.right_margin = Cm(2.5)
        s.top_margin, s.bottom_margin = Cm(2.5), Cm(2.2)
        s.header_distance = s.footer_distance = Cm(1.2)

    # ------------------------------------------------------------------
    def _styles(self):
        st = self.doc.styles
        normal = st["Normal"]
        _set_font(normal, BODY_FONT, 12)
        normal.paragraph_format.space_after = Pt(6)
        normal.paragraph_format.line_spacing = 1.15
        for lvl, size, before, after in ((1, 20, 0, 18), (2, 15, 18, 8), (3, 13, 12, 6), (4, 12, 10, 4)):
            h = st[f"Heading {lvl}"]
            _set_font(h, BODY_FONT, size, bold=True, color=BLUE if lvl < 4 else RGBColor(0x22, 0x22, 0x22))
            h.font.italic = False
            h.paragraph_format.space_before = Pt(before)
            h.paragraph_format.space_after = Pt(after)
            h.paragraph_format.keep_with_next = True
        for name, italic in (("Légende figure", False), ("Légende tableau", False)):
            if name not in [x.name for x in st]:
                cs = st.add_style(name, 1)
                cs.base_style = normal
                _set_font(cs, BODY_FONT, 11, italic=italic)
                cs.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
                cs.paragraph_format.space_before = Pt(4)
                cs.paragraph_format.space_after = Pt(12)
        lb = st["List Bullet"]
        _set_font(lb, BODY_FONT, 12)
        lb.paragraph_format.space_after = Pt(3)

    # ------------------------------------------------------------------
    def new_section(self, header_text="", fmt=None, start=None):
        s = self.doc.add_section(WD_SECTION.NEW_PAGE)
        s.header.is_linked_to_previous = False
        s.footer.is_linked_to_previous = False
        hp = s.header.paragraphs[0]
        hp.text = ""
        if header_text:
            r = hp.add_run(header_text)
            r.font.size, r.font.italic, r.font.name = Pt(10), True, BODY_FONT
            border_bottom(hp, "7F7F7F", 4)
        fp = s.footer.paragraphs[0]
        fp.text = ""
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        field(fp, "PAGE", "1")
        if fmt:
            page_numbering(s, fmt, start or 1)
        else:
            # la section copiee garde "start" : on le retire pour continuer la numerotation
            pg = s._sectPr.find(qn("w:pgNumType"))
            if pg is not None and pg.get(qn("w:start")) is not None:
                del pg.attrib[qn("w:start")]
        return s

    def title(self, text):
        """Titre de page liminaire (hors table des matieres)."""
        return self.p(text, bold=True, size=20, align="left", color=BLUE, after=18)

    def no_footer_first(self):
        s = self.doc.sections[0]
        s.footer.paragraphs[0].text = ""

    def p(self, text="", bold=False, italic=False, align="justify", size=None, after=None, before=None, color=None, keep=False):
        para = self.doc.add_paragraph()
        para.alignment = {"justify": WD_ALIGN_PARAGRAPH.JUSTIFY, "center": WD_ALIGN_PARAGRAPH.CENTER,
                          "left": WD_ALIGN_PARAGRAPH.LEFT, "right": WD_ALIGN_PARAGRAPH.RIGHT}[align]
        self.rich(para, text, bold, italic, size, color)
        if after is not None:
            para.paragraph_format.space_after = Pt(after)
        if before is not None:
            para.paragraph_format.space_before = Pt(before)
        if keep:
            para.paragraph_format.keep_with_next = True
        return para

    @staticmethod
    def rich(para, text, bold=False, italic=False, size=None, color=None):
        """**gras** et `code` dans le texte."""
        import re
        for part in re.split(r"(\*\*[^*]+\*\*|`[^`]+`)", text):
            if not part:
                continue
            if part.startswith("**"):
                r = para.add_run(part[2:-2])
                r.bold = True
            elif part.startswith("`"):
                r = para.add_run(part[1:-1])
                r.font.name = "Consolas"
                r.font.size = Pt(10.5)
            else:
                r = para.add_run(part)
                r.bold = bold
            r.italic = italic or None
            if size:
                r.font.size = Pt(size)
            if color is not None:
                r.font.color.rgb = color
        return para

    def bullets(self, items):
        for it in items:
            para = self.doc.add_paragraph(style="List Bullet")
            para.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            self.rich(para, it)

    def h(self, level, text):
        return self.doc.add_heading(text, level)

    def page_break(self):
        self.doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

    # ------------------------------------------------------------------
    def chapter(self, num, title, plan, header=None):
        """Page de titre de chapitre (style du rapport de reference) puis section avec en-tete."""
        self.new_section(header or f"Chapitre {num}. {title}")
        self.fig_chapter, self.fig_n, self.tab_n = num, 0, 0
        for _ in range(4):
            self.p("")
        top = self.p(f"Chapitre {num}", italic=True, align="center", size=13, after=2)
        border_bottom(top, "000000", 18)
        hd = self.doc.add_heading(f"Chapitre {num} : {title}", 1)
        hd.alignment = WD_ALIGN_PARAGRAPH.CENTER
        border_bottom(hd, "7F7F7F", 4)
        self.p("")
        self.p("Plan", bold=True, align="left", size=13)
        for k, item in enumerate(plan):
            para = self.p(item, align="left", size=11, after=2)
            para.paragraph_format.left_indent = Cm(1)
        self.page_break()

    def unnumbered(self, title, header=None):
        self.new_section(header if header is not None else title)
        self.doc.add_heading(title, 1)

    # ------------------------------------------------------------------
    def figure(self, path, caption, width_cm=15.5):
        para = self.doc.add_paragraph()
        para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        para.paragraph_format.keep_with_next = True
        para.add_run().add_picture(str(path), width=Cm(width_cm))
        self.fig_n += 1
        num = f"{self.fig_chapter}.{self.fig_n}" if self.fig_chapter else str(self.fig_n)
        cap = self.doc.add_paragraph(style="Légende figure")
        r = cap.add_run(f"Figure {num} : ")
        r.bold = True
        cap.add_run(caption)
        return num

    def placeholder(self, caption, height_cm=6):
        """Emplacement de capture d'ecran a completer par l'equipe."""
        t = self.doc.add_table(rows=1, cols=1)
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        c = t.rows[0].cells[0]
        c.width = Cm(15)
        tr = t.rows[0]._tr
        trPr = tr.get_or_add_trPr()
        hgt = OxmlElement("w:trHeight")
        hgt.set(qn("w:val"), str(int(height_cm * 567)))
        trPr.append(hgt)
        self._borders(t, "9E9E9E", dashed=True)
        cp = c.paragraphs[0]
        cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = cp.add_run(f"\n\nCapture d'écran à insérer :\n{caption}")
        r.italic = True
        r.font.color.rgb = RGBColor(0x80, 0x80, 0x80)
        self.fig_n += 1
        num = f"{self.fig_chapter}.{self.fig_n}"
        cap = self.doc.add_paragraph(style="Légende figure")
        rr = cap.add_run(f"Figure {num} : ")
        rr.bold = True
        cap.add_run(f"Interface : {caption}")
        return num

    def _borders(self, table, color="7F7F7F", dashed=False):
        tbl = table._tbl
        tblPr = tbl.tblPr
        b = OxmlElement("w:tblBorders")
        for side in ("top", "left", "bottom", "right", "insideH", "insideV"):
            e = OxmlElement(f"w:{side}")
            e.set(qn("w:val"), "dashed" if dashed else "single")
            e.set(qn("w:sz"), "6")
            e.set(qn("w:space"), "0")
            e.set(qn("w:color"), color)
            b.append(e)
        tblPr.append(b)

    def table(self, caption, header, rows, widths, merge_first=False, font=10.5):
        self.tab_n += 1
        num = f"{self.fig_chapter}.{self.tab_n}" if self.fig_chapter else str(self.tab_n)
        cap = self.doc.add_paragraph(style="Légende tableau")
        cap.paragraph_format.keep_with_next = True
        cap.paragraph_format.space_after = Pt(4)
        r = cap.add_run(f"Tableau {num} : ")
        r.bold = True
        cap.add_run(caption)
        t = self.doc.add_table(rows=1, cols=len(header))
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        self._borders(t)
        for i, htxt in enumerate(header):
            c = t.rows[0].cells[i]
            c.width = Cm(widths[i])
            shade(c, TEAL)
            para = c.paragraphs[0]
            para.alignment = WD_ALIGN_PARAGRAPH.CENTER
            para.paragraph_format.keep_with_next = True
            rr = para.add_run(htxt)
            rr.bold = True
            rr.font.size = Pt(font)
        # repeter l'en-tete sur chaque page
        trPr = t.rows[0]._tr.get_or_add_trPr()
        th = OxmlElement("w:tblHeader")
        th.set(qn("w:val"), "true")
        trPr.append(th)
        prev = None
        for row in rows:
            cells = t.add_row().cells
            for i, val in enumerate(row):
                c = cells[i]
                c.width = Cm(widths[i])
                para = c.paragraphs[0]
                para.alignment = WD_ALIGN_PARAGRAPH.LEFT
                para.paragraph_format.space_after = Pt(1)
                lines = str(val).split("\n")
                for k, line in enumerate(lines):
                    pp = para if k == 0 else c.add_paragraph()
                    pp.paragraph_format.space_after = Pt(1)
                    self.rich(pp, line, size=font)
            if merge_first and prev is not None and row[0] == "":
                prev[0].merge(cells[0])
            elif merge_first:
                prev = cells
            if merge_first and row[0] != "":
                prev = cells
        self.doc.add_paragraph().paragraph_format.space_after = Pt(4)
        return t

    def uc_table(self, caption, d):
        """Description textuelle d'un cas d'utilisation (style du rapport de reference)."""
        rows = [("Cas d'utilisation", d["nom"]), ("Acteur(s)", d["acteurs"]), ("Pré-condition", d["pre"]),
                ("Post-condition", d["post"]), ("Scénario nominal", "\n".join(f"{i+1}. {s}" for i, s in enumerate(d["nominal"]))),
                ("Scénarios alternatifs", "\n".join(d["alt"]))]
        self.tab_n += 1
        num = f"{self.fig_chapter}.{self.tab_n}"
        cap = self.doc.add_paragraph(style="Légende tableau")
        cap.paragraph_format.keep_with_next = True
        r = cap.add_run(f"Tableau {num} : ")
        r.bold = True
        cap.add_run(caption)
        t = self.doc.add_table(rows=0, cols=2)
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        self._borders(t)
        for k, v in rows:
            cells = t.add_row().cells
            cells[0].width, cells[1].width = Cm(4), Cm(12)
            shade(cells[0], "E8F4F5")
            rr = cells[0].paragraphs[0].add_run(k)
            rr.bold = True
            rr.font.size = Pt(10.5)
            for i, line in enumerate(v.split("\n")):
                pp = cells[1].paragraphs[0] if i == 0 else cells[1].add_paragraph()
                pp.paragraph_format.space_after = Pt(1)
                self.rich(pp, line, size=10.5)
        self.doc.add_paragraph().paragraph_format.space_after = Pt(4)

    def save(self, path):
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.doc.save(path)
