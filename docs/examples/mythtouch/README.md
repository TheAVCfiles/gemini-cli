# mythtouch tactile simulation example

This example demonstrates a lightweight tactile receptor simulator that can be packaged
without importing heavy dependencies until after all source files are written. The
workflow mirrors the step-by-step approach used for the Gemini CLI packaging tests to
avoid long import-time runs:

1. **Write module files first.** The `mythtouch.py` module and companion assets are
   created before any imports run.
2. **Import after the files exist.** The example loader uses `importlib` so the
   package can be validated without adding the directory to `sys.path`.
3. **Generate sample artifacts.** A JSON timeseries dump and a CSV feature row are
   produced with deterministic seeds so that regression tests have stable fixtures.

## Files

- `mythtouch.py` – tactile receptor simulation module with CLI commands
- `viewer.html` – minimal HTML shell for manual inspection of exported JSON
- `examples/sample_timeseries.json` – example windowed energy output for the
  `simulate` command
- `examples/sample_features.csv` – feature summary for the `features` command

## Usage

```
python mythtouch.py simulate --texture metal --seconds 1.0 --out /tmp/out.json
python mythtouch.py features --texture metal --seconds 1.0 --out /tmp/out.csv
```

Both commands default to a 1 kHz sampling rate, deterministic RNG seed, and compact
window sizes so they run quickly. The CLI accepts five textures: `silk`, `sandpaper`,
`plastic`, `metal`, and `skin`.
