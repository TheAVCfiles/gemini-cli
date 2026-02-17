"""Score a Stage Cred routine JSON and return grade + coins."""

import json
from pathlib import Path
from typing import Any, Dict

GOE_STEP = 0.5  # how much each GOE step affects value

PCS_WEIGHTS = {
    "skating_skills": 1.0,
    "transitions": 0.8,
    "performance": 1.2,
    "choreo": 1.0,
    "interpretation": 1.2,
}

def score_routine(routine: Dict[str, Any]) -> Dict[str, Any]:
    elements = routine.get("elements", [])
    pcs = routine.get("pcs", {})

    # Technical: (BV + DD) * (1 + GOE * step)
    tech_total = 0.0
    for el in elements:
        bv = float(el.get("bv", 0.0))
        dd = float(el.get("dd", 0.0))
        goe = float(el.get("goe", 0.0))
        base = bv + dd
        factor = 1.0 + goe * GOE_STEP
        tech_total += base * factor

    # Program Component Score (weighted sum)
    pcs_total = 0.0
    for key, weight in PCS_WEIGHTS.items():
        pcs_total += float(pcs.get(key, 0.0)) * weight

    stage_score = round(tech_total + pcs_total, 1)

    if stage_score >= 90:
        grade = "A"
    elif stage_score >= 80:
        grade = "A-"
    elif stage_score >= 70:
        grade = "B"
    elif stage_score >= 60:
        grade = "C"
    else:
        grade = "D"

    # Coin rule: 1 Stage Coin per 20 points (feel free to tweak)
    stage_coins = int(stage_score // 20)

    return {
        "routine_id": routine.get("routine_id"),
        "stage_score": stage_score,
        "grade": grade,
        "stage_coins": stage_coins,
        "tech_total": round(tech_total, 2),
        "pcs_total": round(pcs_total, 2),
    }


def load_and_score(path: str) -> None:
    data = json.loads(Path(path).read_text())
    result = score_routine(data)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 2:
        print("Usage: python stage_cred_scorer.py routine.json")
        raise SystemExit(1)
    load_and_score(sys.argv[1])
