"""Unified DOGE/ETH signal pipeline with Elon meme pressure overlay.

This module intentionally defaults to offline-safe stub data so it can run
without external network access. Provide ``--live`` (plus network access and
API tokens) to fetch live prices via yfinance and tweets via the Twitter v2
API. The output JSON mirrors the "Cunning Mercy" vernacular described in the
operator brief.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, List, Literal, Tuple

from signals.crypto import compute_signals
from signals.elon import ElonMemePressure


Regime = Literal["BULLISH", "NEUTRAL", "ASCENDING", "SIDEWAYS"]


def summarize_regime(
    doge: Dict, eth: Dict, elon_level: str, meme_pressure: int
) -> Dict[str, Dict[str, Regime | str | Dict]]:
    """Map indicator state to the headline "Cunning Mercy" regime.

    - DOGE: bullish when trend and meme-pressure align.
    - ETH: ascending when MACD trend is up; otherwise sideways.
    """

    regime: Dict[str, Regime] = {}
    doge_trending = "EMA_CROSS_UP" in doge.get("buy_signals", []) or doge.get(
        "macd", 0
    ) > doge.get("macd_signal", 0)
    if doge_trending or meme_pressure >= 2:
        regime["DOGE"] = "BULLISH"
    else:
        regime["DOGE"] = "NEUTRAL"

    if "MACD_UP" in eth.get("buy_signals", []):
        regime["ETH"] = "ASCENDING"
    else:
        regime["ETH"] = "SIDEWAYS"

    return {
        "regime": regime,
        "elon_meme_pressure": elon_level,
        "raw": {"doge": doge, "eth": eth},
    }


def run_pipeline(live: bool, bearer_token: str | None, output_path: Path) -> Dict:
    """Compute DOGE + ETH signals and marry them with Elon meme pressure."""

    doge = compute_signals("DOGE-USD", live=live)
    eth = compute_signals("ETH-USD", live=live)

    elon = ElonMemePressure(bearer_token=bearer_token, live=live)
    tweets = elon.fetch_tweets()
    level, pressure = elon.elon_signal(tweets)

    combined = summarize_regime(doge, eth, level, pressure)
    payload = {
        "headline": {
            "doge": f"DOGE: {combined['regime']['DOGE']} (Meme Pressure {pressure})",
            "eth": f"ETH: {combined['regime']['ETH']} (MACD trend signal)",
            "elon": f"Elon Influence: {level} (pressure={pressure})",
        },
        "detail": combined,
        "mode": "live" if live else "stub",
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2))
    return payload


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="DOGE/ETH signal engine with Elon meme overlay",
    )
    parser.add_argument(
        "--live",
        action="store_true",
        help="Fetch live price data (yfinance) and live tweets (Twitter v2 API)",
    )
    parser.add_argument(
        "--bearer-token",
        dest="bearer_token",
        default=None,
        help="Twitter v2 bearer token for live meme-pressure scoring",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("outputs/cunning_mercy_crypto.json"),
        help="Where to write the combined signal payload",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    payload = run_pipeline(live=args.live, bearer_token=args.bearer_token, output_path=args.output)
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
