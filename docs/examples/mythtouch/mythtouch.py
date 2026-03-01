import json
import argparse

import numpy as np
import pandas as pd


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


def simulate_receptors(signal: np.ndarray, fs: int, grid_n: int = 6, rng: np.random.Generator | None = None) -> dict[str, object]:
    if rng is None:
        rng = np.random.default_rng(11)
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


def gen_texture_signal(label: str, fs: int, T: float, rng: np.random.Generator) -> tuple[np.ndarray, np.ndarray]:
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


def extract_features(sim_result: dict[str, object], fs: int) -> dict[str, float]:
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


def timeseries_energies(envs: dict[str, np.ndarray], fs: int, window_ms: int = 50) -> list[dict[str, float | str]]:
    win = max(1, int(window_ms / 1000 * fs))
    n = len(next(iter(envs.values())))
    K = n // win
    out: list[dict[str, float | str]] = []
    labels = ["Merkel", "Meissner", "Pacinian", "Ruffini"]
    for k in range(K):
        s = k * win
        e = s + win
        E = {lab: float(np.mean(envs[lab][s:e] ** 2)) for lab in labels}
        winner = max(labels, key=lambda lab: E[lab])
        row: dict[str, float | str] = {"t_center": float((s + e) / (2 * fs))}
        row.update(E)
        row["winner"] = winner
        out.append(row)
    return out


def _cmd_simulate(args: argparse.Namespace) -> None:
    rng = np.random.default_rng(args.seed)
    _t, sig = gen_texture_signal(args.texture, args.fs, args.seconds, rng)
    sim = simulate_receptors(sig, args.fs, grid_n=6, rng=rng)
    ts = timeseries_energies(sim["envs"], args.fs, window_ms=args.window_ms)
    payload = {
        "texture": args.texture,
        "fs": args.fs,
        "seconds": args.seconds,
        "window_ms": args.window_ms,
        "timeseries": ts,
    }
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    print(f"Wrote JSON timeseries → {args.out}")


def _cmd_features(args: argparse.Namespace) -> None:
    rng = np.random.default_rng(args.seed)
    _t, sig = gen_texture_signal(args.texture, args.fs, args.seconds, rng)
    sim = simulate_receptors(sig, args.fs, grid_n=6, rng=rng)
    feats = extract_features(sim, args.fs)
    feats["label"] = args.texture
    pd.DataFrame([feats]).to_csv(args.out, index=False)
    print(f"Wrote feature row → {args.out}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers()

    ps = sub.add_parser("simulate")
    ps.add_argument("--texture", choices=["silk", "sandpaper", "plastic", "metal", "skin"], required=True)
    ps.add_argument("--seconds", type=float, default=1.0)
    ps.add_argument("--fs", type=int, default=1000)
    ps.add_argument("--window_ms", type=int, default=50)
    ps.add_argument("--seed", type=int, default=11)
    ps.add_argument("--out", type=str, required=True)
    ps.set_defaults(func=_cmd_simulate)

    pf = sub.add_parser("features")
    pf.add_argument("--texture", choices=["silk", "sandpaper", "plastic", "metal", "skin"], required=True)
    pf.add_argument("--seconds", type=float, default=1.0)
    pf.add_argument("--fs", type=int, default=1000)
    pf.add_argument("--seed", type=int, default=11)
    pf.add_argument("--out", type=str, required=True)
    pf.set_defaults(func=_cmd_features)

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    if hasattr(args, "func"):
        args.func(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
