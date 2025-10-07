"""Utilities for building human-readable cue narration logs.

The ballet execution prototypes referenced throughout the analytics
runbooks emit discrete "cues" as the state machine advances through the
routine.  The lightweight :class:`Narrator` helper in this module makes it
trivial to collect those cues and render them as a structured text block
that can be diffed in tests or shared in post-mortems.

Example
-------
>>> narrator = Narrator()
>>> narrator.emit("2024-05-07T16:32:11Z", "PREP", "JETÉ", "GLITCH_CONFIRM", "Glitch confirm (wick)")
>>> narrator.as_text()
'[2024-05-07T16:32:11Z] STATE: PREP -> JETÉ | CUE: GLITCH_CONFIRM | NARRATION: Glitch confirm (wick)'

The implementation intentionally avoids any third-party dependencies so
that it can be reused by quick investigative notebooks as well as the
repository's more formal regression tests.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Iterable, Iterator, List

__all__ = ["Cue", "Narrator"]


@dataclass(frozen=True, slots=True)
class Cue:
    """A single narrated cue emitted by the execution state machine."""

    ts: str
    state_from: str
    state_to: str
    cue: str
    text: str

    def render(self) -> str:
        """Return the cue formatted as a single log line."""

        return (
            f"[{self.ts}] STATE: {self.state_from} -> {self.state_to} | "
            f"CUE: {self.cue} | NARRATION: {self.text}"
        )


class Narrator:
    """Collect and render cue transitions for debugging and tests."""

    def __init__(self, *, formatter: Callable[[Cue], str] | None = None) -> None:
        self._log: List[Cue] = []
        self._formatter: Callable[[Cue], str] = formatter or Cue.render

    def emit(self, ts: str, state_from: str, state_to: str, cue: str, text: str) -> None:
        """Record a new cue transition."""

        self._log.append(Cue(ts, state_from, state_to, cue, text))

    def extend(self, cues: Iterable[Cue]) -> None:
        """Append an iterable of cues to the narration log."""

        for cue in cues:
            if not isinstance(cue, Cue):
                raise TypeError("extend() expected an iterable of Cue instances")
            self._log.append(cue)

    def clear(self) -> None:
        """Remove all recorded cues."""

        self._log.clear()

    def __iter__(self) -> Iterator[Cue]:
        return iter(self._log)

    def __len__(self) -> int:
        return len(self._log)

    def as_text(self, *, separator: str = "\n") -> str:
        """Render the narration log as a newline separated string."""

        return separator.join(self._formatter(cue) for cue in self._log)
