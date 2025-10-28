"""Stage 5: Contrarian index generator."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Iterable, Mapping


def generate_brief(data: Iterable[Mapping[str, object]]) -> str:
    """Produce a daily contrarian report with narrative clusters."""

    themes = {}
    for entry in data:
        cluster_id = entry.get("cluster_id", -1)
        themes.setdefault(cluster_id, []).append(entry.get("title", ""))

    report_lines = [f"Contrarian Index — {date.today()}"]
    for cluster_id, titles in themes.items():
        report_lines.append(f"\nCluster {cluster_id}: {len(titles)} emerging narratives")
        for title in titles[:3]:
            report_lines.append(f"  - {title}")

    poem = (
        "\nIn hesitation, truth gathers.\n"
        "In restraint, alpha breathes.\n"
        "Markets dance in mercy.\n"
    )
    report_lines.append(poem)
    return "\n".join(report_lines)


def main() -> None:
    with Path("stage4_clusters.json").open() as f:
        data = json.load(f)
    brief = generate_brief(data)
    Path("stage5_report.txt").write_text(brief)
    print("✨ Contrarian Index generated.")


if __name__ == "__main__":
    main()
