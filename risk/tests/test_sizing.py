from __future__ import annotations

import math
import unittest

from risk import RiskBudget, position_size


class PositionSizeTests(unittest.TestCase):
    def test_position_size_basic(self) -> None:
        budget = RiskBudget(50)
        size = position_size(budget, stop_distance=5.0, notional=1_000_000)
        self.assertAlmostEqual(size, 1_000.0)

    def test_zero_or_negative_stop_distance_returns_zero(self) -> None:
        budget = RiskBudget(75)
        self.assertEqual(position_size(budget, stop_distance=0.0, notional=500_000), 0.0)
        self.assertEqual(position_size(budget, stop_distance=-2.5, notional=500_000), 0.0)

    def test_negative_budget_rejected(self) -> None:
        with self.assertRaises(ValueError):
            RiskBudget(-1)

    def test_fraction_helper(self) -> None:
        budget = RiskBudget(12.5)
        self.assertTrue(math.isclose(budget.fraction, 0.00125))


if __name__ == "__main__":
    unittest.main()
