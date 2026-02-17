from __future__ import annotations

import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
import pandas as pd

import day_sheet_writer
import institutional_filter
import live_gate
import regime_writer


class InstitutionalConfidenceTests(unittest.TestCase):
    def test_block_bootstrap_returns_bounded_result(self) -> None:
        rng = np.random.default_rng(5)
        x = rng.normal(size=300)
        y = np.roll(x, 3) + rng.normal(scale=0.2, size=300)

        tau, ci, p_value = institutional_filter.block_bootstrap_ci(
            pd.Series(x),
            pd.Series(y),
            block_size=5,
            n_boot=200,
            alpha=0.05,
        )

        self.assertTrue(-20 <= tau <= 20)
        self.assertEqual(ci.shape, (2,))
        self.assertTrue(-1.0 <= float(ci[0]) <= 1.0)
        self.assertTrue(-1.0 <= float(ci[1]) <= 1.0)
        self.assertTrue(0.0 <= p_value <= 1.0)


    def test_block_bootstrap_handles_pairwise_nans(self) -> None:
        x = pd.Series([0.1, 0.2, np.nan, 0.4, 0.5, 0.6] * 20)
        y = pd.Series([0.2, np.nan, 0.3, 0.5, 0.7, 0.8] * 20)

        tau, ci, p_value = institutional_filter.block_bootstrap_ci(
            x,
            y,
            block_size=5,
            n_boot=100,
            alpha=0.05,
        )

        self.assertTrue(-20 <= tau <= 20)
        self.assertEqual(ci.shape, (2,))
        self.assertTrue(0.0 <= p_value <= 1.0)

    def test_regime_writer_closes_when_pvalue_fails(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            out = Path(temp_dir) / "out"
            out.mkdir()

            pd.DataFrame(
                {
                    "tap_date": ["2025-10-01"],
                    "h30d_return": [0.005],
                    "Confirmation_Type": ["STRUCTURAL_CONFIRMED_W=92"],
                }
            ).to_csv(out / "backtest_overlay_results.csv", index=False)

            pd.DataFrame(
                {
                    "horizon": [30],
                    "tau_star": [3.5],
                    "ci_lower": [1.2],
                    "ci_upper": [5.8],
                    "ci_status": ["Excludes 0"],
                }
            ).to_csv(out / "tau_star_summary.csv", index=False)

            pd.DataFrame({"horizon": [30], "p_value": [0.33]}).to_csv(
                out / "event_study_permutation_summary.csv", index=False
            )

            original_dir = regime_writer.OUTPUT_DIR
            original_overlay = regime_writer.OVERLAY_CSV
            original_tau = regime_writer.TAU_CSV
            original_perm = regime_writer.PERM_CSV
            original_regime = regime_writer.REGIME_FILE
            original_tmp = regime_writer.TEMP_FILE
            try:
                regime_writer.OUTPUT_DIR = out
                regime_writer.OVERLAY_CSV = out / "backtest_overlay_results.csv"
                regime_writer.TAU_CSV = out / "tau_star_summary.csv"
                regime_writer.PERM_CSV = out / "event_study_permutation_summary.csv"
                regime_writer.REGIME_FILE = out / "daily_overlay_regime.json"
                regime_writer.TEMP_FILE = out / "daily_overlay_regime.json.tmp"

                payload = regime_writer.write_regime_file()

                self.assertEqual(payload["regime_status"], "CLOSED_DEFENSIVE")
                self.assertTrue(payload["struct_confirmed"])
                self.assertTrue(payload["tau_ci_excludes_zero"])
                self.assertEqual(payload["tap_p_value"], 0.33)
                self.assertEqual(payload["tap_weight_max"], 92)
                self.assertIn("hash_sha256", payload)
            finally:
                regime_writer.OUTPUT_DIR = original_dir
                regime_writer.OVERLAY_CSV = original_overlay
                regime_writer.TAU_CSV = original_tau
                regime_writer.PERM_CSV = original_perm
                regime_writer.REGIME_FILE = original_regime
                regime_writer.TEMP_FILE = original_tmp

    def test_live_gate_rejects_tampered_hash(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            regime_file = Path(temp_dir) / "daily_overlay_regime.json"
            now = datetime.now(timezone.utc)
            payload = {
                "timestamp": now.isoformat().replace("+00:00", "Z"),
                "regime_expiry_utc": (now + timedelta(hours=1)).isoformat().replace("+00:00", "Z"),
                "regime_status": "OPEN",
                "struct_confirmed": True,
                "tau_ci_excludes_zero": True,
                "tap_p_value": 0.01,
                "tap_weight_max": 92,
                "hash_sha256": "bad",
            }
            regime_file.write_text(json.dumps(payload), encoding="utf-8")

            original = live_gate.REGIME_FILE
            try:
                live_gate.REGIME_FILE = regime_file
                is_open, weight, details = live_gate.read_regime_gate()
            finally:
                live_gate.REGIME_FILE = original

            self.assertFalse(is_open)
            self.assertEqual(weight, 75)
            self.assertIsNone(details)

    def test_day_sheet_requires_valid_regime_hash(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            out = Path(temp_dir) / "out"
            out.mkdir()

            regime = {
                "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                "regime_expiry_utc": (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat().replace(
                    "+00:00", "Z"
                ),
                "regime_status": "OPEN",
                "struct_confirmed": True,
                "tau_ci_excludes_zero": True,
                "tap_p_value": 0.01,
                "tap_weight_max": 92,
                "hash_sha256": "invalid",
            }
            (out / "daily_overlay_regime.json").write_text(json.dumps(regime), encoding="utf-8")

            pd.DataFrame(
                [
                    {
                        "symbol": "LIT",
                        "pivot": 72.15,
                        "s1": 71.39,
                        "s2": 70.83,
                        "r1": 73.47,
                        "r2": 74.57,
                        "atr_band_low": 71.2,
                        "atr_band_high": 74.2,
                        "invalidation": 70.0,
                    }
                ]
            ).to_csv(out / "levels_latest.csv", index=False)

            original_out = day_sheet_writer.OUTPUT_DIR
            original_regime = day_sheet_writer.REGIME_JSON
            original_levels = day_sheet_writer.LEVELS_CSV
            try:
                day_sheet_writer.OUTPUT_DIR = out
                day_sheet_writer.REGIME_JSON = out / "daily_overlay_regime.json"
                day_sheet_writer.LEVELS_CSV = out / "levels_latest.csv"

                with self.assertRaises(ValueError):
                    day_sheet_writer.generate_day_sheet()
            finally:
                day_sheet_writer.OUTPUT_DIR = original_out
                day_sheet_writer.REGIME_JSON = original_regime
                day_sheet_writer.LEVELS_CSV = original_levels


if __name__ == "__main__":
    unittest.main()
