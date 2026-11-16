"""Construit rapport/Rapport_PFA_Najahni.docx. Usage : python build.py"""
from pathlib import Path
from docx_kit import Report
from contenu_1 import front, intro, chapitre1, chapitre2, chapitre3
from contenu_2 import chapitre4, chapitre5, chapitre6, conclusion, webographie

OUT = Path(__file__).resolve().parent.parent / "Rapport_PFA_Najahni.docx"

r = Report()
front(r)
intro(r)
chapitre1(r)
chapitre2(r)
chapitre3(r)
chapitre4(r)
chapitre5(r)
chapitre6(r)
conclusion(r)
webographie(r)
r.save(OUT)
print("ecrit :", OUT)
