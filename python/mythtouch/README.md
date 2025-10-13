# Mythtouch synthetic dataset utilities

This directory bundles a tiny, self-contained tactile texture simulation and
three helper scripts:

- `make_dataset.py` – Generate a CSV of features for each synthetic texture.
- `train_classifier.py` – Train Logistic Regression and Random Forest models,
  keeping whichever performs best on a validation split.
- `predict.py` – Load the exported model and run predictions on feature rows or
  on freshly simulated samples.

The implementation is intentionally light-weight; install the dependencies
listed in `requirements.txt` (NumPy, Pandas, and scikit-learn) and then invoke
the scripts directly with Python, e.g.

```bash
python python/mythtouch/make_dataset.py --out /tmp/mythtouch.csv
python python/mythtouch/train_classifier.py --data /tmp/mythtouch.csv \
  --model_out /tmp/mythtouch-model.pkl --scaler_out /tmp/mythtouch-scaler.pkl
python python/mythtouch/predict.py --model /tmp/mythtouch-model.pkl \
  --scaler /tmp/mythtouch-scaler.pkl --simulate metal
```

The `mythtouch.py` module exposes the three building blocks that back these
scripts: signal generation, receptor simulation, and feature extraction.  Other
projects can reuse the module directly via `import mythtouch`.
