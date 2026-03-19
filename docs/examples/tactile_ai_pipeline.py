"""Tactile AI dataset and classifier demo.

This script synthesizes tactile "textures", runs them through a simplified
mechanotransduction stack, extracts features, and trains a pair of simple
classifiers.  It mirrors the walkthrough documented in
``docs/examples/tactile-ai-pipeline.md``.

Usage
-----
Run the script with Python 3.10+ after installing the required packages::

    pip install numpy pandas matplotlib scikit-learn
    python docs/examples/tactile_ai_pipeline.py

Outputs
-------
- ``data/tactile_dataset.csv``: feature table suitable for reuse
- ``data/TACTILE_README.txt``: quick reference for the dataset layout
- Console summary with classifier scores and reports
- Two Matplotlib figures (confusion matrices + feature importances)
"""

from __future__ import annotations

from pathlib import Path
from typing import Dict, Iterable

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    ConfusionMatrixDisplay,
    accuracy_score,
    classification_report,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# --------------------------------------------------------------------------------------
# Utility helpers
# --------------------------------------------------------------------------------------

def fft_band_filter(x: np.ndarray, fs: float, low: float | None = None, high: float | None = None) -> np.ndarray:
    """Band-limit ``x`` using the FFT."""
    X = np.fft.rfft(x)
    freqs = np.fft.rfftfreq(len(x), 1 / fs)

    mask = np.ones_like(freqs, dtype=bool)
    if low is not None:
        mask &= freqs >= low
    if high is not None:
        mask &= freqs <= high

    Xf = np.zeros_like(X)
    Xf[mask] = X[mask]
    return np.fft.irfft(Xf, n=len(x))


def envelope(x: np.ndarray, fs: float, cutoff: float = 20) -> np.ndarray:
    """Return a low-pass envelope of ``x``."""
    rectified = np.abs(x)
    return fft_band_filter(rectified, fs, high=cutoff)


# --------------------------------------------------------------------------------------
# Mechanotransduction model
# --------------------------------------------------------------------------------------

def lif_spikes(
    input_current: np.ndarray,
    fs: float,
    gain: float = 1.0,
    tau_m: float = 0.02,
    v_rest: float = 0.0,
    v_reset: float = 0.0,
    v_thresh: float = 1.0,
    refrac_ms: float = 3.0,
) -> np.ndarray:
    """Leaky integrate-and-fire spike generator."""

    refrac = int(refrac_ms * 1e-3 * fs)
    spikes = np.zeros_like(input_current, dtype=bool)

    v = v_rest
    refr = 0
    alpha = np.exp(-1 / (tau_m * fs))

    for i, current in enumerate(input_current):
        if refr > 0:
            v = v_reset
            refr -= 1
            continue

        v = alpha * v + (1 - alpha) * (v_rest + gain * current)
        if v >= v_thresh:
            spikes[i] = True
            v = v_reset
            refr = refrac

    return spikes


def simulate_receptors(
    signal: np.ndarray,
    fs: float,
    grid_n: int = 8,
    rng: np.random.Generator | None = None,
) -> Dict[str, object]:
    """Simulate a small fingertip patch with four receptor types."""

    if rng is None:
        rng = np.random.default_rng()

    # Coarse frequency bands for the four receptor types.
    merkel = fft_band_filter(signal, fs, high=5)
    meissner = fft_band_filter(signal, fs, low=10, high=50)
    pacinian = fft_band_filter(signal, fs, low=150, high=300)
    ruffini = fft_band_filter(signal, fs, high=2)

    envs = {
        "Merkel": envelope(merkel, fs, cutoff=10),
        "Meissner": envelope(meissner, fs, cutoff=50),
        "Pacinian": envelope(pacinian, fs, cutoff=300),
        "Ruffini": envelope(ruffini, fs, cutoff=5),
    }

    types = np.array(["Merkel", "Meissner", "Pacinian", "Ruffini"])
    n_units = grid_n * grid_n
    receptor_types = np.tile(types, n_units // 4 + 1)[:n_units]
    rng.shuffle(receptor_types)
    gains = rng.uniform(0.8, 1.2, size=n_units)

    spike_trains = []
    for receptor_type, gain in zip(receptor_types, gains, strict=True):
        env = envs[receptor_type]
        spikes = lif_spikes(env, fs, gain=gain)
        spike_trains.append(spikes)

    return {
        "receptor_types": receptor_types,
        "spikes": np.asarray(spike_trains),
        "envs": envs,
    }


# --------------------------------------------------------------------------------------
# Texture generators
# --------------------------------------------------------------------------------------

def _slow_pressure_bias(t: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    return 0.3 * (0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(0.2, 0.6) * t + rng.uniform(0, 2 * np.pi)))


def _gaussian_burst(t: np.ndarray, center: float, width: float) -> np.ndarray:
    return np.exp(-0.5 * ((t - center) / width) ** 2)


def gen_texture_signal(label: str, fs: float, duration: float, rng: np.random.Generator) -> tuple[np.ndarray, np.ndarray]:
    """Create a synthetic tactile texture trace."""

    t = np.arange(0, duration, 1 / fs)
    signal = 0.02 * rng.standard_normal(len(t))

    if label == "silk":
        carrier = rng.uniform(15, 25)
        amplitude = rng.uniform(0.2, 0.5)
        mod = 0.3 + 0.2 * np.sin(2 * np.pi * rng.uniform(0.1, 0.3) * t + rng.uniform(0, 2 * np.pi))
        signal += amplitude * mod * np.sin(2 * np.pi * carrier * t)

    elif label == "sandpaper":
        for _ in range(rng.integers(3, 7)):
            center = rng.uniform(0.2, duration - 0.2)
            width = rng.uniform(0.02, 0.08)
            burst = _gaussian_burst(t, center, width) * rng.uniform(0.4, 0.9)
            noise = fft_band_filter(rng.standard_normal(len(t)), fs, low=20, high=250)
            signal += burst * noise
        signal += 0.05 * fft_band_filter(rng.standard_normal(len(t)), fs, low=150, high=400)

    elif label == "plastic":
        carrier = rng.uniform(60, 100)
        amplitude = rng.uniform(0.3, 0.7)
        wobble = 0.6 + 0.4 * np.sin(2 * np.pi * rng.uniform(0.2, 0.6) * t)
        signal += amplitude * wobble * np.sin(2 * np.pi * carrier * t)

    elif label == "metal":
        carrier = rng.uniform(220, 300)
        q = rng.uniform(0.8, 1.2)
        base = np.sin(2 * np.pi * carrier * t)
        envelope_base = 0.4 + 0.6 * np.exp(-t * q)
        signal += envelope_base * base
        center = rng.uniform(0.6, duration - 0.2)
        width = rng.uniform(0.01, 0.03)
        ping = _gaussian_burst(t, center, width)
        signal += 0.6 * ping * np.sin(2 * np.pi * carrier * t)

    elif label == "skin":
        taps = np.zeros_like(t)
        for _ in range(rng.integers(4, 8)):
            center = rng.uniform(0.2, duration - 0.2)
            width = rng.uniform(0.015, 0.04)
            taps += _gaussian_burst(t, center, width) * rng.uniform(0.3, 0.7)
        flutter = 0.2 * np.sin(2 * np.pi * rng.uniform(20, 40) * t)
        signal += taps + flutter

    else:
        msg = f"Unknown texture label: {label}"
        raise ValueError(msg)

    signal += _slow_pressure_bias(t, rng)
    return t, signal


# --------------------------------------------------------------------------------------
# Feature extraction
# --------------------------------------------------------------------------------------

def _fano_factor(counts: np.ndarray) -> float:
    return float(np.var(counts) / (np.mean(counts) + 1e-6))


def extract_features(sim_result: Dict[str, object], fs: float) -> Dict[str, float]:
    envs: Dict[str, np.ndarray] = sim_result["envs"]  # type: ignore[index]
    spikes: np.ndarray = sim_result["spikes"]  # type: ignore[index]
    receptor_types: np.ndarray = sim_result["receptor_types"]  # type: ignore[index]

    features: Dict[str, float] = {}

    for receptor, env in envs.items():
        energy = env**2
        features[f"{receptor}_E_mean"] = float(np.mean(energy))
        features[f"{receptor}_E_var"] = float(np.var(energy))

    for receptor in ["Merkel", "Meissner", "Pacinian", "Ruffini"]:
        mask = receptor_types == receptor
        spikes_for_type = spikes[mask]
        rate = float(spikes_for_type.mean())
        counts = spikes_for_type.sum(axis=1)
        features[f"{receptor}_spike_rate"] = rate
        features[f"{receptor}_fano"] = _fano_factor(counts)

    merkel_energy = features["Merkel_E_mean"] + 1e-6
    features["Meissner_over_Merkel"] = features["Meissner_E_mean"] / merkel_energy
    features["Pacinian_over_Merkel"] = features["Pacinian_E_mean"] / merkel_energy
    features["Ruffini_over_Merkel"] = features["Ruffini_E_mean"] / merkel_energy

    return features


# --------------------------------------------------------------------------------------
# Dataset builder + classifiers
# --------------------------------------------------------------------------------------

def build_dataset(labels: Iterable[str], samples_per_label: int, fs: float, duration: float, rng: np.random.Generator) -> pd.DataFrame:
    rows = []
    for label in labels:
        for _ in range(samples_per_label):
            _, signal = gen_texture_signal(label, fs, duration, rng)
            sim = simulate_receptors(signal, fs, grid_n=8, rng=rng)
            features = extract_features(sim, fs)
            features["label"] = label
            rows.append(features)
    return pd.DataFrame(rows)


def _ensure_data_dir() -> Path:
    data_dir = Path("data")
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir


def save_metadata(df: pd.DataFrame, labels: Iterable[str], target_dir: Path) -> None:
    readme_path = target_dir / "TACTILE_README.txt"
    with readme_path.open("w", encoding="utf-8") as handle:
        handle.write(
            "TACTILE DATASET\n"
            "----------------\n"
            f"File: {target_dir / 'tactile_dataset.csv'}\n"
            f"Samples: {df.shape[0]}  | Features: {df.shape[1] - 1}\n"
            f"Labels: {list(labels)}\n\n"
            "Columns groupings:\n"
            "- *_E_mean, *_E_var : band power features from receptor envelopes (Merkel, Meissner, Pacinian, Ruffini)\n"
            "- *_spike_rate, *_fano: spike statistics per receptor type\n"
            "- *_over_Merkel: cross-channel ratios (pressure-normalized vibration)\n\n"
            "Pipeline: texture->bands->envelopes->LIF spikes->features->classifier\n"
        )



def main() -> None:
    fs = 2000
    duration = 1.5
    labels = ["silk", "sandpaper", "plastic", "metal", "skin"]
    samples_per_label = 80

    rng = np.random.default_rng(7)

    print("Generating tactile dataset …")
    df = build_dataset(labels, samples_per_label, fs, duration, rng)

    data_dir = _ensure_data_dir()
    csv_path = data_dir / "tactile_dataset.csv"
    df.to_csv(csv_path, index=False)
    save_metadata(df, labels, data_dir)

    print(f"Dataset built: {df.shape[0]} samples, {df.shape[1] - 1} features. Saved to {csv_path}")

    X = df.drop(columns=["label"]).values
    y = df["label"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    logreg = LogisticRegression(max_iter=2000, multi_class="multinomial")
    logreg.fit(X_train_scaled, y_train)
    y_pred_lr = logreg.predict(X_test_scaled)
    acc_lr = accuracy_score(y_test, y_pred_lr)
    print(f"Logistic Regression accuracy: {acc_lr:.3f}")

    rf = RandomForestClassifier(n_estimators=300, random_state=42)
    rf.fit(X_train, y_train)
    y_pred_rf = rf.predict(X_test)
    acc_rf = accuracy_score(y_test, y_pred_rf)
    print(f"Random Forest accuracy: {acc_rf:.3f}")

    fig, axs = plt.subplots(1, 2, figsize=(12, 4))
    ConfusionMatrixDisplay.from_predictions(y_test, y_pred_lr, ax=axs[0], colorbar=False)
    axs[0].set_title(f"LogReg Confusion (acc={acc_lr:.2f})")
    ConfusionMatrixDisplay.from_predictions(y_test, y_pred_rf, ax=axs[1], colorbar=False)
    axs[1].set_title(f"RandomForest Confusion (acc={acc_rf:.2f})")
    plt.show()

    importances = rf.feature_importances_
    feature_names = df.drop(columns=["label"]).columns
    order = np.argsort(importances)[::-1][:15]

    plt.figure(figsize=(8, 5))
    plt.bar(range(len(order)), importances[order])
    plt.xticks(range(len(order)), feature_names[order], rotation=60, ha="right")
    plt.title("Top RF Feature Importances")
    plt.tight_layout()
    plt.show()

    print("\nLogistic Regression classification report:\n")
    print(classification_report(y_test, y_pred_lr))
    print("\nRandom Forest classification report:\n")
    print(classification_report(y_test, y_pred_rf))
    print(f"Saved README to {data_dir / 'TACTILE_README.txt'}")


if __name__ == "__main__":
    main()
