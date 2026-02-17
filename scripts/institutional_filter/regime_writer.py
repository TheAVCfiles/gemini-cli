#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso_z(ts: datetime) -> str:
    return ts.isoformat().replace("+00:00", "Z")


def atomic_write(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")
    tmp.replace(path)


def corr(a: list[float], b: list[float]) -> float:
    n = min(len(a), len(b))
    if n < 2:
        return 0.0
    ax = a[:n]
    bx = b[:n]
    ma = sum(ax) / n
    mb = sum(bx) / n
    cov = sum((x - ma) * (y - mb) for x, y in zip(ax, bx))
    va = sum((x - ma) ** 2 for x in ax)
    vb = sum((y - mb) ** 2 for y in bx)
    if va <= 0 or vb <= 0:
        return 0.0
    return cov / math.sqrt(va * vb)


def quantile(values: list[float], q: float) -> float:
    if not values:
        return 0.0
    arr = sorted(values)
    pos = (len(arr) - 1) * q
    lo = int(math.floor(pos))
    hi = int(math.ceil(pos))
    if lo == hi:
        return arr[lo]
    frac = pos - lo
    return arr[lo] * (1 - frac) + arr[hi] * frac


def compute_block_bootstrap_ci(
    x: list[float],
    y: list[float],
    tau: int,
    block_size: int = 5,
    n_boot: int = 2000,
    confidence: float = 0.95,
    seed: int | None = None,
) -> tuple[float, float, float]:
    if tau < 0:
        raise ValueError("tau must be non-negative")
    aligned_x = x[:-tau] if tau > 0 else x
    aligned_y = y[tau:] if tau > 0 else y
    n = min(len(aligned_x), len(aligned_y))
    if n < max(10, block_size):
        raise ValueError("insufficient observations for block bootstrap")

    aligned_x = aligned_x[:n]
    aligned_y = aligned_y[:n]
    point = corr(aligned_x, aligned_y)

    rng = random.Random(seed)
    n_blocks = math.ceil(n / block_size)
    max_start = n - block_size

    boot = []
    for _ in range(n_boot):
        idx: list[int] = []
        for _ in range(n_blocks):
            s = rng.randint(0, max_start)
            idx.extend(range(s, s + block_size))
        idx = idx[:n]
        bx = [aligned_x[i] for i in idx]
        by = [aligned_y[i] for i in idx]
        boot.append(corr(bx, by))

    alpha = 1 - confidence
    return point, quantile(boot, alpha / 2), quantile(boot, 1 - alpha / 2)


def strict_significant(lower: float, upper: float) -> bool:
    return (lower > 0 and upper > 0) or (lower < 0 and upper < 0)


def load_series(path: Path, x_col: str, y_col: str) -> tuple[list[float], list[float]]:
    x: list[float] = []
    y: list[float] = []
    with path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None or x_col not in reader.fieldnames or y_col not in reader.fieldnames:
            raise ValueError(f"missing required columns: {x_col}, {y_col}")
        for row in reader:
            x.append(float(row[x_col]))
            y.append(float(row[y_col]))
    return x, y


def read_structural_weight(path: Path | None, default_weight: int) -> int:
    if path is None or not path.exists():
        return default_weight
    payload = json.loads(path.read_text(encoding="utf-8"))
    return int(payload.get("structural_weight", default_weight))


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--tau-csv", type=Path, required=True)
    p.add_argument("--x-col", default="x_returns")
    p.add_argument("--y-col", default="y_returns")
    p.add_argument("--tau", type=int, default=1)
    p.add_argument("--p-value", type=float, default=1.0)
    p.add_argument("--structural-json", type=Path)
    p.add_argument("--default-structural-weight", type=int, default=0)
    p.add_argument("--block-size", type=int, default=5)
    p.add_argument("--n-boot", type=int, default=2000)
    p.add_argument("--seed", type=int, default=7)
    p.add_argument("--expiry-hours", type=int, default=24)
    p.add_argument("--output", type=Path, default=Path("daily_overlay_regime.json"))
    return p.parse_args()


def main() -> None:
    args = parse_args()
    x, y = load_series(args.tau_csv, args.x_col, args.y_col)
    point, lo, hi = compute_block_bootstrap_ci(x, y, args.tau, args.block_size, args.n_boot, seed=args.seed)

    p_value = args.p_value if math.isfinite(args.p_value) else 1.0
    tau_significant = strict_significant(lo, hi)
    structural_weight = read_structural_weight(args.structural_json, args.default_structural_weight)
    favorable = bool(tau_significant and p_value < 0.05 and structural_weight >= 80)

    now = utc_now()
    payload = {
        "schema_version": "regime.v1",
        "last_update_utc": iso_z(now),
        "regime_expiry_utc": iso_z((now + timedelta(hours=args.expiry_hours)).replace(minute=0, second=0, microsecond=0)),
        "regime_favorable": favorable,
        "struct_confirmed": structural_weight >= 80,
        "tau_ci_excludes_zero": tau_significant,
        "tau_ci_low": round(lo, 6),
        "tau_ci_high": round(hi, 6),
        "tau_estimate": round(point, 6),
        "tap_p_value": float(p_value),
        "tau_significant": tau_significant,
        "structural_weight": structural_weight,
        "max_gain_factor": 0.96 if favorable else 0.5,
        "risk_level_bias": "LONG_BIAS" if favorable else "NEUTRAL",
        "tau_status": "CI_EXCLUDES_ZERO" if tau_significant else "NO_EDGE",
    }
    payload["hash_sha256"] = hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()

    atomic_write(args.output, payload)
    print(f"✅ REGIME WRITTEN: {args.output} | favorable={payload['regime_favorable']}")


if __name__ == "__main__":
    main()
