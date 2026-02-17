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
    """
    routine: {
      "routine_id": "...",
      "elements": [
        { "id": "EL_001", "bv": 3.0, "dd": 1.2, "goe": 1 },
        ...
      ],
      "pcs": {
        "skating_skills": 7.75,
        "transitions": 7.25,
        "performance": 8.0,
        "choreo": 7.5,
        "interpretation": 8.25
      }
    }
    """
    elements = routine.get("elements", [])
    pcs = routine.get("pcs", {})

    tech_total = 0.0
    for element in elements:
        base_value = float(element.get("bv", 0.0))
        difficulty = float(element.get("dd", 0.0))
        goe = float(element.get("goe", 0.0))
        factor = 1.0 + goe * GOE_STEP
        tech_total += (base_value + difficulty) * factor

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

    stage_coins = int(stage_score // 10)

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
        print("Usage: python -m minute_runner.stage_cred_scorer routine.json")
        raise SystemExit(1)
    load_and_score(sys.argv[1])
