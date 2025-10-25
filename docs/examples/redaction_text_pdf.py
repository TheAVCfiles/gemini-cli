"""Utility for producing a satire-friendly redacted PDF.

This script reads a source PDF, applies a handful of satirical
replacements, redacts email addresses and phone numbers, and then writes a
new PDF with the updated text.  It demonstrates how teams can blend
pdfplumber (for text extraction) with reportlab (for PDF generation).
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import Iterable, List

import pdfplumber
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

SATIRE_MAP = {
    r"\bAllison\b": "Allison “Alli” Margeaux",
    r"\bLisa Ling\b": "Lysa Lingo",
    r"\bSeekingArrangement\b": "Seek-n-Arrange (SugarSettlements™)",
    r"\bAngela Bermudo\b": "Angela “Shoe” Bermy",
    r"\bBrook Urick\b": "Brookie Urchin",
    r"230 Fifth\b": "230 Highdeck Rooftop",
    r"\bBellevue Hospital\b": "Bellevue Medical Pavilion",
}

EMAIL_PATTERN = re.compile(r"[\w.-]+@[\w.-]+", re.IGNORECASE)
PHONE_PATTERN = re.compile(r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b")


def redact_text(text: str) -> str:
    """Apply satirical substitutions and redact contact information."""

    redacted = text
    for pattern, replacement in SATIRE_MAP.items():
        redacted = re.sub(pattern, replacement, redacted, flags=re.IGNORECASE)

    redacted = EMAIL_PATTERN.sub("[REDACTED_EMAIL]", redacted)
    redacted = PHONE_PATTERN.sub("[REDACTED_PHONE]", redacted)
    return redacted


def read_pdf_text(source: Path) -> List[str]:
    """Extract and redact text from every page of ``source``."""

    with pdfplumber.open(source) as pdf:
        return [redact_text(page.extract_text() or "") for page in pdf.pages]


def write_pdf(pages_text: Iterable[str], destination: Path) -> None:
    """Write ``pages_text`` to ``destination`` using ReportLab."""

    pdf_canvas = canvas.Canvas(str(destination), pagesize=letter)
    for page_text in pages_text:
        pdf_canvas.setFont("Helvetica", 11)
        text_object = pdf_canvas.beginText(40, 720)
        for line in page_text.splitlines():
            text_object.textLine(line[:2000])
        pdf_canvas.drawText(text_object)
        pdf_canvas.showPage()
    pdf_canvas.save()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "source",
        type=Path,
        help="Path to the PDF that should be transformed.",
    )
    parser.add_argument(
        "destination",
        type=Path,
        nargs="?",
        default=Path("IncidentOverview_satire_redacted.pdf"),
        help="Output path for the generated satire-friendly PDF.",
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    pages = read_pdf_text(args.source)
    write_pdf(pages, args.destination)


if __name__ == "__main__":
    main()
