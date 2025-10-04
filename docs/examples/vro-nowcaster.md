# VRO Nowcaster Example

The following Python module implements a Kalman-based nowcaster for 30-day variance (VRO). It fuses replication, futures, and microstructure pin signals with adaptive measurement noise handling for the pin input.

```python
from __future__ import annotations
import numpy as np
from dataclasses import dataclass, field


def _arr(x):
    return np.array(x, dtype=float)


def _ridge_eye(n=1, eps=1e-12):
    I = np.eye(n)
    I *= eps
    return I


@dataclass
class VRO_Nowcaster:
    """
    Local-level Kalman nowcaster for 30-day variance (VRO).
    Observers:
      1) y_rep  -> replication (spot options)
      2) y_fut  -> mapped VIX futures (carry/basis adjusted before calling update)
      3) y_pin  -> microstructure pin/flow heuristic
    Adaptive measurement noise gates the pin by health + SNR.
    Returns estimate, CI, and attribution shares per tick.
    """

    # State x_t: scalar variance proxy; A = 1 (local level)
    x_hat: np.ndarray = field(init=False)  # shape (1,1)
    P: np.ndarray = field(init=False)  # shape (1,1)

    A: np.ndarray = field(default_factory=lambda: _arr([[1.0]]))
    H: np.ndarray = field(default_factory=lambda: _arr([[1.0], [1.0], [1.0]]))
    Q: np.ndarray = field(default_factory=lambda: _arr([[0.05**2]]))  # process noise

    # Base measurement noise (variances) in healthy markets
    base_R11_rep: float = 0.10**2
    base_R22_fut: float = 0.20**2
    base_R33_pin: float = 0.50**2

    # Optional: scale Q with market regime (set externally via set_process_noise_scale)
    _q_scale: float = 1.0

    def __init__(self, initial_state: float, initial_variance: float = 1.0):
        self.x_hat = _arr([[initial_state]])
        self.P = _arr([[initial_variance]])
        self.A = _arr([[1.0]])
        self.H = _arr([[1.0], [1.0], [1.0]])
        self.Q = _arr([[0.05**2]])  # tune with realized volatility of VRO updates
        self.base_R11_rep = 0.10**2
        self.base_R22_fut = 0.20**2
        self.base_R33_pin = 0.50**2
        self._q_scale = 1.0

    def set_process_noise_scale(self, q_scale: float):
        """Allow runtime scaling of Q (stormy vs calm tapes)."""
        self._q_scale = max(1e-6, float(q_scale))

    def _adaptive_R33(self, pin_snr: float, pin_health: bool) -> float:
        if not pin_health:
            return 1e6  # ignore pin entirely
        # downweight pin as SNR falls (variance up)
        return self.base_R33_pin / max(1e-6, float(pin_snr))

    def update(
        self,
        y_rep: float,
        y_fut: float,
        y_pin: float,
        pin_snr: float = 1.0,
        pin_health: bool = True,
    ) -> dict:
        # 1) Predict
        x_pred = self.A @ self.x_hat
        P_pred = self.A @ self.P @ self.A.T + (self.Q * self._q_scale)

        # 2) Measurement covariance (adaptive)
        R = np.diag(
            [
                self.base_R11_rep,
                self.base_R22_fut,
                self._adaptive_R33(pin_snr, pin_health),
            ]
        )

        # 3) Update
        y = _arr([[y_rep], [y_fut], [y_pin]])
        innov = y - self.H @ x_pred
        S = self.H @ P_pred @ self.H.T + R + _ridge_eye(3, 1e-12)  # numeric ridge
        K = P_pred @ self.H.T @ np.linalg.inv(S)

        upd = K @ innov
        self.x_hat = x_pred + upd

        I = np.eye(self.P.shape[0])
        self.P = (I - K @ self.H) @ P_pred
        # enforce symmetry + PSD floor
        self.P = 0.5 * (self.P + self.P.T)
        self.P[0, 0] = max(self.P[0, 0], 1e-12)

        # 4) Attribution
        total = float(upd[0, 0])
        contribs = np.array(
            [
                float(K[0, 0] * innov[0, 0]),
                float(K[0, 1] * innov[1, 0]),
                float(K[0, 2] * innov[2, 0]),
            ],
            dtype=float,
        )

        if abs(total) > 1e-9:
            shares = contribs / total
            # clip tiny pathologies, renormalize on meaningful moves
            shares = np.clip(shares, -2.0, 2.0)
            if abs(total) > 1e-4:
                ssum = shares.sum()
                shares = shares / (ssum if abs(ssum) > 1e-12 else 1.0)
        else:
            shares = np.zeros(3, dtype=float)

        vro = float(self.x_hat[0, 0])
        std = float(np.sqrt(self.P[0, 0]))
        return {
            "vro_estimate": vro,
            "vro_std_dev": std,
            "confidence_upper": vro + 1.96 * std,
            "confidence_lower": vro - 1.96 * std,
            "attribution": {
                "replication": float(shares[0]),
                "futures": float(shares[1]),
                "pin": float(shares[2]),
            },
            "kalman_gain": K.flatten().tolist(),
        }
```
