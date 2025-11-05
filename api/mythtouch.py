"""Synthetic texture generation utilities for the mythtouch demo API."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Tuple

import numpy as np


@dataclass(frozen=True)
class TextureProfile:
    name: str
    partials: Tuple[Tuple[float, float], ...]
    modulation_hz: float
    noise_scale: float


_TEXTURE_LIBRARY: Dict[str, TextureProfile] = {
    "metal": TextureProfile(
        name="metal",
        partials=((30.0, 0.6), (120.0, 0.3), (260.0, 0.1)),
        modulation_hz=4.0,
        noise_scale=0.05,
    ),
    "silk": TextureProfile(
        name="silk",
        partials=((12.0, 0.5), (48.0, 0.25), (90.0, 0.1)),
        modulation_hz=2.0,
        noise_scale=0.02,
    ),
    "sandpaper": TextureProfile(
        name="sandpaper",
        partials=((18.0, 0.4), (75.0, 0.4), (220.0, 0.2)),
        modulation_hz=6.0,
        noise_scale=0.12,
    ),
    "plastic": TextureProfile(
        name="plastic",
        partials=((22.0, 0.45), (90.0, 0.25), (190.0, 0.15)),
        modulation_hz=3.0,
        noise_scale=0.04,
    ),
    "skin": TextureProfile(
        name="skin",
        partials=((15.0, 0.4), (55.0, 0.3), (130.0, 0.2)),
        modulation_hz=1.5,
        noise_scale=0.06,
    ),
}

_RECEPTOR_NAMES = ("Merkel", "Meissner", "Pacinian", "Ruffini")


def available_textures() -> List[str]:
    """Return the list of supported texture names."""
    return list(_TEXTURE_LIBRARY.keys())


def _ensure_rng(rng: np.random.Generator | None) -> np.random.Generator:
    return rng if rng is not None else np.random.default_rng()


def gen_texture_signal(
    texture: str,
    *,
    fs: int = 1000,
    T: float = 1.0,
    rng: np.random.Generator | None = None,
) -> Tuple[np.ndarray, np.ndarray]:
    """Generate a synthetic vibration signal for the requested texture."""
    if texture not in _TEXTURE_LIBRARY:
        raise ValueError(f"Unsupported texture '{texture}'.")

    rng = _ensure_rng(rng)
    profile = _TEXTURE_LIBRARY[texture]

    n_samples = max(1, int(fs * T))
    t = np.linspace(0.0, T, n_samples, endpoint=False)
    signal = np.zeros_like(t)

    # Sum a small bank of partials with random initial phases.
    for freq, amp in profile.partials:
        phase = rng.uniform(0, 2 * np.pi)
        signal += amp * np.sin(2 * np.pi * freq * t + phase)

    modulation_phase = rng.uniform(0, 2 * np.pi)
    envelope = 1.0 + 0.2 * np.sin(2 * np.pi * profile.modulation_hz * t + modulation_phase)
    signal *= envelope

    noise = rng.normal(scale=profile.noise_scale, size=n_samples)
    signal += noise

    return t, signal


def _moving_average(signal: np.ndarray, window: int) -> np.ndarray:
    window = max(1, int(window))
    kernel = np.ones(window, dtype=float) / float(window)
    return np.convolve(signal, kernel, mode="same")


def _moving_rms(signal: np.ndarray, window: int) -> np.ndarray:
    return np.sqrt(_moving_average(signal ** 2, window))


def simulate_receptors(
    signal: np.ndarray,
    *,
    fs: int = 1000,
    grid_n: int = 6,
    rng: np.random.Generator | None = None,
) -> Dict[str, np.ndarray]:
    """Generate coarse receptor envelope responses for the synthetic signal."""
    _ = grid_n  # grid density is not used in this toy simulation but kept for parity.
    rng = _ensure_rng(rng)

    # Slow adapting receptors favour low frequency envelopes.
    merkel = _moving_rms(signal, window=max(1, int(fs * 0.08)))
    ruffini = _moving_rms(_moving_average(signal, window=max(1, int(fs * 0.2))), window=max(1, int(fs * 0.12)))

    # Fast adapting receptors emphasise higher frequency content.
    highpassed = signal - _moving_average(signal, window=max(1, int(fs * 0.05)))
    meissner = _moving_rms(highpassed, window=max(1, int(fs * 0.02)))
    pacinian = _moving_rms(np.gradient(highpassed), window=max(1, int(fs * 0.01)))

    # Lightly randomise magnitudes to avoid ties.
    jitter = 1.0 + rng.normal(scale=0.01, size=(signal.shape[0], len(_RECEPTOR_NAMES)))
    envs = np.stack([merkel, meissner, pacinian, ruffini], axis=1) * jitter

    # Normalise per-receptor to the range [0, 1] for easier downstream comparisons.
    denom = np.maximum(envs.max(axis=0, keepdims=True), 1e-9)
    normed_envs = np.clip(envs / denom, 0.0, None)

    return {"envs": normed_envs, "receptors": _RECEPTOR_NAMES}


def timeseries_energies(
    envs: np.ndarray,
    *,
    fs: int = 1000,
    window_ms: int = 50,
) -> List[Dict[str, float]]:
    """Reduce receptor envelopes into per-window energy summaries."""
    if envs.ndim != 2 or envs.shape[1] != len(_RECEPTOR_NAMES):
        raise ValueError("Expected envs to have shape (N, 4).")

    window_samples = max(1, int(fs * window_ms / 1000))
    total_samples = envs.shape[0]
    results: List[Dict[str, float]] = []

    for start in range(0, total_samples, window_samples):
        end = min(start + window_samples, total_samples)
        segment = envs[start:end]
        if segment.size == 0:
            continue
        energies = segment.mean(axis=0)
        entry = {name: float(value) for name, value in zip(_RECEPTOR_NAMES, energies)}
        center_time = ((start + end) / 2.0) / fs
        entry["t_center"] = float(np.round(center_time, 4))
        entry["winner"] = _RECEPTOR_NAMES[int(np.argmax(energies))]
        results.append(entry)

    return results


__all__ = [
    "available_textures",
    "gen_texture_signal",
    "simulate_receptors",
    "timeseries_energies",
]
