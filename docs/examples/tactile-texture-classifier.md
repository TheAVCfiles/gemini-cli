# Tactile texture classifier (lightweight)

This example script builds a compact tactile texture dataset by simulating
a small grid of mechanoreceptors, extracting envelope/spiking statistics,
and training two baseline classifiers. The parameters are tuned for fast
execution so the pipeline can finish within a couple of minutes even on
modest CPUs.

## Highlights

- ✅ Reduced sample count (20 per label, 100 total) and a 6×6 receptor grid
  keep the simulation small while still producing separable features.
- ✅ The script saves a ready-to-use CSV dataset plus PNG artifacts for
  confusion matrices and random forest feature importances.
- ✅ Logistic Regression uses standardized features, while the Random Forest
  operates on raw values to demonstrate two complementary baselines.

## Running the demo

```bash
python docs/examples/tactile_texture_classifier_small.py
```

Outputs:

- `tactile_dataset_small.csv` (written to `/mnt/data/` by default)
- `tactile_confusion_matrices.png`
- `tactile_feature_importances.png`
- Classification reports for both models in the console

The figures are saved to the working directory so they can be inspected or
embedded into reports without requiring an interactive Matplotlib backend.
