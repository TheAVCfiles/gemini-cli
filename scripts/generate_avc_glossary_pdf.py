#!/usr/bin/env python3
"""Generate the "Glossary of Works — Allison Van Cura" PDF with previews.

Beyond rebuilding the PDF, the script can surface immersive stage-by-stage
previews directly in the terminal.  The preview stream echoes the studio
practice of workshopping choreography before fixing it into a final piece,
making it easier for collaborators to review each creative block before the
document is rendered.
"""

from __future__ import annotations

import argparse
import re
import shutil
import textwrap
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:  # pragma: no cover - used for static analysis only
    from reportlab.lib.styles import ParagraphStyle


TITLE_TEXT = "Glossary of Works — Allison Van Cura"


@dataclass(frozen=True)
class GlossarySection:
    icon: str
    title: str
    body: str


SECTIONS: tuple[GlossarySection, ...] = (
    GlossarySection(
        icon="⚙️",
        title="CORE ENTITIES",
        body="""
<b>AVC Systems Studios</b><br/>
Creative technology lab and myth-tech brand hub. Philosophy: “The System is the Dance.”
Code, choreography, and legacy intertwine to craft expressive systems of design and storytelling.<br/><br/>

<b>Decrypt the Girl (DTG)</b><br/>
A movement-based education initiative fostering expressive confidence, empathy, and emotional intelligence through choreography and reflection.<br/><br/>

<b>Decrypt the Future (DTF)</b><br/>
Narrative and philosophical extension of DTG, merging myth-tech design, astrology, and futurism into immersive storytelling and commerce.<br/><br/>

<b>Intuition Labs</b><br/>
Experience design and R&D partner—specializing in emotional UX and intuitive, human-centered interfaces.
""",
    ),
    GlossarySection(
        icon="💫",
        title="CURRICULUM + CREATIVE FRAMEWORKS",
        body="""
<b>APop Allstars Curriculum Pack</b><br/>
Instructor, parent, and student toolkit integrating rhythm, emotion, and teamwork. Includes Progress Passports, Reflection Journals, and Digital Reward Systems.<br/><br/>

<b>Rhythm Sync Lab</b><br/>
A beat-mapping activity where dancers align emotions and motion, cultivating awareness of tempo and collective rhythm.<br/><br/>

<b>Kinetic Cipher Log</b><br/>
Students encode emotion into movement symbols—creating a personal motion language.<br/><br/>

<b>Idol Energy Drills</b><br/>
Exercises in stage presence, confidence, and power posing to teach body-mind connection and performative self-belief.
""",
    ),
    GlossarySection(
        icon="🌀",
        title="NARRATIVE + PHILOSOPHICAL TEXTS",
        body="""
<b>Decrypt the American Dream</b><br/>
A mythic preface connecting ancestry, code, and choreography. Frames exile as creative discipline and rhythm as inheritance.<br/><br/>

<b>Law of 3 Trilogy (Digital Pop Culture Drop)</b><br/>
A meta-satirical product ecosystem exploring how technology, ritual, and commerce interlock. Features three storefronts: SURFACE, CIPHER, and ECHO—each blending art, automation, and mysticism.
""",
    ),
    GlossarySection(
        icon="🏙️",
        title="STRATEGY + COMMERCE BLUEPRINTS",
        body="""
<b>Optimizing NYC Metro Digital Gift Offerings for AVC Studios</b><br/>
A futurist research catalog that merges astrology, commerce, and user psychology. Defines the “Vintage-Future Chic” aesthetic for digital retail and interactive storytelling.
""",
    ),
    GlossarySection(
        icon="🎮",
        title="INTERACTIVE + DIGITAL EXPERIENCES",
        body="""
<b>Decrypt the Girl: Interactive Demo</b><br/>
Web-based dance learning prototype bridging physical and digital motion.<br/><br/>

<b>APop Rhythm Battle (React)</b><br/>
A rhythm-action game where dancers compete through timing, emotion, and digital choreography.<br/><br/>

<b>My Mining World (Minecraft Educational)</b><br/>
Sandbox teaching empathy and responsibility through pet care and resource systems.<br/><br/>

<b>AI Platformer — Mythic Worlds Engine</b><br/>
Procedurally generated game world that adapts to player emotion and theme, illustrating narrative recursion and emotional feedback design.
""",
    ),
    GlossarySection(
        icon="🧠",
        title="PHILOSOPHICAL + DESIGN VOCABULARY",
        body="""
<b>Myth-Tech</b> — Fusion of mythology and technology in design practice.<br/>
<b>Legacy Systems</b> — Heritage reframed as living architecture of creativity.<br/>
<b>Cipher Choreography</b> — Encoding emotion into movement.<br/>
<b>Astro-Commerce</b> — Aligning commerce and creativity with celestial cycles.<br/>
<b>Vintage-Future Chic</b> — Aesthetic of retro tactility meeting digital futurism.<br/>
<b>Law of 3</b> — Triadic design principle: aesthetic, emotional, and structural balance in every artifact.
""",
    ),
)


CLOSING_QUOTE = (
    "“You design systems that teach people how to move—emotionally, digitally, and culturally—with rhythm and intention.”"
)


def create_styles() -> dict[str, "ParagraphStyle"]:
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="TitleStyle",
            fontName="HeiseiMin-W3",
            fontSize=20,
            leading=24,
            spaceAfter=20,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SectionHeader",
            fontName="HeiseiMin-W3",
            fontSize=14,
            leading=18,
            spaceBefore=12,
            spaceAfter=6,
            textColor="#333399",
        )
    )
    styles.add(
        ParagraphStyle(
            name="BodyStyle",
            fontName="HeiseiMin-W3",
            fontSize=11,
            leading=15,
            spaceAfter=10,
        )
    )
    styles.add(
        ParagraphStyle(
            name="QuoteStyle",
            fontName="HeiseiMin-W3",
            fontSize=11,
            leading=15,
            leftIndent=20,
            textColor="#555555",
            spaceAfter=10,
        )
    )
    return styles


def build_document(output_path: Path) -> None:
    """Create the glossary PDF at *output_path*."""
    # Ensure ReportLab can handle the Unicode content we are using.
    from reportlab.lib.pagesizes import LETTER
    from reportlab.lib.units import inch
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.cidfonts import UnicodeCIDFont
    from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate

    pdfmetrics.registerFont(UnicodeCIDFont("HeiseiMin-W3"))

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=LETTER,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = create_styles()

    content = [Paragraph(TITLE_TEXT, styles["TitleStyle"])]

    for section in SECTIONS:
        content.append(
            Paragraph(f"{section.icon} {section.title}", styles["SectionHeader"])
        )
        content.append(Paragraph(section.body, styles["BodyStyle"]))

    content.extend(
        [
            PageBreak(),
            Paragraph(CLOSING_QUOTE, styles["QuoteStyle"]),
        ]
    )

    doc.build(content)


def html_to_terminal_copy(raw: str) -> str:
    """Convert lightweight HTML fragments into plain text for previews."""

    text = raw.replace("<br/>", "\n").replace("<br />", "\n")
    text = re.sub(r"</?b>", "", text)
    text = re.sub(r"</?i>", "", text)
    text = re.sub(r"</?u>", "", text)
    text = re.sub(r"</?em>", "", text)
    text = re.sub(r"</?strong>", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+\n", "\n", text)
    return text.strip()


def render_stage_preview(title: str, body: str, stage_index: int, stage_count: int) -> None:
    """Print a framed preview block to the terminal."""

    terminal_width = shutil.get_terminal_size(fallback=(100, 20)).columns
    content_width = max(48, min(terminal_width - 6, 96))

    wrapped_title = textwrap.wrap(title, width=content_width)
    paragraphs = [
        textwrap.wrap(paragraph.strip(), width=content_width)
        for paragraph in html_to_terminal_copy(body).split("\n\n")
        if paragraph.strip()
    ]

    stage_label = f"Stage {stage_index} of {stage_count}"
    header_line = f" {stage_label} "
    top_border = "╔" + "═" * (content_width + 2) + "╗"
    separator = "╠" + "═" * (content_width + 2) + "╣"
    bottom_border = "╚" + "═" * (content_width + 2) + "╝"

    print()
    print(top_border)
    print(
        "║"
        + header_line.center(content_width + 2, "═")
        + "║"
    )
    print(separator)

    for line in wrapped_title or [""]:
        print(f"║ {line.ljust(content_width)} ║")

    print(separator)

    for index, paragraph_lines in enumerate(paragraphs):
        for line in paragraph_lines:
            print(f"║ {line.ljust(content_width)} ║")
        if index != len(paragraphs) - 1:
            print(f"║ {'':{content_width}s} ║")

    if not paragraphs:
        print(f"║ {'':{content_width}s} ║")

    print(bottom_border)


def render_terminal_previews() -> None:
    """Stream immersive previews of each stage to the terminal."""

    total_stages = len(SECTIONS) + 2  # title + closing quote

    render_stage_preview(
        title="Opening Title",
        body=TITLE_TEXT,
        stage_index=1,
        stage_count=total_stages,
    )

    for index, section in enumerate(SECTIONS, start=2):
        render_stage_preview(
            title=f"{section.icon} {section.title}",
            body=section.body,
            stage_index=index,
            stage_count=total_stages,
        )

    render_stage_preview(
        title="Closing Reflection",
        body=CLOSING_QUOTE,
        stage_index=total_stages,
        stage_count=total_stages,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate the Glossary of Works — Allison Van Cura PDF."
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("docs/AllisonVanCura_Glossary_of_Works.pdf"),
        help="Path where the PDF will be written.",
    )
    parser.add_argument(
        "--no-preview",
        dest="preview",
        action="store_false",
        help="Skip the immersive terminal preview and only produce the PDF.",
    )
    parser.add_argument(
        "--preview-only",
        action="store_true",
        help="Show the terminal preview without writing a PDF.",
    )
    parser.set_defaults(preview=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.preview:
        render_terminal_previews()

    if args.preview_only:
        print("Preview only mode enabled — PDF generation skipped.")
        return

    output_path: Path = args.output
    output_path.parent.mkdir(parents=True, exist_ok=True)
    build_document(output_path)
    print(f"Glossary PDF written to {output_path}")


if __name__ == "__main__":
    main()
