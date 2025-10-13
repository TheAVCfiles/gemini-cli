"""Utility for materializing the standalone mythtouch package and small demo artifacts.

This script intentionally performs work in discrete stages so we can avoid importing
heavy numerical dependencies (NumPy/Pandas) until absolutely necessary.  The
``write`` stage only writes plain-text assets.  The optional ``examples`` stage then
imports the freshly-written package to generate a couple of demo files.
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from pathlib import Path
from types import ModuleType
from typing import Iterable


MYTHTOUCH_SOURCE = """
import json, argparse, numpy as np, pandas as pd


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


def gen_texture_signal(label, fs, T, rng):
    t = np.arange(0, T, 1 / fs)
    signal = 0.02 * rng.standard_normal(len(t))
    if label == "silk":
        f = rng.uniform(15, 25)
        amp = rng.uniform(0.2, 0.5)
        mod = 0.3 + 0.2 * np.sin(
            2 * np.pi * rng.uniform(0.1, 0.3) * t + rng.uniform(0, 2 * np.pi)
        )
        signal += amp * mod * np.sin(2 * np.pi * f * t)
    elif label == "sandpaper":
        for _ in range(rng.integers(2, 4)):
            center = rng.uniform(0.2, T - 0.2)
            width = rng.uniform(0.02, 0.06)
            burst = np.exp(-0.5 * ((t - center) / width) ** 2) * rng.uniform(0.4, 0.9)
            noise = rng.standard_normal(len(t))
            noise = fft_band_filter(noise, fs, low=20, high=250)
            signal += burst * noise
        signal += 0.05 * fft_band_filter(
            rng.standard_normal(len(t)), fs, low=150, high=400
        )
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
    slow = 0.3 * (
        0.5
        + 0.5
        * np.sin(2 * np.pi * rng.uniform(0.2, 0.6) * t + rng.uniform(0, 2 * np.pi))
    )
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
    feats["Meissner_over_Merkel"] = feats["Meissner_E_mean"] / (
        feats["Merkel_E_mean"] + eps
    )
    feats["Pacinian_over_Merkel"] = feats["Pacinian_E_mean"] / (
        feats["Merkel_E_mean"] + eps
    )
    feats["Ruffini_over_Merkel"] = feats["Ruffini_E_mean"] / (
        feats["Merkel_E_mean"] + eps
    )
    return feats


def timeseries_energies(envs, fs, window_ms=50):
    win = max(1, int(window_ms / 1000 * fs))
    n = len(next(iter(envs.values())))
    K = n // win
    out = []
    labels = ["Merkel", "Meissner", "Pacinian", "Ruffini"]
    for k in range(K):
        s = k * win
        e = s + win
        E = {lab: float(np.mean(envs[lab][s:e] ** 2)) for lab in labels}
        winner = max(labels, key=lambda lab: E[lab])
        row = {"t_center": float((s + e) / (2 * fs))}
        row.update(E)
        row["winner"] = winner
        out.append(row)
    return out


def _cmd_simulate(args):
    rng = np.random.default_rng(args.seed)
    t, sig = gen_texture_signal(args.texture, args.fs, args.seconds, rng)
    sim = simulate_receptors(sig, args.fs, grid_n=6, rng=rng)
    ts = timeseries_energies(sim["envs"], args.fs, window_ms=args.window_ms)
    payload = {
        "texture": args.texture,
        "fs": args.fs,
        "seconds": args.seconds,
        "window_ms": args.window_ms,
        "timeseries": ts,
    }
    with open(args.out, "w") as f:
        json.dump(payload, f, indent=2)
    print(f"Wrote JSON timeseries → {args.out}")


def _cmd_features(args):
    rng = np.random.default_rng(args.seed)
    t, sig = gen_texture_signal(args.texture, args.fs, args.seconds, rng)
    sim = simulate_receptors(sig, args.fs, grid_n=6, rng=rng)
    feats = extract_features(sim, args.fs)
    feats["label"] = args.texture
    pd.DataFrame([feats]).to_csv(args.out, index=False)
    print(f"Wrote feature row → {args.out}")


def main():
    import argparse

    p = argparse.ArgumentParser()
    sub = p.add_subparsers()

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

    args = p.parse_args()
    if hasattr(args, "func"):
        args.func(args)
    else:
        p.print_help()


if __name__ == "__main__":
    main()
""".strip()

README_CONTENT = """# mythtouch\n\nRun `python mythtouch.py --help` for usage.\n"""

VIEWER_HTML = (
    "<!doctype html><meta charset='utf-8'><p>Drop a JSON from `simulate` here to visualize energies.</p>"
)


def _normalize_path(path: str | Path) -> Path:
    p = Path(path)
    return p.resolve()


def write_assets(base_dir: Path) -> None:
    mythtouch_py = base_dir / "mythtouch.py"
    base_dir.mkdir(parents=True, exist_ok=True)
    (base_dir / "examples").mkdir(exist_ok=True)
    mythtouch_py.write_text(MYTHTOUCH_SOURCE + "\n", encoding="utf-8")
    (base_dir / "README.md").write_text(README_CONTENT, encoding="utf-8")
    (base_dir / "viewer.html").write_text(VIEWER_HTML, encoding="utf-8")


def _load_module(mythtouch_py: Path) -> ModuleType:
    spec = importlib.util.spec_from_file_location("mythtouch", mythtouch_py)
    if spec is None or spec.loader is None:
        raise RuntimeError("Could not build module spec for mythtouch")
    module = importlib.util.module_from_spec(spec)
    sys.modules["mythtouch_packager_temp"] = module
    spec.loader.exec_module(module)  # type: ignore[arg-type]
    return module


def generate_examples(base_dir: Path, seed: int = 13) -> Iterable[Path]:
    mythtouch_py = base_dir / "mythtouch.py"
    if not mythtouch_py.exists():
        raise FileNotFoundError(
            "mythtouch.py not found. Run the 'write' stage before generating examples."
        )

    try:
        module = _load_module(mythtouch_py)
    except ModuleNotFoundError as exc:  # pragma: no cover - import-time dependency check
        missing = exc.name or "a required dependency"
        raise ModuleNotFoundError(
            "Generating examples requires numpy and pandas to be installed. "
            f"Missing module: {missing}"
        ) from exc

    import numpy as np  # Imported lazily to avoid heavy imports during write stage
    import pandas as pd

    rng = np.random.default_rng(seed)
    t, sig = module.gen_texture_signal("metal", fs=1000, T=1.0, rng=rng)
    sim = module.simulate_receptors(sig, fs=1000, grid_n=6, rng=rng)
    ts = module.timeseries_energies(sim["envs"], fs=1000, window_ms=50)

    payload = {
        "texture": "metal",
        "fs": 1000,
        "seconds": 1.0,
        "window_ms": 50,
        "timeseries": ts,
    }
    json_path = base_dir / "examples" / "sample_timeseries.json"
    json_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    feats = module.extract_features(sim, fs=1000)
    feats["label"] = "metal"
    csv_path = base_dir / "examples" / "sample_features.csv"

    pd.DataFrame([feats]).to_csv(csv_path, index=False)

    return json_path, csv_path


def run(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "base",
        nargs="?",
        default="examples/mythtouch",
        help="Directory to create or update with mythtouch assets.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("write", help="Write mythtouch assets without running heavy imports.")

    examples_parser = sub.add_parser(
        "examples",
        help="Generate sample JSON/CSV outputs after the assets are written.",
    )
    examples_parser.add_argument("--seed", type=int, default=13)

    all_parser = sub.add_parser("all", help="Run both write and examples stages.")
    all_parser.add_argument("--seed", type=int, default=13)

    args = parser.parse_args(argv)
    base_dir = _normalize_path(args.base)

    if args.command == "write":
        write_assets(base_dir)
        print(f"Wrote mythtouch assets to {base_dir}")
    elif args.command == "examples":
        paths = generate_examples(base_dir, seed=args.seed)
        for path in paths:
            print(f"Generated {path}")
    elif args.command == "all":
        write_assets(base_dir)
        print(f"Wrote mythtouch assets to {base_dir}")
        paths = generate_examples(base_dir, seed=args.seed)
        for path in paths:
            print(f"Generated {path}")
    else:
        parser.error(f"Unknown command: {args.command}")


if __name__ == "__main__":
    run()
