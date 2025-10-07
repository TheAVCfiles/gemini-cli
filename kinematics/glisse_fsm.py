"""Finite-state machine for managing Glissé trade sequencing.

This module encodes the minimal control flow that appears throughout the
integration notes in :mod:`docs/integration-tests.md`.  The original version
of the FSM lived in a notebook and had a subtle bug in the ``coda`` handler –
it logged the wrong source state when finishing a trade because it overwrote
``self.state`` before narrating the transition.  The lightweight
implementation below fixes that regression while also providing small helper
dataclasses so the behaviour can be tested in isolation inside this
repository.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum, auto
from typing import List


@dataclass(frozen=True)
class DeadlineWindow:
    """Deadline configuration used for the elastic countdown."""

    D0: int
    min_D: int
    max_D: int


@dataclass(frozen=True)
class EngineConfig:
    """Configuration bundle required by :class:`GlisseFSM`."""

    structure_min: float
    deadlines: DeadlineWindow


@dataclass(frozen=True)
class Regime:
    tri: float
    tau_star: float


@dataclass(frozen=True)
class StructureSignal:
    score: float


@dataclass(frozen=True)
class GlitchSignal:
    wick: bool = False
    divergence: bool = False
    lob: bool = False

    def confirmed(self) -> bool:  # pragma: no cover - trivial delegation
        return self.wick or self.divergence or self.lob


@dataclass(frozen=True)
class VolSignal:
    spike: bool


@dataclass
class Narration:
    ts: str
    from_state: str
    to_state: str
    cue: str
    message: str


@dataclass
class Narrator:
    """Collects narration events emitted by the FSM."""

    events: List[Narration] = field(default_factory=list)

    def emit(self, ts: str, from_state: str, to_state: str, cue: str, message: str) -> None:
        self.events.append(Narration(ts, from_state, to_state, cue, message))


class State(Enum):
    IDLE = auto()
    PREP = auto()
    JETE = auto()
    FERMATA = auto()
    CODA_PROFIT = auto()
    CODA_STOP = auto()
    CORPS_RESET = auto()


def elastic_deadline(cfg: EngineConfig, regime: Regime) -> int:
    """Compute the elastic deadline based on structure/volatility regime."""

    D = cfg.deadlines.D0
    if regime.tri >= 4.5:
        D += 1
    if regime.tau_star <= -7:
        D -= 1
    return max(cfg.deadlines.min_D, min(cfg.deadlines.max_D, D))


class GlisseFSM:
    """Minimal state machine that emits narration for Glissé trade flow."""

    def __init__(self, cfg: EngineConfig, narrator: Narrator) -> None:
        self.cfg = cfg
        self.state = State.IDLE
        self.n = narrator
        self.deadline_ticks = 0

    def glissade(self, ts: str, structure: StructureSignal, regime: Regime) -> None:
        if structure.score >= self.cfg.structure_min:
            self.state = State.PREP
            self.deadline_ticks = elastic_deadline(self.cfg, regime)
            self.n.emit(
                ts,
                "IDLE",
                "PREP",
                "Glissade",
                f"Structure {structure.score}≥{self.cfg.structure_min}. Elastic D={self.deadline_ticks} ticks.",
            )

    def scan_glitch(self, ts: str, glitch: GlitchSignal) -> None:
        if self.state == State.PREP:
            if glitch.confirmed():
                self.state = State.JETE
                self.n.emit(
                    ts,
                    "PREP",
                    "JETE",
                    "Jeté (Glitch Confirm)",
                    "Entry fired: glitch confirmed (wick/divergence/LOB).",
                )
            else:
                self.deadline_ticks -= 1
                self.n.emit(
                    ts,
                    "PREP",
                    "PREP",
                    "Glitch_Scan",
                    f"Awaiting glitch. {max(0, self.deadline_ticks)} ticks left.",
                )
                if self.deadline_ticks <= 0:
                    self.state = State.CORPS_RESET
                    self.n.emit(
                        ts,
                        "PREP",
                        "CORPS_RESET",
                        "Negate",
                        "Deadline expired. Setup invalidated.",
                    )

    def handle_vol(self, ts: str, vol: VolSignal) -> None:
        if self.state == State.JETE and vol.spike:
            self.state = State.FERMATA
            self.n.emit(ts, "JETE", "FERMATA", "Fermata", "Volatility spike—deadline paused.")
        elif self.state == State.FERMATA and not vol.spike:
            self.state = State.JETE
            self.n.emit(ts, "FERMATA", "JETE", "Release", "Volatility subsided—resuming.")

    def coda(self, ts: str, profit: bool) -> None:
        if self.state in (State.JETE, State.FERMATA):
            origin_state = self.state
            coda_state = State.CODA_PROFIT if profit else State.CODA_STOP
            cue = "Coda"
            msg = (
                "Target reached. Closed for profit."
                if profit
                else "Stop hit. Closed for loss."
            )

            self.state = coda_state
            self.n.emit(ts, origin_state.name, coda_state.name, cue, msg)

            self.state = State.CORPS_RESET
            self.n.emit(ts, coda_state.name, State.CORPS_RESET.name, "Corps Reset", "Flattened; back to IDLE.")
