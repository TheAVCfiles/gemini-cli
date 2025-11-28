"""Elon tweet meme-pressure scoring.

Offline-safe by default; live mode requires a Twitter v2 bearer token.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

import requests

ELON_ID = "44196397"


@dataclass
class ElonMemePressure:
    bearer_token: str | None = None
    live: bool = False

    def fetch_tweets(self) -> List[Dict]:
        if not self.live:
            return self._stub_tweets()

        headers = {"Authorization": f"Bearer {self.bearer_token}"}
        url = f"https://api.twitter.com/2/users/{ELON_ID}/tweets"
        params = {"max_results": 10}
        response = requests.get(url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        return response.json().get("data", [])

    def compute_meme_pressure(self, tweets: List[Dict]) -> int:
        memes = ["doge", "dogecoin", "🐕", "🐶", "🚀", "moon", "to the moon", "dog"]
        score = 0
        for tweet in tweets:
            text = tweet.get("text", "").lower()
            for meme in memes:
                if meme in text:
                    score += 1
        return score

    def elon_signal(self, tweets: List[Dict]) -> Tuple[str, int]:
        pressure = self.compute_meme_pressure(tweets)
        if pressure >= 3:
            return "HIGH", pressure
        if pressure == 2:
            return "MEDIUM", pressure
        return "LOW", pressure

    def _stub_tweets(self) -> List[Dict]:
        now = datetime.utcnow()
        return [
            {
                "id": "1",
                "text": "🐕💫 Doge mode activated",
                "created_at": (now - timedelta(minutes=30)).isoformat(),
            },
            {
                "id": "2",
                "text": "Starship tests looking good 🚀",
                "created_at": (now - timedelta(hours=2)).isoformat(),
            },
        ]
