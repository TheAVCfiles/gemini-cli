"""Lightweight tactile texture classification pipeline.

This script simulates tactile afferent responses for a selection of
textures, extracts envelope and spiking statistics, and trains two
baseline classifiers.  It is tuned for a fast, low-resource run so it can
be executed inside documentation builds or small CI jobs without timing
out.
"""
from __future__ import annotations

import pathlib
from dataclasses import dataclass

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


@dataclass
class SimulationConfig:
    """Configuration for a light-weight tactile simulation run."""

    fs: int = 1_000
    duration_s: float = 1.0
    grid_n: int = 6
    samples_per_label: int = 20
    random_seed: int = 11
    dataset_path: pathlib.Path = pathlib.Path("/mnt/data/tactile_dataset_small.csv")


def fft_band_filter(x: np.ndarray, fs: int, low: float | None = None, high: float | None = None) -> np.ndarray:
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


def envelope(x: np.ndarray, fs: int, cutoff: float = 20) -> np.ndarray:
    rect = np.abs(x)
    return fft_band_filter(rect, fs, low=None, high=cutoff)


def lif_spikes(
    input_current: np.ndarray,
    fs: int,
    *,
    gain: float = 1.0,
    tau_m: float = 0.02,
    v_rest: float = 0.0,
    v_reset: float = 0.0,
    v_thresh: float = 1.0,
    refrac_ms: float = 3.0,
) -> np.ndarray:
    refrac = int(refrac_ms * 1e-3 * fs)
    v = v_rest
    spikes = np.zeros_like(input_current, dtype=bool)
    refr = 0
    alpha = np.exp(-1 / (tau_m * fs))
    for i, current in enumerate(input_current):
        if refr > 0:
            v = v_reset
            refr -= 1
        else:
            v = alpha * v + (1 - alpha) * (v_rest + gain * current)
            if v >= v_thresh:
                spikes[i] = True
                v = v_reset
                refr = refrac
    return spikes


def simulate_receptors(signal: np.ndarray, config: SimulationConfig, rng: np.random.Generator) -> dict[str, object]:
    fs = config.fs

    merkel = fft_band_filter(signal, fs, low=None, high=5)
    meissner = fft_band_filter(signal, fs, low=10, high=50)
    pacinian = fft_band_filter(signal, fs, low=150, high=300)
    ruffini = fft_band_filter(signal, fs, low=None, high=2)

    envs = {
        "Merkel": envelope(merkel, fs, cutoff=10),
        "Meissner": envelope(meissner, fs, cutoff=50),
        "Pacinian": envelope(pacinian, fs, cutoff=300),
        "Ruffini": envelope(ruffini, fs, cutoff=5),
    }

    receptor_types = np.array(["Merkel", "Meissner", "Pacinian", "Ruffini"])
    total_receptors = config.grid_n * config.grid_n
    receptor_types = np.tile(receptor_types, total_receptors // 4 + 1)[:total_receptors]
    rng.shuffle(receptor_types)
    gains = rng.uniform(0.8, 1.2, size=total_receptors)

    spike_trains = np.empty((total_receptors, len(signal)), dtype=bool)
    for i, receptor_type in enumerate(receptor_types):
        env = envs[receptor_type]
        spike_trains[i] = lif_spikes(env, fs, gain=gains[i])

    return {
        "receptor_types": receptor_types,
        "spikes": spike_trains,
        "envs": envs,
    }


def gen_texture_signal(label: str, config: SimulationConfig, rng: np.random.Generator) -> tuple[np.ndarray, np.ndarray]:
    fs = config.fs
    t = np.arange(0, config.duration_s, 1 / fs)
    signal = 0.02 * rng.standard_normal(len(t))

    if label == "silk":
        f = rng.uniform(15, 25)
        amp = rng.uniform(0.2, 0.5)
        mod = 0.3 + 0.2 * np.sin(2 * np.pi * rng.uniform(0.1, 0.3) * t + rng.uniform(0, 2 * np.pi))
        signal += amp * mod * np.sin(2 * np.pi * f * t)

    elif label == "sandpaper":
        for _ in range(rng.integers(2, 4)):
            center = rng.uniform(0.2, config.duration_s - 0.2)
            width = rng.uniform(0.02, 0.06)
            burst = np.exp(-0.5 * ((t - center) / width) ** 2) * rng.uniform(0.4, 0.9)
            noise = rng.standard_normal(len(t))
            noise = fft_band_filter(noise, fs, low=20, high=250)
            signal += burst * noise
        signal += 0.05 * fft_band_filter(rng.standard_normal(len(t)), fs, low=150, high=400)

    elif label == "plastic":
        f = rng.uniform(60, 100)
        amp = rng.uniform(0.3, 0.7)
        wob = 0.6 + 0.4 * np.sin(2 * np.pi * rng.uniform(0.2, 0.6) * t)
        signal += amp * wob * np.sin(2 * np.pi * f * t)

    elif label == "metal":
        f = rng.uniform(220, 300)
        q = rng.uniform(0.8, 1.2)
        base = np.sin(2 * np.pi * f * t)
        env = 0.4 + 0.6 * np.exp(-t * q)
        signal += env * base
        center = rng.uniform(0.4, config.duration_s - 0.2)
        width = rng.uniform(0.01, 0.03)
        ping = np.exp(-0.5 * ((t - center) / width) ** 2)
        signal += 0.6 * ping * np.sin(2 * np.pi * f * t)

    elif label == "skin":
        taps = np.zeros_like(t)
        for _ in range(rng.integers(3, 6)):
            center = rng.uniform(0.2, config.duration_s - 0.2)
            width = rng.uniform(0.015, 0.04)
            taps += np.exp(-0.5 * ((t - center) / width) ** 2) * rng.uniform(0.3, 0.7)
        flutter_f = rng.uniform(20, 40)
        flutter = 0.2 * np.sin(2 * np.pi * flutter_f * t)
        signal += taps + flutter

    else:
        raise ValueError(f"Unknown texture label: {label}")

    slow = 0.3 * (0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(0.2, 0.6) * t + rng.uniform(0, 2 * np.pi)))
    signal += slow
    return t, signal


def extract_features(sim_result: dict[str, object]) -> dict[str, float]:
    envs = sim_result["envs"]
    spikes = sim_result["spikes"]
    receptor_types = sim_result["receptor_types"]

    features: dict[str, float] = {}
    for receptor, env in envs.items():
        env_sq = env**2
        features[f"{receptor}_E_mean"] = float(np.mean(env_sq))
        features[f"{receptor}_E_var"] = float(np.var(env_sq))

    for receptor in ("Merkel", "Meissner", "Pacinian", "Ruffini"):
        mask = receptor_types == receptor
        spk = spikes[mask]
        rate = float(spk.mean())
        counts = spk.sum(axis=1) + 1e-6
        fano = float(np.var(counts) / np.mean(counts))
        features[f"{receptor}_spike_rate"] = rate
        features[f"{receptor}_fano"] = fano

    eps = 1e-6
    features["Meissner_over_Merkel"] = features["Meissner_E_mean"] / (features["Merkel_E_mean"] + eps)
    features["Pacinian_over_Merkel"] = features["Pacinian_E_mean"] / (features["Merkel_E_mean"] + eps)
    features["Ruffini_over_Merkel"] = features["Ruffini_E_mean"] / (features["Merkel_E_mean"] + eps)

    return features


def build_dataset(config: SimulationConfig) -> pd.DataFrame:
    rng = np.random.default_rng(config.random_seed)
    labels = ["silk", "sandpaper", "plastic", "metal", "skin"]
    rows: list[dict[str, float | str]] = []

    for label in labels:
        for _ in range(config.samples_per_label):
            _, signal = gen_texture_signal(label, config, rng)
            sim = simulate_receptors(signal, config, rng)
            features = extract_features(sim)
            features["label"] = label
            rows.append(features)

    return pd.DataFrame(rows)


def train_models(df: pd.DataFrame, config: SimulationConfig) -> None:
    X = df.drop(columns=["label"]).values
    y = df["label"].values
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    logreg = LogisticRegression(max_iter=2_000, multi_class="multinomial")
    logreg.fit(X_train_s, y_train)
    y_pred_lr = logreg.predict(X_test_s)
    acc_lr = float(accuracy_score(y_test, y_pred_lr))

    rf = RandomForestClassifier(n_estimators=200, random_state=42)
    rf.fit(X_train, y_train)
    y_pred_rf = rf.predict(X_test)
    acc_rf = float(accuracy_score(y_test, y_pred_rf))

    fig, axs = plt.subplots(1, 2, figsize=(12, 4))
    ConfusionMatrixDisplay.from_predictions(y_test, y_pred_lr, ax=axs[0], colorbar=False)
    axs[0].set_title(f"LogReg Confusion (acc={acc_lr:.2f})")
    ConfusionMatrixDisplay.from_predictions(y_test, y_pred_rf, ax=axs[1], colorbar=False)
    axs[1].set_title(f"RandomForest Confusion (acc={acc_rf:.2f})")
    fig.tight_layout()
    fig.savefig("tactile_confusion_matrices.png", dpi=150)

    importances = rf.feature_importances_
    feat_names = df.drop(columns=["label"]).columns
    idx = np.argsort(importances)[::-1][:12]

    plt.figure(figsize=(8, 4))
    plt.bar(range(len(idx)), importances[idx])
    plt.xticks(range(len(idx)), feat_names[idx], rotation=60, ha="right")
    plt.title("Top RF Feature Importances")
    plt.tight_layout()
    plt.savefig("tactile_feature_importances.png", dpi=150)

    print(f"LogReg acc: {acc_lr:.3f}")
    print(f"RandomForest acc: {acc_rf:.3f}")
    print("\nLogistic Regression report:\n")
    print(classification_report(y_test, y_pred_lr))
    print("\nRandom Forest report:\n")
    print(classification_report(y_test, y_pred_rf))
    print("Artifacts ready:")
    print(f"- Dataset (small): {config.dataset_path}")
    print("- Confusion matrices: tactile_confusion_matrices.png")
    print("- Feature importances: tactile_feature_importances.png")


def main() -> None:
    config = SimulationConfig()
    df = build_dataset(config)
    df.to_csv(config.dataset_path, index=False)
    print(
        f"Dataset: {df.shape[0]} samples, {df.shape[1] - 1} features → {config.dataset_path}"
    )
    train_models(df, config)


if __name__ == "__main__":
    main()
