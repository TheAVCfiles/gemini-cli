"""Utility for generating the Rumi Sensory Armor same-day design package.

This module reproduces the behaviour requested in the task description by
building a bundle of printable PDFs (front panel, sleeves, size chart, tech
pack) alongside simple rectangular DXF panel outlines for each graded size.
The resulting assets are written to ``dist/Rumi_SensoryArmor_DesignPackage``
and zipped for one-click delivery.

Run this script with ``python scripts/rumi_sensory_armor_package.py``.
"""

from __future__ import annotations

import math
import textwrap
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Sequence

try:
    import numpy as np
except ImportError as exc:  # pragma: no cover - dependency guard
    raise SystemExit("numpy is required to build the design package. Install it with `pip install numpy`.") from exc

try:
    import matplotlib
except ImportError as exc:  # pragma: no cover - dependency guard
    raise SystemExit(
        "matplotlib is required to build the design package. Install it with `pip install matplotlib`.") from exc

# Use the vector-safe backend required for PDF generation before importing
# pyplot to avoid backend conflicts on systems that default to interactive
# backends.
matplotlib.use("pdf")
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages


DIST_DIR = Path(__file__).resolve().parents[1] / "dist"
PACKAGE_DIR = DIST_DIR / "Rumi_SensoryArmor_DesignPackage"


@dataclass(frozen=True)
class SizeSpec:
    """Measurement specification for a garment size."""

    size: str
    chest: float
    body: float
    sleeve: float
    bicep: float
    hem: float


SIZES: Sequence[SizeSpec] = (
    SizeSpec("XS", 17.0, 26.0, 18.0, 6.0, 17.0),
    SizeSpec("S", 18.0, 27.0, 18.5, 6.5, 18.0),
    SizeSpec("M", 19.0, 28.0, 19.0, 7.0, 19.0),
    SizeSpec("L", 20.5, 29.0, 19.5, 7.5, 20.5),
    SizeSpec("XL", 22.0, 30.0, 20.0, 8.0, 22.0),
    SizeSpec("XXL", 23.5, 31.0, 20.5, 8.5, 23.5),
)


def draw_wave(ax: plt.Axes, width_in: float, height_in: float, *, phase: float, amp: float, period: float, lw: float) -> None:
    """Draw a sinusoidal wave with a filled underlay for the front artwork."""

    x = np.linspace(0.0, width_in, 600)
    y = amp * np.sin((2 * math.pi / period) * x + phase) + (height_in * 0.3)
    ax.plot(x, y, linewidth=lw)
    ax.fill_between(x, y, 0, alpha=0.25)


def make_front_pdf(path_pdf: Path, *, shirt_width: float = 13.0, body_height: float = 10.0, bleed: float = 0.25) -> None:
    """Generate the front panel artwork PDF."""

    width = shirt_width + 2 * bleed
    height = body_height + 2 * bleed
    fig = plt.figure(figsize=(width, height))
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(-bleed, shirt_width + bleed)
    ax.set_ylim(-bleed, body_height + bleed)
    ax.add_patch(plt.Rectangle((-bleed, -bleed), shirt_width + 2 * bleed, body_height + 2 * bleed))
    ax.add_patch(plt.Rectangle((0, 0), shirt_width, body_height, fill=False, linewidth=0.5))
    safe = 0.25
    ax.add_patch(
        plt.Rectangle((safe, safe), shirt_width - 2 * safe, body_height - 2 * safe, fill=False, linewidth=0.5, linestyle="--")
    )
    draw_wave(ax, shirt_width, body_height, phase=0.0, amp=1.5, period=2.5, lw=4)
    draw_wave(ax, shirt_width, body_height, phase=math.pi / 6, amp=1.5, period=2.5, lw=3)
    ax.text(3.6, 8.6, "Rrrrrrumi", fontsize=32, fontweight="bold")
    ax.text(shirt_width - 0.25, 8.1, "SLAY", ha="right", fontsize=16)
    ax.text(shirt_width - 0.25, 7.6, "SEOUL", ha="right", fontsize=16)
    ax.text(shirt_width - 0.25, 7.1, "HUNTRIX", ha="right", fontsize=16)
    ax.text(6.0, 1.25, "KPOP DEMON HUNTERS", fontsize=12)
    ax.axis("off")
    fig.savefig(path_pdf, bbox_inches="tight")
    plt.close(fig)


def make_sleeves_pdf(path_pdf: Path, *, sleeve_length: float = 19.0, sleeve_width: float = 6.0, bleed: float = 0.25) -> None:
    """Create a multi-page PDF with mirrored sleeve panels."""

    width = sleeve_length + 2 * bleed
    height = sleeve_width + 2 * bleed
    with PdfPages(path_pdf) as pdf:
        for side in ("LEFT", "RIGHT"):
            fig = plt.figure(figsize=(width, height))
            ax = fig.add_axes([0, 0, 1, 1])
            ax.set_xlim(-bleed, sleeve_length + bleed)
            ax.set_ylim(-bleed, sleeve_width + bleed)
            ax.add_patch(plt.Rectangle((-bleed, -bleed), sleeve_length + 2 * bleed, sleeve_width + 2 * bleed))
            ax.add_patch(plt.Rectangle((0, 0), sleeve_length, sleeve_width, fill=False, linewidth=0.5))
            safe = 0.25
            ax.add_patch(
                plt.Rectangle(
                    (safe, safe),
                    sleeve_length - 2 * safe,
                    sleeve_width - 2 * safe,
                    fill=False,
                    linewidth=0.5,
                    linestyle="--",
                )
            )
            phase = 0.0 if side == "LEFT" else math.pi
            x = np.linspace(0, sleeve_length, 400)
            y = 0.5 * np.sin((2 * math.pi / 5.0) * x + phase) + sleeve_width * 0.5
            ax.plot(x, y, linewidth=2)
            ax.text(0.1, -0.3, f"{side} SLEEVE {sleeve_length:.1f}in x {sleeve_width:.1f}in", fontsize=8)
            ax.axis("off")
            pdf.savefig(fig, bbox_inches="tight")
            plt.close(fig)


def make_size_chart_pdf(path_pdf: Path) -> None:
    """Render the size grading table into a PDF."""

    columns = ("Size", "Chest", "Body Length", "Sleeve", "Bicep", "Hem")
    data = [[getattr(size, field.lower()) if field != "Size" else size.size for field in columns] for size in SIZES]
    fig = plt.figure(figsize=(8.5, 11))
    ax = fig.add_axes([0.05, 0.05, 0.9, 0.9])
    ax.axis("off")
    ax.text(
        0.5,
        0.96,
        "Rumi Sensory Armor – Size Grading (inches)",
        ha="center",
        va="top",
        fontsize=16,
        fontweight="bold",
        transform=ax.transAxes,
    )
    row_height = 0.08
    y0 = 0.88
    x_positions = (0.05, 0.25, 0.42, 0.6, 0.75, 0.9)
    for column, x in zip(columns, x_positions):
        ax.text(x, y0, column, fontsize=12, fontweight="bold", va="center")
    ax.plot([0.05, 0.95], [y0 - 0.03, y0 - 0.03])
    y = y0 - row_height
    for row in data:
        for value, x in zip(row, x_positions):
            ax.text(x, y, f"{value}", fontsize=11, va="center")
        y -= 0.06
    fig.savefig(path_pdf, bbox_inches="tight")
    plt.close(fig)


def dxf_header() -> str:
    return "0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nSECTION\n2\nTABLES\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n"


def dxf_footer() -> str:
    return "0\nENDSEC\n0\nEOF\n"


def dxf_polyline(points: Iterable[tuple[float, float]], layer: str) -> str:
    body = ["0", "POLYLINE", "8", layer, "66", "1", "70", "1"]
    for x, y in points:
        body.extend(["0", "VERTEX", "8", layer, "10", f"{x:.4f}", "20", f"{y:.4f}"])
    body.extend(["0", "SEQEND", "8", layer])
    return "\n".join(body) + "\n"


def write_panel_dxf(path_dxf: Path, panels: Sequence[tuple[str, float, float, float, float]], *, note: str) -> None:
    with path_dxf.open("w", encoding="utf-8") as handle:
        handle.write("999\n" + note + "\n")
        handle.write(dxf_header())
        for layer, x0, y0, width, height in panels:
            points = ((x0, y0), (x0 + width, y0), (x0 + width, y0 + height), (x0, y0 + height))
            handle.write(dxf_polyline(points, layer))
        handle.write(dxf_footer())


def make_dxf_patterns(body_path: Path, sleeve_path: Path, *, bleed: float = 0.25) -> None:
    body_panels = []
    sleeve_panels = []
    for size in SIZES:
        body_width = size.chest + 2 * bleed
        body_height = size.body + 2 * bleed
        sleeve_length = size.sleeve + 2 * bleed
        sleeve_width = size.bicep + 2 * bleed
        body_panels.append((f"BODY_{size.size}", 0.0, 0.0, body_width, body_height))
        sleeve_panels.append((f"SLEEVE_{size.size}", 0.0, 0.0, sleeve_length, sleeve_width))
    note = "Units: inches; rectangles represent print/cut panels with bleed included."
    write_panel_dxf(body_path, body_panels, note=note)
    write_panel_dxf(sleeve_path, sleeve_panels, note=note)


def make_techpack_pdf(path_pdf: Path) -> None:
    fig = plt.figure(figsize=(8.5, 11))
    ax = fig.add_axes([0.05, 0.05, 0.9, 0.9])
    ax.axis("off")
    ax.text(
        0.5,
        0.97,
        "Rumi Sensory Armor – Tech Pack (Same-Day Print Package)",
        ha="center",
        va="top",
        fontsize=16,
        fontweight="bold",
        transform=ax.transAxes,
    )
    bullets = """
    Contents:
    • Printable Front Panel PDF (vector)
    • Printable Sleeves PDF (vector, L/R pages)
    • Size Grading PDF (inches)
    • DXF Patterns (R12): body & sleeves per size (rectangular panels with bleed)
    Production Notes:
    • Bleed: 0.25 in; Safe: 0.25 in
    • Base color: True Rumi Gold (approx to Pantone 1235 C); confirm with physical chip
    • Optional reveal: gloss micro-texture in wave band; UV cuff glyph (separate plate at shop)
    • For speed, DTF or dye-sub recommended for same-day; screen print needs more setup
    QC:
    • Verify panel dimensions vs. target size before batch
    • Print a ruler strip on first sheet to confirm scale (1 in check)
    """
    wrapped_bullets = textwrap.fill(" ".join(bullets.split()), width=90)
    ax.text(0.02, 0.9, wrapped_bullets, transform=ax.transAxes, va="top", fontsize=11)
    ax.text(0.02, 0.15, "Scale Check: 1-inch ruler below", fontsize=11)
    ax.plot([0.02, 0.02 + 1 / 8.5], [0.13, 0.13], linewidth=2)
    ax.text(0.02, 0.125, "1 in", fontsize=10, va="top")
    fig.savefig(path_pdf, bbox_inches="tight")
    plt.close(fig)


def zip_package(zip_path: Path, files: Sequence[Path]) -> None:
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for file_path in files:
            zf.write(file_path, arcname=file_path.name)


def main() -> Path:
    DIST_DIR.mkdir(parents=True, exist_ok=True)
    PACKAGE_DIR.mkdir(parents=True, exist_ok=True)

    front_pdf = PACKAGE_DIR / "Rumi_SensoryArmor_Front_Printable.pdf"
    sleeves_pdf = PACKAGE_DIR / "Rumi_SensoryArmor_Sleeves_Printable.pdf"
    size_pdf = PACKAGE_DIR / "Rumi_SensoryArmor_SizeChart.pdf"
    tech_pdf = PACKAGE_DIR / "Rumi_SensoryArmor_TechPack.pdf"
    body_dxf = PACKAGE_DIR / "Rumi_BodyPanels_AllSizes_R12.dxf"
    sleeve_dxf = PACKAGE_DIR / "Rumi_Sleeves_AllSizes_R12.dxf"

    make_front_pdf(front_pdf)
    make_sleeves_pdf(sleeves_pdf)
    make_size_chart_pdf(size_pdf)
    make_techpack_pdf(tech_pdf)
    make_dxf_patterns(body_dxf, sleeve_dxf)

    zip_path = DIST_DIR / "Rumi_SensoryArmor_DesignPackage.zip"
    zip_package(zip_path, (front_pdf, sleeves_pdf, size_pdf, tech_pdf, body_dxf, sleeve_dxf))
    return zip_path


if __name__ == "__main__":
    zip_file = main()
    print(zip_file)
