"""Generate a lighter tactile receptor dataset for quick experimentation.

This script simulates responses from mechanoreceptor populations to synthetic
textures. It is a trimmed-down version of a heavier workflow: fewer samples per
class and a smaller spatial grid reduce runtime so it can be executed within
sandbox limits.

Running the module will:
- Generate 20 samples for each of five texture labels.
- Simulate spike trains for a 6x6 grid of receptors.
- Save the resulting feature table as ``tactile_dataset_small.csv`` next to the
  script.
- Train & evaluate both logistic regression and random forest classifiers,
  displaying confusion matrices, feature importances, and classification
  reports.
"""

from __future__ import annotations

from pathlib import Path

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


def fft_band_filter(x: np.ndarray, fs: float, low: float | None = None, high: float | None = None) -> np.ndarray:
    """Apply a simple FFT band filter.

    Parameters
    ----------
    x : np.ndarray
        Input time-series.
    fs : float
        Sampling frequency in Hz.
    low : float | None
        Lower cutoff frequency. If ``None`` no lower bound is applied.
    high : float | None
        Upper cutoff frequency. If ``None`` no upper bound is applied.
    """

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
    """Compute a smoothed envelope of ``x`` using rectification + low-pass."""

    rect = np.abs(x)
    return fft_band_filter(rect, fs, low=None, high=cutoff)


def lif_spikes(
    input_current: np.ndarray,
    fs: float,
    *,
    gain: float = 1.0,
    tau_m: float = 0.02,
    v_rest: float = 0.0,
    v_reset: float = 0.0,
    v_thresh: float = 1.0,
    refrac_ms: float = 3.0,
) -> np.ndarray:
    """Simulate spikes for a leaky integrate-and-fire unit."""

    refrac = int(refrac_ms * 1e-3 * fs)
    v = v_rest
    spikes = np.zeros_like(input_current, dtype=bool)
    refr = 0
    alpha = np.exp(-1 / (tau_m * fs))
    for i, I in enumerate(input_current):
        if refr > 0:
            v = v_reset
            refr -= 1
        else:
            v = alpha * v + (1 - alpha) * (v_rest + gain * I)
            if v >= v_thresh:
                spikes[i] = True
                v = v_reset
                refr = refrac
    return spikes


def simulate_receptors(signal: np.ndarray, fs: float, *, grid_n: int = 6, rng: np.random.Generator | None = None) -> dict[str, object]:
    """Simulate a grid of receptors responding to ``signal``."""

    if rng is None:
        rng = np.random.default_rng()

    merkel = fft_band_filter(signal, fs, low=None, high=5)
    meissner = fft_band_filter(signal, fs, low=10, high=50)
    pacinian = fft_band_filter(signal, fs, low=150, high=300)
    ruffini = fft_band_filter(signal, fs, low=None, high=2)

    env_merkel = envelope(merkel, fs, cutoff=10)
    env_meissner = envelope(meissner, fs, cutoff=50)
    env_pacinian = envelope(pacinian, fs, cutoff=300)
    env_ruffini = envelope(ruffini, fs, cutoff=5)

    type_to_env = {
        "Merkel": env_merkel,
        "Meissner": env_meissner,
        "Pacinian": env_pacinian,
        "Ruffini": env_ruffini,
    }

    types = np.array(["Merkel", "Meissner", "Pacinian", "Ruffini"])
    N = grid_n * grid_n
    receptor_types = np.tile(types, N // 4 + 1)[:N]
    rng.shuffle(receptor_types)
    gains = rng.uniform(0.8, 1.2, size=N)

    spike_trains = np.empty((N, len(signal)), dtype=bool)
    for i in range(N):
        env = type_to_env[receptor_types[i]]
        spk = lif_spikes(env, fs, gain=gains[i])
        spike_trains[i] = spk
    return {
        "receptor_types": receptor_types,
        "spikes": spike_trains,
        "envs": {
            "Merkel": env_merkel,
            "Meissner": env_meissner,
            "Pacinian": env_pacinian,
            "Ruffini": env_ruffini,
        },
    }


def gen_texture_signal(label: str, fs: float, T: float, rng: np.random.Generator) -> tuple[np.ndarray, np.ndarray]:
    """Create a synthetic vibration signal for ``label``."""

    t = np.arange(0, T, 1 / fs)
    signal = 0.02 * rng.standard_normal(len(t))

    if label == "silk":
        f = rng.uniform(15, 25)
        amp = rng.uniform(0.2, 0.5)
        mod = 0.3 + 0.2 * np.sin(2 * np.pi * rng.uniform(0.1, 0.3) * t + rng.uniform(0, 2 * np.pi))
        signal += amp * mod * np.sin(2 * np.pi * f * t)

    elif label == "sandpaper":
        for _ in range(rng.integers(2, 4)):
            center = rng.uniform(0.2, T - 0.2)
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
        center = rng.uniform(0.4, T - 0.2)
        width = rng.uniform(0.01, 0.03)
        ping = np.exp(-0.5 * ((t - center) / width) ** 2)
        signal += 0.6 * ping * np.sin(2 * np.pi * f * t)

    elif label == "skin":
        taps = np.zeros_like(t)
        for _ in range(rng.integers(3, 6)):
            center = rng.uniform(0.2, T - 0.2)
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


def extract_features(sim_result: dict[str, object], fs: float) -> dict[str, float]:
    """Summarise simulated responses as scalar features."""

    envs = sim_result["envs"]
    spikes = sim_result["spikes"]
    rtypes = sim_result["receptor_types"]

    feats: dict[str, float] = {}
    for k, e in envs.items():
        feats[f"{k}_E_mean"] = float(np.mean(e**2))
        feats[f"{k}_E_var"] = float(np.var(e**2))

    for k in ["Merkel", "Meissner", "Pacinian", "Ruffini"]:
        mask = rtypes == k
        spk = spikes[mask]
        rate = spk.mean()
        counts = spk.sum(axis=1) + 1e-6
        fano = float(np.var(counts) / np.mean(counts))
        feats[f"{k}_spike_rate"] = float(rate)
        feats[f"{k}_fano"] = fano

    eps = 1e-6
    feats["Meissner_over_Merkel"] = feats["Meissner_E_mean"] / (feats["Merkel_E_mean"] + eps)
    feats["Pacinian_over_Merkel"] = feats["Pacinian_E_mean"] / (feats["Merkel_E_mean"] + eps)
    feats["Ruffini_over_Merkel"] = feats["Ruffini_E_mean"] / (feats["Merkel_E_mean"] + eps)

    return feats


def main() -> None:
    fs = 1000
    T = 1.0
    rng = np.random.default_rng(11)
    labels = ["silk", "sandpaper", "plastic", "metal", "skin"]
    samples_per_label = 20

    rows: list[dict[str, float | str]] = []
    for lab in labels:
        for _ in range(samples_per_label):
            _, sig = gen_texture_signal(lab, fs, T, rng)
            sim = simulate_receptors(sig, fs, grid_n=6, rng=rng)
            feats = extract_features(sim, fs)
            feats["label"] = lab
            rows.append(feats)

    df = pd.DataFrame(rows)
    csv_path = Path(__file__).resolve().parent / "tactile_dataset_small.csv"
    df.to_csv(csv_path, index=False)

    print(f"Dataset: {df.shape[0]} samples, {df.shape[1] - 1} features → {csv_path}")

    X = df.drop(columns=["label"]).values
    y = df["label"].values
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    logreg = LogisticRegression(max_iter=2000, multi_class="multinomial")
    logreg.fit(X_train_s, y_train)
    y_pred_lr = logreg.predict(X_test_s)
    acc_lr = float(accuracy_score(y_test, y_pred_lr))
    print(f"LogReg acc: {acc_lr:.3f}")

    rf = RandomForestClassifier(n_estimators=200, random_state=42)
    rf.fit(X_train, y_train)
    y_pred_rf = rf.predict(X_test)
    acc_rf = float(accuracy_score(y_test, y_pred_rf))
    print(f"RandomForest acc: {acc_rf:.3f}")

    fig, axs = plt.subplots(1, 2, figsize=(12, 4))
    ConfusionMatrixDisplay.from_predictions(y_test, y_pred_lr, ax=axs[0], colorbar=False)
    axs[0].set_title(f"LogReg Confusion (acc={acc_lr:.2f})")
    ConfusionMatrixDisplay.from_predictions(y_test, y_pred_rf, ax=axs[1], colorbar=False)
    axs[1].set_title(f"RandomForest Confusion (acc={acc_rf:.2f})")
    plt.show()

    importances = rf.feature_importances_
    feat_names = df.drop(columns=["label"]).columns
    idx = np.argsort(importances)[::-1][:12]

    plt.figure(figsize=(8, 4))
    plt.bar(range(len(idx)), importances[idx])
    plt.xticks(range(len(idx)), feat_names[idx], rotation=60, ha="right")
    plt.title("Top RF Feature Importances")
    plt.tight_layout()
    plt.show()

    print("\nLogistic Regression report:\n")
    print(classification_report(y_test, y_pred_lr))
    print("\nRandom Forest report:\n")
    print(classification_report(y_test, y_pred_rf))

    print("Artifacts ready:")
    print(f"- Dataset (small): {csv_path}")


if __name__ == "__main__":
    main()
