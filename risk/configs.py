"""Configuration models used by the risk sizing helpers."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class RiskBudget:
    """Represent a budget expressed in basis points.

    Parameters
    ----------
    bps:
        The total amount of risk capital available, measured in basis points.
    """

    bps: float

    def __post_init__(self) -> None:
        object.__setattr__(self, "bps", float(self.bps))
        if self.bps < 0:
            raise ValueError("bps must be non-negative")

    @property
    def fraction(self) -> float:
        """Return the risk budget expressed as a fraction of notional."""

        return self.bps / 10_000.0
