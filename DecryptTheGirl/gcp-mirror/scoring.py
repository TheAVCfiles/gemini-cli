from typing import Dict, List

DEFAULT_WEIGHTS = {
    "commits": 1.0,
}


def compute_equity_from_commit_counts(
    commit_counts: Dict[str, int],
    weights=DEFAULT_WEIGHTS,
) -> List[dict]:
    results = []
    for name, commits in commit_counts.items():
        score = commits * weights["commits"]
        results.append({"contributor": name, "commits": commits, "score": score})

    total = sum(result["score"] for result in results) or 1.0
    for result in results:
        result["equity_percent"] = round((result["score"] / total) * 100.0, 2)

    # rank
    results.sort(key=lambda item: item["score"], reverse=True)
    return results
