"""Stage 2: Sentiment & semantic analysis using FinBERT."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable, Mapping

from transformers import pipeline

sentiment_model = pipeline("sentiment-analysis", model="ProsusAI/finbert")


def analyze_sentiment(entries: Iterable[Mapping[str, str]]):
    """Annotate entries with sentiment labels and scores."""

    analyzed = []
    for entry in entries:
        text = (entry.get("summary") or "")[:512]
        result = sentiment_model(text)[0]
        enriched = dict(entry)
        enriched["sentiment_label"] = result["label"].lower()
        enriched["sentiment_score"] = float(result["score"])
        analyzed.append(enriched)
    return analyzed


def main() -> None:
    input_path = Path("stage1_raw_feeds.json")
    with input_path.open() as f:
        articles = json.load(f)
    analyzed = analyze_sentiment(articles)
    output_path = Path("stage2_sentiment.json")
    output_path.write_text(json.dumps(analyzed, indent=2))
    print(f"🧠 Sentiment analyzed for {len(analyzed)} items")


if __name__ == "__main__":
    main()
