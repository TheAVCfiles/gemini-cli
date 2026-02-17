import json
from typing import Any, Dict

from .cred_coins import screen_coins, street_coins
from .stage_cred_scorer import score_routine


def build_weekly_report(
    *,
    week_id: str,
    as_of: str,
    market_regime: Dict[str, Any],
    risk_band: Dict[str, Any],
    predictive_levels: Dict[str, Any],
    street_input: Dict[str, Any],
    screen_input: Dict[str, Any],
    stage_routine: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Returns the unified weekly object matching the JSON schema.
    """

    stage_result = score_routine(stage_routine)

    street_pnl = float(street_input.get("pnl_pct", 0.0))
    obeyed_plan = bool(street_input.get("obeyed_plan", False))
    street_hit_rate = float(street_input.get("hit_rate", 0.0))
    street_notes = street_input.get("notes", "")
    street_minted = street_coins(pnl_pct=street_pnl, obeyed_plan=obeyed_plan)

    reels_posted = int(screen_input.get("reels_posted", 0))
    essays_or_logs = int(screen_input.get("essays_or_logs", 0))
    quality_pass_count = int(screen_input.get("quality_pass_count", 0))
    screen_notes = screen_input.get("notes", "")
    screen_minted = screen_coins(quality_pass_count=quality_pass_count)

    stage_minted = int(stage_result["stage_coins"])

    coin_summary = {
        "street": street_minted,
        "screen": screen_minted,
        "stage": stage_minted,
        "total": street_minted + screen_minted + stage_minted,
    }

    weekly: Dict[str, Any] = {
        "week_id": week_id,
        "as_of": as_of,
        "market_regime": market_regime,
        "risk_band": risk_band,
        "predictive_levels": predictive_levels,
        "stage_cred": {
            "street": {
                "pnl_pct": street_pnl,
                "hit_rate": street_hit_rate,
                "obeyed_plan": obeyed_plan,
                "notes": street_notes,
                "coins": {
                    "minted": street_minted,
                    "delta": None,
                },
            },
            "screen": {
                "reels_posted": reels_posted,
                "essays_or_logs": essays_or_logs,
                "quality_pass_count": quality_pass_count,
                "notes": screen_notes,
                "coins": {
                    "minted": screen_minted,
                    "delta": None,
                },
            },
            "stage": {
                "best_routine_id": stage_result["routine_id"],
                "best_routine_score": stage_result["stage_score"],
                "grade": stage_result["grade"],
                "judge_tag": "Controlled risk, expressive exits",
                "coins": {
                    "minted": stage_minted,
                    "delta": None,
                },
            },
        },
        "coin_summary": coin_summary,
        "protocol_notes": [],
    }

    return weekly


def demo() -> None:
    market_regime = {
        "label": "Cunning Mercy",
        "profile": "Defensive / Fade-Short",
        "element_bias": "Air-Fire tilt",
        "tau_ci": 0.88,
        "perm_p": 0.017,
        "structural_confirmed": True,
        "notes": [
            "Regime C-3: mean-revert short favored.",
            "Guard band around 4624.",
        ],
    }

    risk_band = {
        "max_equity_risk": 0.02,
        "scale_up_gate": False,
        "advised_flavor": "Scout only / No pyramiding",
        "allowed_modes": ["paper", "micro", "study"],
    }

    predictive_levels = {
        "symbol": "ETH",
        "levels": [
            {
                "label": "Guard",
                "level": 4624,
                "bias": "fade short",
                "note": "defend above",
            },
            {
                "label": "Mean-Revert Zone",
                "level": 4475,
                "bias": "short bounces",
                "note": "primary hunting ground",
            },
        ],
        "summary": "Bias: mean-revert short; guard @4624, only scout size.",
    }

    street_input = {
        "pnl_pct": -0.3,
        "hit_rate": 0.52,
        "obeyed_plan": True,
        "notes": "One FOMO entry, but exits disciplined.",
    }

    screen_input = {
        "reels_posted": 3,
        "essays_or_logs": 2,
        "quality_pass_count": 3,
        "notes": "One strong demo reel; two ‘good enough’ clips.",
    }

    stage_routine = {
        "routine_id": "pyrouette_demo_B12I6RwlEzY",
        "elements": [
            {"id": "EL_001", "bv": 3.0, "dd": 1.2, "goe": 1},
            {"id": "EL_002", "bv": 2.6, "dd": 0.8, "goe": 0},
            {"id": "EL_003", "bv": 4.0, "dd": 1.8, "goe": -1},
        ],
        "pcs": {
            "skating_skills": 7.75,
            "transitions": 7.25,
            "performance": 8.0,
            "choreo": 7.5,
            "interpretation": 8.25,
        },
    }

    weekly = build_weekly_report(
        week_id="2025-W47",
        as_of="2025-11-23T23:59:00Z",
        market_regime=market_regime,
        risk_band=risk_band,
        predictive_levels=predictive_levels,
        street_input=street_input,
        screen_input=screen_input,
        stage_routine=stage_routine,
    )

    print(json.dumps(weekly, indent=2))


if __name__ == "__main__":
    demo()
