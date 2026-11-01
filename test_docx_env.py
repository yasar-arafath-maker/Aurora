# -*- coding: utf-8 -*-
"""
Script to verify docx capabilities and page counting helper.
"""
import docx
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

print("python-docx is ready.")
