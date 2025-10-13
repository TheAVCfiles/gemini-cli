"""Configuration primitives for the Glissé engine."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class GlisseConfig:
    """Runtime parameters for :class:`GlisseEngine`.

    The defaults follow the values referenced in the Balanchine notes from
    ``docs/integration-tests.md``.  They express the integrity gate, deadline
    adjustment rules, and trading risk cap.
    """

    structure_threshold: float = 85.0
    """Minimum structural conviction before the engine can arm."""

    perm_probability_cap: float = 0.05
    """Maximum allowable permanence probability (p-value)."""

    epsilon: float = 0.75
    """Maximum distance from ``Angle90`` for arming in price units."""

    base_deadline: int = 4
    """Baseline traversal window in ticks."""

    tri_expand_threshold: float = 4.5
    """TRI* level that stretches the traversal deadline by one tick."""

    tau_compress_threshold: float = -7.0
    """Adverse τ* level that compresses the traversal deadline by one tick."""

    deadline_min: int = 2
    """Lower bound for the elastic deadline."""

    deadline_max: int = 12
    """Upper bound for the elastic deadline."""

    cap_bps: float = 50.0
    """Risk cap in basis points (50 bps by default)."""

    adverse_tau_cutoff: float = -7.0
    """τ* level that immediately disarms the sequence."""

    price_invalid_tolerance: float = 0.0
    """Tolerance before a price drop invalidates an armed sequence."""
