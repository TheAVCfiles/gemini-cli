from __future__ import annotations

import argparse
import os
import shutil
import zipfile
from pathlib import Path


DEFAULT_BASE = Path("/mnt/data")
ZIP_V1 = "DeCrypt_Studio_SaaS_Seed_v1.zip"
ZIP_V2 = "DeCrypt_Studio_SaaS_Seed_v2.zip"
ZIP_V3 = "DeCrypt_Studio_SaaS_v3_Dimensions.zip"

MEGA_DIR = "AVC_MegaBundle_v1"
MEGA_ZIP = f"{MEGA_DIR}.zip"
C_ARTIFACT_DIR = "AVC_C_Artifact_v1"
C_ARTIFACT_ZIP = f"{C_ARTIFACT_DIR}.zip"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build the AVC megabundle and compact artifact from provided zip inputs.",
    )
    parser.add_argument(
        "--base",
        type=Path,
        default=DEFAULT_BASE,
        help="Root directory containing input zips and where outputs will be written.",
    )
    return parser.parse_args()


def ensure_fresh_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def unzip(source: Path, destination: Path) -> None:
    if not source.exists():
        return

    with zipfile.ZipFile(source, "r") as archive:
        archive.extractall(destination)


def copytree(source: Path, destination: Path) -> None:
    if not source.exists():
        return

    for root, _dirs, files in os.walk(source):
        for file_name in files:
            full_path = Path(root) / file_name
            relative = full_path.relative_to(source)
            target = destination / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy(full_path, target)


def zip_dir(source: Path, archive_path: Path, root_prefix: str) -> None:
    with zipfile.ZipFile(archive_path, "w", zipfile.ZIP_DEFLATED) as archive:
        for root, _dirs, files in os.walk(source):
            for file_name in files:
                full_path = Path(root) / file_name
                relative = full_path.relative_to(source)
                archive.write(full_path, arcname=str(Path(root_prefix) / relative))


def build_megabundle(base_dir: Path) -> tuple[Path, Path]:
    tmp_dirs = [base_dir / "_mb_v1", base_dir / "_mb_v2", base_dir / "_mb_v3"]
    mega_dir = base_dir / MEGA_DIR
    c_artifact_dir = base_dir / C_ARTIFACT_DIR

    for directory in tmp_dirs + [mega_dir, c_artifact_dir]:
        ensure_fresh_dir(directory)

    unzip(base_dir / ZIP_V1, tmp_dirs[0])
    unzip(base_dir / ZIP_V2, tmp_dirs[1])
    unzip(base_dir / ZIP_V3, tmp_dirs[2])

    copytree(tmp_dirs[0], mega_dir / "Seed_v1")
    copytree(tmp_dirs[1], mega_dir / "Seed_v2")
    copytree(tmp_dirs[2], mega_dir / "Dimensions_v3")

    zip_dir(mega_dir, base_dir / MEGA_ZIP, MEGA_DIR)

    copytree(tmp_dirs[0] / "DeCrypt_Studio_SaaS_Seed_v1/studio_console", c_artifact_dir / "console")
    copytree(tmp_dirs[0] / "DeCrypt_Studio_SaaS_Seed_v1/json_schemas", c_artifact_dir / "json_schemas")
    copytree(tmp_dirs[2], c_artifact_dir / "dimensions")

    zip_dir(c_artifact_dir, base_dir / C_ARTIFACT_ZIP, C_ARTIFACT_DIR)

    return base_dir / MEGA_ZIP, base_dir / C_ARTIFACT_ZIP


def main() -> None:
    args = parse_args()
    mega_zip, c_artifact_zip = build_megabundle(args.base)
    print(f"Megabundle created: {mega_zip}")
    print(f"Compact artifact created: {c_artifact_zip}")


if __name__ == "__main__":
    main()
