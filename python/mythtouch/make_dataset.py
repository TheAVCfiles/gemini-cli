#!/usr/bin/env python3
"""Generate a synthetic tactile dataset for the mythtouch demo."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import List

import numpy as np
import pandas as pd

# Allow running the script directly without installing the package.
HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

from mythtouch import extract_features, gen_texture_signal, simulate_receptors

LABELS: List[str] = ["silk", "sandpaper", "plastic", "metal", "skin"]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", required=True, help="Path to the CSV that will be written.")
    parser.add_argument("--per_class", type=int, default=40, help="Number of samples per label.")
    parser.add_argument("--fs", type=int, default=1_000, help="Sample rate of the signal (Hz).")
    parser.add_argument("--seconds", type=float, default=1.0, help="Duration of each signal in seconds.")
    parser.add_argument("--seed", type=int, default=17, help="Seed used for the RNG.")
    parser.add_argument("--grid", type=int, default=6, help="Number of receptors per side of the grid.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    rng = np.random.default_rng(args.seed)
    rows = []
    for label in LABELS:
        for _ in range(args.per_class):
            _, signal = gen_texture_signal(label, fs=args.fs, T=args.seconds, rng=rng)
            sim = simulate_receptors(signal, fs=args.fs, grid_n=args.grid, rng=rng)
            feats = extract_features(sim, fs=args.fs)
            feats["label"] = label
            rows.append(feats)

    df = pd.DataFrame(rows)
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out_path, index=False)
    print(json.dumps({"rows": len(df), "columns": df.shape[1], "path": str(out_path)}, indent=2))


if __name__ == "__main__":
    main()
