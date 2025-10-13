"""Utilities for combining market structure, glitch, and volatility signals.

This module provides small dataclasses that mirror the signal payloads
produced by the experimental "Glissé" trading notebooks documented in
``docs/integration-tests.md``.  The helpers intentionally keep business
rules lightweight so that downstream scripts (for example ``regime_writer``)
can reuse the same validation logic without pulling in heavier
dependencies.

Example
-------
>>> structure = StructureSignal(score=90)
>>> glitch = GlitchSignal(wick_rejection=True)
>>> vol = VolSignal(spike=False)
>>> decision = evaluate_regime(
...     structure,
...     tau_ci_excludes_zero=True,
...     perm_p_value=0.02,
...     glitch=glitch,
...     vol=vol,
... )
>>> decision.gate_open
True
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Iterable, List


@dataclass(frozen=True)
class StructureSignal:
    """Structural confirmation score expressed on a 0-100 scale.

    The notebooks and CSV payloads that feed the live runner clamp the
    structural weight to the inclusive ``[0, 100]`` range.  Guarding the
    range here prevents subtle bugs where out-of-band values silently make it
    into the downstream JSON artefacts.
    """

    score: int  # structural weight 0..100

    def __post_init__(self) -> None:  # pragma: no cover - dataclass hook
        if not 0 <= int(self.score) <= 100:
            raise ValueError("structure score must be within [0, 100]")


@dataclass(frozen=True)
class GlitchSignal:
    """Intraday micro-structure confirmations used by the Glissé engine."""

    wick_rejection: bool = False
    micro_divergence: bool = False
    lob_imbalance: bool = False

    def confirmed(self) -> bool:
        return self.wick_rejection or self.micro_divergence or self.lob_imbalance


@dataclass(frozen=True)
class VolSignal:
    """Lightweight volatility gate flag."""

    spike: bool = False


@dataclass(frozen=True)
class RegimeDecision:
    """Normalized result emitted by :func:`evaluate_regime`."""

    gate_open: bool
    tap_weight: int
    risk_budget_bps: int
    reasons: List[str] = field(default_factory=list)
    diagnostics: Dict[str, bool] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, object]:
        """Serialize the decision for logging or JSON output."""

        payload: Dict[str, object] = {
            "gate_open": self.gate_open,
            "tap_weight": self.tap_weight,
            "risk_budget_bps": self.risk_budget_bps,
        }
        if self.reasons:
            payload["reasons"] = list(self.reasons)
        if self.diagnostics:
            payload["diagnostics"] = dict(self.diagnostics)
        return payload


def structure_bucket(
    structure: StructureSignal, *, strong: int = 85, watch: int = 70
) -> str:
    """Return a coarse label describing the structure score.

    Parameters
    ----------
    structure:
        Structural signal containing the score.
    strong:
        Threshold for a *strong* confirmation.
    watch:
        Lower boundary for a *watch* bucket.  Anything below this value is
        considered *weak*.
    """

    if strong <= watch:
        raise ValueError("'strong' threshold must exceed 'watch' threshold")

    if structure.score >= strong:
        return "strong"
    if structure.score >= watch:
        return "watch"
    return "weak"


def _make_reasons(flags: Iterable[tuple[bool, str]]) -> List[str]:
    return [label for condition, label in flags if not condition]


def evaluate_regime(
    structure: StructureSignal,
    *,
    tau_ci_excludes_zero: bool,
    perm_p_value: float,
    glitch: GlitchSignal | None = None,
    vol: VolSignal | None = None,
    structure_threshold: int = 85,
    p_value_threshold: float = 0.05,
    fallback_tap_weight: int = 90,
    watch_threshold: int = 70,
    open_risk_budget_bps: int = 50,
    closed_risk_budget_bps: int = 5,
) -> RegimeDecision:
    """Combine structural, statistical, and volatility signals.

    The helper mirrors the gating checklist documented in
    ``docs/examples/territory-scaling.md`` and ``docs/integration-tests.md``.
    ``structure_threshold`` and ``p_value_threshold`` default to the
    playbook's recommended values but can be tuned by callers during
    experiments.
    """

    if structure_threshold > 100 or structure_threshold < 0:
        raise ValueError("structure_threshold must be within [0, 100]")
    if watch_threshold < 0:
        raise ValueError("watch_threshold must be non-negative")
    if perm_p_value < 0 or perm_p_value > 1:
        raise ValueError("perm_p_value must be within [0, 1]")

    struct_ok = structure.score >= structure_threshold
    tau_ok = bool(tau_ci_excludes_zero)
    p_ok = perm_p_value <= p_value_threshold
    vol_ok = not (vol.spike if vol else False)
    glitch_confirmed = bool(glitch.confirmed() if glitch else False)

    gate_open = struct_ok and tau_ok and p_ok and vol_ok

    diagnostics = {
        "structure_ok": struct_ok,
        "tau_ci_ok": tau_ok,
        "perm_p_ok": p_ok,
        "vol_ok": vol_ok,
        "glitch_confirmed": glitch_confirmed,
        "structure_bucket": structure_bucket(
            structure, strong=structure_threshold, watch=watch_threshold
        ),
    }

    reasons = _make_reasons(
        [
            (struct_ok, "structure_below_threshold"),
            (tau_ok, "tau_ci_includes_zero"),
            (p_ok, "perm_p_above_threshold"),
            (vol_ok, "vol_spike"),
        ]
    )

    tap_weight = structure.score if struct_ok else fallback_tap_weight

    risk_budget = open_risk_budget_bps if gate_open else closed_risk_budget_bps

    return RegimeDecision(
        gate_open=gate_open,
        tap_weight=int(tap_weight),
        risk_budget_bps=int(risk_budget),
        reasons=reasons,
        diagnostics=diagnostics,
    )

