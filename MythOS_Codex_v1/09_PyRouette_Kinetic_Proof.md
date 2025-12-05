# Py.rouette Kinetic Proof – Physics Notes

Py.rouette = DeepScorer’s kinetic kernel. It measures **how grace becomes proof**.

## Inputs
- Frame stream (XYZ joints, quaternions, timestamps)
- Music signature (BPM, time signature, accent map)
- Routine metadata (difficulty coefficient, apparatus, floor type)
- Safety signals (heart rate, impact spikes, fatigue markers)

## Outputs
- **Element Scores** – per-move vector accuracy + timing alignment.
- **Stability Index** – confidence band across the full routine.
- **Volatility Flags** – drift, slip, stall, over-rotation, non-symmetric load.
- **Receipt Stub** – model version, calibration window, hash of raw bundle.

## Kinetic Doctrine
- **Glitch Capture** – anomalies are preserved, labeled, and scored for insight.
- **Human Override** – faculty can annotate or zero-out any element; the override is logged.
- **Replay Loop** – model can re-run past sessions with updated weights to test fairness.
- **Safety-first** – auto-pauses scoring if heart-rate or impact goes outside guardrails.

## Proof of Work
- Benchmarked against canonical combos (tendu → relevé → pirouette) for bias drift.
- Every release tagged `PYR-[semver]-[model hash]` with reproducible seeds.
- Designed for serverless batch scoring; single routine target < 600ms at p95.
