"""Utility script to assemble the Docker build context for the Mythtouch FastAPI service.

Run this script from the repository root once the Mythtouch project is available locally. It
copies the runtime artefacts that the container expects into ``deploy/mythtouch`` so that the
Docker build can succeed without needing to restructure the original project layout.
"""
from __future__ import annotations

import argparse
import pathlib
import shutil
from typing import Iterable

ASSETS = {
    "mythtouch.py",
    "model.pkl",
    "scaler.pkl",
    "labels.json",
}

API_ASSETS = {
    "app.py",
    "requirements.txt",
}


def copy_files(sources: Iterable[pathlib.Path], destination: pathlib.Path) -> None:
    for src in sources:
        if not src.exists():
            raise FileNotFoundError(f"Missing required asset: {src}")
        shutil.copy2(src, destination / src.name)


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare Mythtouch Docker build context")
    parser.add_argument(
        "project_root",
        type=pathlib.Path,
        help="Path to the Mythtouch project root that contains mythtouch.py",
    )
    parser.add_argument(
        "--api-dir",
        type=pathlib.Path,
        default=None,
        help="Optional explicit path to the FastAPI application directory (defaults to project_root / 'api')",
    )
    parser.add_argument(
        "--context",
        type=pathlib.Path,
        default=pathlib.Path(__file__).resolve().parent,
        help="Directory to receive the copied assets (defaults to this script's directory)",
    )

    args = parser.parse_args()

    project_root = args.project_root.resolve()
    api_dir = (args.api_dir or project_root / "api").resolve()
    context_dir = args.context.resolve()
    context_dir.mkdir(parents=True, exist_ok=True)

    asset_sources = [project_root / name for name in ASSETS]
    api_sources = [api_dir / name for name in API_ASSETS]

    copy_files(asset_sources, context_dir)
    copy_files(api_sources, context_dir)

    print("Docker context prepared:")
    for file_path in sorted(context_dir.glob("*")):
        print(f" - {file_path.name}")


if __name__ == "__main__":
    main()
