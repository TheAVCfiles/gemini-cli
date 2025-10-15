"""Generate a focused daily brief from a projects.json file.

This module mirrors the helper script shared in the task description but adds a
small amount of structure so it can be imported in tests.  The core flow is the
same: load projects, pick the highest impact × urgency task that is not blocked,
and format the result as a short brief.
"""

from __future__ import annotations

import datetime as _dt
import json
import random
import textwrap
from pathlib import Path
from typing import Any, Callable, Iterable, Mapping, Sequence

DATA = Path("projects.json")
LOG = Path("progress.log")

Task = Mapping[str, Any]
Project = Mapping[str, Any]


def score(task: Task) -> float:
    """Return a score where higher values indicate better candidates."""

    if task.get("blocked"):
        return -1.0
    impact = float(task.get("impact", 1))
    urgency = float(task.get("urgency", 1))
    effort_raw = task.get("effort", 1)
    try:
        effort = float(effort_raw)
    except (TypeError, ValueError):
        effort = 1.0
    effort = max(effort, 1.0)
    return (impact * urgency) / effort


def pick_one(
    projects: Iterable[Project],
    *,
    rng: Callable[[], float] = random.random,
) -> tuple[float, str, str, Task] | None:
    """Select the highest scoring task from the project list."""

    candidates: list[tuple[float, str, str, Task]] = []
    for project in projects:
        name = project.get("name")
        goal = project.get("goal")
        tasks: Sequence[Task] = project.get("tasks", [])  # type: ignore[assignment]
        if not isinstance(tasks, Sequence) or isinstance(tasks, (str, bytes)):
            continue
        for task in tasks:
            score_value = score(task)
            if score_value > 0 and name and goal:
                candidates.append((score_value, str(name), str(goal), task))
    if not candidates:
        return None

    candidates.sort(key=lambda item: (item[0], rng()), reverse=True)
    return candidates[0]


def micro_brief(
    project: str,
    goal: str,
    task: Task,
    *,
    today: _dt.date | None = None,
) -> str:
    """Format the details for the highest-priority task."""

    if today is None:
        today = _dt.date.today()

    title = str(task.get("title", ""))
    steps = [
        "Open repo/docs for this project",
        f"Draft the asset for: {title}",
        "Self-check against Definition of Done",
        "Save/commit and log result",
    ]
    dod = [
        "Clear, shippable artifact produced (doc/section/file)",
        "No TODOs left in text",
        "Stored in the right folder/repo with sensible name",
    ]
    first_keystrokes = "- [ ] {title}\n\n# Notes\n".format(title=title)

    block = f"""
    ONE THING TODAY  —  {today.isoformat()}
    Project: {project}
    Goal:    {goal}
    Task:    {title}

    Why this: highest Impact×Urgency with doable effort (25–45 min).

    Steps:
    - {steps[0]}
    - {steps[1]}
    - {steps[2]}
    - {steps[3]}

    Definition of Done:
    - {dod[0]}
    - {dod[1]}
    - {dod[2]}

    First keystrokes (paste into your doc):
    {first_keystrokes}
    """
    return textwrap.dedent(block).strip()


def log_done(
    project: str,
    task_title: str,
    *,
    log_path: Path | str = LOG,
    timestamp: _dt.datetime | None = None,
) -> None:
    """Append a completion entry to the log."""

    if timestamp is None:
        timestamp = _dt.datetime.now()
    path = Path(log_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(f"{timestamp.isoformat()}\t{project}\t{task_title}\n")


def generate_brief(
    data_path: Path | str = DATA,
    *,
    rng: Callable[[], float] = random.random,
    today: _dt.date | None = None,
) -> str:
    """Return the micro brief or an informative status message."""

    path = Path(data_path)
    if not path.exists():
        return "Missing projects.json"

    with path.open("r", encoding="utf-8") as source:
        data = json.load(source)

    projects: Sequence[Project] = data.get("projects", [])  # type: ignore[assignment]
    choice = pick_one(projects, rng=rng)
    if not choice:
        return "No unblocked tasks found. Unblock something small and rerun."

    _, project, goal, task = choice
    return micro_brief(project, goal, task, today=today)


def main() -> None:
    """Entry point when used as a script."""

    print(generate_brief())


if __name__ == "__main__":  # pragma: no cover - CLI helper
    main()
