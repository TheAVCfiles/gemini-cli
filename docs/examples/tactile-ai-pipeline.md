# Tactile AI Pipeline: dataset + classifier

This example extends the tactile mechanotransduction demo into a runnable
experiment that builds a feature dataset and benchmarks two classic
classifiers. It is useful for bootstrapping tactile ML experiments or sharing a
reusable dataset with collaborators.

## What the script does

1. **Texture synthesis** – Generates five canonical "textures" (silk, sandpaper,
   plastic, metal, skin) as vibration signals with distinct spectral structure.
2. **Mechanotransduction** – Routes the signals through four coarse receptor
   bands, extracts envelopes, and runs leaky integrate-and-fire (LIF) neurons to
   produce spike trains.
3. **Feature extraction** – Computes band energies, spike statistics, and
   simple cross-channel ratios.
4. **Model training** – Splits the dataset, scales the features, and trains a
   multinomial logistic regression and a random forest classifier. Confusion
   matrices and feature importances are plotted.
5. **Artifacts** – Saves the synthesized dataset and a README that documents the
   column groups so you can reuse the CSV later.

## Prerequisites

Install the scientific Python stack (Python 3.10+):

```bash
pip install numpy pandas matplotlib scikit-learn
```

## Running the experiment

```bash
python docs/examples/tactile_ai_pipeline.py
```

On completion you will see accuracy scores, classification reports, and two
Matplotlib figures. The dataset and README are written to `data/`:

- `data/tactile_dataset.csv`
- `data/TACTILE_README.txt`

## Script outline

The full script lives alongside this document at
`docs/examples/tactile_ai_pipeline.py`. Highlights:

- `gen_texture_signal` defines the five texture recipes.
- `simulate_receptors` applies band-pass filters and generates LIF spikes.
- `extract_features` distills envelopes and spike trains into a feature vector.
- `build_dataset` loops over textures and aggregates features in a DataFrame.
- The `main()` function persists artifacts, fits the classifiers, and draws
  plots for quick inspection.

Feel free to tweak the random seed, number of samples, or classifier hyperparameters
for further experiments.
