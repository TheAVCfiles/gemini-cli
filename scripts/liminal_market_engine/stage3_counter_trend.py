"""Stage 3: Counter-trend detection."""

from __future__ import annotations

from pathlib import Path

import pandas as pd


def detect_counter_trends(df: pd.DataFrame) -> pd.DataFrame:
    """Identify contrarian zones using a rolling average of sentiment."""

    mapping = {"positive": 1, "neutral": 0, "negative": -1}
    df = df.copy()
    df["sentiment_num"] = df["sentiment_label"].map(mapping)
    df["rolling_avg"] = df["sentiment_num"].rolling(window=5, min_periods=1).mean()
    contrarian_signals = df[df["rolling_avg"].between(-0.1, 0.1)]
    return contrarian_signals


def main() -> None:
    df = pd.read_json(Path("stage2_sentiment.json"))
    contrarian = detect_counter_trends(df)
    output_path = Path("stage3_contrarian.json")
    output_path.write_text(contrarian.to_json(orient="records", indent=2))
    print(f"⚖️ Counter-trend zone detected: {len(contrarian)} signals")


if __name__ == "__main__":
    main()
