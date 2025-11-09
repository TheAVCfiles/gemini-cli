"""Placeholder astro engine script for SYVAQ 29° Protocol runs.

This script demonstrates how to load founder and entity datetimes, produce a
placeholder pandas DataFrame, and export CSV/JSON outputs. Replace the
placeholder scoring logic with real calculations once exact natal data and
orb weights are confirmed.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd


@dataclass(frozen=True)
class RuntimeConfig:
    founder_datetime: datetime
    founding_datetime: datetime
    start_date: datetime
    end_date: datetime
    output_dir: Path


def daterange(start: datetime, end: datetime) -> Iterable[datetime]:
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)


def generate_placeholder_scores(config: RuntimeConfig) -> pd.DataFrame:
    """Generate placeholder composite metrics using deterministic noise.

    The placeholder engine creates cyclical patterns so stakeholders can review
    data flows while waiting for verified birth/founding times.
    """

    dates = list(daterange(config.start_date, config.end_date))
    days = np.arange(len(dates))

    founder_cycle = 0.6 + 0.3 * np.sin(days / 7)
    entity_cycle = 0.5 + 0.4 * np.cos(days / 11)
    synastry = 0.5 * founder_cycle + 0.5 * entity_cycle

    composite = 0.4 * founder_cycle + 0.4 * entity_cycle + 0.2 * np.sin(days / 3)
    tag = np.where(composite > 0.75, "green", np.where(composite < 0.45, "red", "amber"))

    df = pd.DataFrame(
        {
            "date": [d.date().isoformat() for d in dates],
            "founder_score": founder_cycle.round(3),
            "entity_score": entity_cycle.round(3),
            "synastry_activation": synastry.round(3),
            "composite_score": composite.round(3),
            "tag": tag,
            "notes": ["placeholder" for _ in dates],
        }
    )

    return df


def export_outputs(df: pd.DataFrame, config: RuntimeConfig) -> None:
    config.output_dir.mkdir(parents=True, exist_ok=True)
    csv_path = config.output_dir / "lilly_syvaq_astro_series_20250701_20270131.csv"
    json_path = config.output_dir / "lilly_syvaq_astro_series_20250701_20270131.json"

    df.to_csv(csv_path, index=False)
    df.to_json(json_path, orient="records", indent=2)

    print(f"Wrote {csv_path}")
    print(f"Wrote {json_path}")


def main() -> None:
    # TODO: Replace placeholder datetimes with verified values.
    founder_dt = datetime(1994, 7, 6, 12, 0, tzinfo=timezone.utc)
    founding_dt = datetime(2024, 5, 1, 16, 30, tzinfo=timezone.utc)  # <<FOUNDING_DATETIME>>

    start = datetime(2025, 7, 1, tzinfo=timezone.utc)
    end = datetime(2027, 1, 31, tzinfo=timezone.utc)

    output_dir = Path("outputs")

    config = RuntimeConfig(
        founder_datetime=founder_dt,
        founding_datetime=founding_dt,
        start_date=start,
        end_date=end,
        output_dir=output_dir,
    )

    df = generate_placeholder_scores(config)
    export_outputs(df, config)


if __name__ == "__main__":
    main()
