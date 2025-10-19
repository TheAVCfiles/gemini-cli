"""Tests for the :mod:`one_thing_today` helpers."""

from __future__ import annotations

import json
import tempfile
import unittest
from datetime import date, datetime
from pathlib import Path

from one_thing_today import (
    generate_brief,
    log_done,
    micro_brief,
    pick_one,
    score,
)


class ScoreTests(unittest.TestCase):
    def test_blocked_task_returns_negative_score(self) -> None:
        self.assertEqual(score({"blocked": True}), -1.0)

    def test_score_defaults_to_one_when_fields_missing(self) -> None:
        self.assertEqual(score({}), 1.0)

    def test_score_uses_effort_floor(self) -> None:
        task = {"impact": 5, "urgency": 2, "effort": 0.2}
        self.assertEqual(score(task), 10.0)


class PickOneTests(unittest.TestCase):
    def test_pick_one_returns_highest_scoring_task(self) -> None:
        projects = [
            {
                "name": "Project A",
                "goal": "Ship v1",
                "tasks": [
                    {"title": "Low", "impact": 1, "urgency": 1, "effort": 3},
                    {"title": "High", "impact": 5, "urgency": 3, "effort": 2},
                ],
            }
        ]

        result = pick_one(projects)
        assert result is not None
        _, project, goal, task = result

        self.assertEqual(project, "Project A")
        self.assertEqual(goal, "Ship v1")
        self.assertEqual(task["title"], "High")

    def test_pick_one_uses_rng_to_break_ties(self) -> None:
        values = iter([0.1, 0.9])

        def fake_rng() -> float:
            return next(values)

        projects = [
            {
                "name": "Tie Break",
                "goal": "Decide",
                "tasks": [
                    {"title": "First", "impact": 2, "urgency": 2, "effort": 2},
                    {"title": "Second", "impact": 2, "urgency": 2, "effort": 2},
                ],
            }
        ]

        result = pick_one(projects, rng=fake_rng)
        assert result is not None
        self.assertEqual(result[3]["title"], "Second")

    def test_pick_one_returns_none_when_no_candidates(self) -> None:
        projects = [
            {
                "name": "Blocked",
                "goal": "Wait",
                "tasks": [
                    {"title": "Blocked", "impact": 3, "urgency": 2, "effort": 2, "blocked": True}
                ],
            }
        ]

        self.assertIsNone(pick_one(projects))


class MicroBriefTests(unittest.TestCase):
    def test_micro_brief_formats_expected_sections(self) -> None:
        task = {"title": "Draft README"}
        brief = micro_brief("Gemini CLI", "Improve docs", task, today=date(2024, 1, 2))

        self.assertIn("ONE THING TODAY  —  2024-01-02", brief)
        self.assertIn("Project: Gemini CLI", brief)
        self.assertIn("Task:    Draft README", brief)
        self.assertIn("First keystrokes", brief)


class LogDoneTests(unittest.TestCase):
    def test_log_done_appends_timestamped_entry(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            log_path = Path(tmpdir) / "progress.log"
            stamp = datetime(2024, 5, 1, 8, 30)

            log_done("Project X", "Task Y", log_path=log_path, timestamp=stamp)

            with log_path.open() as handle:
                line = handle.read().strip()

        self.assertEqual(line, "2024-05-01T08:30:00\tProject X\tTask Y")


class GenerateBriefTests(unittest.TestCase):
    def _make_projects_file(self, tmp_path: Path, data: dict[str, object]) -> Path:
        path = tmp_path / "projects.json"
        path.write_text(json.dumps(data), encoding="utf-8")
        return path

    def test_generate_brief_returns_status_when_missing_file(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            missing_path = Path(tmpdir) / "projects.json"
            self.assertEqual(generate_brief(missing_path), "Missing projects.json")

    def test_generate_brief_handles_no_unblocked_tasks(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            projects_path = self._make_projects_file(
                Path(tmpdir),
                {
                    "projects": [
                        {
                            "name": "Zeta",
                            "goal": "Launch",
                            "tasks": [
                                {
                                    "title": "Blocked",
                                    "impact": 3,
                                    "urgency": 2,
                                    "effort": 1,
                                    "blocked": True,
                                }
                            ],
                        }
                    ]
                },
            )

            self.assertEqual(
                generate_brief(projects_path),
                "No unblocked tasks found. Unblock something small and rerun.",
            )

    def test_generate_brief_returns_formatted_block(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            projects_path = self._make_projects_file(
                Path(tmpdir),
                {
                    "projects": [
                        {
                            "name": "Gemini CLI",
                            "goal": "Ship MVP",
                            "tasks": [
                                {
                                    "title": "Draft docs",
                                    "impact": 4,
                                    "urgency": 3,
                                    "effort": 2,
                                }
                            ],
                        }
                    ]
                },
            )

            output = generate_brief(projects_path, today=date(2024, 1, 3))

        self.assertIn("ONE THING TODAY", output)
        self.assertIn("Gemini CLI", output)
        self.assertIn("Draft docs", output)


if __name__ == "__main__":
    unittest.main()
