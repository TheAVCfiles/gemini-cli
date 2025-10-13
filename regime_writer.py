"""Assemble regime gate metadata for the live runner.

The analytics pipeline produces three CSV files that encode the structural,
statistical and predictive checks used by the intraday execution engine.  This
utility condenses those artifacts into a single JSON document that the live
runner can ingest atomically.  The resulting payload communicates whether the
"regime gate" is open as well as the diagnostic context that informed that
decision.
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from typing import Optional

import pandas as pd
from pydantic import BaseModel, Field


class Regime(BaseModel):
    tri: float = Field(0.0, description="Systemic stress score TRI*")
    tau_star: float = Field(0.0, description="Regime indicator τ*")


class Deadlines(BaseModel):
    D0: int = 4
    min_D: int = 2
    max_D: int = 12


class RiskBudget(BaseModel):
    bps: float = 15.0
    no_scale_p_low: float = 0.05
    no_scale_p_high: float = 0.35


class EngineConfig(BaseModel):
    structure_min: int = Field(85, ge=0)
    tau_ci_excludes_zero: bool = True
    deadlines: Deadlines = Field(default_factory=Deadlines)
    risk: RiskBudget = Field(default_factory=RiskBudget)


@dataclass(frozen=True)
class RegimeInputs:
    tau_summary: Path
    event_perm: Path
    overlay: Path
    out_path: Path
    fallback_weight: int


def parse_args() -> RegimeInputs:
    parser = argparse.ArgumentParser(description="Write daily regime JSON")
    parser.add_argument("--tau-summary", type=Path, required=True)
    parser.add_argument("--event-perm", type=Path, required=True)
    parser.add_argument("--overlay", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument(
        "--fallback-weight",
        type=int,
        default=90,
        help="Weight to use when the structural overlay does not provide one",
    )
    args = parser.parse_args()

    return RegimeInputs(
        tau_summary=args.tau_summary,
        event_perm=args.event_perm,
        overlay=args.overlay,
        out_path=args.out,
        fallback_weight=args.fallback_weight,
    )


def read_tau_summary(path: Path) -> dict[str, Any]:
    df = pd.read_csv(path)
    if df.empty:
        raise ValueError("tau_star_summary.csv is empty")
    row = df.iloc[0]
    ci_low = float(row.get("ci_low"))
    ci_high = float(row.get("ci_high"))
    tau_star = float(row.get("tau_star"))
    r_star = float(row.get("r_star"))
    tri_value = row.get("tri", 0.0)
    tri = 0.0 if pd.isna(tri_value) else float(tri_value)
    excludes_zero = (ci_low > 0 and ci_high > 0) or (ci_low < 0 and ci_high < 0)
    return {
        "tau_star": tau_star,
        "r_star": r_star,
        "ci_low": ci_low,
        "ci_high": ci_high,
        "tau_ci_excludes_zero": excludes_zero,
        "tri": tri,
    }


def best_p_value(path: Path) -> float:
    df = pd.read_csv(path)
    if df.empty:
        raise ValueError("event_study_permutation_summary.csv is empty")
    if "p_one_sided" not in df.columns:
        raise ValueError("Permutation summary missing 'p_one_sided' column")
    return float(df["p_one_sided"].min())


def structural_confirmation(path: Path, fallback: int) -> dict[str, Any]:
    df = pd.read_csv(path)
    if df.empty:
        return {"struct_confirmed": False, "tap_weight": fallback, "confirmation": None}

    if "is_confirmed" not in df.columns:
        raise ValueError("Overlay summary missing 'is_confirmed' column")

    confirmed_rows = df[df["is_confirmed"] == True].copy()  # noqa: E712
    if confirmed_rows.empty:
        return {"struct_confirmed": False, "tap_weight": fallback, "confirmation": None}

    confirmation: Optional[str] = confirmed_rows.iloc[0].get("confirmation")
    weight = fallback
    if isinstance(confirmation, str):
        # confirmation strings look like "Event name (W:95, 2024-01-01)"
        match = re.search(r"W:(\d+)", confirmation)
        if match:
            weight = int(match.group(1))

    return {
        "struct_confirmed": True,
        "tap_weight": int(weight),
        "confirmation": confirmation,
    }


def build_payload(inputs: RegimeInputs) -> dict[str, Any]:
    tau_info = read_tau_summary(inputs.tau_summary)
    p_value = best_p_value(inputs.event_perm)
    struct_info = structural_confirmation(inputs.overlay, inputs.fallback_weight)

    gate_open = (
        struct_info["struct_confirmed"]
        and tau_info["tau_ci_excludes_zero"]
        and p_value < 0.05
    )

    regime = "kinetic_power_up" if gate_open else "cunning_mercy"
    max_risk = 0.025 if gate_open else 0.005

    regime_metrics = Regime(tri=tau_info["tri"], tau_star=tau_info["tau_star"])
    engine_config = EngineConfig(
        structure_min=int(struct_info["tap_weight"]),
        tau_ci_excludes_zero=tau_info["tau_ci_excludes_zero"],
    )

    payload = {
        "struct_confirmed": struct_info["struct_confirmed"],
        "tap_weight": struct_info["tap_weight"],
        "confirmation": struct_info["confirmation"],
        "tau_star": tau_info["tau_star"],
        "r_star": tau_info["r_star"],
        "ci_low": tau_info["ci_low"],
        "ci_high": tau_info["ci_high"],
        "tau_ci_excludes_zero": tau_info["tau_ci_excludes_zero"],
        "tap_p_value": p_value,
        "gate_open": gate_open,
        "regime": regime,
        "max_position_risk": max_risk,
        "regime_metrics": regime_metrics.model_dump(),
        "engine_config": engine_config.model_dump(),
    }
    return payload


def atomic_write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_name(f".{path.name}.tmp")
    tmp_path.write_text(json.dumps(payload, indent=2))
    tmp_path.replace(path)


def main() -> None:
    inputs = parse_args()
    payload = build_payload(inputs)
    atomic_write_json(inputs.out_path, payload)


if __name__ == "__main__":
    main()
