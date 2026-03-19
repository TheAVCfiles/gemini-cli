"""Utility script to recreate the Ko-fi add-on deployment archive.

This mirrors the manual instructions provided for regenerating the
KoFi_AutoPost_and_TierPresets_Addon.zip bundle inside the container.
"""
from __future__ import annotations

import argparse
import hashlib
import os
import sys
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


@dataclass
class ZipSummary:
    """Summary information about the generated archive."""

    path: Path
    file_count: int
    size_bytes: int
    sha256: str
    entries: list[str]


def iter_files(root: Path) -> Iterable[Path]:
    """Yield all files below *root* recursively.

    Directories are traversed depth-first; files are yielded in sorted order
    to produce stable archives between runs.
    """

    for dirpath, _, filenames in os.walk(root):
        base = Path(dirpath)
        for filename in sorted(filenames):
            yield base / filename


def build_zip(source_root: Path, archive_path: Path) -> ZipSummary:
    """Create the ZIP archive and return a :class:`ZipSummary`."""

    archive_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(archive_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for file_path in iter_files(source_root):
            arcname = file_path.relative_to(source_root)
            zf.write(file_path, arcname)

    entries: list[str] = []
    with zipfile.ZipFile(archive_path, "r") as zf:
        for info in zf.infolist():
            if not info.is_dir():
                entries.append(info.filename)

    h = hashlib.sha256()
    with archive_path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(8192), b""):
            h.update(chunk)

    return ZipSummary(
        path=archive_path,
        file_count=len(entries),
        size_bytes=archive_path.stat().st_size,
        sha256=h.hexdigest(),
        entries=entries,
    )


def ensure_structure(root: Path) -> None:
    """Make sure the expected Ko-fi folder layout exists."""

    (root / "public").mkdir(parents=True, exist_ok=True)
    (root / "functions").mkdir(parents=True, exist_ok=True)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Recreate the Ko-fi AutoPost and Tier Presets add-on ZIP",
    )
    parser.add_argument(
        "source",
        nargs="?",
        type=Path,
        default=Path("/mnt/data/KoFi_AutoPost_and_TierPresets_Addon"),
        help="Directory that contains the add-on sources.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("/mnt/data/KoFi_AutoPost_and_TierPresets_Addon.zip"),
        help="Where to write the resulting ZIP archive.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)

    ensure_structure(args.source)

    if args.output.exists():
        args.output.unlink()

    summary = build_zip(args.source, args.output)

    print("ZIP created at:", summary.path)
    print("Total entries (files only):", summary.file_count)
    print("ZIP size (bytes):", summary.size_bytes)
    print("SHA256:", summary.sha256)
    print("Archive contents:", summary.entries)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
