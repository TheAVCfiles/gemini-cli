"""Build the DeCrypt The Girl residency / funding submission package.

This utility generates a summary PDF highlighting the funding readiness of the
project and gathers a curated set of supporting artefacts into a single ZIP
archive.  The goal is to provide a reproducible, auditable pipeline for
producing investor- and residency-ready materials directly from the repository.

Example usage::

    python scripts/build_residency_package.py \
        --assets-dir DecryptTheGirl \
        --output-dir dist/decrypt_the_girl

Provide the ``--summary-template`` flag to point at a text file when you want to
customise the copy that is rendered into the summary PDF.  Otherwise the default
message – tuned for alignment/funding opportunities – is used.
"""

from __future__ import annotations

import argparse
import datetime as _dt
import json
import textwrap
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import List, Sequence

try:
    from reportlab.lib.pagesizes import LETTER
    from reportlab.pdfgen import canvas
except ImportError as exc:  # pragma: no cover - dependency guard
    raise SystemExit(
        "reportlab is required to build the residency package. Install it with `pip install reportlab`."
    ) from exc


DEFAULT_PACKAGE_NAME = "DeCrypt_The_Girl_Residency_Submission_Pack"
DEFAULT_VERSION = "v1"
LINE_HEIGHT = 14
PAGE_MARGIN = 72
SUMMARY_FONT = "Helvetica"
SUMMARY_FONT_SIZE = 11


@dataclass(frozen=True)
class PackageInputs:
    """User-supplied configuration for building the package."""

    assets_dir: Path
    assets: Sequence[str]
    output_dir: Path
    package_name: str
    version: str
    summary_text: str
    include_manifest: bool = True


def default_assets() -> List[str]:
    """Return the curated default list of supporting artefacts.

    The filenames are intentionally human-facing; the script only bundles files
    that are present on disk so it is safe if some assets are missing or still in
    production.
    """

    return [
        "PROJECT_PORTFOLIO.pdf",
        "PRESS_&_CITATION_SHEET.pdf",
        "C4 Caesarian Shift 2.pdf",
        "Ballet Cipher Theory.pdf",
        "Decrypt_The_Girl_Interactive_Reader 8.html",
        "README.md",
        "requirements.txt",
        "conclusion.html",
    ]


def default_summary_text(today: str) -> str:
    """Compose the default narrative for the summary PDF."""

    impact = textwrap.dedent(
        """
        Impact:
        • 3,800+ verified research downloads and 500+ workshop participants.
        • Recognised by Mozilla Open Leaders, Allied Media Conference, and Tech Reset Canada.
        • Running stack verified deployable on FastAPI + Ollama + Vercel.
        """
    ).strip()

    business = textwrap.dedent(
        """
        Business Structure:
        • Default: LLC (member-managed) for licensing & revenue.
        • Nonprofit grants: Fiscal sponsorship via Open Collective Foundation.
        • Upgrade path: Delaware C-Corp via Atlas for equity investors.
        """
    ).strip()

    residency_alignment = textwrap.dedent(
        """
        Residency Focus Alignment:
        • OpenAI Residency → Applied Alignment & Human-AI Collaboration.
        • Cohere Catalyst → Language & Meaning Interfaces.
        • Google AI Opportunity Fund → Education & AI Ethics Infrastructure.
        """
    ).strip()

    return textwrap.dedent(
        f"""
        DeCrypt The Girl — Residency & Funding Submission Summary
        Date: {today}

        Project Overview:
        DeCrypt The Girl reframes narrative as a recursive cryptosystem — a living engine where authorship, consent, and computation entwine.
        Through Glissé Engine FSMs (Finite-State Machines for ethics & movement) and Local Secretary RAGs (privacy-first AI assistants), the work operationalises 'alignment' in the physical world. It is art as algorithm, ethics as executable.

        {impact}

        {business}

        {residency_alignment}

        Contact:
        Allison Van Cura (AVC Systems Studios)
        https://decryptthegirl.vercel.app | team@your-domain.com
        """
    ).strip()


def wrap_lines(text: str, width: int = 86) -> List[str]:
    """Split paragraphs into wrapped lines suitable for PDF output."""

    lines: List[str] = []
    for paragraph in text.splitlines():
        if not paragraph.strip():
            lines.append("")
            continue
        wrapped = textwrap.wrap(paragraph, width=width, replace_whitespace=False)
        if not wrapped:
            lines.append("")
        else:
            lines.extend(wrapped)
    return lines


def create_summary_pdf(path: Path, text: str) -> None:
    """Render the provided text into a single-page PDF."""

    path.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(path), pagesize=LETTER)
    _, page_height = LETTER
    x = PAGE_MARGIN
    y = page_height - PAGE_MARGIN
    for line in wrap_lines(text):
        if y <= PAGE_MARGIN:
            pdf.showPage()
            y = page_height - PAGE_MARGIN
        pdf.setFont(SUMMARY_FONT, SUMMARY_FONT_SIZE)
        pdf.drawString(x, y, line)
        y -= LINE_HEIGHT
    pdf.save()


def resolve_assets(assets_dir: Path, assets: Sequence[str]) -> tuple[list[Path], list[str]]:
    """Resolve assets relative to ``assets_dir`` and collect the ones that exist."""

    resolved: list[Path] = []
    missing: list[str] = []
    for item in assets:
        path = Path(item)
        if not path.is_absolute():
            path = assets_dir / path
        if path.exists():
            resolved.append(path)
        else:
            missing.append(item)
    return resolved, missing


def build_package(inputs: PackageInputs) -> Path:
    """Build the submission package and return the ZIP file path."""

    today = _dt.datetime.now().isoformat(timespec="seconds")
    inputs.output_dir.mkdir(parents=True, exist_ok=True)

    summary_pdf = inputs.output_dir / "Residency_Submission_Summary.pdf"
    create_summary_pdf(summary_pdf, inputs.summary_text)

    included_assets, missing_assets = resolve_assets(inputs.assets_dir, inputs.assets)

    manifest_path: Path | None = None
    if inputs.include_manifest:
        manifest = {
            "package_name": inputs.package_name,
            "version": inputs.version,
            "generated": today,
            "summary_pdf": summary_pdf.name,
            "assets": [asset.name for asset in included_assets],
            "missing_assets": missing_assets,
            "assets_directory": str(inputs.assets_dir),
        }
        manifest_path = inputs.output_dir / "Residency_Submission_Manifest.json"
        manifest_path.write_text(json.dumps(manifest, indent=2))

    archive_name = f"{inputs.package_name}_{inputs.version}.zip"
    archive_path = inputs.output_dir / archive_name
    with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.write(summary_pdf, summary_pdf.name)
        if manifest_path is not None:
            zf.write(manifest_path, manifest_path.name)
        for asset in included_assets:
            zf.write(asset, asset.name)

    return archive_path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate the DeCrypt The Girl residency submission package.")
    parser.add_argument(
        "--assets-dir",
        type=Path,
        default=Path("DecryptTheGirl"),
        help="Root directory that contains the artefacts to bundle (default: DecryptTheGirl).",
    )
    parser.add_argument(
        "--assets",
        nargs="*",
        default=None,
        help="Specific asset filenames to include. Defaults to the curated residency deliverables list.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("dist/decrypt_the_girl"),
        help="Where to write the PDF, manifest, and ZIP archive (default: dist/decrypt_the_girl).",
    )
    parser.add_argument(
        "--package-name",
        default=DEFAULT_PACKAGE_NAME,
        help=f"Base filename for the generated ZIP archive (default: {DEFAULT_PACKAGE_NAME}).",
    )
    parser.add_argument(
        "--version",
        default=DEFAULT_VERSION,
        help="Version label appended to the archive filename (default: v1).",
    )
    parser.add_argument(
        "--summary-template",
        type=Path,
        help="Optional path to a text file used to render the summary PDF.",
    )
    parser.add_argument(
        "--no-manifest",
        dest="include_manifest",
        action="store_false",
        help="Skip generating the JSON manifest file.",
    )
    return parser.parse_args()


def load_summary_text(path: Path | None) -> str:
    """Return the summary copy, using the default template when not provided."""

    today = _dt.date.today().strftime("%Y-%m-%d")
    if path is None:
        return default_summary_text(today)
    return path.read_text().strip().format(today=today)


def main() -> None:
    args = parse_args()
    assets = args.assets if args.assets is not None and len(args.assets) > 0 else default_assets()
    summary_text = load_summary_text(args.summary_template)
    inputs = PackageInputs(
        assets_dir=args.assets_dir,
        assets=assets,
        output_dir=args.output_dir,
        package_name=args.package_name,
        version=args.version,
        summary_text=summary_text,
        include_manifest=args.include_manifest,
    )
    archive_path = build_package(inputs)
    print(f"Residency submission package created: {archive_path}")


if __name__ == "__main__":
    main()
