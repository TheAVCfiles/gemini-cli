# Institutional Confidence Filter (Fail-Closed)

This package implements the protocol as an auditable artifact pipeline:

1. `bootstrap_tau.py` computes block-bootstrap tau statistics and writes `out/tau_star_summary.csv`.
2. `regime_writer.py` reads overlay + tau + permutation outputs and writes atomic `out/daily_overlay_regime.json`.
3. `day_sheet_writer.py` verifies regime integrity and writes atomic `out/day_sheet_YYYYMMDD.json`.
4. `live_gate.py` is the runtime fail-closed guard for stale/corrupt regime payloads.

## Institutional controls

- Atomic write (`.tmp` then `replace`) for regime and day sheet.
- Explicit expiry/TTL (`regime_expiry_utc`, `expiry_utc`).
- SHA-256 signing (`hash_sha256`) and verification.
- Strict CI sign logic: CI must be entirely above or below zero.
- Fail-closed defaults: `tap_p_value=1.0`, `regime_status=CLOSED_DEFENSIVE` on missing/bad inputs.

## Input files

Regime writer expects:

- `out/backtest_overlay_results.csv`
- `out/tau_star_summary.csv`
- `out/event_study_permutation_summary.csv`

Day sheet writer expects:

- `out/daily_overlay_regime.json`
- `out/levels_latest.csv` with:
  - `symbol,pivot,s1,s2,r1,r2,atr_band_low,atr_band_high,invalidation`

## Run sequence

```bash
python bootstrap_tau.py          # Optional: creates tau summary from returns
python regime_writer.py          # Contract gate
python day_sheet_writer.py       # Deliverable artifact
```

## API

- `GET /health`
- `GET /regime`
- `GET /day-sheet/latest`

## Test

```bash
PYTHONPATH=. python -m unittest tests.test_institutional_confidence
```


## Preview Dashboard

A standalone visual preview is available at:

- `docs/previews/presidents-day-fortress-dashboard.html`

It mirrors the regime-open/closed decision logic (`W >= 80`, `p < 0.05`) for fast operator review.
