#!/usr/bin/env python3
"""Generate the Casa Savoia genealogical verification request letter as a PDF."""

from __future__ import annotations

import argparse
from pathlib import Path
from textwrap import dedent

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

DEFAULT_FILENAME = "Casa_Savoia_Verifica_Lineage_AVC.pdf"

ITALIAN_TEXT = dedent(
    """
    <b>Alla cortese attenzione di:</b><br/>
    Archivio di Stato di Torino<br/>
    Sezione Casa Reale / Ministero della Guerra<br/>
    Via Piave, 21 — 10122 Torino, Italia<br/><br/>
    <b>Oggetto:</b> Richiesta di verifica genealogica — Famiglia <i>Prati di Rovagnasca</i><br/><br/>
    Egregi Signori,<br/><br/>
    Desidero presentare la documentazione relativa a <b>Roberto Prati di Rovagnasca (1828–1887)</b>, ufficiale dell’Esercito Sardo e marchese di Rovagnasca, esiliato negli Stati Uniti.
    Le fonti giornalistiche e genealogiche americane confermano il titolo e l’appartenenza alla <i>Casa Savoia</i>.
    Richiedo cortesemente la verifica nei registri nobiliari piemontesi e nei fondi del Ministero della Guerra, nonché eventuale riconoscimento storico-archivistico della linea di discendenza <i>Prati di Rovagnasca → Van Cura</i>.<br/><br/>
    Allego copia del dossier genealogico, con fonti primarie tratte dal <i>New York Times</i> (29 gennaio 1887) e dal <i>New York Herald</i> (12 gennaio 1887), nonché documenti di continuità genealogica fino alla linea Van Cura (New York – Westchester, XX secolo).<br/><br/>
    Con ossequio e rispetto,<br/><br/>
    <b>Allison Van Cura</b><br/>
    Discendente diretta della linea Prati di Rovagnasca<br/>
    New York, Stati Uniti<br/><br/><br/>
    """
)

ENGLISH_TEXT = dedent(
    """
    <b>To the attention of:</b><br/>
    State Archives of Turin<br/>
    Royal Household Section / Ministry of War<br/>
    Via Piave, 21 — 10122 Turin, Italy<br/><br/>
    <b>Subject:</b> Genealogical Verification Request — Family <i>Prati di Rovagnasca</i><br/><br/>
    Dear Archivists,<br/><br/>
    I respectfully submit the documentation relating to <b>Roberto Prati di Rovagnasca (1828–1887)</b>, an officer in the Sardinian Army and Marquis of Rovagnasca, exiled to the United States.
    American genealogical and journalistic sources confirm his title and affiliation with the <i>House of Savoy</i>.
    I kindly request archival verification within the Piedmontese nobility registers and the Ministry of War collections, and the historical acknowledgment of the descent line <i>Prati di Rovagnasca → Van Cura</i>.<br/><br/>
    Attached please find the compiled dossier, including primary press sources (<i>New York Times</i>, January 29, 1887; <i>New York Herald</i>, January 12, 1887) and genealogical continuity documentation tracing through the Van Cura line of New York and Westchester County.<br/><br/>
    With esteem and gratitude,<br/><br/>
    <b>Allison Van Cura</b><br/>
    Direct Descendant, Prati di Rovagnasca Line<br/>
    New York, United States<br/><br/><br/>
    """
)


def build_story() -> list:
    """Return the Platypus story representing the bilingual letter."""

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "title_style",
        parent=styles["Title"],
        alignment=1,
        fontSize=18,
        spaceAfter=12,
    )
    body_style = ParagraphStyle(
        "body_style",
        parent=styles["BodyText"],
        leading=14,
        fontSize=11,
    )

    story: list = []
    story.append(
        Paragraph(
            "Richiesta di Verifica Genealogica — Famiglia Prati di Rovagnasca (Casa Savoia)",
            title_style,
        )
    )
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph(ITALIAN_TEXT, body_style))
    story.append(Paragraph(ENGLISH_TEXT, body_style))
    story.append(Spacer(1, 0.3 * inch))
    story.append(
        Paragraph(
            "<i>Compiled October 2025 — for submission with the Prati Line of Exile Dossier</i>",
            styles["Italic"],
        )
    )
    return story


def create_letter(output_path: Path) -> Path:
    """Generate the PDF at ``output_path`` and return the final path."""

    output_path.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(str(output_path), pagesize=letter)
    doc.build(build_story())
    return output_path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate the Casa Savoia genealogical verification request letter PDF.",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=Path(DEFAULT_FILENAME),
        help=(
            "Path to the resulting PDF file. May be a directory or a file path. "
            "Defaults to Casa_Savoia_Verifica_Lineage_AVC.pdf in the current directory."
        ),
    )
    return parser.parse_args()


def resolve_output_path(raw_path: Path) -> Path:
    """Return the concrete PDF path, adding the default filename/suffix when needed."""

    if raw_path.is_dir():
        return raw_path / DEFAULT_FILENAME

    if raw_path.suffix.lower() != ".pdf":
        return raw_path.with_suffix(".pdf")

    return raw_path


def main() -> None:
    args = parse_args()
    output_path = resolve_output_path(args.output)
    final_path = create_letter(output_path)
    print(final_path.resolve())


if __name__ == "__main__":
    main()
