"""Sizing helpers for risk managed trading strategies."""

from __future__ import annotations

from .configs import RiskBudget


def position_size(bps_budget: RiskBudget, stop_distance: float, notional: float) -> float:
    """Return the position size given a risk budget and stop distance.

    Parameters
    ----------
    bps_budget:
        The risk capital available, expressed in basis points.
    stop_distance:
        The distance between the entry price and the protective stop in the
        instrument's price units.
    notional:
        The total notional value of the position.
    """

    risk_amt = bps_budget.fraction * notional
    if stop_distance <= 0:
        return 0.0
    return max(0.0, risk_amt / stop_distance)
