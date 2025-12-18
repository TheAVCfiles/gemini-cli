"""Assemble the DeCrypt the Girl system pack ZIP bundles.

This utility mirrors a provided archival helper that builds separate PUBLIC
and INTERNAL zip archives with simple folder structures. By default it writes
into ``/mnt/data`` so the resulting files are ready for download, but the
output location and optional mind map input can be customized.

Usage:
    python scripts/assemble_dtg_system_pack.py \
        --base-dir /mnt/data \
        --mindmap "NotebookLM Mind Map 2.jpeg"

Running the script will create the following artifacts inside ``base-dir``:
- ``DTG_System_Pack_PUBLIC`` (folder)
- ``DTG_System_Pack_PUBLIC_v1_<YYYYMMDD>.zip``
- ``DTG_System_Pack_INTERNAL`` (folder)
- ``DTG_System_Pack_INTERNAL_v1_<YYYYMMDD>.zip``
"""

from __future__ import annotations

import argparse
import shutil
import zipfile
from datetime import date
from pathlib import Path


def prepare_directory(path: Path) -> None:
    """Create a clean directory, removing any existing contents."""

    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def write_public_contents(base_dir: Path, mindmap_path: Path | None) -> Path:
    """Populate the PUBLIC folder and return its path."""

    public_dir = base_dir / "DTG_System_Pack_PUBLIC"
    prepare_directory(public_dir)

    core_dir = public_dir / "CORE"
    artifacts_dir = public_dir / "ARTIFACTS"
    core_dir.mkdir(exist_ok=True)
    artifacts_dir.mkdir(exist_ok=True)

    (public_dir / "README.md").write_text(
        "# DeCrypt the Girl — System Pack (Public)\n\n"
        "This archive contains a high-level system overview for review.\n\n"
        "It is intentionally minimal and static.\n\n"
        "No license is granted by access.\n"
    )

    (core_dir / "Concepts.md").write_text(
        "Core Concepts\n\n"
        "- Recursion\n"
        "- Participation\n"
        "- Portals\n"
        "- Mirrors\n"
    )

    (core_dir / "Flow.md").write_text(
        "System Flow\n\n"
        "1. Entry\n"
        "2. Engagement\n"
        "3. Reflection\n"
        "4. Exit\n"
    )

    (public_dir / "LICENSE.txt").write_text(
        "All rights reserved.\n\n"
        "Shared for review only. No license granted."
    )

    if mindmap_path and mindmap_path.exists():
        shutil.copyfile(mindmap_path, public_dir / "MAP.jpeg")
        print(f"✅ Added mind map: {mindmap_path}")
    else:
        print("ℹ️ No mind map provided or file missing; skipping MAP.jpeg")

    return public_dir


def write_internal_contents(base_dir: Path) -> Path:
    """Populate the INTERNAL folder and return its path."""

    internal_dir = base_dir / "DTG_System_Pack_INTERNAL"
    prepare_directory(internal_dir)

    for subdir in ("CANON", "SOURCES", "LEDGER", "PROCESS"):
        (internal_dir / subdir).mkdir(exist_ok=True)

    (internal_dir / "PRIVATE_NOTICE.txt").write_text(
        "Private internal archive.\n\n"
        "Not for distribution."
    )

    return internal_dir


def zip_directory(folder: Path, zip_path: Path) -> None:
    """Zip the contents of ``folder`` into ``zip_path`` preserving structure."""

    zip_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as archive:
        for item in sorted(folder.rglob("*")):
            archive.write(item, arcname=item.relative_to(folder))
    print(f"✅ Created archive: {zip_path}")


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Assemble DeCrypt the Girl system pack ZIPs.")
    parser.add_argument(
        "--base-dir",
        type=Path,
        default=Path("/mnt/data"),
        help="Directory where the pack folders and ZIP files will be written.",
    )
    parser.add_argument(
        "--mindmap",
        type=Path,
        default=None,
        help="Optional path to the mind map image to include as MAP.jpeg in the public pack.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv)
    today = date.today().strftime("%Y%m%d")

    public_dir = write_public_contents(args.base_dir, args.mindmap)
    internal_dir = write_internal_contents(args.base_dir)

    public_zip = args.base_dir / f"DTG_System_Pack_PUBLIC_v1_{today}.zip"
    internal_zip = args.base_dir / f"DTG_System_Pack_INTERNAL_v1_{today}.zip"

    zip_directory(public_dir, public_zip)
    zip_directory(internal_dir, internal_zip)

    print("🎁 Pack generation complete.")
    print(f"PUBLIC folder:    {public_dir}")
    print(f"PUBLIC zip:       {public_zip}")
    print(f"INTERNAL folder:  {internal_dir}")
    print(f"INTERNAL zip:     {internal_zip}")


if __name__ == "__main__":
    main()
