# Mechanotransduction Simulation Pipeline

This notebook-style example walks through a self-contained Python script that
models a tactile processing chain from vibration input to somatotopic spike
maps. It is designed to be easy to run and modify so you can explore how
changes in frequency, amplitude, and neuron parameters influence downstream
activity.

## Overview

1. **Stimulus synthesis** – builds a rich tactile waveform by combining flutter
   (Meissner), buzz (Pacinian), slow pressure ramps (Merkel/Ruffini), and a
   transient tap.
2. **Receptor transfer functions** – approximates each mechanoreceptor's
   frequency selectivity using simple FFT-based band filters.
3. **Envelope extraction** – rectifies and low-pass filters the receptor
   outputs to obtain smooth drive signals for spiking models.
4. **Leaky integrate-and-fire (LIF) neurons** – simulates a 10×10 fingertip grid
   where each location is assigned a receptor type and produces spikes in
   response to the envelope current.
5. **Somatotopic aggregation** – counts spikes inside 50 ms windows to produce
   spatial heatmaps and receptor-specific activity summaries.
6. **Decoder** – reports which receptor channel dominates in each time window
   based on band energies.

## Requirements

- Python 3.9+
- `numpy`
- `matplotlib`
- Optional: `pandas` and `scikit-learn` for the lightweight dataset/classifier demo

Install dependencies with:

```bash
python -m venv .venv
source .venv/bin/activate
pip install numpy matplotlib
# optional extras for the fast dataset demo
pip install pandas scikit-learn
```

## Running the simulation

Save the following script as `mechanotransduction_sim.py` (or paste it into a
notebook cell) and execute it. The code renders diagnostic plots and prints key
design notes so you can iterate quickly.

```python
import numpy as np
import matplotlib.pyplot as plt

# ---------- 1) Global params ----------
fs = 2000                 # samples/sec (temporal resolution)
T  = 2.0                  # seconds
t  = np.arange(0, T, 1/fs)

rng = np.random.default_rng(42)

# ---------- 2) Build a tactile "scene" (sum of components) ----------
#   - low-freq flutter ~ Meissner (20 Hz)
#   - high-freq buzz ~ Pacinian (250 Hz)
#   - slow pressure ramp ~ Merkel/Ruffini (0–2 Hz)
f_meissner = 20
f_pacinian = 250

amp_meissner = 0.7
amp_pacinian = 0.5
amp_pressure = 1.0

flutter   = amp_meissner * np.sin(2*np.pi*f_meissner*t)
buzz      = amp_pacinian * np.sin(2*np.pi*f_pacinian*t)
pressure  = amp_pressure * (0.5 + 0.5*np.sin(2*np.pi*0.5*t))  # ~1 Hz slow stretch/pressure

signal = flutter + buzz + pressure

# Optional: add a transient "tap" to emulate brief deformation
tap_center = 1.2
tap_width  = 0.05
tap = np.exp(-0.5*((t - tap_center)/tap_width)**2)
signal += 0.6 * tap

# ---------- 3) Simple FFT band filters for receptor transfer functions ----------
def fft_band_filter(x, fs, low=None, high=None):
    X = np.fft.rfft(x)
    freqs = np.fft.rfftfreq(len(x), 1/fs)
    mask = np.ones_like(freqs, dtype=bool)
    if low is not None:
        mask &= freqs >= low
    if high is not None:
        mask &= freqs <= high
    Xf = np.zeros_like(X)
    Xf[mask] = X[mask]
    return np.fft.irfft(Xf, n=len(x))

# Approximated bands (very rough, for demonstration):
# Merkel (SA1): static/slow pressure -> low-pass ~ 0–5 Hz
# Meissner (RA1): flutter -> band-pass ~ 10–50 Hz
# Pacinian (RA2): vibration -> band-pass ~ 150–300 Hz (peak near 250)
# Ruffini (SA2): stretch/slow posture -> low-pass ~ 0–2 Hz
merkel   = fft_band_filter(signal, fs, low=None, high=5)
meissner = fft_band_filter(signal, fs, low=10, high=50)
pacinian = fft_band_filter(signal, fs, low=150, high=300)
ruffini  = fft_band_filter(signal, fs, low=None, high=2)

# For spike generation, we use rectified envelopes (biophysical shortcut)
def envelope(x, fs, cutoff=20):
    # rectified + low-pass via FFT mask (0..cutoff Hz)
    rect = np.abs(x)
    return fft_band_filter(rect, fs, low=None, high=cutoff)

env_merkel   = envelope(merkel, fs, cutoff=10)
env_meissner = envelope(meissner, fs, cutoff=50)
env_pacinian = envelope(pacinian, fs, cutoff=300)  # keep faster
env_ruffini  = envelope(ruffini, fs, cutoff=5)

# ---------- 4) Leaky Integrate-and-Fire neurons per receptor ----------
# We simulate small receptor arrays on a 2D fingertip patch (10x10 grid).

grid_n = 10
xy = np.stack(np.meshgrid(np.linspace(0,1,grid_n), np.linspace(0,1,grid_n), indexing='ij'), axis=-1).reshape(-1,2)
N = xy.shape[0]

# Assign receptor types across the grid (quarter each, interleaved for variety)
types = np.array(['Merkel','Meissner','Pacinian','Ruffini'])
receptor_types = np.tile(types, N//4 + 1)[:N]
rng.shuffle(receptor_types)

# Each receptor gets a sensitivity gain and picks the matching envelope as "current"
gains = rng.uniform(0.8, 1.2, size=N)

type_to_env = {
    'Merkel':   env_merkel,
    'Meissner': env_meissner,
    'Pacinian': env_pacinian,
    'Ruffini':  env_ruffini
}

# LIF params (shared, simple)
v_rest   = 0.0
v_reset  = 0.0
v_thresh = 1.0
tau_m    = 0.02   # 20 ms membrane time constant
refrac   = int(0.003 * fs)  # 3 ms refractory

def lif_spikes(input_current, fs, gain, tau_m, v_rest, v_reset, v_thresh, refrac):
    v = v_rest
    spikes = np.zeros_like(input_current, dtype=bool)
    refr = 0
    alpha = np.exp(-1/(tau_m*fs))
    for i, I in enumerate(input_current):
        if refr > 0:
            v = v_reset
            refr -= 1
        else:
            # discrete LIF: v <- alpha*v + (1-alpha)*(v_rest + gain*I)
            v = alpha*v + (1-alpha)*(v_rest + gain*I)
            if v >= v_thresh:
                spikes[i] = True
                v = v_reset
                refr = refrac
    return spikes

# Generate spike trains
spike_trains = []
for i in range(N):
    env = type_to_env[receptor_types[i]]
    spk = lif_spikes(env, fs, gains[i], tau_m, v_rest, v_reset, v_thresh, refrac)
    spike_trains.append(spk)
spike_trains = np.array(spike_trains)  # shape (N, T)

# ---------- 5) Somatotopic windows: spike counts → spatial heatmaps ----------
win_ms = 50  # 50 ms windows approximate cortical pooling
win = int(win_ms * 1e-3 * fs)

num_windows = len(t)//win
heatmaps = []  # list of (grid_n, grid_n) heatmaps of total spikes (all types)
type_maps = {k: [] for k in types}

for w in range(num_windows):
    start = w*win
    stop  = start + win
    counts = spike_trains[:, start:stop].sum(axis=1)  # per receptor
    # assemble into grid
    g = np.zeros((grid_n, grid_n))
    idx = 0
    for i in range(grid_n):
        for j in range(grid_n):
            g[i,j] = counts[idx]
            idx += 1
    heatmaps.append(g)

    # also per type
    for k in types:
        mask = receptor_types == k
        counts_k = spike_trains[mask, start:stop].sum(axis=1)
        gk = np.zeros((grid_n, grid_n))
        # fill only positions of this type
        idx = 0
        for i in range(grid_n):
            for j in range(grid_n):
                if receptor_types[idx] == k:
                    gk[i,j] = spike_trains[idx, start:stop].sum()
                idx += 1
        type_maps[k].append(gk)

# ---------- 6) Basic readouts/plots ----------
# a) raw signal + envelopes
plt.figure(figsize=(10,6))
plt.plot(t, signal, label='input (pressure+flutter+buzz+tap)')
plt.plot(t, env_merkel,   label='Merkel env (0–5 Hz)')
plt.plot(t, env_meissner, label='Meissner env (10–50 Hz)')
plt.plot(t, env_pacinian, label='Pacinian env (150–300 Hz)')
plt.plot(t, env_ruffini,  label='Ruffini env (0–2 Hz)')
plt.xlabel('Time (s)'); plt.ylabel('Amplitude'); plt.title('Stimulus & receptor envelopes')
plt.legend(loc='upper right')
plt.show()

# b) spike raster (subset)
subset = np.arange(0, min(60, N))  # show up to 60 units
plt.figure(figsize=(10,6))
for row, i in enumerate(subset):
    ts = t[spike_trains[i]]
    plt.vlines(ts, row, row+0.8)
plt.xlabel('Time (s)'); plt.ylabel('Receptors (subset)'); plt.title('Spike raster (subset of receptors)')
plt.show()

# c) one mid-trial spatial heatmap (sum over 50 ms window near the "tap")
mid_w = np.argmin(np.abs((t[::win]+(win/(2*fs))) - tap_center))
plt.figure(figsize=(5,4))
plt.imshow(heatmaps[mid_w], origin='lower', aspect='equal')
plt.title(f'Spatial spike count map (window ~{tap_center:.2f}s)')
plt.colorbar(label='spikes/50ms')
plt.show()

# d) simple band-power features vs time (what the brain might re-synthesize)
def band_energy(x, fs, low, high):
    xf = fft_band_filter(x, fs, low, high)
    return np.mean(xf**2)

# Compute instantaneous band energies in sliding windows as a crude "percept"
energies = {'Merkel':[], 'Meissner':[], 'Pacinian':[], 'Ruffini':[]}
for w in range(num_windows):
    start = w*win
    stop  = start + win
    energies['Merkel'].append(np.mean(merkel[start:stop]**2))
    energies['Meissner'].append(np.mean(meissner[start:stop]**2))
    energies['Pacinian'].append(np.mean(pacinian[start:stop]**2))
    energies['Ruffini'].append(np.mean(ruffini[start:stop]**2))

tw = (np.arange(num_windows)+0.5)*win/fs

plt.figure(figsize=(10,4))
for k,v in energies.items():
    plt.plot(tw, v, label=k)
plt.xlabel('Time (s)'); plt.ylabel('Band energy'); plt.title('Percept-like band energies over time')
plt.legend()
plt.show()

# ---------- 7) Minimal "decoder": which component dominates? ----------
# At each window, pick the max band-energy as the perceived "channel".
labels = np.array(list(energies.keys()))
ener_mat = np.vstack([energies[k] for k in labels])  # shape (4, num_windows)
winner = labels[np.argmax(ener_mat, axis=0)]

# Plot winning channel over time as a categorical readout
plt.figure(figsize=(10,1.8))
# Map labels to integers for visualization
label_to_id = {lab:i for i,lab in enumerate(labels)}
ids = np.vectorize(label_to_id.get)(winner)
plt.scatter(tw, ids, s=20)
plt.yticks(list(label_to_id.values()), list(label_to_id.keys()))
plt.xlabel('Time (s)'); plt.title('Max-band decoder (which receptor channel dominates?)')
plt.show()

print("Done. You can now tweak frequencies, amplitudes, LIF params, and window size to test hypotheses.\n"
      "Design notes:\n"
      "- Step 3 approximates receptor tuning via crude FFT masks (replace with measured transfer functions when available).\n"
      "- Step 4 uses a leaky integrate-and-fire neuron to convert envelopes into spikes (biophysically simple but testable).\n"
      "- Step 5 pools spikes into 50 ms windows to imitate cortical integration; adjust to 5–100 ms to explore temporal → spatial tradeoffs.\n"
      "- Step 7 shows a toy decoder; replace with an ML classifier to map patterns → texture classes.\n")
```

## Experimentation ideas

- **Change stimulus frequencies or amplitudes** to mimic different textures.
- **Alter the LIF threshold or membrane constant** to see how excitability shifts
  the spike raster.
- **Adjust the pooling window** (e.g., 10 ms vs. 100 ms) to explore temporal vs.
  spatial coding trade-offs.
- **Swap the decoder** with a learned classifier (e.g., logistic regression) for
  richer texture identification experiments.

This scaffold is intentionally minimal so you can plug in more realistic
biomechanical models, receptor transfer functions, or downstream decoders as
your research evolves.

## Quick, lightweight texture dataset + classifier

When you just need a fast end-to-end run (e.g., for CI smoke tests or rapid
feature iteration), the following script trims the simulation to 1 second,
reduces the receptor grid to 6×6, and synthesizes a small five-class texture
dataset. It then evaluates both multinomial logistic regression and a random
forest on the extracted mechanoreceptor features, reporting accuracy and
diagnostic plots.

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    ConfusionMatrixDisplay,
    accuracy_score,
    classification_report,
)


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


def simulate_receptors(signal, fs, grid_n=6, rng=None):
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


def gen_texture_signal(label, fs, T, rng):
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
        raise ValueError("Unknown texture label")

    slow = 0.3 * (0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(0.2, 0.6) * t + rng.uniform(0, 2 * np.pi)))
    signal += slow
    return t, signal


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


# Parameters (lighter run)
fs = 1000
T = 1.0
rng = np.random.default_rng(11)
labels = ["silk", "sandpaper", "plastic", "metal", "skin"]
samples_per_label = 20  # 100 samples total

rows = []
for lab in labels:
    for _ in range(samples_per_label):
        t, sig = gen_texture_signal(lab, fs, T, rng)
        sim = simulate_receptors(sig, fs, grid_n=6, rng=rng)
        feats = extract_features(sim, fs)
        feats["label"] = lab
        rows.append(feats)

df = pd.DataFrame(rows)
csv_path = Path("tactile_dataset_small.csv")
df.to_csv(csv_path, index=False)

print(f"Dataset: {df.shape[0]} samples, {df.shape[1] - 1} features → {csv_path}")

X = df.drop(columns=["label"]).values
y = df["label"].values
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.25,
    random_state=42,
    stratify=y,
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
plt.tight_layout()
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
print(f"- Dataset (small): {csv_path.resolve()}")
```

Because the run is intentionally lightweight (100 samples total), the entire
pipeline typically completes in under a minute on a laptop while still
exercising the mechanotransduction-to-classifier workflow end to end.
