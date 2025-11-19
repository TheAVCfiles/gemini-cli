#!/usr/bin/env python3
"""Train baseline classifiers for the synthetic mythtouch dataset."""

from __future__ import annotations

import argparse
import json
import pickle
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", required=True, help="CSV produced by make_dataset.py")
    parser.add_argument("--model_out", default="model.pkl", help="Path to store the best model.")
    parser.add_argument("--scaler_out", default="scaler.pkl", help="Path to store the fitted scaler.")
    parser.add_argument("--labels_out", default="labels.json", help="Path to store the label list.")
    parser.add_argument("--test_size", type=float, default=0.25, help="Fraction of data for validation.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for splits and models.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    df = pd.read_csv(args.data)
    if "label" not in df.columns:
        raise SystemExit("Input CSV is missing a 'label' column.")

    X = df.drop(columns=["label"]).values
    y = df["label"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=args.test_size, random_state=args.seed, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    lr = LogisticRegression(max_iter=2_000, multi_class="multinomial", random_state=args.seed)
    lr.fit(X_train_scaled, y_train)
    y_pred_lr = lr.predict(X_test_scaled)
    acc_lr = accuracy_score(y_test, y_pred_lr)

    rf = RandomForestClassifier(n_estimators=400, random_state=args.seed)
    rf.fit(X_train, y_train)
    y_pred_rf = rf.predict(X_test)
    acc_rf = accuracy_score(y_test, y_pred_rf)

    if acc_rf >= acc_lr:
        best_kind = "rf"
        best_model = rf
        best_pred = y_pred_rf
    else:
        best_kind = "lr"
        best_model = lr
        best_pred = y_pred_lr

    Path(args.model_out).parent.mkdir(parents=True, exist_ok=True)
    with open(args.model_out, "wb") as fh:
        pickle.dump({"kind": best_kind, "model": best_model}, fh)

    with open(args.scaler_out, "wb") as fh:
        pickle.dump(scaler, fh)

    with open(args.labels_out, "w", encoding="utf-8") as fh:
        json.dump(sorted(np.unique(y).tolist()), fh, indent=2)

    report = classification_report(y_test, best_pred, zero_division=0)
    summary = {
        "logistic_accuracy": acc_lr,
        "random_forest_accuracy": acc_rf,
        "chosen_model": best_kind,
        "model_path": str(Path(args.model_out).resolve()),
    }
    print(json.dumps(summary, indent=2))
    print(report)


if __name__ == "__main__":
    main()
