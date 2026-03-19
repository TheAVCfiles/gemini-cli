#!/usr/bin/env python3
"""Predict texture labels from features or by simulating new samples."""

from __future__ import annotations

import argparse
import json
import pickle
import sys
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

from mythtouch import extract_features, gen_texture_signal, simulate_receptors

TEXTURE_CHOICES = ["silk", "sandpaper", "plastic", "metal", "skin"]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", required=True, help="Trained model pickle file.")
    parser.add_argument("--scaler", required=True, help="Fitted scaler pickle file.")
    parser.add_argument("--features", help="Optional CSV of features to score.")
    parser.add_argument(
        "--simulate",
        choices=TEXTURE_CHOICES,
        help="If provided, generate a synthetic sample for the chosen texture.",
    )
    parser.add_argument("--fs", type=int, default=1_000, help="Sample rate for simulation.")
    parser.add_argument("--seconds", type=float, default=1.0, help="Duration for simulation.")
    parser.add_argument("--grid", type=int, default=6, help="Grid size for receptor simulation.")
    parser.add_argument("--seed", type=int, default=99, help="Seed for the RNG when simulating.")
    return parser.parse_args()


def load_pickle(path: str):
    with open(path, "rb") as fh:
        return pickle.load(fh)


def main() -> None:
    args = parse_args()

    bundle = load_pickle(args.model)
    model_kind = bundle["kind"]
    model = bundle["model"]
    scaler = load_pickle(args.scaler)

    if args.features:
        df = pd.read_csv(args.features)
    else:
        if not args.simulate:
            raise SystemExit("Provide --features CSV or choose a texture via --simulate.")
        rng = np.random.default_rng(args.seed)
        _, signal = gen_texture_signal(args.simulate, fs=args.fs, T=args.seconds, rng=rng)
        sim = simulate_receptors(signal, fs=args.fs, grid_n=args.grid, rng=rng)
        feats = extract_features(sim, fs=args.fs)
        df = pd.DataFrame([feats])

    X = df.values
    X_processed = scaler.transform(X) if model_kind == "lr" else X

    probs: Optional[np.ndarray] = None
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(X_processed)

    preds = model.predict(X_processed)
    payload = {
        "kind": model_kind,
        "predictions": preds.tolist(),
        "probabilities": probs.tolist() if probs is not None else None,
    }
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
