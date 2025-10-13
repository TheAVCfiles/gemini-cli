"""Prepare Docker build context for the Mythtouch FastAPI service."""
from __future__ import annotations

import shutil
from pathlib import Path


def main() -> None:
    base = Path(__file__).resolve().parents[1]
    api_dir = base / "api"
    docker_dir = base / "docker"
    docker_dir.mkdir(exist_ok=True)

    files_to_copy = [
        base / "mythtouch.py",
        base / "model.pkl",
        base / "scaler.pkl",
        base / "labels.json",
        api_dir / "app.py",
        api_dir / "requirements.txt",
    ]

    for src in files_to_copy:
        if src.exists():
            dest = docker_dir / src.name
            shutil.copy(src, dest)
            print(f"Copied {src.relative_to(base)} -> {dest.relative_to(base)}")
        else:
            print(f"Warning: {src} not found; skipping")

    print("Docker assets staged in:", docker_dir)


if __name__ == "__main__":
    main()
