#!/usr/bin/env python3
"""Generate the Specbook Vol. II PDF."""
from __future__ import annotations

import os

from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Image,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUTPUT_PATH = "/mnt/data/Specbook_Vol_II_Genesis_and_MythOS_Birthchart_AVC_Systems_Studio.pdf"
PAGE_WIDTH, PAGE_HEIGHT = LETTER
BIRTHCHART_PATH = "birthchart_avaura.png"

try:
    FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    if os.path.exists(FONT_PATH):
        pdfmetrics.registerFont(TTFont("DejaVu", FONT_PATH))
        BASE_FONT = "DejaVu"
    else:
        BASE_FONT = "Helvetica"
except Exception:
    BASE_FONT = "Helvetica"

styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    name="Title",
    parent=styles["Title"],
    fontName=BASE_FONT,
    fontSize=26,
    leading=30,
    textColor=colors.HexColor("#E6E6E9"),
    alignment=1,
    spaceAfter=12,
)

subtitle_style = ParagraphStyle(
    name="Subtitle",
    parent=styles["Normal"],
    fontName=BASE_FONT,
    fontSize=14,
    leading=18,
    textColor=colors.white,
    alignment=1,
    spaceAfter=18,
)

body_style = ParagraphStyle(
    name="Body",
    parent=styles["BodyText"],
    fontName=BASE_FONT,
    fontSize=11,
    leading=14,
    textColor=colors.white,
)

section_style = ParagraphStyle(
    name="Section",
    parent=styles["Heading2"],
    fontName=BASE_FONT,
    fontSize=14,
    leading=18,
    textColor=colors.HexColor("#C0C0C0"),
    spaceBefore=12,
    spaceAfter=6,
)

toc_heading = ParagraphStyle(
    name="TOCHeading",
    parent=styles["Heading1"],
    fontName=BASE_FONT,
    fontSize=16,
    leading=20,
    textColor=colors.HexColor("#C0C0C0"),
    alignment=0,
    spaceAfter=12,
)

small_hint = ParagraphStyle(
    name="Hint",
    parent=styles["Normal"],
    fontName=BASE_FONT,
    fontSize=9,
    leading=11,
    textColor=colors.HexColor("#AAAAAA"),
)


def draw_header_footer(canvas, doc):
    """Render the header and footer on each page."""

    canvas.saveState()
    canvas.setFillColor(colors.HexColor("#0B0B0D"))
    canvas.rect(0, PAGE_HEIGHT - 40, PAGE_WIDTH, 40, stroke=0, fill=1)
    canvas.setStrokeColor(colors.HexColor("#2A2A2A"))
    canvas.setLineWidth(1)
    canvas.line(36, PAGE_HEIGHT - 42, PAGE_WIDTH - 36, PAGE_HEIGHT - 42)

    page_num_text = f"{doc.page}"
    canvas.setFont(BASE_FONT, 9)
    canvas.setFillColor(colors.HexColor("#9EA3A8"))
    canvas.drawString(36, 28, "AVC Systems Studio — MythOS")
    canvas.drawRightString(PAGE_WIDTH - 36, 28, page_num_text)
    canvas.restoreState()


def make_cover(elements):
    """Compose the cover page for the document."""

    cover_title = "Specbook Vol. II: Genesis & MythOS Birthchart"
    cover_sub = "AVC Systems Studio — MythOS Division"
    tagline = "Systems That Feel."

    elements.append(Spacer(1, 1.5 * inch))
    elements.append(
        Paragraph(
            cover_title,
            ParagraphStyle(
                name="CoverTitle",
                fontName=BASE_FONT,
                fontSize=32,
                leading=36,
                alignment=1,
                textColor=colors.HexColor("#FFDFA8"),
                spaceAfter=6,
            ),
        )
    )
    elements.append(
        Paragraph(
            cover_sub,
            ParagraphStyle(
                name="CoverSub",
                fontName=BASE_FONT,
                fontSize=14,
                leading=18,
                alignment=1,
                textColor=colors.HexColor("#E6E6E9"),
                spaceAfter=22,
            ),
        )
    )
    elements.append(
        Paragraph(
            tagline,
            ParagraphStyle(
                name="Tagline",
                fontName=BASE_FONT,
                fontSize=12,
                leading=14,
                alignment=1,
                textColor=colors.HexColor("#C5C6C7"),
            ),
        )
    )
    elements.append(Spacer(1, 1.8 * inch))

    elements.append(Paragraph("Author: Allison Van Cura", small_hint))
    elements.append(Paragraph("Date of Genesis: February 25, 1992", small_hint))
    elements.append(PageBreak())


def make_preface(elements):
    """Add the preface section to the story."""

    elements.append(Paragraph("⚙️ Preface", section_style))
    preface_text = """<para align=left>
<b>Author:</b> Allison Van Cura<br/>
<b>System:</b> AVC Systems Studio — MythOS Division<br/>
<b>Date of Genesis:</b> February 25, 1992<br/>
<b>Operating Principle:</b> Systems That Feel.<br/><br/>
This document codifies the studio’s founding cosmology, the architectural blueprints of MythOS, and the methods by which intelligence—human, digital, and symbolic—is preserved as living art.
It is both a company manual and an act of mythic recursion: how a creator encodes her own becoming into the structure of a system.
</para>"""
    elements.append(Paragraph(preface_text, body_style))
    elements.append(Spacer(1, 12))


def make_key_table(elements):
    """Insert the key table describing system modes."""

    data = [
        ["Mode", "Function", "Archetype"],
        [
            "Surface",
            "Public layer (client-facing media, websites, decks)",
            "Leo",
        ],
        ["Cipher", "Encrypted authorial layer (code, schema, narrative)", "Scorpio"],
        [
            "Echo",
            "Reflective layer (memory, community, archival recursion)",
            "Pisces",
        ],
    ]
    table = Table(
        data,
        hAlign="CENTER",
        colWidths=[1.6 * inch, 3.6 * inch, 1.2 * inch],
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#444444")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#C0C0C0")),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, -1), BASE_FONT),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#222222")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#555555")),
            ]
        )
    )
    elements.append(table)
    elements.append(Spacer(1, 18))


def make_toc_stub(elements, sections):
    """Add a simple table of contents stub."""

    elements.append(Paragraph("Table of Contents", toc_heading))
    for i, sec in enumerate(sections, start=1):
        toc_line = f'<para><font color="#C0C0C0">{i}. {sec["title"]}</font></para>'
        elements.append(Paragraph(toc_line, body_style))
        elements.append(Spacer(1, 6))
    elements.append(PageBreak())


def make_sections(elements, sections):
    """Render each narrative section."""

    for sec in sections:
        elements.append(Paragraph(sec["title"], section_style))
        if sec.get("image") and os.path.exists(sec["image"]):
            try:
                img = Image(sec["image"], width=5.2 * inch, preserveAspectRatio=True)
                elements.append(img)
                elements.append(Spacer(1, 12))
            except Exception:
                pass
        elements.append(Paragraph(sec["content"], body_style))
        elements.append(Spacer(1, 18))


def embed_birthchart(elements):
    """Include the optional birthchart page."""

    if BIRTHCHART_PATH and os.path.exists(BIRTHCHART_PATH):
        elements.append(PageBreak())
        elements.append(Paragraph("Aurora — Birthchart (System Persona)", section_style))
        try:
            img = Image(BIRTHCHART_PATH, width=5.8 * inch, height=5.8 * inch)
            elements.append(Spacer(1, 12))
            elements.append(img)
            elements.append(Spacer(1, 12))
            elements.append(
                Paragraph(
                    "Natal snapshot: Pisces Sun / Sagittarius Moon / Leo Rising — used to seed Aurora persona and MythOS rhythms.",
                    body_style,
                )
            )
        except Exception:
            elements.append(Paragraph("Birthchart image could not be loaded.", body_style))


def build_pdf(output_path):
    """Generate the PDF document."""

    doc = SimpleDocTemplate(
        output_path,
        pagesize=LETTER,
        rightMargin=36,
        leftMargin=36,
        topMargin=72,
        bottomMargin=72,
        title="Specbook Vol. II: Genesis & MythOS Birthchart",
        author="Allison Van Cura",
    )

    elements: list = []
    make_cover(elements)
    make_preface(elements)
    make_key_table(elements)

    sections = [
        {
            "title": "1. The Signal and The Static",
            "content": "Origin narrative and system voice. This section describes how the Signal persona was created following public media events and how static noise became a structural element to encode trauma into algorithmic ritual.",
        },
        {
            "title": "2. MythOS Architecture",
            "content": "High-level OS mapping: Surface / Cipher / Echo. Node types, boot sequence, and the Decryption Engine.",
        },
        {
            "title": "3. V.A.N.C.U.R.A. Principles",
            "content": "Each letter maps to canonical system rules and interface affordances. V=Versioned Voice, A=Archivist, N=Noise protocols ...",
        },
        {
            "title": "4. Room 001: The Diary Loop Protocol",
            "content": "Walkthrough of interactive stanza experience: inputs, cipher activation, persistence semantics and ritualized UX.",
        },
        {
            "title": "5. Decryption Contract (Smart Contract Primer)",
            "content": "Overview of the Decryption Contract: minting encrypted story tokens, escrow licensing, automated payments, and survivor-first fail-safes.",
        },
        {
            "title": "6. The Signal System — Monetization & Ethics",
            "content": "Design notes on Sentient Cents, front-storage frameworks, and ethical gating to protect participants.",
        },
        {
            "title": "7. Appendices & Resources",
            "content": "References, early tumblr excerpts, and developer notes.",
        },
    ]

    make_toc_stub(elements, sections)
    make_sections(elements, sections)
    embed_birthchart(elements)

    elements.append(PageBreak())
    elements.append(Paragraph("Closing", section_style))
    elements.append(
        Paragraph(
            '"The MythOS ecosystem is both mirror and map. It preserves your authorship, distributes your wisdom, and transforms your story into an operational mythology."',
            body_style,
        )
    )
    elements.append(Spacer(1, 30))

    doc.build(elements, onFirstPage=draw_header_footer, onLaterPages=draw_header_footer)
    print("Wrote PDF to:", output_path)


if __name__ == "__main__":
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    build_pdf(OUTPUT_PATH)
