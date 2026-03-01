"""Proof runner for the Adaptive Ethics rebuttal.

This utility produces a CSV template for users to fill, writes a synthetic demo
backtest dataset, and computes Spearman's rho / p-value for a provided CSV. The
results are persisted as JSON + Markdown receipts so they can be attached to a
public audit trail.
"""

from __future__ import annotations

import argparse
import csv
import json
from dataclasses import dataclass
from datetime import date, timedelta
from math import erf, sqrt
from pathlib import Path
from random import gauss, seed
from typing import Iterable, List

BASE_DIR = Path(__file__).resolve().parent
ARTIFACT_DIR = BASE_DIR / "proof_artifacts"
TEMPLATE_PATH = ARTIFACT_DIR / "proof_template.csv"
DEMO_PATH = ARTIFACT_DIR / "demo_backtest.csv"
RECEIPT_PATH = ARTIFACT_DIR / "proof_receipt.json"
REPORT_PATH = ARTIFACT_DIR / "proof_report_DEMO.md"


@dataclass
class ProofResult:
  n: int
  rho: float
  p_value: float
  alpha: float
  gate_open: bool
  note: str | None = None


def ensure_dirs() -> None:
  ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)


def write_template(days: int = 30) -> None:
  today = date.today()
  start = today - timedelta(days=days - 1)
  with TEMPLATE_PATH.open("w", newline="") as handle:
    writer = csv.writer(handle)
    writer.writerow(["date", "signal", "return"])
    for offset in range(days):
      writer.writerow([(start + timedelta(days=offset)).isoformat(), "", ""])


def generate_demo_dataset(points: int = 180) -> None:
  seed(7)
  today = date.today()
  start = today - timedelta(days=points - 1)
  with DEMO_PATH.open("w", newline="") as handle:
    writer = csv.writer(handle)
    writer.writerow(["date", "signal", "return"])
    for i in range(points):
      signal = -1 + 2 * (i / (points - 1)) + gauss(0, 0.25)
      ret = signal * 0.8 + gauss(0, 0.35)
      writer.writerow([(start + timedelta(days=i)).isoformat(), f"{signal:.6f}", f"{ret:.6f}"])


def rankdata(values: Iterable[float]) -> List[float]:
  pairs = sorted((value, index) for index, value in enumerate(values))
  ranks = [0.0] * len(pairs)
  i = 0
  while i < len(pairs):
    j = i
    while j + 1 < len(pairs) and pairs[j + 1][0] == pairs[i][0]:
      j += 1
    avg_rank = (i + j + 2) / 2.0
    for k in range(i, j + 1):
      _, original_index = pairs[k]
      ranks[original_index] = avg_rank
    i = j + 1
  return ranks


def spearman_rho(x: List[float], y: List[float]) -> float:
  rx = rankdata(x)
  ry = rankdata(y)
  mean_rx = sum(rx) / len(rx)
  mean_ry = sum(ry) / len(ry)
  num = sum((rx_i - mean_rx) * (ry_i - mean_ry) for rx_i, ry_i in zip(rx, ry))
  den_x = sum((rx_i - mean_rx) ** 2 for rx_i in rx)
  den_y = sum((ry_i - mean_ry) ** 2 for ry_i in ry)
  denominator = sqrt(den_x * den_y)
  return float("nan") if denominator == 0 else num / denominator


def p_value_spearman(rho: float, n: int) -> float:
  if not (n >= 3 and abs(rho) < 1):
    return float("nan")
  t = rho * sqrt((n - 2) / max(1e-12, 1 - rho * rho))
  z = abs(t) / sqrt(2.0)
  p_one = 0.5 * (1 - erf(z))
  return max(0.0, min(1.0, 2 * p_one))


def run_proof(rows: Iterable[dict[str, str]], alpha: float) -> ProofResult:
  signals: List[float] = []
  returns: List[float] = []
  for row in rows:
    try:
      signal = float(row.get("signal", ""))
      ret = float(row.get("return", ""))
    except ValueError:
      continue
    signals.append(signal)
    returns.append(ret)

  if len(signals) < 10:
    return ProofResult(
      n=len(signals),
      rho=float("nan"),
      p_value=float("nan"),
      alpha=alpha,
      gate_open=False,
      note="Not enough rows with numeric signal/return (need >= 10).",
    )

  rho = spearman_rho(signals, returns)
  p_value = p_value_spearman(rho, len(signals))
  gate_open = bool(p_value <= alpha)
  return ProofResult(n=len(signals), rho=rho, p_value=p_value, alpha=alpha, gate_open=gate_open)


def load_csv(path: Path) -> List[dict[str, str]]:
  with path.open() as handle:
    reader = csv.DictReader(handle)
    return list(reader)


def write_receipts(result: ProofResult, dataset_path: Path, dataset_label: str) -> None:
  receipt = {
    "dataset": dataset_label,
    "dataset_path": str(dataset_path),
    "result": {
      "n": result.n,
      "rho": result.rho,
      "p_value": result.p_value,
      "alpha": result.alpha,
      "gate_open": result.gate_open,
      "note": result.note,
    },
  }
  RECEIPT_PATH.write_text(json.dumps(receipt, indent=2))

  gate_text = "OPEN ✅" if result.gate_open else "CLOSED 🚫"
  REPORT_PATH.write_text(
    (
      "# Intuition Labs — Proof Run (DEMO DATA)\n"
      f"**Dataset:** {dataset_label}\n\n"
      f"**Rows used (n):** {result.n}\n\n"
      f"**Spearman rho:** {result.rho:.3f}\n\n"
      f"**Approx. p-value (two-tailed):** {result.p_value:.3e}\n\n"
      f"**Alpha (gate threshold):** {result.alpha:.2f}\n\n"
      f"**Mercy Gate:** {gate_text}\n\n"
      "> This run uses synthetic data to demonstrate the mechanics only. Replace with real backtest CSV to generate auditable evidence.\n"
    )
  )


def main() -> None:
  parser = argparse.ArgumentParser(description="Run the Adaptive Ethics proof correlation check.")
  parser.add_argument(
    "--csv",
    type=Path,
    help="Optional CSV to evaluate. Must contain 'signal' and 'return' columns."
  )
  parser.add_argument("--alpha", type=float, default=0.05, help="Threshold for the mercy gate (default: 0.05)")
  args = parser.parse_args()

  ensure_dirs()
  write_template()
  generate_demo_dataset()

  dataset_path = args.csv if args.csv else DEMO_PATH
  dataset_label = dataset_path.name if args.csv else "demo_backtest.csv (synthetic)"

  rows = load_csv(dataset_path)
  result = run_proof(rows, args.alpha)
  write_receipts(result, dataset_path, dataset_label)

  if args.csv:
    summary_label = dataset_path.name
  else:
    summary_label = "DEMO (synthetic)"

  print("Proof summary:")
  print(f"  data: {summary_label}")
  print(f"  n: {result.n}")
  print(f"  Spearman rho: {result.rho:.3f}")
  print(f"  Approx. p-value: {result.p_value:.3e}")
  print(f"  Mercy gate: {'OPEN ✅' if result.gate_open else 'CLOSED 🚫'}")
  if result.note:
    print(f"  Note: {result.note}")


if __name__ == "__main__":
  main()
