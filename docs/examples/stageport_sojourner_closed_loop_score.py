"""Generate the StagePort / Sojourner Closed Loop Score as a PDF.

This script reflows the one-page score into a clean ReportLab output using
only built-in styles. Run it from the `docs/examples/` directory to produce a
single `StagePort_Sojourner_Closed_Loop_Score.pdf` next to the script.
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

OUTPUT_FILE_NAME = "StagePort_Sojourner_Closed_Loop_Score.pdf"


def build_styles():
    """Return the stylesheet with a centered header."""
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="Header",
            parent=styles["Heading1"],
            fontSize=16,
            leading=20,
            spaceAfter=12,
            spaceBefore=12,
            alignment=1,
        )
    )
    return styles


def build_story(styles) -> list:
    """Compose the platypus story for the closed loop score."""
    story: list = []

    story.append(
        Paragraph("STAGEPORT / SOJOURNER — CLOSED LOOP SCORE", styles["Header"])
    )
    story.append(
        Paragraph("<b>Runtime:</b> Finite &nbsp;&nbsp; <b>State:</b> Filed", styles["Normal"])
    )
    story.append(Spacer(1, 0.3 * inch))

    sections = [
        ("I. ANCHOR", "Axis established · Provenance declared · Hash fixed"),
        ("II. CAPTURE", "Live motion only · No replay payload · Presence logged"),
        ("III. SCORE", "Motion → Structure → Ledger → Proof"),
        ("IV. DECAY", "Signal released · Identity preserved · Memory aggregated"),
        ("V. MIRROR", "Distributed persistence · No single point of failure"),
        ("VI. REST", "Generator disengaged · Archivist active · System holds"),
    ]

    for title, detail in sections:
        story.append(Paragraph(f"<b>{title}</b><br/>{detail}", styles["Normal"]))
        story.append(Spacer(1, 0.15 * inch))

    story.append(Paragraph("<b>STUDIO OPERATOR RUN SHEET</b>", styles["Heading2"]))
    story.append(
        Paragraph(
            (
                "Roles are rotational, never identities. Authority is structural, not "
                "performative."
            ),
            styles["Normal"],
        )
    )
    story.append(Spacer(1, 0.15 * inch))

    story.append(
        Paragraph(
            (
                "<b>Architect:</b> Owns score, sets invariants, leaves room.<br/>"
                "<b>Conductor:</b> Schedules cycles, calls start/stop, enforces rest.<br/>"
                "<b>Archivist:</b> Files artifacts, verifies hashes, controls release.<br/>"
                "<b>Dancers:</b> Execute motion, do not explain system, do not own ledger.<br/>"
                "<b>Witness:</b> Verifies proof, cannot alter state."
            ),
            styles["Normal"],
        )
    )
    story.append(Spacer(1, 0.25 * inch))

    story.append(
        Paragraph(
            (
                "<b>STOP CONDITIONS:</b><br/>"
                "• Explanation exceeds execution<br/>"
                "• Identity replaces role<br/>"
                "• Extraction pressure rises<br/>"
                "• Architect feels on stage again"
            ),
            styles["Normal"],
        )
    )
    story.append(Spacer(1, 0.2 * inch))

    story.append(
        Paragraph(
            (
                "<b>SUCCESS CONDITION:</b> The studio runs. The dancers dance. "
                "The ledger holds. The architect rests."
            ),
            styles["Normal"],
        )
    )

    return story


def generate_score(output_path: Path) -> Path:
    """Write the Closed Loop Score PDF to ``output_path`` and return the path."""
    styles = build_styles()
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=LETTER,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72,
    )
    doc.build(build_story(styles))
    return output_path


def main() -> None:
    base_dir = Path(__file__).resolve().parent
    output_path = base_dir / OUTPUT_FILE_NAME
    path = generate_score(output_path)
    print(f"Generated Closed Loop Score at {path}")


if __name__ == "__main__":
    main()
