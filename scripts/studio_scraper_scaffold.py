#!/usr/bin/env python3
"""Utility to generate a scaffold for the Studio Scraper project.

The script mirrors the structure described in the product requirements by
materializing the expected directories, seed files, and a timestamped archive.
"""

import os
import zipfile
from datetime import datetime
from pathlib import Path

# ---------- CONFIG ----------
ROOT = Path("studio-scraper")
SUBS = [
    "config",
    "logs",
    "data",
    "pages/raw_html",
    "proxies",
    "alerting",
    "db",
    "parsers",
]
FILES = {
    "README.md": "# Studio Scraper\n\nPipeline to monitor daily listings.",
    "requirements.txt": "requests\nbeautifulsoup4\nPyYAML\nurllib3\nsqlite3",
    "config/settings.yml": "targets:\n  - https://www.bizbuysell.com/dance-pilates-and-yoga-studios-for-sale/\n  - https://www.loopnet.com/commercial-property-for-sale/performing-arts-studio/",
    "scrape_opportunities.py": "# main orchestrator – fill in later\n",
    "proxies/proxy_pool.py": "# proxy pool stub\n",
    "alerting/notify.py": "# alert stub\n",
    "db/store.py": "# db interface stub\n",
    "parsers/__init__.py": "",
    "parsers/bizbuysell.py": "# BizBuySell parser stub\n",
    "parsers/loopnet.py": "# LoopNet parser stub\n",
    "parsers/generic.py": "# generic parser stub\n",
}


def ensure_structure() -> None:
    """Create the directory tree and seed files if they do not exist."""

    for sub in SUBS:
        (ROOT / sub).mkdir(parents=True, exist_ok=True)

    for name, content in FILES.items():
        file_path = ROOT / name
        file_path.parent.mkdir(parents=True, exist_ok=True)
        if not file_path.exists():
            file_path.write_text(content)

    print(f"✅ Created scaffold under {ROOT.resolve()}")


def timestamped_zip(folder: Path, dest_dir: Path) -> None:
    """Archive the scaffold into a timestamped zip file."""

    dest_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    zip_name = f"{folder.name}_{timestamp}.zip"
    zip_path = dest_dir / zip_name

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, _, files in os.walk(folder):
            for file_name in files:
                file_path = Path(root) / file_name
                zipf.write(file_path, file_path.relative_to(folder))

    print(f"📦 Built archive: {zip_path}")


def main() -> None:
    """Generate the scaffold and archive it."""

    ensure_structure()
    timestamped_zip(ROOT, Path("builds"))


if __name__ == "__main__":
    main()
