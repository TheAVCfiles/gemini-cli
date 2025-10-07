"""Pydantic models describing kinematics configuration primitives."""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field, ConfigDict, model_validator


class StrictModel(BaseModel):
    """Base model that forbids extra / unknown fields."""

    model_config = ConfigDict(extra="forbid")


class SG(StrictModel):
    """Savitzky–Golay parameters for smoothing/derivatives."""

    window: int = Field(..., gt=2, description="Odd window length; > order")
    order: int = Field(..., ge=1, description="Polynomial order (>=1 and < window)")

    @model_validator(mode="after")
    def _validate(self) -> "SG":
        if self.window % 2 == 0:
            raise ValueError("sg.window must be odd")
        if self.order >= self.window:
            raise ValueError("sg.order must be < sg.window")
        # Numeric stability guardrails for streaming bars
        if self.window < 7:
            raise ValueError("sg.window must be >= 7 for noisy 1m bars")
        if self.order > 3:
            raise ValueError("sg.order > 3 is rarely stable for streaming kinematics")
        return self


class ZThresh(StrictModel):
    """Z-score thresholds for enter/exit logic."""

    v1: float = Field(..., description="velocity-1 z threshold")
    v2: float = Field(..., description="velocity-2 z threshold")
    a: float = Field(..., description="acceleration z threshold")


class PhysicsModelConfigModel(StrictModel):
    """Core kinematics / detection configuration."""

    sampling_interval_s: float = Field(
        ..., gt=0, description="Bar duration in seconds (e.g., 60.0 for 1m)"
    )
    baseline_window_short: int = Field(..., gt=10, description="Short baseline length (bars)")
    baseline_window_long: int = Field(..., gt=10, description="Long baseline length (bars)")

    sg_pos: SG
    sg_vel: SG
    sg_accel: SG

    z_enter: ZThresh
    z_exit: ZThresh

    m_persist: int = Field(2, ge=1, le=10, description="State persistence in bars")
    ssi_crit: float = Field(9.0, gt=0, description="Systemic stress index cutoff")

    max_ticks_default: int = Field(4, ge=2, le=10, description="Default traversal budget (ticks)")
    max_ticks_stressed: Optional[int] = Field(
        None, ge=2, le=12, description="Optional stressed budget; if None, compute from rules"
    )

    thresholds_positive: bool = Field(
        True,
        description=(
            "If True, z thresholds are non-negative and compared by <=; else use |z|"
        ),
    )

    mode: Literal["physics", "balanchine"] = Field(
        "physics", description="Controls deadline logic downstream"
    )

    @model_validator(mode="after")
    def _relations(self) -> "PhysicsModelConfigModel":
        if not (self.baseline_window_short < self.baseline_window_long):
            raise ValueError("baseline_window_short must be < baseline_window_long")

        if self.thresholds_positive:
            for label, value in (
                ("z_enter.v1", self.z_enter.v1),
                ("z_enter.v2", self.z_enter.v2),
                ("z_enter.a", self.z_enter.a),
                ("z_exit.v1", self.z_exit.v1),
                ("z_exit.v2", self.z_exit.v2),
                ("z_exit.a", self.z_exit.a),
            ):
                if value < 0:
                    raise ValueError(
                        f"{label} must be non-negative when thresholds_positive=True"
                    )
            ok = (
                self.z_exit.v1 <= self.z_enter.v1
                and self.z_exit.v2 <= self.z_enter.v2
                and self.z_exit.a <= self.z_enter.a
            )
        else:
            ok = (
                abs(self.z_exit.v1) <= abs(self.z_enter.v1)
                and abs(self.z_exit.v2) <= abs(self.z_enter.v2)
                and abs(self.z_exit.a) <= abs(self.z_enter.a)
            )
        if not ok:
            raise ValueError(
                "z_exit must be less stringent than z_enter (apply component-wise; "
                "abs() if thresholds_positive=False)"
            )

        if self.max_ticks_stressed is not None and self.max_ticks_stressed < self.max_ticks_default - 1:
            raise ValueError("max_ticks_stressed must be >= max_ticks_default - 1")

        return self

    def effective_deadline(self, tri_score: float, tau_star: float) -> int:
        """Compute traversal deadline ticks based on mode & regime."""

        base = int(self.max_ticks_default)
        if self.mode == "physics":
            return base

        bump = 0
        if tri_score >= 4.5:
            bump += 1
        if tau_star <= -7.0:
            bump -= 1

        deadline = base + bump
        if self.max_ticks_stressed is not None and bump > 0:
            deadline = min(deadline, self.max_ticks_stressed)
        return max(2, min(12, deadline))


__all__ = [
    "PhysicsModelConfigModel",
    "SG",
    "StrictModel",
    "ZThresh",
]

