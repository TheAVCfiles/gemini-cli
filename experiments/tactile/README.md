# Tactile receptor simulation (lightweight)

This directory contains a reduced version of the tactile receptor simulation
workflow. The script lowers the sample count and receptor grid size so it can be
executed quickly when exploring the mechanoreceptor texture classification
example.

## Usage

```bash
python generate_tactile_dataset_small.py
```

The script writes `tactile_dataset_small.csv` alongside the code and shows
confusion matrices and feature importance plots for the trained classifiers.
