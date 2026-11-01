import docx
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn
from docx.enum.text import WD_ALIGN_PARAGRAPH

doc = docx.Document()

# Section 1: Front matter
sec1 = doc.sections[0]
sec1.different_first_page_header_footer = True

# Set Roman page numbering in sec1
pgNumType1 = parse_xml(f'<w:pgNumType {nsdecls("w")} w:fmt="lowerRoman"/>')
sec1._sectPr.append(pgNumType1)

# Add page number to normal footer of sec1
footer1 = sec1.footer
p1 = footer1.paragraphs[0]
p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
run1 = p1.add_run()
fld1 = OxmlElement('w:fldSimple')
fld1.set(qn('w:instr'), 'PAGE')
run1._r.append(fld1)

doc.add_paragraph('Page 1: Cover Page (No footer)')
doc.add_page_break()
doc.add_paragraph('Page 2: Certificate (Should be page ii)')

# Section 2: Main Body
sec2 = doc.add_section()
sec2.header.is_linked_to_previous = False
sec2.footer.is_linked_to_previous = False
sec2.different_first_page_header_footer = False

pgNumType2 = parse_xml(f'<w:pgNumType {nsdecls("w")} w:fmt="decimal" w:start="1"/>')
sec2._sectPr.append(pgNumType2)

footer2 = sec2.footer
p2 = footer2.paragraphs[0]
p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
run2 = p2.add_run()
fld2 = OxmlElement('w:fldSimple')
fld2.set(qn('w:instr'), 'PAGE')
run2._r.append(fld2)

doc.add_paragraph('Page 3: Chapter 1 (Should be page 1)')
doc.add_page_break()
doc.add_paragraph('Page 4: Chapter 1 cont (Should be page 2)')

doc.save('test_sections.docx')
print('Successfully tested sections!')
