#!/usr/bin/env python3
"""Build a PDF pitch deck from images and package it with the assets.

This utility mirrors the behaviour of a previously shared helper script that
combined a ReportLab PDF deck with a ZIP archive containing the original image
assets. It adds a small CLI so the title, intro sections, and output locations
can be customized.
"""

from __future__ import annotations

import argparse
import zipfile
from pathlib import Path
from typing import Iterable, Sequence

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer


DEFAULT_SECTIONS = (
    "This deck includes system previews, ledger visualizations, live ops screens, kinetic scoring outputs, and credentials.",
    "All images are original system mockups from StagePort OS, Decrypt OS, Ballet Bank, and PyRouette-powered proofs.",
    "Use this deck for BizBuySell, Acquire.com, investor outreach, and licensing negotiations.",
)


def collect_images(inputs: Sequence[Path]) -> list[Path]:
    """Return a deduplicated, ordered list of existing image paths.

    Directories are expanded one level deep and filtered to common image
    extensions. Non-existent paths are ignored but reported.
    """

    seen: set[Path] = set()
    images: list[Path] = []
    allowed_suffixes = {".jpg", ".jpeg", ".png"}

    for candidate in inputs:
        if candidate.is_dir():
            for child in sorted(candidate.iterdir()):
                if child.suffix.lower() in allowed_suffixes and child.is_file():
                    if child not in seen:
                        seen.add(child)
                        images.append(child)
        elif candidate.is_file():
            if candidate.suffix.lower() in allowed_suffixes and candidate not in seen:
                seen.add(candidate)
                images.append(candidate)
        else:
            print(f"⚠️ Skipping missing path: {candidate}")

    existing = [path for path in images if path.exists()]
    missing = [path for path in images if not path.exists()]

    if missing:
        for path in missing:
            print(f"⚠️ File referenced but missing: {path}")

    if not existing:
        raise ValueError("No valid images were found to include in the pitch deck.")

    return existing


def build_pitch_deck(
    images: Iterable[Path],
    pdf_path: Path,
    *,
    title: str,
    sections: Sequence[str],
    image_width: float,
    image_height: float,
) -> None:
    """Create a PDF pitch deck that includes all provided images."""

    styles = getSampleStyleSheet()
    story = [Paragraph(title, styles["Title"]), Spacer(1, 0.3 * inch)]

    for section in sections:
        story.append(Paragraph(section, styles["BodyText"]))
        story.append(Spacer(1, 0.2 * inch))

    story.append(Paragraph("System Visuals", styles["Heading2"]))
    story.append(Spacer(1, 0.25 * inch))

    for img in images:
        story.append(Image(str(img), width=image_width, height=image_height))
        story.append(Spacer(1, 0.3 * inch))

    pdf_path.parent.mkdir(parents=True, exist_ok=True)
    SimpleDocTemplate(str(pdf_path), pagesize=letter).build(story)
    print(f"✅ Wrote pitch deck: {pdf_path}")


def package_assets(pdf_path: Path, images: Sequence[Path], zip_path: Path) -> None:
    """Create a ZIP archive containing the PDF and the referenced images."""

    zip_path.parent.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.write(pdf_path, arcname=f"PitchDeck/{pdf_path.name}")
        for index, image in enumerate(images, start=1):
            arcname = f"Images/SystemPreview_{index}.jpeg"
            archive.write(image, arcname=arcname)

    print(f"✅ Created ZIP archive: {zip_path}")


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate a PDF pitch deck from images and bundle it into a ZIP archive.",
    )
    parser.add_argument(
        "images",
        metavar="IMAGE",
        type=Path,
        nargs="+",
        help="Image files or directories containing images to include in the deck.",
    )
    parser.add_argument(
        "--title",
        default="Decrypt My Story — Full Acquisition Package Pitch Deck",
        help="Title displayed at the top of the generated deck.",
    )
    parser.add_argument(
        "--section",
        action="append",
        dest="sections",
        help="Introductory section paragraph. Can be provided multiple times.",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path("dist/final_bizbuysell_package"),
        help="Directory where the PDF and ZIP output will be written.",
    )
    parser.add_argument(
        "--pdf-name",
        type=Path,
        default=Path("DecryptMyStory_FullPitchDeck.pdf"),
        help="Filename for the generated PDF (relative to the output directory).",
    )
    parser.add_argument(
        "--zip-name",
        type=Path,
        default=Path("DecryptMyStory_FULL_ASSET_PACKAGE.zip"),
        help="Filename for the generated ZIP archive (relative to the output directory).",
    )
    parser.add_argument(
        "--image-width",
        type=float,
        default=5.5 * inch,
        help="Width used when rendering each image inside the PDF (in points).",
    )
    parser.add_argument(
        "--image-height",
        type=float,
        default=3.5 * inch,
        help="Height used when rendering each image inside the PDF (in points).",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)

    images = collect_images(args.images)
    sections = args.sections if args.sections is not None else list(DEFAULT_SECTIONS)

    pdf_path = (args.out_dir / args.pdf_name).resolve()
    zip_path = (args.out_dir / args.zip_name).resolve()

    build_pitch_deck(
        images,
        pdf_path,
        title=args.title,
        sections=sections,
        image_width=args.image_width,
        image_height=args.image_height,
    )
    package_assets(pdf_path, images, zip_path)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
