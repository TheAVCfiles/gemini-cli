"""AURE regulation spine for gating risky actions.

This module exposes the Adaptive Unified Regulation Engine (AURE) as a simple
state machine you can import into StagePort, the Evolution Engine, or any other
runtime that needs reversible-by-default guardrails when AURA spikes.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Optional


class AureMode(str, Enum):
    BASELINE = "BASELINE"
    MAINTENANCE = "MAINTENANCE"
    OVERWHELM = "OVERWHELM"
    RESTORE = "RESTORE"


@dataclass
class DualFieldReading:
    aura_load: float
    somatic_flag: bool
    operator_override: Optional[AureMode] = None


@dataclass
class AureState:
    mode: AureMode
    sovereign_gap: float
    reversible_only: bool
    throttle_factor: float


class AureRegulator:
    """Adaptive Unified Regulation Engine.

    Feed it AURA and somatic readings; it returns a policy describing how
    reversible the system must be and how hard to throttle automation.
    """

    def __init__(self, mode: AureMode = AureMode.BASELINE) -> None:
        self.mode = mode

    def step(self, reading: DualFieldReading) -> AureState:
        aura = max(0.0, min(1.0, reading.aura_load))

        # 1. Operator override (only down-shift allowed)
        if reading.operator_override is not None:
            self.mode = self._respect_downshift(
                current=self.mode, requested=reading.operator_override
            )

        # 2. Automatic mode transitions
        if self.mode == AureMode.BASELINE:
            if aura > 0.7:
                self.mode = AureMode.MAINTENANCE

        elif self.mode == AureMode.MAINTENANCE:
            if aura < 0.4:
                self.mode = AureMode.BASELINE
            elif aura > 0.85 or reading.somatic_flag:
                self.mode = AureMode.OVERWHELM

        elif self.mode == AureMode.OVERWHELM:
            if aura < 0.6 and not reading.somatic_flag:
                self.mode = AureMode.RESTORE

        elif self.mode == AureMode.RESTORE:
            if aura < 0.45 and not reading.somatic_flag:
                self.mode = AureMode.BASELINE

        # 3. Output policy per mode
        if self.mode == AureMode.BASELINE:
            throttle = 1.0
            reversible_only = False
            gap = 0.9
        elif self.mode == AureMode.MAINTENANCE:
            throttle = 0.65
            reversible_only = False
            gap = 0.7
        elif self.mode == AureMode.OVERWHELM:
            throttle = 0.15
            reversible_only = True
            gap = 0.25
        else:  # RESTORE
            throttle = 0.4
            reversible_only = True
            gap = 0.5

        return AureState(
            mode=self.mode,
            sovereign_gap=gap,
            reversible_only=reversible_only,
            throttle_factor=throttle,
        )

    @staticmethod
    def _respect_downshift(current: AureMode, requested: AureMode) -> AureMode:
        order = [
            AureMode.OVERWHELM,
            AureMode.RESTORE,
            AureMode.MAINTENANCE,
            AureMode.BASELINE,
        ]
        idx_cur = order.index(current)
        idx_req = order.index(requested)
        # You can only move "down" (toward BASELINE)
        return order[min(idx_req, idx_cur)]


__all__ = [
    "AureMode",
    "DualFieldReading",
    "AureState",
    "AureRegulator",
]
