"""Unit tests for the :mod:`cue_narrator` helpers."""

from __future__ import annotations

import unittest

from cue_narrator import Cue, Narrator


class NarratorTests(unittest.TestCase):
    def test_emit_creates_renderable_log(self) -> None:
        narrator = Narrator()
        narrator.emit("2024-05-07T16:32:11Z", "PREP", "JETÉ", "GLITCH_CONFIRM", "Glitch confirm (wick)")

        expected = "[2024-05-07T16:32:11Z] STATE: PREP -> JETÉ | CUE: GLITCH_CONFIRM | NARRATION: Glitch confirm (wick)"
        self.assertEqual(narrator.as_text(), expected)
        self.assertEqual(len(narrator), 1)

    def test_extend_accepts_existing_cues(self) -> None:
        cues = [
            Cue("00:00", "PREP", "PREP", "GLISSADE", "Structure 88/100, prepping."),
            Cue("00:05", "PREP", "JETÉ", "GLITCH_CONFIRM", "Glitch confirm (wick)."),
        ]
        narrator = Narrator()
        narrator.extend(cues)

        self.assertEqual(len(narrator), 2)
        self.assertEqual(narrator.as_text(separator=" | "), " | ".join(cue.render() for cue in cues))

    def test_custom_formatter(self) -> None:
        narrator = Narrator(formatter=lambda cue: f"[{cue.ts}] {cue.cue}")
        narrator.emit("00:01", "PREP", "FERMATA", "PAUSE", "Hold position.")

        self.assertEqual(narrator.as_text(), "[00:01] PAUSE")


if __name__ == "__main__":
    unittest.main()
