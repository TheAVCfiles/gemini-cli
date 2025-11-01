#!/usr/bin/env python3
"""Utility script to create ZIP archives from directories.

This script provides a simple command-line interface for zipping a directory
and writing the archive to a target location. It intentionally mirrors the
behaviour described in the user-provided helper snippet while adding basic
argument parsing so that the source and destination can be supplied on the
command line.
"""

from __future__ import annotations

import argparse
import os
import sys
import zipfile
from pathlib import Path


def zip_directory(folder_path: Path, output_path: Path) -> None:
    """Create a ZIP archive containing the contents of *folder_path*.

    Args:
        folder_path: Directory whose contents should be zipped.
        output_path: Target path for the resulting ZIP file. Parent
            directories are created automatically if necessary.
    """

    folder_path = folder_path.resolve()
    output_path = output_path.resolve()

    if not folder_path.is_dir():
        raise ValueError(f"Source directory not found: {folder_path}")

    output_path.parent.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, _, files in os.walk(folder_path):
            for file in files:
                file_path = Path(root) / file
                # Write file with path relative to the folder being zipped.
                arcname = file_path.relative_to(folder_path)
                zipf.write(file_path, arcname)

    print(f"✅ Created ZIP archive: {output_path}")


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create a ZIP archive from a source directory.",
    )
    parser.add_argument(
        "source",
        type=Path,
        help="Directory to archive.",
    )
    parser.add_argument(
        "destination",
        type=Path,
        nargs="?",
        help=(
            "Path to the output ZIP archive. If omitted, the archive will be "
            "created alongside the source directory with the directory name "
            "as the archive name."
        ),
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    source: Path = args.source

    if args.destination is not None:
        destination: Path = args.destination
    else:
        destination = source.with_suffix(".zip")

    try:
        zip_directory(source, destination)
    except ValueError as exc:
        print(f"❌ {exc}")
        return 1
    except Exception as exc:  # pragma: no cover - unexpected errors
        print(f"❌ Failed to create ZIP archive: {exc}")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
