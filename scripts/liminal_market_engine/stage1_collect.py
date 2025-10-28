"""Stage 1: System initialization and provenance logging for the Liminal Market Engine."""

from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Iterable, List, Mapping
from urllib.parse import urlparse

import feedparser

logging.basicConfig(filename="provenance.log", level=logging.INFO)


def collect_public_feeds(feed_urls: Iterable[str]) -> List[Mapping[str, str]]:
    """Collect public RSS/Atom feeds with provenance logging."""

    entries = []
    for url in feed_urls:
        feed = feedparser.parse(url)
        for entry in feed.entries:
            data = {
                "title": entry.title,
                "summary": entry.get("summary", ""),
                "link": entry.link,
                "published": entry.get("published", datetime.utcnow().isoformat()),
                "source": urlparse(url).netloc,
            }
            entries.append(data)
            logging.info(
                "%s | SOURCE: %s | TITLE: %s",
                datetime.utcnow().isoformat(),
                data["source"],
                data["title"],
            )
    return entries


def main() -> None:
    feeds = [
        "https://news.google.com/rss/search?q=markets",
        "https://feeds.bbci.co.uk/news/business/rss.xml",
        "https://www.investing.com/rss/news.rss",
    ]
    articles = collect_public_feeds(feeds)
    output_path = Path("stage1_raw_feeds.json")
    output_path.write_text(json.dumps(articles, indent=2))
    print(f"✅ Collected {len(articles)} articles")


if __name__ == "__main__":
    main()
