# Institutional Confidence Filter

This module implements a fail-closed signal pipeline:

1. `bootstrap_tau.py` computes non-parametric block-bootstrap CI for cross-correlation and writes `daily_outputs/tau_analysis_latest.json`.
2. `regime_writer.py` builds `daily_overlay_regime.json` with strict sign logic (`CI` must exclude zero), TTL, defaults (`p_value=1.0` fallback), and SHA-256 hash.
3. `day_sheet_writer.py` verifies regime hash and expiry, then writes a hashed day sheet JSON atomically.
4. `day_sheet_gate.py` is the live-runner ingestion gate that rejects missing, expired, or tampered day sheets.

## Run sequence

```bash
python scripts/institutional_confidence_filter/bootstrap_tau.py \
  --input daily_outputs/returns_latest.csv \
  --x-col x_return \
  --y-col y_return \
  --output daily_outputs/tau_analysis_latest.json

python scripts/institutional_confidence_filter/regime_writer.py
python scripts/institutional_confidence_filter/day_sheet_writer.py
python scripts/institutional_confidence_filter/day_sheet_gate.py
```

## Required CSV files

- `daily_outputs/returns_latest.csv`: `x_return`, `y_return` columns for tau bootstrap.
- `daily_outputs/structural_latest.csv`: first row must include `weight`.
- `daily_outputs/levels_latest.csv`: included as-is in day sheet `levels`.
