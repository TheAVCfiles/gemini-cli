"""Generate the Prati Line of Exile dossier as a PDF.

This script mirrors the narrative shared in the MWRA Glossary project
history notes.  It exists purely as a convenience example for teams that
want to produce a printable artifact alongside the glossary bundle.
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


OUTPUT_FILE_NAME = "Prati_Line_of_Exile_Dossier.pdf"


def build_story() -> list:
    """Create the platypus story elements for the dossier."""
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "title_style",
        parent=styles["Title"],
        fontSize=20,
        spaceAfter=20,
        alignment=1,
    )

    subtitle_style = ParagraphStyle(
        "subtitle_style",
        parent=styles["Normal"],
        fontSize=12,
        alignment=1,
        spaceAfter=20,
    )

    story = [
        Paragraph("The Line of Exile", title_style),
        Paragraph("From Rovagnasca to New York to the Digital Stage", subtitle_style),
        Spacer(1, 0.3 * inch),
    ]

    body_style = styles["BodyText"]

    intro_text = (
        """
This dossier traces the lineage of <b>Roberto Prati (1825–1887)</b>, the exiled Marquis of Rovagnasca, and the American Prati–Van Cura line that followed.
From noble courts in Piedmont to a New York tenement, his story traverses continents and centuries, re-emerging in descendants who live through music, language, media, and code.
"""
    )

    historical_text = (
        """
<b>Roberto Prati, Marquis of Rovagnasca (1825–1887)</b><br/>
Born in Rovagnasca, Piedmont, Italy, Roberto graduated from the Turin Military Academy and served as an officer under King Victor Emmanuel II.
His passionate affair with a woman close to the royal court led to his exile. Stripped of title and fortune, he emigrated to New York.
There, in January 1887, he died in poverty at 382 East 82nd Street. Yet his obituary was carried across the world — from New York to Oregon, Honolulu, and even Australia — the telegraph age's version of a global headline.
"""
    )

    american_text = (
        """
<b>Robert Prati (1828–1887) & Harriot A. McQuaide</b><br/>
Possibly the same man under an anglicized identity, or a close relative who carried the Prati bloodline into America.
Settled in New Jersey and fathered <b>Caroline F. Van Cura (née Prati)</b>, whose marriage intertwined Italian nobility with the Dutch-American Van Cura family.
"""
    )

    modern_text = (
        """
<b>The Artistic Continuum</b><br/>
Generations later, the lineage of exile finds new expression.
Descendants and kin now work within the classical arts, music, language, and telecommunications — continuing the Prati archetype of bridging art and signal.
What began as a marquis’s scandal becomes a family legacy of creation, translation, and transformation.
In the digital age, the same impulse to communicate beauty through structure persists — the romance of exile reborn as media, movement, and code.
"""
    )

    footer_text = (
        """
<i>Compiled and annotated for historical context. Sources include The Wheeling Daily Intelligencer (WV, Jan 31 1887), The Oregon Scout (Feb 26 1887), and colonial reprints in Australia and Hawaii.</i>
"""
    )

    for block in (intro_text, historical_text, american_text, modern_text):
        story.append(Paragraph(block.strip(), body_style))
        story.append(Spacer(1, 0.2 * inch))

    story.pop()  # Remove trailing spacer before footer
    story.append(Spacer(1, 0.3 * inch))
    story.append(Paragraph(footer_text.strip(), styles["Italic"]))

    return story


def generate_dossier(output_path: Path) -> Path:
    """Write the dossier PDF to ``output_path`` and return the path."""
    doc = SimpleDocTemplate(str(output_path), pagesize=letter)
    story = build_story()
    doc.build(story)
    return output_path


def main() -> None:
    output_path = Path(__file__).resolve().parent / OUTPUT_FILE_NAME
    path = generate_dossier(output_path)
    print(f"Generated dossier at {path}")


if __name__ == "__main__":
    main()
