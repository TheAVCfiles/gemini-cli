#!/usr/bin/env python3
"""Build a timestamped MWRA glossary bundle archive.

This utility collects the public-facing glossary assets (web UI, Netlify
function, README, checklist, etc.) into a temporary staging directory and
produces a timestamped `.zip` file for easy distribution. The output is
suitable for consumption by `apply_mwra_patch.sh` or downstream Firebase
hosting setups documented in `docs/firebase-hosting.md`.

Example usage:

    python3 scripts/create_mwra_bundle.py
    python3 scripts/create_mwra_bundle.py --dest builds --name mwra-demo

"""

from __future__ import annotations

import argparse
import shutil
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
import zipfile

# Paths that must be included in every bundle. Each entry is relative to the
# repository root.
REQUIRED_PATHS = [
    Path("web"),
    Path("netlify"),
    Path("netlify.toml"),
    Path("README.md"),
    Path("CHECKLIST.md"),
    Path("apply_mwra_patch.sh"),
    Path("docs/firebase-hosting.md"),
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create a timestamped MWRA glossary bundle archive.",
    )
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).resolve().parent.parent,
        help="Repository root containing the MWRA assets (default: project root).",
    )
    parser.add_argument(
        "--dest",
        type=Path,
        default=Path("builds"),
        help="Output directory for the generated archive (default: builds/).",
    )
    parser.add_argument(
        "--name",
        default="mwra-glossary",
        help="Base name for the generated archive (default: mwra-glossary).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate inputs without producing an archive.",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Print every file that will be packaged.",
    )
    return parser.parse_args()


def stage_required_paths(root: Path, staging_dir: Path, verbose: bool = False) -> None:
    for relative in REQUIRED_PATHS:
        source = root / relative
        if not source.exists():
            raise FileNotFoundError(f"Required path missing: {source}")

        destination = staging_dir / relative
        destination.parent.mkdir(parents=True, exist_ok=True)

        if source.is_dir():
            if verbose:
                print(f"📁 copy {relative}/", flush=True)
            shutil.copytree(source, destination, dirs_exist_ok=True)
        else:
            if verbose:
                print(f"📄 copy {relative}", flush=True)
            shutil.copy2(source, destination)


def build_archive(staging_dir: Path, dest_dir: Path, base_name: str, verbose: bool = False) -> Path:
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d_%H-%M-%S")
    archive_name = f"{base_name}_{timestamp}.zip"
    dest_dir.mkdir(parents=True, exist_ok=True)
    archive_path = dest_dir / archive_name

    with zipfile.ZipFile(archive_path, "w", zipfile.ZIP_DEFLATED) as bundle:
        for path in sorted(staging_dir.rglob("*")):
            if path.is_file():
                arcname = path.relative_to(staging_dir)
                if verbose:
                    print(f"📦 add {arcname}", flush=True)
                bundle.write(path, arcname)

    return archive_path


def main() -> int:
    args = parse_args()
    root = args.root.resolve()

    with tempfile.TemporaryDirectory() as tmp_dir:
        staging_dir = Path(tmp_dir)
        stage_required_paths(root, staging_dir, verbose=args.verbose)

        if args.dry_run:
            print("Dry run complete — no archive created.")
            return 0

        archive_path = build_archive(staging_dir, args.dest.resolve(), args.name, verbose=args.verbose)
        print(f"✅ Created {archive_path}")

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except FileNotFoundError as err:
        print(f"Error: {err}", file=sys.stderr)
        raise SystemExit(1)
