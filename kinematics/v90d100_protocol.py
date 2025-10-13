from dataclasses import dataclass
from typing import Dict, Optional, Any

import pandas as pd


@dataclass
class V90D100Protocol:
    mode: str = "physics"            # "physics" (strict 4/4) or "balanchine" (adaptive irregular)
    base_max_ticks: int = 4          # bars allowed from A90-cross to FTR baseline
    tri_threshold: float = 3.0
    comps_min: float = 1.0
    z_v1_min_physics: float = 0.5
    zv_2_min_physics: float = 0.5
    z_v1_min_balanchine: float = 0.3 # Balanchine is more tolerant to “off-beat” resolution
    zv_2_min_balanchine: float = 0.3

    armed: bool = False
    last_disarm_reason: Optional[str] = None
    arm_idx: Optional[int] = None
    arm_price: Optional[float] = None
    a90_level: Optional[float] = None
    prev_close: Optional[float] = None

    # ----- helpers -----
    def _eligible(self, tri: float, comps: Dict[str, float], tau_star: float) -> bool:
        comps_ok = all(v >= self.comps_min for v in (comps or {}).values())
        tri_ok = (tri is None) or (tri >= self.tri_threshold)
        tau_ok = (tau_star is None) or (tau_star < 0)  # short-bias: want negative tau regime
        return comps_ok and tri_ok and tau_ok

    def _ftr(self, a90: float) -> float:
        return (10.0 / 9.0) * float(a90)

    def _crossed_a90(self, last_close: float, a90: float) -> bool:
        # strict “true cross” using stored prev_close
        if self.prev_close is None:
            self.prev_close = last_close
            return False
        crossed = (self.prev_close < a90) and (last_close >= a90)
        self.prev_close = last_close
        return crossed

    def _kinematics(self, closes: pd.Series, a90: float):
        window = closes[-3:]
        diffs = window.diff().dropna()
        v1 = float(diffs.iloc[-1]) if len(diffs) else 0.0
        vmean = float(diffs.mean()) if len(diffs) else 0.0
        scale = max(1.0, abs(a90) * 0.001)
        return {"z_v1": v1/scale, "zv_2": vmean/scale}

    def _adaptive_max_ticks(self, vol_regime: str, structural_weight: Optional[float], tau_star: Optional[float]) -> int:
        """
        Balanchine timing window:
          - high vol → tighter (−1)
          - low vol  → looser (+2)
          - stronger |tau| → a bit more tolerance
          - higher structural weight → a bit tighter
        """
        m = self.base_max_ticks
        if vol_regime == "high":  m -= 1
        elif vol_regime == "low": m += 2

        if structural_weight is not None:
            # weight in [0..1]: strong conviction tightens by up to 1 bar
            m -= 1 if structural_weight >= 0.8 else 0

        if tau_star is not None:
            # stronger |tau| (e.g., <= -5) adds tolerance
            if tau_star <= -5:
                m += 1
            elif tau_star >= -1: # weaker regime, be stricter
                m -= 0

        return max(2, int(m))

    # ----- main check -----
    def check(self,
              df: pd.DataFrame,
              levels: Dict[str, float],
              tri: float,
              comps: Dict[str, float],
              tau_star: float,
              vol_regime: str = "mid",
              structural_weight: Optional[float] = None) -> Optional[Dict[str, Any]]:

        assert "close" in df.columns, "df must contain 'close'"
        closes = df["close"]
        last = float(closes.iloc[-1])
        a90 = float(levels["ang_90"])
        ftr = self._ftr(a90)

        # determine timing window
        if self.mode == "physics":
            max_ticks = self.base_max_ticks
            z_v1_min, zv_2_min = self.z_v1_min_physics, self.zv_2_min_physics
        else:  # "balanchine"
            max_ticks = self._adaptive_max_ticks(vol_regime, structural_weight, tau_star)
            z_v1_min, zv_2_min = self.z_v1_min_balanchine, self.zv_2_min_balanchine

        # arm on strict cross
        if (not self.armed) and self._eligible(tri, comps, tau_star) and self._crossed_a90(last, a90):
            self.armed = True
            self.last_disarm_reason = None
            self.arm_idx = len(closes) - 1
            self.arm_price = last
            self.a90_level = a90
            return None

        if self.armed:
            ticks = (len(closes) - 1) - (self.arm_idx or (len(closes)-1))

            # precedence: regime flip → loss of A90 → timing → fire
            if tau_star is not None and tau_star >= 0:
                self.armed = False
                self.last_disarm_reason = "Regime Disqualification (tau flipped non-negative)"
                return None

            if last < a90:
                self.armed = False
                self.last_disarm_reason = "Price fell below A90"
                return None

            if ticks >= max_ticks:
                self.armed = False
                self.last_disarm_reason = ("Timing Disqualification (A90→FTR too slow)"
                                           if self.mode == "physics"
                                           else "Adaptive Timing Disqualification")
                return None

            if last >= ftr:
                kin = self._kinematics(closes, a90)
                if (kin["z_v1"] > z_v1_min) or (kin["zv_2"] > zv_2_min):
                    self.armed = False
                    self.last_disarm_reason = "Signal Fired"
                    return {"status": "V90_D100_FADE_SHORT_TRIGGER", "price": last, **kin}
                else:
                    # physics: reject weak kinematics; balanchine: allow another bar to resolve
                    if self.mode == "physics":
                        self.armed = False
                        self.last_disarm_reason = "Kinematic Disqualification (insufficient acceleration)"
                        return None
                    else:
                        # In Balanchine mode we’re tolerant; no immediate disarm
                        return None

        return None
