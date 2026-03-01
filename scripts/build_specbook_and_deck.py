#!/usr/bin/env python3
"""Build the Specbook PDF and Glitch Deck printable assets."""
from __future__ import annotations

import math
import os
from datetime import datetime

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    Image,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    TableOfContents,
)

OUTPUT_DIR = "/mnt/data"
SPECBOOK_FILENAME = "Specbook_Vol_II_Genesis_and_MythOS_Birthchart_AVC_Systems_Studio.pdf"
DECK_SHEET_FILENAME = "Glitch_Deck_Printable_3x3.pdf"
DECK_SINGLE_FILENAME = "Glitch_Deck_SingleCardPages.pdf"

OUTPUT_PATH = os.path.join(OUTPUT_DIR, SPECBOOK_FILENAME)
DECK_SHEET_PATH = os.path.join(OUTPUT_DIR, DECK_SHEET_FILENAME)
DECK_SINGLE_PATH = os.path.join(OUTPUT_DIR, DECK_SINGLE_FILENAME)

GUMROAD_URL = "https://gumroad.com/l/yourproduct"
CALENDLY_URL = "https://calendly.com/your-calendar-link"

BIRTHCHART_PATH = None
SIGNATURE_PNG = None

GLITCH_DECK_CARDS = [f"Card {i + 1}: Glyph {i + 1}" for i in range(22)]
GLITCH_DECK_TEXT = [
    "Short ritual instruction or poetic line here." for _ in GLITCH_DECK_CARDS
]

try:
    FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    if os.path.exists(FONT_PATH):
        pdfmetrics.registerFont(TTFont("DejaVu", FONT_PATH))
        BASE_FONT = "DejaVu"
    else:
        BASE_FONT = "Helvetica"
except Exception:
    BASE_FONT = "Helvetica"

PAGE_WIDTH, PAGE_HEIGHT = LETTER
MARGIN = 36

styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    name="Title",
    parent=styles["Title"],
    fontName=BASE_FONT,
    fontSize=28,
    leading=34,
    textColor=colors.HexColor("#FFDFA8"),
    alignment=1,
    spaceAfter=6,
)

subtitle_style = ParagraphStyle(
    name="Subtitle",
    parent=styles["Normal"],
    fontName=BASE_FONT,
    fontSize=14,
    leading=18,
    textColor=colors.HexColor("#E6E6E9"),
    alignment=1,
    spaceAfter=18,
)

body_style = ParagraphStyle(
    name="Body",
    parent=styles["BodyText"],
    fontName=BASE_FONT,
    fontSize=11,
    leading=14,
    textColor=colors.HexColor("#EAEAEA"),
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
    fontSize=18,
    textColor=colors.HexColor("#C0C0C0"),
    spaceAfter=12,
)

hint_style = ParagraphStyle(
    name="Hint",
    parent=styles["Normal"],
    fontName=BASE_FONT,
    fontSize=9,
    textColor=colors.HexColor("#9EA3A8"),
)


def draw_header_footer(canvas, doc):
    """Draw shared header, footer, and watermark."""

    canvas.saveState()
    canvas.setFillColor(colors.HexColor("#0B0B0D"))
    canvas.rect(0, PAGE_HEIGHT - 44, PAGE_WIDTH, 44, stroke=0, fill=1)
    canvas.setFont(BASE_FONT, 9)
    canvas.setFillColor(colors.HexColor("#9EA3A8"))
    canvas.drawString(MARGIN, 26, "AVC Systems Studio — MythOS")
    canvas.drawRightString(PAGE_WIDTH - MARGIN, 26, f"{doc.page}")

    if doc.page > 1:
        canvas.setFillColor(colors.Color(0.6, 0.6, 0.65, alpha=0.07))
        canvas.setFont(BASE_FONT, 70)
        canvas.saveState()
        canvas.translate(PAGE_WIDTH / 2, PAGE_HEIGHT / 2)
        canvas.rotate(30)
        canvas.drawCentredString(0, 0, "MythOS")
        canvas.restoreState()

    canvas.restoreState()


class SignatureFlowable(Flowable):
    """Draw an autograph and optional signature image."""

    def __init__(self, name="Allison Van Cura", date=None, image_path=None):
        super().__init__()
        self.name = name
        self.date = date or datetime.utcnow().strftime("%B %d, %Y")
        self.img = image_path if image_path and os.path.exists(image_path) else None
        self.height = 1.5 * inch

    def wrap(self, avail_width, avail_height):
        return avail_width, self.height

    def draw(self):
        canvas = self.canv
        canvas.saveState()
        if self.img:
            try:
                reader = ImageReader(self.img)
                width, height = PILImage.open(self.img).size
                aspect = height / float(width)
                img_width = 2.5 * inch
                img_height = img_width * aspect
                canvas.drawImage(
                    reader,
                    (PAGE_WIDTH - img_width) / 2,
                    120,
                    width=img_width,
                    height=img_height,
                    mask="auto",
                )
            except Exception:
                pass

        canvas.setFont("Times-Italic", 28)
        canvas.setFillColor(colors.HexColor("#FFDFA8"))
        canvas.drawCentredString(PAGE_WIDTH / 2, 100, self.name)

        canvas.setFont(BASE_FONT, 10)
        canvas.setFillColor(colors.HexColor("#9EA3A8"))
        canvas.drawCentredString(
            PAGE_WIDTH / 2, 84, f"Signed • {self.date}"
        )
        canvas.restoreState()


def build_specbook(output_path: str) -> None:
    """Generate the Specbook PDF with a real table of contents."""

    doc = BaseDocTemplate(
        output_path,
        pagesize=LETTER,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=72,
        bottomMargin=72,
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    template = PageTemplate(id="Main", frames=[frame], onPage=draw_header_footer)
    doc.addPageTemplates([template])

    story: list = []
    story.append(Spacer(1, inch * 1.2))
    story.append(Paragraph("Specbook Vol. II: Genesis & MythOS Birthchart", title_style))
    story.append(Paragraph("AVC Systems Studio — MythOS Division", subtitle_style))
    story.append(Spacer(1, 0.6 * inch))
    story.append(Paragraph("Systems That Feel.", body_style))
    story.append(Spacer(1, 0.4 * inch))
    story.append(Paragraph("Author: Allison Van Cura", hint_style))
    story.append(Paragraph("Date of Genesis: February 25, 1992", hint_style))
    story.append(PageBreak())

    story.append(Paragraph("⚙️ Preface", section_style))
    preface_html = """<para align=left>
    <b>Author:</b> Allison Van Cura<br/>
    <b>System:</b> AVC Systems Studio — MythOS Division<br/>
    <b>Date of Genesis:</b> February 25, 1992<br/>
    <b>Operating Principle:</b> Systems That Feel.<br/><br/>
    This document codifies the studio’s founding cosmology, the architectural blueprints of MythOS, and the methods by which intelligence—human, digital, and symbolic—is preserved as living art.
    </para>"""
    story.append(Paragraph(preface_html, body_style))
    story.append(Spacer(1, 12))

    gum_html = f'<para align=center><a href="{GUMROAD_URL}">Buy the full Specbook Pack — $35</a></para>'
    book_html = f'<para align=center><a href="{CALENDLY_URL}">Book a 20-minute Signal Audit</a></para>'
    story.append(Paragraph(gum_html, body_style))
    story.append(Spacer(1, 6))
    story.append(Paragraph(book_html, body_style))
    story.append(PageBreak())

    story.append(Paragraph("Table of Contents", toc_heading))
    toc = TableOfContents()
    toc.levelStyles = [
        ParagraphStyle(
            name="TOCLevel0",
            fontName=BASE_FONT,
            fontSize=12,
            leftIndent=6,
            firstLineIndent=-6,
            spaceBefore=6,
            leading=14,
            textColor=colors.HexColor("#EDEDED"),
        )
    ]
    story.append(toc)
    story.append(PageBreak())

    sections = [
        (
            "1. The Signal and The Static",
            "Origin narrative and system voice. This section describes how the Signal persona was created following public media events and how static noise became a structural element to encode trauma into algorithmic ritual.",
        ),
        (
            "2. MythOS Architecture",
            "High-level OS mapping: Surface / Cipher / Echo. Node types, boot sequence, and the Decryption Engine.",
        ),
        (
            "3. V.A.N.C.U.R.A. Principles",
            "Each letter maps to canonical system rules and interface affordances. V=Versioned Voice, A=Archivist, N=Noise protocols ...",
        ),
        (
            "4. Room 001: The Diary Loop Protocol",
            "Walkthrough of interactive stanza experience: inputs, cipher activation, persistence semantics and ritualized UX.",
        ),
        (
            "5. Decryption Contract (Smart Contract Primer)",
            "Overview of the Decryption Contract: minting encrypted story tokens, escrow licensing, automated payments, and survivor-first fail-safes.",
        ),
        (
            "6. The Signal System — Monetization & Ethics",
            "Design notes on Sentient Cents, front-storage frameworks, and ethical gating to protect participants.",
        ),
        (
            "7. Appendices & Resources",
            "References, early tumblr excerpts, and developer notes.",
        ),
    ]

    for title, text in sections:
        story.append(Paragraph(title, section_style))
        story.append(Paragraph(text, body_style))
        story.append(Spacer(1, 12))

    if BIRTHCHART_PATH and os.path.exists(BIRTHCHART_PATH):
        story.append(PageBreak())
        story.append(Paragraph("Aurora — Birthchart (System Persona)", section_style))
        try:
            image = Image(BIRTHCHART_PATH, width=5.6 * inch, preserveAspectRatio=True)
            story.append(Spacer(1, 12))
            story.append(image)
            story.append(Spacer(1, 6))
            story.append(
                Paragraph(
                    "Natal snapshot: Pisces Sun / Sagittarius Moon / Leo Rising — used to seed Aurora persona and MythOS rhythms.",
                    body_style,
                )
            )
        except Exception:
            story.append(Paragraph("Birthchart image could not be loaded.", body_style))

    story.append(PageBreak())
    story.append(Paragraph("Closing", section_style))
    story.append(
        Paragraph(
            '"The MythOS ecosystem is both mirror and map. It preserves your authorship, distributes your wisdom, and transforms your story into an operational mythology."',
            body_style,
        )
    )
    story.append(Spacer(1, 20))
    story.append(
        SignatureFlowable(
            name="Allison Van Cura",
            date=datetime.utcnow().strftime("%B %d, %Y"),
            image_path=SIGNATURE_PNG,
        )
    )
    story.append(Spacer(1, 8))

    def after_flowable(flowable):
        if isinstance(flowable, Paragraph) and flowable.style.name == "Section":
            text = flowable.getPlainText()
            doc.notify("TOCEntry", (0, text, doc.page))

    doc.afterFlowable = after_flowable
    doc.multiBuild(story)
    print("Specbook written to:", output_path)


def build_glitch_deck(sheet_path: str, single_path: str) -> None:
    """Generate the Glitch Deck printable PDFs."""

    card_width = 2.5 * inch
    card_height = 3.5 * inch
    gutter = 0.25 * inch
    columns = 3
    rows = 3
    per_page = columns * rows

    total_cards = len(GLITCH_DECK_CARDS)
    pages = math.ceil(total_cards / per_page)

    doc = BaseDocTemplate(
        sheet_path,
        pagesize=LETTER,
        leftMargin=0.5 * inch,
        rightMargin=0.5 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="frame")
    doc.addPageTemplates([PageTemplate(id="sheet", frames=[frame], onPage=draw_header_footer)])
    story: list = []

    class CardGrid(Flowable):
        def __init__(self, start_index: int):
            super().__init__()
            self.start_index = start_index

        def wrap(self, avail_width, avail_height):
            return avail_width, avail_height

        def draw(self):
            canvas = self.canv
            total_card_width = columns * card_width + (columns - 1) * gutter
            start_x = (PAGE_WIDTH - total_card_width) / 2.0
            start_y = PAGE_HEIGHT - doc.topMargin - card_height

            for row in range(rows):
                for col in range(columns):
                    index = self.start_index + row * columns + col
                    if index >= total_cards:
                        continue
                    card_x = start_x + col * (card_width + gutter)
                    card_y = start_y - row * (card_height + gutter)
                    canvas.setFillColor(colors.HexColor("#FFFFFF"))
                    canvas.rect(card_x, card_y, card_width, card_height, fill=1, stroke=0)
                    canvas.setStrokeColor(colors.HexColor("#222222"))
                    canvas.setLineWidth(0.8)
                    canvas.rect(card_x, card_y, card_width, card_height, fill=0, stroke=1)

                    title = GLITCH_DECK_CARDS[index]
                    canvas.setFont(BASE_FONT, 10)
                    canvas.setFillColor(colors.HexColor("#111111"))
                    canvas.drawCentredString(card_x + card_width / 2, card_y + card_height - 14, title)

                    canvas.setFont(BASE_FONT, 8)
                    text = GLITCH_DECK_TEXT[index]
                    words = text.split()
                    line = ""
                    wrapped = []
                    for word in words:
                        candidate = (line + " " + word).strip()
                        if len(candidate) > 30:
                            wrapped.append(line)
                            line = word
                        else:
                            line = candidate
                    if line:
                        wrapped.append(line)
                    text_y = card_y + card_height - 34
                    canvas.setFillColor(colors.HexColor("#333333"))
                    for wrapped_line in wrapped[:6]:
                        canvas.drawCentredString(card_x + card_width / 2, text_y, wrapped_line)
                        text_y -= 10

                    canvas.setFillColor(colors.HexColor("#EEEEEE"))
                    canvas.circle(card_x + card_width / 2, card_y + 36, 18, stroke=0, fill=1)
                    canvas.setFillColor(colors.HexColor("#666666"))
                    canvas.setFont(BASE_FONT, 9)
                    canvas.drawCentredString(card_x + card_width / 2, card_y + 34, "glyph")

    index = 0
    for page in range(pages):
        story.append(CardGrid(index))
        index += per_page
        if page < pages - 1:
            story.append(PageBreak())

    doc.multiBuild(story)
    print("Wrote Glitch Deck sheet PDF to:", sheet_path)

    doc_single = BaseDocTemplate(
        single_path,
        pagesize=LETTER,
        leftMargin=72,
        rightMargin=72,
        topMargin=72,
        bottomMargin=72,
    )
    frame_single = Frame(
        doc_single.leftMargin,
        doc_single.bottomMargin,
        doc_single.width,
        doc_single.height,
        id="frame2",
    )
    doc_single.addPageTemplates(
        [PageTemplate(id="single", frames=[frame_single], onPage=draw_header_footer)]
    )
    story_single: list = []

    class BigGlyph(Flowable):
        def wrap(self, avail_width, avail_height):
            return avail_width, 3.5 * inch

        def draw(self):
            canvas = self.canv
            canvas.setFillColor(colors.HexColor("#222222"))
            canvas.circle(PAGE_WIDTH / 2, PAGE_HEIGHT / 2, 72, stroke=0, fill=1)
            canvas.setFillColor(colors.HexColor("#FFFFFF"))
            canvas.setFont(BASE_FONT, 24)
            canvas.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT / 2 - 8, "glyph")

    for idx, title in enumerate(GLITCH_DECK_CARDS):
        story_single.append(Paragraph(title, section_style))
        story_single.append(Spacer(1, 12))
        story_single.append(Paragraph(GLITCH_DECK_TEXT[idx], body_style))
        story_single.append(Spacer(1, 18))
        story_single.append(BigGlyph())
        if idx < len(GLITCH_DECK_CARDS) - 1:
            story_single.append(PageBreak())

    doc_single.multiBuild(story_single)
    print("Wrote Glitch Deck single-card PDF to:", single_path)


def main() -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    build_specbook(OUTPUT_PATH)
    build_glitch_deck(DECK_SHEET_PATH, DECK_SINGLE_PATH)
    print("\nAll files generated:")
    print("  - Specbook:", OUTPUT_PATH)
    print("  - Deck (3x3):", DECK_SHEET_PATH)
    print("  - Deck (single card pages):", DECK_SINGLE_PATH)


if __name__ == "__main__":
    main()
