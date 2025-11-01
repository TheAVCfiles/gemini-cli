#!/usr/bin/env python3
"""Utility for zipping a directory with relative paths preserved."""

from __future__ import annotations

import argparse
from pathlib import Path
import zipfile


def zip_directory(source: Path, destination: Path) -> None:
    """Create a ZIP archive from *source* at *destination*.

    The archive will contain paths relative to *source*.
    """
    source = source.expanduser().resolve()
    destination = destination.expanduser().resolve()

    if not source.exists():
        raise FileNotFoundError(f"Source directory not found: {source}")

    with zipfile.ZipFile(destination, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in source.rglob("*"):
            if path.is_file():
                archive.write(path, path.relative_to(source))



def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create a ZIP archive from the provided directory."
    )
    parser.add_argument(
        "source",
        type=Path,
        help="Directory to zip",
    )
    parser.add_argument(
        "destination",
        type=Path,
        nargs="?",
        help="Optional output archive path (defaults to <source>.zip)",
    )
    return parser.parse_args()



def main() -> None:
    args = parse_args()
    destination = args.destination or args.source.with_suffix(".zip")

    zip_directory(args.source, destination)
    print(f"✅ Created ZIP archive: {destination}")


if __name__ == "__main__":
    main()
