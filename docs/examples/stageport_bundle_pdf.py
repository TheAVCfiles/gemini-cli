"""Assemble a Stageport PDF bundle from a folder of JPEG stills.

This mirrors the quick ReportLab sketch shared in the Stageport notebooks:
scale each image to fit a letter page, stack them sequentially, and export a
single PDF. The script defaults to the filenames used in the original bundle
notes but accepts custom directories or filenames when needed.
"""

from __future__ import annotations

from pathlib import Path
from typing import Iterable, Sequence

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import Image, PageBreak, SimpleDocTemplate

DEFAULT_IMAGE_NAMES: Sequence[str] = (
    "IMG_90A3CD7B-A3B9-4B11-BB70-EBF25B99DB27.jpeg",
    "IMG_91B4467F-DAA1-404D-8BD1-2DC7AA93A169.jpeg",
    "IMG_457A2984-5EEC-4302-8041-FF7A33DB1E42.jpeg",
    "IMG_0EAFE2F6-1855-4113-A0CF-0BD1AB3A5927.jpeg",
    "IMG_C414D990-D2C5-4D9A-96C0-6329D376C300.jpeg",
    "IMG_733B01EC-68FB-40A8-82F8-C8EF8EE67CC1.jpeg",
    "IMG_7773A535-46F3-4D24-8E8D-9BCC496297BC.jpeg",
    "IMG_DE55C5BF-D920-43A9-ADDC-D689A62D766C.jpeg",
    "IMG_D04D9BE1-FD51-4C9F-B761-DA73686935CE.jpeg",
    "IMG_A68CE171-E445-452D-9F2F-872C7A928164.jpeg",
    "IMG_8D829237-14A1-4352-ABAC-99D5D7BD31AF.jpeg",
    "3175867E-AE75-4D4D-950A-5B14DD47E20B.jpeg",
    "A746D167-35C6-4E4C-BCF5-20BA80029974.jpeg",
    "2FF4A35D-6526-4C1D-93A0-22E82B0022F7.jpeg",
    "721134C8-BBFE-4EBB-A52D-5DCC4BBAA996.jpeg",
    "DFAAD9E5-263F-49CC-A317-71717BF01F79.jpeg",
    "1D21E242-A7A0-4969-B8BD-BE65D7D7F6AF.jpeg",
    "B189AA7D-A255-4D76-8804-90ABAF0A6261.jpeg",
    "A73AD0ED-9253-4447-B749-14EDCB7791C5.jpeg",
    "C32AABFE-97FF-4EA4-A1B2-AA72F7262EF0.jpeg",
    "61F3F0D4-714D-4220-BCE9-3F2A6DD31DE2.jpeg",
    "08B62746-F78C-4CC6-AAA1-6AE92A3A9F52.jpeg",
    "7B3FC705-78F0-4328-B170-213D376F50DC.jpeg",
    "23537142-4D9B-40C5-A569-ECD90C41023F.jpeg",
    "27494895-67C5-4083-AAB0-BCA316010729.jpeg",
    "13EA8088-1FFB-45BF-8689-F5CC9736B689.jpeg",
    "D8C4FFE9-C831-4A13-8AC3-EDEF246EE2FA.jpeg",
    "C2484A73-8709-420C-B10B-A85D9433A9BC.jpeg",
    "F068A5AA-0096-4B16-A67D-0832E9522720.jpeg",
    "8F5387CF-4E98-447D-9C27-3E42B98056E1.jpeg",
    "715DD0E8-6B84-4367-8742-A56CFD017AC2.jpeg",
)

DEFAULT_OUTPUT = "stageport_bundle.pdf"
DEFAULT_IMAGE_DIR = Path(__file__).resolve().parent / "stageport-bundle-images"
MAX_WIDTH = 6 * inch
MAX_HEIGHT = 7 * inch


def build_story(image_dir: Path, image_names: Iterable[str]) -> list:
    """Create a platypus story of scaled images and page breaks."""
    story: list = []

    for name in image_names:
        img_path = image_dir / name
        if not img_path.exists():
            print(f"Skipping missing image: {img_path}")
            continue

        img = Image(str(img_path))
        original_width, original_height = img.wrap(0, 0)
        if not original_width or not original_height:
            print(f"Skipping unreadable image: {img_path}")
            continue

        scale = min(MAX_WIDTH / original_width, MAX_HEIGHT / original_height, 1)
        img.drawWidth = original_width * scale
        img.drawHeight = original_height * scale

        story.append(img)
        story.append(PageBreak())

    if story and isinstance(story[-1], PageBreak):
        story.pop()  # Avoid trailing blank page

    return story


def generate_pdf(image_dir: Path, image_names: Sequence[str] = DEFAULT_IMAGE_NAMES) -> Path:
    """Write the Stageport bundle PDF and return the path."""
    pdfmetrics.registerFont(UnicodeCIDFont("HeiseiMin-W3"))

    output_path = Path(__file__).resolve().parent / DEFAULT_OUTPUT
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        leftMargin=0.5 * inch,
        rightMargin=0.5 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
    )

    story = build_story(image_dir, image_names)
    if not story:
        raise FileNotFoundError(
            f"No images found in {image_dir}. Populate it with JPEGs to build the bundle."
        )

    doc.build(story)
    return output_path


def main() -> None:
    """Generate the PDF bundle using default filenames and image directory."""
    image_dir = DEFAULT_IMAGE_DIR
    output_path = generate_pdf(image_dir)
    print(f"Generated Stageport bundle at {output_path}")


if __name__ == "__main__":
    main()
