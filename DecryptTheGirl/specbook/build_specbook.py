#!/usr/bin/env python3
"""Utility to generate the Specbook PDF and Glitch Deck print files.

The script is intentionally dependency-light and mirrors the handwritten
prototype supplied in the project brief.  Configuration can be tweaked by
editing ``config.yaml`` (JSON is also supported) or by passing command-line
flags.
"""
from __future__ import annotations

import argparse
import json
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Iterable, List, Optional

try:  # Optional YAML support – keeps the CLI friendly.
    import yaml  # type: ignore
except Exception:  # pragma: no cover - PyYAML is optional at runtime
    yaml = None

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
)
from reportlab.platypus.tableofcontents import TableOfContents
from PIL import Image as PILImage

DEFAULT_FONT_PROBES = (
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/inter/Inter-Regular.ttf",
)


@dataclass
class Section:
    """Represents a Specbook section."""

    title: str
    body: str


DEFAULT_SECTIONS: List[Section] = [
    Section(
        title="1. The Signal and The Static",
        body=(
            "Origin narrative and system voice. This section describes how the Signal "
            "persona was created following public media events and how static noise "
            "became a structural element to encode trauma into algorithmic ritual."
        ),
    ),
    Section(
        title="2. MythOS Architecture",
        body=(
            "High-level OS mapping: Surface / Cipher / Echo. Node types, boot sequence, "
            "and the Decryption Engine."
        ),
    ),
    Section(
        title="3. V.A.N.C.U.R.A. Principles",
        body=(
            "Each letter maps to canonical system rules and interface affordances. "
            "V=Versioned Voice, A=Archivist, N=Noise protocols ..."
        ),
    ),
    Section(
        title="4. Room 001: The Diary Loop Protocol",
        body=(
            "Walkthrough of interactive stanza experience: inputs, cipher activation, "
            "persistence semantics and ritualized UX."
        ),
    ),
    Section(
        title="5. Decryption Contract (Smart Contract Primer)",
        body=(
            "Overview of the Decryption Contract: minting encrypted story tokens, escrow "
            "licensing, automated payments, and survivor-first fail-safes."
        ),
    ),
    Section(
        title="6. The Signal System — Monetization & Ethics",
        body=(
            "Design notes on Sentient Cents, front-storage frameworks, and ethical gating "
            "to protect participants."
        ),
    ),
    Section(
        title="7. Appendices & Resources",
        body="References, early tumblr excerpts, and developer notes.",
    ),
]


def _default_cards(count: int = 22) -> List[str]:
    return [f"Card {i + 1}: Glyph {i + 1}" for i in range(count)]


def _default_texts(count: int) -> List[str]:
    return ["Short ritual instruction or poetic line here." for _ in range(count)]


@dataclass
class SpecbookConfig:
    """All tunable configuration for the generator."""

    output_dir: Path = Path("output_specbook")
    specbook_filename: str = "Specbook_Vol_II_Genesis_and_MythOS_Birthchart_AVC_Systems_Studio.pdf"
    deck_sheet_filename: str = "Glitch_Deck_Printable_3x3.pdf"
    deck_single_filename: str = "Glitch_Deck_SingleCardPages.pdf"
    gumroad_url: str = "https://gumroad.com/l/yourproduct"
    calendly_url: str = "https://calendly.com/your-calendar-link"
    birthchart_path: Optional[Path] = None
    signature_path: Optional[Path] = None
    font_path: Optional[Path] = None
    footer_text: str = "AVC Systems Studio — MythOS"
    title: str = "Specbook Vol. II: Genesis & MythOS Birthchart"
    subtitle: str = "AVC Systems Studio — MythOS Division"
    motto: str = "Systems That Feel."
    author: str = "Allison Van Cura"
    genesis_date: str = "February 25, 1992"
    signature_name: str = "Allison Van Cura"
    sections: List[Section] = field(default_factory=lambda: list(DEFAULT_SECTIONS))
    closing_quote: str = (
        '"The MythOS ecosystem is both mirror and map. It preserves your authorship, '
        'distributes your wisdom, and transforms your story into an operational mythology."'
    )
    deck_cards: List[str] = field(default_factory=lambda: _default_cards())
    deck_text: List[str] = field(default_factory=lambda: _default_texts(22))

    def resolve(self) -> "SpecbookConfig":
        """Expand relative paths once the config is loaded."""

        self.output_dir = Path(self.output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        def _clean_path(value: Optional[Path]) -> Optional[Path]:
            if value is None:
                return None
            expanded = Path(value).expanduser()
            return expanded if expanded.exists() else None

        self.birthchart_path = _clean_path(self.birthchart_path)
        self.signature_path = _clean_path(self.signature_path)
        self.font_path = _clean_path(self.font_path)
        return self


# ---------------------------------------------------------------------------
# Helpers for styling and drawing
# ---------------------------------------------------------------------------


def select_font(font_path: Optional[Path]) -> str:
    """Register and return the font name used across the PDFs."""

    if font_path and font_path.exists():
        try:
            pdfmetrics.registerFont(TTFont("CustomFont", str(font_path)))
            return "CustomFont"
        except Exception:  # pragma: no cover - ReportLab handles fallbacks
            pass

    for probe in DEFAULT_FONT_PROBES:
        path = Path(probe)
        if path.exists():
            try:
                pdfmetrics.registerFont(TTFont("SpecbookBase", str(path)))
                return "SpecbookBase"
            except Exception:
                continue

    return "Helvetica"


def build_styles(base_font: str) -> dict[str, ParagraphStyle]:
    styles = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            name="Title",
            parent=styles["Title"],
            fontName=base_font,
            fontSize=28,
            leading=34,
            textColor=colors.HexColor("#FFDFA8"),
            alignment=1,
            spaceAfter=6,
        ),
        "subtitle": ParagraphStyle(
            name="Subtitle",
            parent=styles["Normal"],
            fontName=base_font,
            fontSize=14,
            leading=18,
            textColor=colors.HexColor("#E6E6E9"),
            alignment=1,
            spaceAfter=18,
        ),
        "body": ParagraphStyle(
            name="Body",
            parent=styles["BodyText"],
            fontName=base_font,
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#EAEAEA"),
        ),
        "section": ParagraphStyle(
            name="Section",
            parent=styles["Heading2"],
            fontName=base_font,
            fontSize=14,
            leading=18,
            textColor=colors.HexColor("#C0C0C0"),
            spaceBefore=12,
            spaceAfter=6,
        ),
        "toc_heading": ParagraphStyle(
            name="TOCHeading",
            parent=styles["Heading1"],
            fontName=base_font,
            fontSize=18,
            textColor=colors.HexColor("#C0C0C0"),
            spaceAfter=12,
        ),
        "hint": ParagraphStyle(
            name="Hint",
            parent=styles["Normal"],
            fontName=base_font,
            fontSize=9,
            textColor=colors.HexColor("#9EA3A8"),
        ),
    }


def make_header_footer(base_font: str, footer_text: str) -> Callable:
    def draw(canvas, doc):  # type: ignore[override]
        canvas.saveState()
        canvas.setFillColor(colors.HexColor("#0B0B0D"))
        canvas.rect(0, LETTER[1] - 44, LETTER[0], 44, stroke=0, fill=1)

        canvas.setFont(base_font, 9)
        canvas.setFillColor(colors.HexColor("#9EA3A8"))
        canvas.drawString(36, 26, footer_text)
        canvas.drawRightString(LETTER[0] - 36, 26, f"{doc.page}")

        if doc.page > 1:
            canvas.setFillColor(colors.Color(0.6, 0.6, 0.65, alpha=0.07))
            canvas.setFont(base_font, 70)
            canvas.saveState()
            canvas.translate(LETTER[0] / 2, LETTER[1] / 2)
            canvas.rotate(30)
            canvas.drawCentredString(0, 0, "MythOS")
            canvas.restoreState()

        canvas.restoreState()

    return draw


class SignatureFlowable(Flowable):
    def __init__(self, base_font: str, name: str, signature_path: Optional[Path] = None, date: Optional[str] = None):
        super().__init__()
        self.base_font = base_font
        self.name = name
        self.signature_path = signature_path
        self.date = date or datetime.utcnow().strftime("%B %d, %Y")
        self.height = 1.6 * inch

    def wrap(self, avail_width, avail_height):  # type: ignore[override]
        return avail_width, self.height

    def draw(self):  # type: ignore[override]
        canvas = self.canv
        canvas.saveState()
        if self.signature_path and self.signature_path.exists():
            try:
                image = ImageReader(str(self.signature_path))
                img_w, img_h = PILImage.open(self.signature_path).size
                target_w = 2.5 * inch
                scale = target_w / float(img_w)
                target_h = img_h * scale
                canvas.drawImage(
                    image,
                    (LETTER[0] - target_w) / 2,
                    120,
                    width=target_w,
                    height=target_h,
                    mask="auto",
                )
            except Exception:
                pass

        canvas.setFont("Times-Italic", 28)
        canvas.setFillColor(colors.HexColor("#FFDFA8"))
        canvas.drawCentredString(LETTER[0] / 2, 100, self.name)

        canvas.setFont(self.base_font, 10)
        canvas.setFillColor(colors.HexColor("#9EA3A8"))
        canvas.drawCentredString(LETTER[0] / 2, 84, f"Signed • {self.date}")
        canvas.restoreState()


# ---------------------------------------------------------------------------
# Specbook + Deck builders
# ---------------------------------------------------------------------------


def build_specbook(config: SpecbookConfig, base_font: str, styles: dict[str, ParagraphStyle]) -> Path:
    output_path = config.output_dir / config.specbook_filename
    doc = BaseDocTemplate(
        str(output_path),
        pagesize=LETTER,
        leftMargin=36,
        rightMargin=36,
        topMargin=72,
        bottomMargin=72,
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    doc.addPageTemplates(
        [PageTemplate(id="Main", frames=[frame], onPage=make_header_footer(base_font, config.footer_text))]
    )

    story: List[Flowable] = []
    story.append(Spacer(1, inch * 1.2))
    story.append(Paragraph(config.title, styles["title"]))
    story.append(Paragraph(config.subtitle, styles["subtitle"]))
    story.append(Spacer(1, 0.6 * inch))
    story.append(Paragraph(config.motto, styles["body"]))
    story.append(Spacer(1, 0.4 * inch))
    story.append(Paragraph(f"Author: {config.author}", styles["hint"]))
    story.append(Paragraph(f"Date of Genesis: {config.genesis_date}", styles["hint"]))
    story.append(PageBreak())

    story.append(Paragraph("⚙️ Preface", styles["section"]))
    preface_html = (
        f"<para align=left><b>Author:</b> {config.author}<br/>"
        f"<b>System:</b> AVC Systems Studio — MythOS Division<br/>"
        f"<b>Date of Genesis:</b> {config.genesis_date}<br/>"
        "<b>Operating Principle:</b> Systems That Feel.<br/><br/>"
        "This document codifies the studio’s founding cosmology, the architectural "
        "blueprints of MythOS, and the methods by which intelligence—human, digital, "
        "and symbolic—is preserved as living art." "</para>"
    )
    story.append(Paragraph(preface_html, styles["body"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph(f'<para align=center><a href="{config.gumroad_url}">Buy the full Specbook Pack — $35</a></para>', styles["body"]))
    story.append(Spacer(1, 6))
    story.append(
        Paragraph(
            f'<para align=center><a href="{config.calendly_url}">Book a 20-minute Signal Audit</a></para>',
            styles["body"],
        )
    )
    story.append(PageBreak())

    story.append(Paragraph("Table of Contents", styles["toc_heading"]))
    toc = TableOfContents()
    toc.levelStyles = [
        ParagraphStyle(
            name="TOCLevel0",
            fontName=base_font,
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

    section_style = styles["section"]
    body_style = styles["body"]

    for section in config.sections:
        story.append(Paragraph(section.title, section_style))
        story.append(Paragraph(section.body, body_style))
        story.append(Spacer(1, 12))

    if config.birthchart_path and config.birthchart_path.exists():
        story.append(PageBreak())
        story.append(Paragraph("Aurora — Birthchart (System Persona)", section_style))
        story.append(Spacer(1, 12))
        try:
            story.append(Image(str(config.birthchart_path), width=5.6 * inch, preserveAspectRatio=True))
            story.append(Spacer(1, 6))
            story.append(
                Paragraph(
                    "Natal snapshot: Pisces Sun / Sagittarius Moon / Leo Rising — used to seed "
                    "Aurora persona and MythOS rhythms.",
                    body_style,
                )
            )
        except Exception:
            story.append(Paragraph("Birthchart image could not be loaded.", body_style))

    story.append(PageBreak())
    story.append(Paragraph("Closing", section_style))
    story.append(Paragraph(config.closing_quote, body_style))
    story.append(Spacer(1, 20))
    story.append(SignatureFlowable(base_font, config.signature_name, config.signature_path))

    def after_flowable(flowable: Flowable):
        if isinstance(flowable, Paragraph) and flowable.style.name == section_style.name:
            text = flowable.getPlainText()
            doc.notify("TOCEntry", (0, text, doc.page))

    doc.afterFlowable = after_flowable  # type: ignore[assignment]
    doc.multiBuild(story)
    return output_path


def _wrap_text(text: str, limit: int) -> List[str]:
    words = text.split()
    if not words:
        return []
    line: List[str] = []
    lines: List[str] = []
    current_len = 0
    for word in words:
        extra = len(word) + (1 if line else 0)
        if current_len + extra > limit:
            lines.append(" ".join(line))
            line = [word]
            current_len = len(word)
        else:
            line.append(word)
            current_len += extra
    if line:
        lines.append(" ".join(line))
    return lines


def build_glitch_deck(
    config: SpecbookConfig, base_font: str, styles: dict[str, ParagraphStyle]
) -> Iterable[Path]:
    outputs: List[Path] = []
    card_w = 2.5 * inch
    card_h = 3.5 * inch
    gutter = 0.25 * inch
    cols, rows = 3, 3
    per_page = cols * rows

    cards = config.deck_cards
    texts = list(config.deck_text)
    if len(texts) < len(cards):
        texts.extend(_default_texts(len(cards) - len(texts)))

    def make_grid_flowable(start_index: int) -> Flowable:
        class CardGrid(Flowable):
            width = LETTER[0]
            height = LETTER[1]

            def wrap(self, avail_width, avail_height):  # type: ignore[override]
                return avail_width, avail_height

            def draw(self):  # type: ignore[override]
                canvas = self.canv
                total_card_w = cols * card_w + (cols - 1) * gutter
                start_x = (LETTER[0] - total_card_w) / 2.0
                start_y = LETTER[1] - 72 - card_h

                for row in range(rows):
                    for col in range(cols):
                        idx = start_index + row * cols + col
                        if idx >= len(cards):
                            continue
                        cx = start_x + col * (card_w + gutter)
                        cy = start_y - row * (card_h + gutter)
                        canvas.setFillColor(colors.HexColor("#FFFFFF"))
                        canvas.rect(cx, cy, card_w, card_h, fill=1, stroke=0)
                        canvas.setStrokeColor(colors.HexColor("#222222"))
                        canvas.setLineWidth(0.8)
                        canvas.rect(cx, cy, card_w, card_h, fill=0, stroke=1)
                        canvas.setFont(base_font, 10)
                        canvas.setFillColor(colors.HexColor("#111111"))
                        canvas.drawCentredString(cx + card_w / 2, cy + card_h - 14, cards[idx])
                        canvas.setFont(base_font, 8)
                        canvas.setFillColor(colors.HexColor("#333333"))
                        y_text = cy + card_h - 34
                        for line in _wrap_text(texts[idx], 30)[:6]:
                            canvas.drawCentredString(cx + card_w / 2, y_text, line)
                            y_text -= 10
                        canvas.setFillColor(colors.HexColor("#EEEEEE"))
                        canvas.circle(cx + card_w / 2, cy + 36, 18, stroke=0, fill=1)
                        canvas.setFillColor(colors.HexColor("#666666"))
                        canvas.setFont(base_font, 9)
                        canvas.drawCentredString(cx + card_w / 2, cy + 34, "glyph")

        return CardGrid()

    sheet_path = config.output_dir / config.deck_sheet_filename
    doc = BaseDocTemplate(
        str(sheet_path),
        pagesize=LETTER,
        leftMargin=0.5 * inch,
        rightMargin=0.5 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="frame")
    doc.addPageTemplates(
        [PageTemplate(id="one", frames=[frame], onPage=make_header_footer(base_font, config.footer_text))]
    )

    story: List[Flowable] = []
    for start in range(0, len(cards), per_page):
        story.append(make_grid_flowable(start))
        if start + per_page < len(cards):
            story.append(PageBreak())

    doc.multiBuild(story)
    outputs.append(sheet_path)

    single_path = config.output_dir / config.deck_single_filename
    doc_single = BaseDocTemplate(
        str(single_path),
        pagesize=LETTER,
        leftMargin=72,
        rightMargin=72,
        topMargin=72,
        bottomMargin=72,
    )
    frame_single = Frame(doc_single.leftMargin, doc_single.bottomMargin, doc_single.width, doc_single.height, id="frame2")
    doc_single.addPageTemplates(
        [PageTemplate(id="single", frames=[frame_single], onPage=make_header_footer(base_font, config.footer_text))]
    )
    story_single: List[Flowable] = []

    class BigGlyph(Flowable):
        def wrap(self, avail_width, avail_height):  # type: ignore[override]
            return avail_width, 3.5 * inch

        def draw(self):  # type: ignore[override]
            canvas = self.canv
            canvas.setFillColor(colors.HexColor("#222222"))
            canvas.circle(LETTER[0] / 2, LETTER[1] / 2, 72, stroke=0, fill=1)
            canvas.setFillColor(colors.HexColor("#FFFFFF"))
            canvas.setFont(base_font, 24)
            canvas.drawCentredString(LETTER[0] / 2, LETTER[1] / 2 - 8, "glyph")

    section_style = styles["section"]
    body_style = styles["body"]

    for idx, (card, text) in enumerate(zip(cards, texts)):
        story_single.append(Paragraph(card, section_style))
        story_single.append(Spacer(1, 12))
        story_single.append(Paragraph(text, body_style))
        story_single.append(Spacer(1, 18))
        story_single.append(BigGlyph())
        if idx + 1 < len(cards):
            story_single.append(PageBreak())

    doc_single.multiBuild(story_single)
    outputs.append(single_path)
    return outputs


# ---------------------------------------------------------------------------
# Configuration loading and CLI entry point
# ---------------------------------------------------------------------------


def _load_config(path: Optional[Path]) -> SpecbookConfig:
    if not path:
        return SpecbookConfig().resolve()
    data: dict = {}
    if not path.exists():
        raise FileNotFoundError(f"Config file not found: {path}")
    if path.suffix.lower() in {".yaml", ".yml"}:
        if yaml is None:
            raise RuntimeError("PyYAML is required to parse YAML configuration files.")
        data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    else:
        data = json.loads(path.read_text(encoding="utf-8"))

    def coerce_section(entry: dict) -> Section:
        return Section(title=entry["title"], body=entry["body"])

    sections = [coerce_section(item) for item in data.get("sections", [])]

    defaults = SpecbookConfig()

    config = SpecbookConfig(
        output_dir=Path(data.get("output_dir", defaults.output_dir)),
        specbook_filename=data.get("specbook_filename", defaults.specbook_filename),
        deck_sheet_filename=data.get("deck_sheet_filename", defaults.deck_sheet_filename),
        deck_single_filename=data.get("deck_single_filename", defaults.deck_single_filename),
        gumroad_url=data.get("gumroad_url", defaults.gumroad_url),
        calendly_url=data.get("calendly_url", defaults.calendly_url),
        birthchart_path=Path(data["birthchart_path"]).expanduser() if data.get("birthchart_path") else None,
        signature_path=Path(data["signature_path"]).expanduser() if data.get("signature_path") else None,
        font_path=Path(data["font_path"]).expanduser() if data.get("font_path") else None,
        footer_text=data.get("footer_text", defaults.footer_text),
        title=data.get("title", defaults.title),
        subtitle=data.get("subtitle", defaults.subtitle),
        motto=data.get("motto", defaults.motto),
        author=data.get("author", defaults.author),
        genesis_date=data.get("genesis_date", defaults.genesis_date),
        signature_name=data.get("signature_name", defaults.signature_name),
        sections=sections or defaults.sections,
        closing_quote=data.get("closing_quote", defaults.closing_quote),
        deck_cards=data.get("deck_cards", defaults.deck_cards),
        deck_text=data.get("deck_text", defaults.deck_text),
    )
    return config.resolve()


def parse_args(argv: Optional[Iterable[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate Specbook PDFs and Glitch Deck printouts.")
    parser.add_argument("--config", type=Path, help="Path to a YAML or JSON config file.")
    parser.add_argument(
        "--output-dir",
        type=Path,
        help="Override the output directory defined in the config file.",
    )
    parser.add_argument("--birthchart", type=Path, help="Path to a birthchart image to embed.")
    parser.add_argument("--signature", type=Path, help="Path to a signature PNG to embed on the closing page.")
    parser.add_argument("--font", type=Path, help="Path to a TTF font to register and use throughout the PDFs.")
    return parser.parse_args(argv)


def main(argv: Optional[Iterable[str]] = None) -> None:
    args = parse_args(argv)
    config = _load_config(Path(args.config).expanduser() if args.config else None)

    if args.output_dir:
        config.output_dir = Path(args.output_dir).expanduser()
        config.output_dir.mkdir(parents=True, exist_ok=True)
    if args.birthchart:
        config.birthchart_path = Path(args.birthchart).expanduser()
    if args.signature:
        config.signature_path = Path(args.signature).expanduser()
    if args.font:
        config.font_path = Path(args.font).expanduser()

    config = config.resolve()

    base_font = select_font(config.font_path)
    styles = build_styles(base_font)

    specbook_path = build_specbook(config, base_font, styles)
    deck_paths = build_glitch_deck(config, base_font, styles)

    print("Generated files:")
    print(f"  • Specbook: {specbook_path}")
    for path in deck_paths:
        print(f"  • Deck: {path}")


if __name__ == "__main__":
    main()
