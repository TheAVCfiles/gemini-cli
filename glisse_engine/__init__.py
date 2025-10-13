"""Glissé Engine — Balanchine Cipher Prototype.

This module implements a narratable finite state controller that mirrors the
IDLE→PREP→JETÉ→FERMATA→CODA progression described in the project notes.  The
engine focuses on three core ideas:

* **Elastic deadlines** – every transition can be annotated with a soft timing
  window that tolerates early or late arrivals while still recording the
  deviation for audit purposes.
* **Glitch gating** – invalid or out‑of‑sequence transitions are rejected and
  logged with an explanation so downstream tooling can surface the anomaly.
* **Narrated transitions** – each accepted transition is summarised in natural
  language to make the choreography easy to inspect from logs or diagnostics.

The implementation is intentionally dependency-light so that it can be reused
from scripting environments as well as from larger orchestration workflows.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, Iterable, List, Literal, Optional

TransitionKind = Literal["transition", "glitch", "reset"]


class GlisseState(str, Enum):
    """Enumeration of the engine states.

    The string values preserve the accent present in the original documentation
    so that narratives read naturally.
    """

    IDLE = "IDLE"
    PREP = "PREP"
    JETE = "JETÉ"
    FERMATA = "FERMATA"
    CODA = "CODA"


@dataclass(frozen=True)
class ElasticDeadlineSpec:
    """Specification for an elastic deadline.

    Parameters
    ----------
    duration:
        Target duration in seconds between two transitions.
    tolerance:
        Fractional tolerance that widens the acceptable window.  A tolerance of
        ``0.2`` means the arrival may drift ±20% around the target duration.
    """

    duration: float
    tolerance: float = 0.0

    def materialise(self, *, start: float) -> ElasticDeadline:
        """Convert the specification into a concrete window."""

        if self.duration <= 0:
            raise ValueError("ElasticDeadlineSpec.duration must be positive")
        if self.tolerance < 0:
            raise ValueError("ElasticDeadlineSpec.tolerance cannot be negative")
        return ElasticDeadline(start=start, duration=self.duration, tolerance=self.tolerance)


@dataclass(frozen=True)
class ElasticDeadline:
    """Concrete elastic deadline anchored to a start timestamp."""

    start: float
    duration: float
    tolerance: float = 0.0

    @property
    def target(self) -> float:
        return self.start + self.duration

    @property
    def slack(self) -> float:
        return self.duration * self.tolerance

    @property
    def earliest(self) -> float:
        return max(self.start, self.target - self.slack)

    @property
    def latest(self) -> float:
        return self.target + self.slack

    def classify(self, actual: float) -> tuple[str, float]:
        """Return ``(status, delta)`` for an observed timestamp.

        ``status`` is one of ``"on-time"``, ``"early"`` or ``"late"`` and
        ``delta`` measures the signed deviation from the target time.
        """

        delta = actual - self.target
        if actual < self.earliest:
            return "early", delta
        if actual > self.latest:
            return "late", delta
        return "on-time", delta

    def describe(self, status: str, delta: float) -> str:
        """Generate a human-readable description of the deadline outcome."""

        window = f"[{self.earliest:.3f}, {self.latest:.3f}]s"
        target = f"{self.target:.3f}s"
        delta_text = f"{delta:+.3f}s"
        if status == "on-time":
            return f"arrived on-time ({delta_text} vs target {target}) inside elastic window {window}"
        qualifier = "early" if status == "early" else "late"
        drift = abs(delta)
        return (
            f"arrived {qualifier} ({drift:.3f}s {'ahead of' if qualifier == 'early' else 'past'} target {target}); "
            f"elastic window {window}"
        )

    def as_dict(self) -> Dict[str, float]:
        return {
            "start": self.start,
            "target": self.target,
            "earliest": self.earliest,
            "latest": self.latest,
            "tolerance": self.tolerance,
            "duration": self.duration,
        }


@dataclass
class TimelineEntry:
    """Narrated event emitted by the Glissé engine."""

    kind: TransitionKind
    timestamp: float
    message: str
    from_state: GlisseState
    to_state: Optional[GlisseState]
    reason: str
    deadline_status: Optional[str] = None
    deadline: Optional[ElasticDeadline] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def as_dict(self) -> Dict[str, Any]:
        payload = {
            "kind": self.kind,
            "timestamp": self.timestamp,
            "message": self.message,
            "from_state": self.from_state.value,
            "to_state": self.to_state.value if self.to_state else None,
            "reason": self.reason,
        }
        if self.deadline_status is not None:
            payload["deadline_status"] = self.deadline_status
        if self.deadline is not None:
            payload["deadline"] = self.deadline.as_dict()
        if self.metadata:
            payload["metadata"] = self.metadata
        return payload


class GlisseEngine:
    """Finite-state controller with narrated transitions and glitch gating."""

    _ORDER: List[GlisseState] = [
        GlisseState.IDLE,
        GlisseState.PREP,
        GlisseState.JETE,
        GlisseState.FERMATA,
        GlisseState.CODA,
    ]

    _TRANSITIONS = {
        GlisseState.IDLE: GlisseState.PREP,
        GlisseState.PREP: GlisseState.JETE,
        GlisseState.JETE: GlisseState.FERMATA,
        GlisseState.FERMATA: GlisseState.CODA,
    }

    def __init__(self, *, origin: float = 0.0) -> None:
        self._state = GlisseState.IDLE
        self._last_timestamp = float(origin)
        self._history: List[TimelineEntry] = []

    @property
    def state(self) -> GlisseState:
        return self._state

    @property
    def history(self) -> List[TimelineEntry]:
        """Return a copy of the narrated timeline."""

        return list(self._history)

    def _next_state(self) -> Optional[GlisseState]:
        return self._TRANSITIONS.get(self._state)

    def _log_event(
        self,
        *,
        kind: TransitionKind,
        timestamp: float,
        from_state: GlisseState,
        to_state: Optional[GlisseState],
        reason: str,
        message: str,
        deadline_status: Optional[str] = None,
        deadline: Optional[ElasticDeadline] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        entry = TimelineEntry(
            kind=kind,
            timestamp=timestamp,
            from_state=from_state,
            to_state=to_state,
            reason=reason,
            message=message,
            deadline_status=deadline_status,
            deadline=deadline,
            metadata=dict(metadata or {}),
        )
        self._history.append(entry)

    def _log_glitch(
        self,
        *,
        to_state: GlisseState,
        timestamp: float,
        reason: str,
        issues: Iterable[str],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        issue_text = "; ".join(issues)
        message = (
            f"Glitch gate at t={timestamp:.3f}s during {self._state.value}→{to_state.value}: {issue_text}."
        )
        extra = dict(metadata or {})
        extra.setdefault("glitch_issues", list(issues))
        self._log_event(
            kind="glitch",
            timestamp=timestamp,
            from_state=self._state,
            to_state=to_state,
            reason=reason,
            message=message,
            metadata=extra,
        )

    def advance(
        self,
        to_state: GlisseState,
        *,
        timestamp: float,
        reason: str,
        deadline: Optional[ElasticDeadlineSpec] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Attempt to progress to ``to_state``.

        Returns ``True`` if the transition is accepted.  When a transition is
        rejected the engine remains in the current state and a glitch narrative
        is emitted.
        """

        timestamp = float(timestamp)
        issues: List[str] = []

        if timestamp < self._last_timestamp:
            drift = self._last_timestamp - timestamp
            issues.append(f"timeline regressed by {drift:.3f}s")

        expected = self._next_state()
        if expected is None:
            issues.append("no forward transition available from CODA; reset required")
        elif to_state != expected:
            issues.append(f"expected {expected.value}")

        if issues:
            self._log_glitch(to_state=to_state, timestamp=timestamp, reason=reason, issues=issues, metadata=metadata)
            return False

        realised_deadline: Optional[ElasticDeadline] = None
        deadline_status: Optional[str] = None
        entry_metadata = dict(metadata or {})

        if deadline is not None:
            realised_deadline = deadline.materialise(start=self._last_timestamp)
            deadline_status, delta = realised_deadline.classify(timestamp)
            entry_metadata.setdefault("deadline_delta", delta)
            deadline_summary = realised_deadline.describe(deadline_status, delta)
        else:
            deadline_summary = "no deadline provided"

        message = (
            f"{self._state.value}→{to_state.value} at t={timestamp:.3f}s because {reason}"
        )
        if realised_deadline is not None:
            message = f"{message}; {deadline_summary}."
        else:
            message = f"{message}; {deadline_summary}."

        self._log_event(
            kind="transition",
            timestamp=timestamp,
            from_state=self._state,
            to_state=to_state,
            reason=reason,
            message=message,
            deadline_status=deadline_status,
            deadline=realised_deadline,
            metadata=entry_metadata,
        )

        self._state = to_state
        self._last_timestamp = timestamp
        return True

    def reset(
        self,
        *,
        timestamp: float,
        reason: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Reset the controller back to ``IDLE`` with a narrated event."""

        timestamp = float(timestamp)
        if timestamp < self._last_timestamp:
            drift = self._last_timestamp - timestamp
            self._log_glitch(
                to_state=self._state,
                timestamp=timestamp,
                reason=reason,
                issues=[f"reset attempted with timeline regression of {drift:.3f}s"],
                metadata=metadata,
            )
            return False

        message = (
            f"Reset at t={timestamp:.3f}s: returning from {self._state.value} to IDLE because {reason}."
        )
        self._log_event(
            kind="reset",
            timestamp=timestamp,
            from_state=self._state,
            to_state=GlisseState.IDLE,
            reason=reason,
            message=message,
            metadata=metadata,
        )
        self._state = GlisseState.IDLE
        self._last_timestamp = timestamp
        return True


__all__ = [
    "ElasticDeadline",
    "ElasticDeadlineSpec",
    "GlisseEngine",
    "GlisseState",
    "TimelineEntry",
]

