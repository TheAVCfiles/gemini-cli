#!/usr/bin/env python3
"""Utility to fix demo feature data before running predictions.

This helper mirrors the patch provided in the user instructions: drop the
``label`` column from the ``demo_features.csv`` file if it exists and then
re-run the prediction script with the cleaned feature matrix.  The defaults
match the paths used by the external demo environment (``/mnt/data/mythtouch``),
but every path can be overridden via command-line arguments.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

import pandas as pd


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Drop the 'label' column from demo features before running predictions."
    )
    parser.add_argument(
        "--base",
        default="/mnt/data/mythtouch",
        type=Path,
        help="Base directory that contains the demo bundle (default: /mnt/data/mythtouch)",
    )
    parser.add_argument(
        "--features",
        default=None,
        type=Path,
        help="Path to demo_features.csv (defaults to <base>/run_demo/demo_features.csv)",
    )
    parser.add_argument(
        "--model",
        default=None,
        type=Path,
        help="Path to model.pkl (defaults to <base>/run_demo/model.pkl)",
    )
    parser.add_argument(
        "--scaler",
        default=None,
        type=Path,
        help="Path to scaler.pkl (defaults to <base>/run_demo/scaler.pkl)",
    )
    parser.add_argument(
        "--predict-script",
        default=None,
        type=Path,
        help="Path to predict.py (defaults to <base>/predict.py)",
    )
    parser.add_argument(
        "--python",
        default=sys.executable,
        type=str,
        help="Python interpreter to use when running the prediction script.",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Only clean the CSV without executing the prediction script.",
    )
    return parser.parse_args()


def resolve_paths(args: argparse.Namespace) -> tuple[Path, Path, Path, Path]:
    base = args.base
    features = args.features or base / "run_demo" / "demo_features.csv"
    model = args.model or base / "run_demo" / "model.pkl"
    scaler = args.scaler or base / "run_demo" / "scaler.pkl"
    predict_script = args.predict_script or base / "predict.py"
    return features, model, scaler, predict_script


def drop_label_column(features_path: Path) -> bool:
    if not features_path.exists():
        print(f"Skipping: {features_path} does not exist.")
        return False

    df = pd.read_csv(features_path)
    if "label" not in df.columns:
        print("No 'label' column found. No changes made to demo features.")
        return False

    cleaned = df.drop(columns=["label"])
    cleaned.to_csv(features_path, index=False)
    print(f"Removed 'label' column and rewrote {features_path}.")
    return True


def run_prediction(
    predict_script: Path,
    python_executable: str,
    model_path: Path,
    scaler_path: Path,
    features_path: Path,
) -> subprocess.CompletedProcess[str]:
    cmd = [
        python_executable,
        str(predict_script),
        "--model",
        str(model_path),
        "--scaler",
        str(scaler_path),
        "--features",
        str(features_path),
    ]
    print("Running:", " ".join(cmd))
    return subprocess.run(cmd, capture_output=True, text=True, check=False)


def main() -> int:
    args = parse_args()
    features_path, model_path, scaler_path, predict_script = resolve_paths(args)

    changed = drop_label_column(features_path)

    if args.check:
        return 0

    result = run_prediction(
        predict_script=predict_script,
        python_executable=args.python,
        model_path=model_path,
        scaler_path=scaler_path,
        features_path=features_path,
    )

    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)

    if result.returncode != 0:
        status = "Prediction command failed"
    elif changed:
        status = "Prediction completed after cleaning demo features"
    else:
        status = "Prediction completed (no cleanup required)"

    print(status)
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())

