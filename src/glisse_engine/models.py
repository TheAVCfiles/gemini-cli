"""Dataclasses and enumerations used by the Glissé engine."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Mapping, MutableMapping, Optional


class State(str, Enum):
    """Internal state machine for the engine."""

    IDLE = "IDLE"
    PREP = "PREP"
    JETE = "JETÉ"
    FERMATA = "FERMATA"


class Cue(str, Enum):
    """Narrated cue emitted by the controller."""

    GLISSADE = "GLISSADE"
    GLITCH_SCAN = "GLITCH_SCAN"
    JETE = "JETÉ"
    FERMATA = "FERMATA"
    CODA_PROFIT = "CODA_PROFIT"
    CORPS_RESET = "CORPS_RESET"
    DISARM = "DISARM"


@dataclass(slots=True)
class GlisseInputs:
    """Snapshot of sensor inputs supplied to :class:`GlisseEngine.step`."""

    price: float
    angle_90: float
    structure: float
    ci_excludes_zero: bool = True
    perm_p: float = 0.02
    ticks_left: int = 0
    glitch_signals: Mapping[str, bool] = field(default_factory=dict)
    tri: float = 0.0
    tau_star: float = 0.0
    target_hit: bool = False
    negate: bool = False
    regime_open: bool = True

    def __post_init__(self) -> None:  # pragma: no cover - trivial guard
        # Ensure the mapping is safe to reuse downstream.
        if not isinstance(self.glitch_signals, MutableMapping):
            self.glitch_signals = dict(self.glitch_signals)


@dataclass(slots=True)
class GlisseEvent:
    """Structured event emitted by :class:`GlisseEngine`."""

    sequence: int
    state: State
    cue: Cue
    narration: str
    deadline: Optional[int] = None


def mk_inputs(**overrides: object) -> GlisseInputs:
    """Convenience helper mirroring the pseudo-code fixtures in the docs."""

    defaults = {
        "price": 0.0,
        "angle_90": 0.0,
        "structure": 0.0,
        "ci_excludes_zero": True,
        "perm_p": 0.02,
        "ticks_left": 0,
        "glitch_signals": {},
        "tri": 0.0,
        "tau_star": 0.0,
        "target_hit": False,
        "negate": False,
        "regime_open": True,
    }
    defaults.update(overrides)
    return GlisseInputs(**defaults)
