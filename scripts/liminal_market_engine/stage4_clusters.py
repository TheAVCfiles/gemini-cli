"""Stage 4: Cluster analysis (Liminal Space Mapper)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable, Mapping

import hdbscan
from sentence_transformers import SentenceTransformer


def find_clusters(entries: Iterable[Mapping[str, object]]):
    """Assign cluster identifiers based on semantic similarity."""

    model = SentenceTransformer("all-MiniLM-L6-v2")
    texts = [f"{entry.get('title', '')} {entry.get('summary', '')}" for entry in entries]
    embeddings = model.encode(texts)
    clusterer = hdbscan.HDBSCAN(min_cluster_size=10, metric="euclidean")
    labels = clusterer.fit_predict(embeddings)
    clustered = []
    for entry, label in zip(entries, labels):
        enriched = dict(entry)
        enriched["cluster_id"] = int(label)
        clustered.append(enriched)
    return clustered


def main() -> None:
    with Path("stage3_contrarian.json").open() as f:
        data = json.load(f)
    clustered = find_clusters(data)
    Path("stage4_clusters.json").write_text(json.dumps(clustered, indent=2))
    print(f"🌀 Clustered {len(clustered)} narratives into liminal themes")


if __name__ == "__main__":
    main()
