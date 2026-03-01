#!/usr/bin/env python3
"""Generate printable hexaflexagon strips for puzzle handouts.

This script renders two variants by default:
- FOUND: unlabeled triangles with minimal instructions.
- OFFICIAL: triangles labeled S/C/E (Surface/Cipher/Echo) with indices.

Usage examples:
    python scripts/hexaflex_strip.py --output /tmp/hexaflex
    python scripts/hexaflex_strip.py --mode official --title "Custom" --subtitle "Notes" --output strip.pdf
"""
from __future__ import annotations

import argparse
import math
from pathlib import Path

from reportlab.graphics.shapes import Drawing, Line, String
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

styles = getSampleStyleSheet()


def make_hexaflex_strip(path: Path, title: str, subtitle: str, label_fn=None) -> None:
    doc = SimpleDocTemplate(str(path), pagesize=letter)
    story = [Paragraph(f"<b>{title}</b>", styles["Title"]), Spacer(1, 20), Paragraph(subtitle, styles["BodyText"]), Spacer(1, 20)]

    drawing = Drawing(500, 200)

    side = 50
    height = side * math.sqrt(3) / 2

    coords = []
    x = 50
    y = 100
    for i in range(10):
        if i % 2 == 0:
            coords.append([(x, y), (x + side, y), (x + side / 2, y + height)])
        else:
            coords.append([(x, y + height), (x + side, y + height), (x + side / 2, y)])
        x += side

    for tri in coords:
        (x1, y1), (x2, y2), (x3, y3) = tri
        drawing.add(Line(x1, y1, x2, y2))
        drawing.add(Line(x2, y2, x3, y3))
        drawing.add(Line(x3, y3, x1, y1))

    if label_fn is not None:
        for i, tri in enumerate(coords):
            (x1, y1), (x2, y2), (x3, y3) = tri
            cx = (x1 + x2 + x3) / 3
            cy = (y1 + y2 + y3) / 3
            text = label_fn(i)
            if text:
                drawing.add(String(cx - 6, cy - 4, text, fontSize=8))

    story.append(drawing)
    doc.build(story)


def official_label(index: int) -> str:
    roles = ["S", "C", "E"]
    role = roles[index % len(roles)]
    return f"{role}{index + 1}"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Render printable hexaflexagon strips.")
    parser.add_argument("--output", type=Path, default=Path("/mnt/data/hexaflex"), help="Output file or directory for generated PDF(s). Defaults to /mnt/data/hexaflex.*")
    parser.add_argument("--mode", choices=["both", "found", "official"], default="both", help="Which strip(s) to generate.")
    parser.add_argument("--title", default=None, help="Custom title for single-mode generation.")
    parser.add_argument("--subtitle", default=None, help="Custom subtitle for single-mode generation.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if args.mode == "both":
        base = args.output
        if base.suffix:
            base = base.with_suffix("")
        found_path = base.with_name(f"{base.name}_found.pdf")
        official_path = base.with_name(f"{base.name}_official.pdf")

        make_hexaflex_strip(
            found_path,
            "ROOM 000 — Hexaflexa-Cipher (FOUND EDITION)",
            "Unearthed strip. No numbering. Cut and fold; treat each face as an unknown glyph surface.",
            label_fn=None,
        )

        make_hexaflex_strip(
            official_path,
            "ROOM 000 — Hexaflexa-Cipher (OFFICIAL EDITION)",
            "Cut along outer border. Fold triangles back-to-back. Each face is marked S (Surface), C (Cipher), or E (Echo) with an index.",
            label_fn=official_label,
        )

        print(f"Wrote: {found_path}\nWrote: {official_path}")
        return

    output_path = args.output
    if output_path.is_dir():
        output_path /= f"hexaflex_{args.mode}.pdf"

    title = args.title or (
        "ROOM 000 — Hexaflexa-Cipher (FOUND EDITION)" if args.mode == "found" else "ROOM 000 — Hexaflexa-Cipher (OFFICIAL EDITION)"
    )
    subtitle = args.subtitle or (
        "Unearthed strip. No numbering. Cut and fold; treat each face as an unknown glyph surface."
        if args.mode == "found"
        else "Cut along outer border. Fold triangles back-to-back. Each face is marked S (Surface), C (Cipher), or E (Echo) with an index."
    )
    label_fn = None if args.mode == "found" else official_label

    make_hexaflex_strip(output_path, title, subtitle, label_fn=label_fn)
    print(f"Wrote: {output_path}")


if __name__ == "__main__":
    main()
