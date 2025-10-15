# Tactile AI Pipeline: Dataset + Classifier

The following Python script demonstrates a tactile-sensing pipeline that:

1. Generates synthetic tactile "textures".
2. Filters the signal into receptor-specific bands and produces spike trains with a leaky integrate-and-fire (LIF) model.
3. Extracts band-energy and spike-statistics features.
4. Trains and evaluates logistic regression and random forest classifiers.
5. Saves the resulting dataset for later use.

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    ConfusionMatrixDisplay,
    classification_report,
)


# ---------------------------- Utility: FFT band filter & envelopes ----------------------------
def fft_band_filter(x, fs, low=None, high=None):
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


def envelope(x, fs, cutoff=20):
    rect = np.abs(x)
    return fft_band_filter(rect, fs, low=None, high=cutoff)


# ---------------------------- Mechanotransduction Model ----------------------------
def lif_spikes(
    input_current,
    fs,
    gain=1.0,
    tau_m=0.02,
    v_rest=0.0,
    v_reset=0.0,
    v_thresh=1.0,
    refrac_ms=3.0,
):
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


def simulate_receptors(signal, fs, grid_n=8, rng=None):
    """Build a small fingertip patch with interleaved receptor types."""
    if rng is None:
        rng = np.random.default_rng()

    # Receptor bands (rough approximations)
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

    spike_trains = []
    for i in range(N):
        env = type_to_env[receptor_types[i]]
        spk = lif_spikes(env, fs, gain=gains[i])
        spike_trains.append(spk)
    spike_trains = np.array(spike_trains)
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


# ---------------------------- Texture Generators ----------------------------
def gen_texture_signal(label, fs, T, rng):
    t = np.arange(0, T, 1 / fs)

    # Base noise (very low) to avoid degenerate signals
    signal = 0.02 * rng.standard_normal(len(t))

    if label == "silk":
        f = rng.uniform(15, 25)
        amp = rng.uniform(0.2, 0.5)
        mod = 0.3 + 0.2 * np.sin(2 * np.pi * rng.uniform(0.1, 0.3) * t + rng.uniform(0, 2 * np.pi))
        signal += amp * mod * np.sin(2 * np.pi * f * t)

    elif label == "sandpaper":
        for _ in range(rng.integers(3, 7)):
            center = rng.uniform(0.2, T - 0.2)
            width = rng.uniform(0.02, 0.08)
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
        center = rng.uniform(0.6, T - 0.2)
        width = rng.uniform(0.01, 0.03)
        ping = np.exp(-0.5 * ((t - center) / width) ** 2)
        signal += 0.6 * ping * np.sin(2 * np.pi * f * t)

    elif label == "skin":
        taps = np.zeros_like(t)
        for _ in range(rng.integers(4, 8)):
            center = rng.uniform(0.2, T - 0.2)
            width = rng.uniform(0.015, 0.04)
            taps += np.exp(-0.5 * ((t - center) / width) ** 2) * rng.uniform(0.3, 0.7)
        flutter_f = rng.uniform(20, 40)
        flutter = 0.2 * np.sin(2 * np.pi * flutter_f * t)
        signal += taps + flutter

    else:
        raise ValueError("Unknown texture label")

    slow = 0.3 * (0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(0.2, 0.6) * t + rng.uniform(0, 2 * np.pi)))
    signal += slow
    return t, signal


# ---------------------------- Feature Extraction ----------------------------
def extract_features(sim_result, fs):
    envs = sim_result["envs"]
    spikes = sim_result["spikes"]
    rtypes = sim_result["receptor_types"]

    feats = {}

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


# ---------------------------- Build Dataset ----------------------------
fs = 2000
T = 1.5
rng = np.random.default_rng(7)

labels = ["silk", "sandpaper", "plastic", "metal", "skin"]
samples_per_label = 80

rows = []
for lab in labels:
    for _ in range(samples_per_label):
        t, sig = gen_texture_signal(lab, fs, T, rng)
        sim = simulate_receptors(sig, fs, grid_n=8, rng=rng)
        feats = extract_features(sim, fs)
        feats["label"] = lab
        rows.append(feats)

df = pd.DataFrame(rows)
csv_path = "/mnt/data/tactile_dataset.csv"
df.to_csv(csv_path, index=False)

print(f"Dataset built: {df.shape[0]} samples, {df.shape[1]-1} features. Saved to {csv_path}")


# ---------------------------- Train/Test Models ----------------------------
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
acc_lr = accuracy_score(y_test, y_pred_lr)
print(f"Logistic Regression accuracy: {acc_lr:.3f}")

rf = RandomForestClassifier(n_estimators=300, random_state=42)
rf.fit(X_train, y_train)
y_pred_rf = rf.predict(X_test)
acc_rf = accuracy_score(y_test, y_pred_rf)
print(f"Random Forest accuracy: {acc_rf:.3f}")


# ---------------------------- Confusion Matrices ----------------------------
fig, axs = plt.subplots(1, 2, figsize=(12, 4))
ConfusionMatrixDisplay.from_predictions(y_test, y_pred_lr, ax=axs[0], colorbar=False)
axs[0].set_title(f"LogReg Confusion (acc={acc_lr:.2f})")
ConfusionMatrixDisplay.from_predictions(y_test, y_pred_rf, ax=axs[1], colorbar=False)
axs[1].set_title(f"RandomForest Confusion (acc={acc_rf:.2f})")
plt.show()


# ---------------------------- Feature Importance (RF) ----------------------------
importances = rf.feature_importances_
feat_names = df.drop(columns=["label"]).columns
idx = np.argsort(importances)[::-1][:15]

plt.figure(figsize=(8, 5))
plt.bar(range(len(idx)), importances[idx])
plt.xticks(range(len(idx)), feat_names[idx], rotation=60, ha="right")
plt.title("Top RF Feature Importances")
plt.tight_layout()
plt.show()


# ---------------------------- Text Report ----------------------------
print("\nLogistic Regression classification report:\n")
print(classification_report(y_test, y_pred_lr))
print("\nRandom Forest classification report:\n")
print(classification_report(y_test, y_pred_rf))

with open("/mnt/data/TACTILE_README.txt", "w") as f:
    f.write(
        "TACTILE DATASET\n"
        "----------------\n"
        "File: /mnt/data/tactile_dataset.csv\n"
        "Samples: {}  | Features: {}\n"
        "Labels: {}\n\n"
        "Columns groupings:\n"
        "- *_E_mean, *_E_var : band power features from receptor envelopes (Merkel, Meissner, Pacinian, Ruffini)\n"
        "- *_spike_rate, *_fano: spike statistics per receptor type\n"
        "- *_over_Merkel: cross-channel ratios (pressure-normalized vibration)\n\n"
        "Pipeline: texture->bands->envelopes->LIF spikes->features->classifier\n".format(
            df.shape[0], df.shape[1] - 1, labels
        )
    )

print("Saved README to /mnt/data/TACTILE_README.txt")
```

## Running the example

1. Install dependencies:

   ```bash
   pip install numpy pandas matplotlib scikit-learn
   ```

2. Run the script. When it finishes, it saves the dataset to `/mnt/data/tactile_dataset.csv`
   and writes a short summary to `/mnt/data/TACTILE_README.txt`.

3. Review the printed model metrics and plots for confusion matrices and feature importances.
