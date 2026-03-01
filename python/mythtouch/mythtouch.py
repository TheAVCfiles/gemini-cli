"""Utilities for generating synthetic tactile texture signals.

This module implements a light-weight tactile simulation inspired by the
``mythtouch`` project.  It provides three high-level helpers:

``gen_texture_signal``
    Produce a one-dimensional vibration signal for a requested texture.
``simulate_receptors``
    Expand the vibration into a small spatial grid of mechanoreceptor responses.
``extract_features``
    Derive tabular summary features that can feed classical ML pipelines.

The implementation favours readability and determinism over physical
accuracy—it is intended for quick experimentation and to power the dataset
scripts that accompany this repository.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Tuple

import numpy as np

# ---------------------------------------------------------------------------
# Texture definitions
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class TextureSpec:
    """Parametrisation for a synthetic texture signal."""

    base_freq: float
    harmonic_freqs: Tuple[float, float]
    amplitude: float
    harmonic_ratio: Tuple[float, float]
    mod_freq: float
    mod_depth: float
    noise: float
    burst_chance: float
    burst_scale: float


TEXTURE_PARAMS: Dict[str, TextureSpec] = {
    "silk": TextureSpec(
        base_freq=12.0,
        harmonic_freqs=(24.0, 48.0),
        amplitude=0.6,
        harmonic_ratio=(0.35, 0.15),
        mod_freq=1.5,
        mod_depth=0.08,
        noise=0.01,
        burst_chance=0.02,
        burst_scale=0.2,
    ),
    "sandpaper": TextureSpec(
        base_freq=28.0,
        harmonic_freqs=(56.0, 112.0),
        amplitude=0.9,
        harmonic_ratio=(0.5, 0.25),
        mod_freq=3.5,
        mod_depth=0.2,
        noise=0.06,
        burst_chance=0.12,
        burst_scale=0.8,
    ),
    "plastic": TextureSpec(
        base_freq=18.0,
        harmonic_freqs=(36.0, 54.0),
        amplitude=0.75,
        harmonic_ratio=(0.4, 0.18),
        mod_freq=2.4,
        mod_depth=0.12,
        noise=0.03,
        burst_chance=0.05,
        burst_scale=0.35,
    ),
    "metal": TextureSpec(
        base_freq=70.0,
        harmonic_freqs=(140.0, 210.0),
        amplitude=0.7,
        harmonic_ratio=(0.3, 0.22),
        mod_freq=1.2,
        mod_depth=0.05,
        noise=0.015,
        burst_chance=0.01,
        burst_scale=0.1,
    ),
    "skin": TextureSpec(
        base_freq=8.0,
        harmonic_freqs=(16.0, 32.0),
        amplitude=0.55,
        harmonic_ratio=(0.25, 0.1),
        mod_freq=1.0,
        mod_depth=0.18,
        noise=0.025,
        burst_chance=0.03,
        burst_scale=0.25,
    ),
}


# ---------------------------------------------------------------------------
# Signal generation helpers
# ---------------------------------------------------------------------------


def _rng(instance: np.random.Generator | None) -> np.random.Generator:
    return instance if instance is not None else np.random.default_rng()


def gen_texture_signal(
    texture: str,
    *,
    fs: int = 1_000,
    T: float = 1.0,
    rng: np.random.Generator | None = None,
) -> Tuple[np.ndarray, np.ndarray]:
    """Generate a synthetic vibration signal for a named texture."""

    if texture not in TEXTURE_PARAMS:
        raise KeyError(f"Unknown texture '{texture}'. Expected one of {sorted(TEXTURE_PARAMS)}.")

    rng = _rng(rng)
    spec = TEXTURE_PARAMS[texture]

    n = max(1, int(fs * T))
    t = np.linspace(0.0, T, n, endpoint=False)

    # Base sinusoidal components with harmonic structure.
    phases = rng.uniform(0.0, 2.0 * np.pi, size=3)
    signal = spec.amplitude * np.sin(2.0 * np.pi * spec.base_freq * t + phases[0])
    for idx, freq in enumerate(spec.harmonic_freqs):
        amp = spec.amplitude * spec.harmonic_ratio[idx]
        signal += amp * np.sin(2.0 * np.pi * freq * t + phases[idx + 1])

    # Slow modulation to mimic varying contact pressure.
    modulation = 1.0 + spec.mod_depth * np.sin(2.0 * np.pi * spec.mod_freq * t + phases[0] / 2.0)
    signal *= modulation

    # Random impulsive bursts to encode roughness/texture asperities.
    if spec.burst_chance > 0:
        mask = rng.random(n) < spec.burst_chance
        burst = rng.normal(0.0, spec.burst_scale, size=n)
        signal += mask * burst

    # Broadband noise component.
    signal += rng.normal(0.0, spec.noise, size=n)

    # Normalise to a bounded range for stability.
    peak = np.max(np.abs(signal))
    if peak > 1.0:
        signal = signal / peak

    return t, signal


# ---------------------------------------------------------------------------
# Spatial receptor simulation
# ---------------------------------------------------------------------------


def simulate_receptors(
    signal: np.ndarray,
    *,
    fs: int = 1_000,
    grid_n: int = 6,
    rng: np.random.Generator | None = None,
) -> Dict[str, np.ndarray]:
    """Simulate a grid of mechanoreceptors responding to the vibration."""

    rng = _rng(rng)

    if signal.ndim != 1:
        raise ValueError("signal must be a 1-D array")

    n_points = signal.shape[0]
    receptor_count = max(1, grid_n * grid_n)
    responses = np.empty((receptor_count, n_points), dtype=np.float64)

    times = np.arange(n_points) / float(fs)

    for idx in range(receptor_count):
        # Each receptor has a slightly different spatial filter and tuning.
        decay = rng.uniform(0.003, 0.03)
        kernel_len = max(1, int(decay * fs))
        window = np.exp(-np.linspace(-1.0, 1.0, kernel_len) ** 2 / 0.25)
        window /= window.sum()
        filtered = np.convolve(signal, window, mode="same")

        # Temporal modulation differences between receptors.
        mod_freq = rng.uniform(3.0, 40.0)
        mod_phase = rng.uniform(0.0, 2.0 * np.pi)
        modulation = 1.0 + 0.05 * np.sin(2.0 * np.pi * mod_freq * times + mod_phase)
        receptor_signal = filtered * modulation

        noise_scale = 0.02 * np.maximum(1e-6, np.std(signal))
        noise = rng.normal(0.0, noise_scale, size=n_points)
        responses[idx] = receptor_signal + noise

    return {
        "responses": responses,
        "grid_n": grid_n,
        "fs": fs,
    }


# ---------------------------------------------------------------------------
# Feature extraction
# ---------------------------------------------------------------------------


def _spectral_features(data: np.ndarray, fs: int) -> Tuple[float, float, float, float, float]:
    # Compute FFT magnitude spectrum.
    spectrum = np.abs(np.fft.rfft(data))
    freqs = np.fft.rfftfreq(data.size, 1.0 / fs)
    power = spectrum ** 2
    power_sum = power.sum() + 1e-12

    centroid = float((freqs * power).sum() / power_sum)

    cumulative = np.cumsum(power)
    rolloff_threshold = 0.85 * power_sum
    idx = np.searchsorted(cumulative, rolloff_threshold)
    idx = min(idx, freqs.size - 1)
    rolloff = float(freqs[idx])

    # Band energies (normalised by total power).
    low_mask = freqs < 40.0
    mid_mask = (freqs >= 40.0) & (freqs < 120.0)
    high_mask = freqs >= 120.0
    low_energy = float((power[low_mask].sum() / power_sum) if low_mask.any() else 0.0)
    mid_energy = float((power[mid_mask].sum() / power_sum) if mid_mask.any() else 0.0)
    high_energy = float((power[high_mask].sum() / power_sum) if high_mask.any() else 0.0)

    return centroid, rolloff, low_energy, mid_energy, high_energy


def extract_features(sim_data: Dict[str, np.ndarray], *, fs: int = 1_000) -> Dict[str, float]:
    """Convert simulated receptor responses into tabular features."""

    responses = np.asarray(sim_data["responses"], dtype=np.float64)
    if responses.ndim != 2:
        raise ValueError("sim_data['responses'] must be a 2-D array")

    global_signal = responses.mean(axis=0)

    mean = float(global_signal.mean())
    std = float(global_signal.std())
    energy = float(np.mean(global_signal ** 2))

    centered = global_signal - global_signal.mean()
    std_eps = std if std > 1e-12 else 1e-12
    skewness = float(np.mean((centered / std_eps) ** 3))
    kurtosis = float(np.mean((centered / std_eps) ** 4) - 3.0)

    spatial_var = responses.var(axis=0)
    temporal_var = responses.var(axis=1)

    centroid, rolloff, low_band, mid_band, high_band = _spectral_features(global_signal, fs)

    diff = np.diff(np.signbit(global_signal))
    zero_crossings = float(np.count_nonzero(diff))
    zero_cross_rate = zero_crossings / (global_signal.size / fs)

    features = {
        "mean_response": mean,
        "std_response": std,
        "energy_response": energy,
        "skew_response": skewness,
        "kurtosis_response": kurtosis,
        "spatial_var_mean": float(spatial_var.mean()),
        "spatial_var_std": float(spatial_var.std()),
        "temporal_var_mean": float(temporal_var.mean()),
        "temporal_var_std": float(temporal_var.std()),
        "spectral_centroid": centroid,
        "spectral_rolloff": rolloff,
        "band_energy_low": low_band,
        "band_energy_mid": mid_band,
        "band_energy_high": high_band,
        "zero_cross_rate": float(zero_cross_rate),
    }

    return features
