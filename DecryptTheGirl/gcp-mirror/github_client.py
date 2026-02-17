import os
from typing import Dict, List

import requests

GITHUB_API = "https://api.github.com"


def _headers() -> Dict[str, str]:
    token = os.getenv("GITHUB_TOKEN", "")
    if not token:
        raise RuntimeError("Missing GITHUB_TOKEN in environment.")
    return {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json",
    }


def get_repo_commits(
    owner: str,
    repo: str,
    per_page: int = 100,
    max_pages: int = 10,
) -> List[dict]:
    """Fetch recent commits (paged). This is V0.1: recent history only."""
    commits: List[dict] = []
    for page in range(1, max_pages + 1):
        url = f"{GITHUB_API}/repos/{owner}/{repo}/commits"
        response = requests.get(
            url,
            headers=_headers(),
            params={"per_page": per_page, "page": page},
            timeout=30,
        )
        if response.status_code != 200:
            raise RuntimeError(
                f"GitHub commits fetch failed: {response.status_code} {response.text[:200]}"
            )
        batch = response.json()
        if not batch:
            break
        commits.extend(batch)
    return commits


def aggregate_commit_counts(commits: List[dict]) -> Dict[str, int]:
    """Count commits per author login (fallback to email/name if missing)."""
    counts: Dict[str, int] = {}
    for commit_payload in commits:
        author = commit_payload.get("author") or {}
        login = author.get("login")
        if not login:
            # fallback for unlinked commits
            commit = commit_payload.get("commit", {})
            commit_author = commit.get("author", {}) or {}
            login = (
                commit_author.get("email")
                or commit_author.get("name")
                or "unknown"
            )
        counts[login] = counts.get(login, 0) + 1
    return counts
