# Institutional Confidence Filter

Utilities implementing a fail-closed regime workflow:

1. `regime_writer.py`
   - Computes block-bootstrap CI for lagged cross-correlation.
   - Applies strict significance (`CI` entirely above or below zero).
   - Emits `daily_overlay_regime.json` with TTL + SHA-256 hash.
2. `day_sheet_writer.py`
   - Verifies regime expiry/hash.
   - Computes mechanical pivot/ATR bands from `daily_outputs/levels_latest.csv`.
   - Emits hashed `daily_outputs/day_sheet_YYYYMMDD.json` via atomic write.
3. `live_runner_gate.py`
   - Reads Day Sheet in fail-closed mode for execution engines.

## Run

```bash
python scripts/institutional_filter/regime_writer.py \
  --tau-csv daily_outputs/tau_latest.csv \
  --x-col lit_returns --y-col etha_returns \
  --tau 1 --p-value 0.012 \
  --structural-json daily_outputs/structural_latest.json

python scripts/institutional_filter/day_sheet_writer.py
python scripts/institutional_filter/live_runner_gate.py
```
