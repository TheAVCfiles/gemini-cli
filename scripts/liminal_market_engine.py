"""Liminal Market Engine prototype.

This module assembles a multi-stage pipeline that collects public market
news, analyses sentiment using a finance-tuned model, surfaces contrarian
signals, clusters narratives, and finally produces a short intelligence
brief.  Each stage can be executed independently via the command line or
all together in sequence.

The stages mirror the artefacts described in the original prototype:

1. ``stage1_raw_feeds.json`` – raw feed entries with provenance logging.
2. ``stage2_sentiment.json`` – entries enriched with sentiment metadata.
3. ``stage3_contrarian.json`` – contrarian-zone signals derived from
   rolling sentiment averages.
4. ``stage4_clusters.json`` – narratives grouped into liminal themes via
   density-based clustering.
5. ``stage5_report.txt`` – a concise daily brief with a poetic epilogue.

The implementation intentionally favours clarity and composability so
that future experiments (e.g. alternate models or scoring heuristics) can
slot into the same scaffold with minimal adjustments.
"""

from __future__ import annotations

import argparse
import json
import logging
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Dict, Iterable, List, Sequence
from urllib.parse import urlparse

import feedparser
import hdbscan
import pandas as pd
from sentence_transformers import SentenceTransformer
from transformers import pipeline

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DEFAULT_FEEDS: Sequence[str] = (
    "https://news.google.com/rss/search?q=markets",
    "https://feeds.bbci.co.uk/news/business/rss.xml",
    "https://www.investing.com/rss/news.rss",
)

SCRIPT_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = SCRIPT_DIR

PROVENANCE_LOG = OUTPUT_DIR / "provenance.log"
STAGE1_PATH = OUTPUT_DIR / "stage1_raw_feeds.json"
STAGE2_PATH = OUTPUT_DIR / "stage2_sentiment.json"
STAGE3_PATH = OUTPUT_DIR / "stage3_contrarian.json"
STAGE4_PATH = OUTPUT_DIR / "stage4_clusters.json"
STAGE5_PATH = OUTPUT_DIR / "stage5_report.txt"

logging.basicConfig(
    filename=str(PROVENANCE_LOG),
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------


@dataclass
class FeedEntry:
    title: str
    summary: str
    link: str
    published: str
    source: str
    sentiment_label: str | None = None
    sentiment_score: float | None = None
    cluster_id: int | None = None

    @classmethod
    def from_dict(cls, data: Dict[str, object]) -> "FeedEntry":
        return cls(
            title=str(data.get("title", "")),
            summary=str(data.get("summary", "")),
            link=str(data.get("link", "")),
            published=str(data.get("published", "")),
            source=str(data.get("source", "")),
            sentiment_label=(data.get("sentiment_label") or None),
            sentiment_score=float(score) if (score := data.get("sentiment_score")) is not None else None,
            cluster_id=int(cid) if (cid := data.get("cluster_id")) is not None else None,
        )

    def to_dict(self) -> Dict[str, object]:
        data = {
            "title": self.title,
            "summary": self.summary,
            "link": self.link,
            "published": self.published,
            "source": self.source,
        }
        if self.sentiment_label is not None:
            data["sentiment_label"] = self.sentiment_label
        if self.sentiment_score is not None:
            data["sentiment_score"] = self.sentiment_score
        if self.cluster_id is not None:
            data["cluster_id"] = self.cluster_id
        return data


# ---------------------------------------------------------------------------
# Stage 1 – feed collection
# ---------------------------------------------------------------------------


def collect_public_feeds(feed_urls: Iterable[str]) -> List[FeedEntry]:
    """Collect entries from a sequence of RSS/Atom feeds."""

    entries: List[FeedEntry] = []
    for url in feed_urls:
        feed = feedparser.parse(url)
        for entry in getattr(feed, "entries", []):
            published = entry.get("published") or datetime.utcnow().isoformat()
            data = FeedEntry(
                title=entry.get("title", ""),
                summary=entry.get("summary", ""),
                link=entry.get("link", ""),
                published=published,
                source=urlparse(url).netloc,
            )
            entries.append(data)
            logging.info("SOURCE: %s | TITLE: %s", data.source, data.title)
    return entries


# ---------------------------------------------------------------------------
# Stage 2 – sentiment analysis
# ---------------------------------------------------------------------------


_SENTIMENT_PIPELINE = None


def _get_sentiment_pipeline():
    global _SENTIMENT_PIPELINE
    if _SENTIMENT_PIPELINE is None:
        _SENTIMENT_PIPELINE = pipeline("sentiment-analysis", model="ProsusAI/finbert")
    return _SENTIMENT_PIPELINE


def analyze_sentiment(entries: Sequence[FeedEntry]) -> List[FeedEntry]:
    """Annotate feed entries with FinBERT sentiment labels and scores."""

    sentiment_analyzer = _get_sentiment_pipeline()
    analysed: List[FeedEntry] = []
    for entry in entries:
        text = (entry.summary or entry.title)[:512]
        if not text:
            analysed.append(entry)
            continue
        result = sentiment_analyzer(text)[0]
        enriched = FeedEntry(
            title=entry.title,
            summary=entry.summary,
            link=entry.link,
            published=entry.published,
            source=entry.source,
            sentiment_label=result.get("label"),
            sentiment_score=float(result.get("score", 0.0)),
        )
        analysed.append(enriched)
    return analysed


# ---------------------------------------------------------------------------
# Stage 3 – contrarian detection
# ---------------------------------------------------------------------------


def detect_counter_trends(entries: Sequence[FeedEntry]) -> pd.DataFrame:
    """Identify contrarian signals based on rolling sentiment averages."""

    records = [entry.to_dict() for entry in entries]
    df = pd.DataFrame(records)

    if df.empty:
        return df

    sentiment_map = {"positive": 1, "neutral": 0, "negative": -1}
    df["sentiment_num"] = df["sentiment_label"].map(sentiment_map).fillna(0)
    df["rolling_avg"] = df["sentiment_num"].rolling(window=5, min_periods=1).mean()
    contrarian_signals = df[df["rolling_avg"].between(-0.1, 0.1)]
    return contrarian_signals.reset_index(drop=True)


# ---------------------------------------------------------------------------
# Stage 4 – narrative clustering
# ---------------------------------------------------------------------------


_CLUSTER_MODEL = None


def _get_sentence_model():
    global _CLUSTER_MODEL
    if _CLUSTER_MODEL is None:
        _CLUSTER_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
    return _CLUSTER_MODEL


def find_clusters(entries: Sequence[FeedEntry]) -> List[FeedEntry]:
    """Cluster contrarian signals into themes using HDBSCAN."""

    if not entries:
        return []

    model = _get_sentence_model()
    texts = [f"{entry.title} {entry.summary}".strip() for entry in entries]
    embeddings = model.encode(texts)
    clusterer = hdbscan.HDBSCAN(min_cluster_size=10, metric="euclidean")
    labels = clusterer.fit_predict(embeddings)

    clustered: List[FeedEntry] = []
    for entry, label in zip(entries, labels):
        clustered.append(
            FeedEntry(
                title=entry.title,
                summary=entry.summary,
                link=entry.link,
                published=entry.published,
                source=entry.source,
                sentiment_label=entry.sentiment_label,
                sentiment_score=entry.sentiment_score,
                cluster_id=int(label),
            )
        )
    return clustered


# ---------------------------------------------------------------------------
# Stage 5 – briefing generation
# ---------------------------------------------------------------------------


def generate_brief(entries: Sequence[FeedEntry]) -> str:
    """Generate a textual report summarising clusters with a poetic coda."""

    themes: Dict[int, List[str]] = {}
    for entry in entries:
        cid = entry.cluster_id if entry.cluster_id is not None else -1
        themes.setdefault(cid, []).append(entry.title)

    report_lines = [f"Contrarian Index — {date.today()}"]
    for cid, titles in themes.items():
        report_lines.append("")
        report_lines.append(f"Cluster {cid}: {len(titles)} emerging narratives")
        for title in titles[:3]:
            report_lines.append(f"  - {title}")

    report_lines.append("")
    report_lines.extend(
        [
            "In hesitation, truth gathers.",
            "In restraint, alpha breathes.",
            "Markets dance in mercy.",
        ]
    )

    return "\n".join(report_lines) + "\n"


# ---------------------------------------------------------------------------
# I/O helpers
# ---------------------------------------------------------------------------


def _write_json(path: Path, data: Iterable[Dict[str, object]]) -> None:
    path.write_text(json.dumps(list(data), indent=2), encoding="utf-8")


def _read_json(path: Path) -> List[Dict[str, object]]:
    if not path.exists():
        raise FileNotFoundError(f"Expected artefact missing: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


# ---------------------------------------------------------------------------
# Command-line interface
# ---------------------------------------------------------------------------


def _stage_collect(args: argparse.Namespace) -> None:
    entries = collect_public_feeds(args.feeds or DEFAULT_FEEDS)
    _write_json(STAGE1_PATH, (entry.to_dict() for entry in entries))
    print(f"✅ Collected {len(entries)} articles")


def _stage_sentiment(_: argparse.Namespace) -> None:
    raw_entries = [FeedEntry.from_dict(d) for d in _read_json(STAGE1_PATH)]
    analysed = analyze_sentiment(raw_entries)
    _write_json(STAGE2_PATH, (entry.to_dict() for entry in analysed))
    print(f"🧠 Sentiment analysed for {len(analysed)} items")


def _stage_contrarian(_: argparse.Namespace) -> None:
    sentiment_entries = [FeedEntry.from_dict(d) for d in _read_json(STAGE2_PATH)]
    contrarian_df = detect_counter_trends(sentiment_entries)
    _write_json(STAGE3_PATH, contrarian_df.to_dict(orient="records"))
    print(f"⚖️ Counter-trend zone detected: {len(contrarian_df)} signals")


def _stage_cluster(_: argparse.Namespace) -> None:
    contrarian_entries = [FeedEntry.from_dict(d) for d in _read_json(STAGE3_PATH)]
    clustered = find_clusters(contrarian_entries)
    _write_json(STAGE4_PATH, (entry.to_dict() for entry in clustered))
    print(f"🌀 Clustered {len(clustered)} narratives into liminal themes")


def _stage_brief(_: argparse.Namespace) -> None:
    clustered_entries = [FeedEntry.from_dict(d) for d in _read_json(STAGE4_PATH)]
    brief = generate_brief(clustered_entries)
    STAGE5_PATH.write_text(brief, encoding="utf-8")
    print("✨ Contrarian Index generated.")


def _stage_run_all(args: argparse.Namespace) -> None:
    _stage_collect(args)
    _stage_sentiment(args)
    _stage_contrarian(args)
    _stage_cluster(args)
    _stage_brief(args)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Liminal Market Engine pipeline")
    parser.add_argument(
        "--feeds",
        nargs="*",
        help="Optional list of feed URLs to collect from; defaults to curated set.",
    )

    subparsers = parser.add_subparsers(dest="command")
    subparsers.required = True

    subparsers.add_parser("collect", help="Collect stage-one feed artefact").set_defaults(
        func=_stage_collect
    )
    subparsers.add_parser("sentiment", help="Annotate feeds with sentiment").set_defaults(
        func=_stage_sentiment
    )
    subparsers.add_parser(
        "contrarian", help="Derive counter-trend signals from sentiment"
    ).set_defaults(func=_stage_contrarian)
    subparsers.add_parser("cluster", help="Cluster contrarian narratives").set_defaults(
        func=_stage_cluster
    )
    subparsers.add_parser("brief", help="Generate the contrarian index brief").set_defaults(
        func=_stage_brief
    )
    subparsers.add_parser("run-all", help="Execute the full pipeline").set_defaults(
        func=_stage_run_all
    )

    return parser


def main(argv: Sequence[str] | None = None) -> None:
    parser = build_parser()
    args = parser.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
