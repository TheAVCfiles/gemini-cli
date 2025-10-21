import unittest

from regime_gate import (
    GlitchSignal,
    StructureSignal,
    VolSignal,
    evaluate_regime,
    structure_bucket,
)


class StructureSignalTests(unittest.TestCase):
    def test_score_bounds(self) -> None:
        with self.assertRaises(ValueError):
            StructureSignal(score=101)

        with self.assertRaises(ValueError):
            StructureSignal(score=-1)

        # valid boundaries should not raise
        StructureSignal(score=0)
        StructureSignal(score=100)

    def test_structure_bucket(self) -> None:
        strong = StructureSignal(score=90)
        watch = StructureSignal(score=72)
        weak = StructureSignal(score=40)

        self.assertEqual(structure_bucket(strong), "strong")
        self.assertEqual(structure_bucket(watch), "watch")
        self.assertEqual(structure_bucket(weak), "weak")


class EvaluateRegimeTests(unittest.TestCase):
    def test_gate_opens_on_strong_inputs(self) -> None:
        structure = StructureSignal(score=92)
        glitch = GlitchSignal(wick_rejection=True)
        vol = VolSignal(spike=False)

        decision = evaluate_regime(
            structure,
            tau_ci_excludes_zero=True,
            perm_p_value=0.02,
            glitch=glitch,
            vol=vol,
        )

        self.assertTrue(decision.gate_open)
        self.assertEqual(decision.tap_weight, 92)
        self.assertEqual(decision.risk_budget_bps, 50)
        self.assertTrue(decision.diagnostics["glitch_confirmed"])

    def test_gate_closes_on_vol_spike_and_high_p(self) -> None:
        structure = StructureSignal(score=88)
        vol = VolSignal(spike=True)

        decision = evaluate_regime(
            structure,
            tau_ci_excludes_zero=True,
            perm_p_value=0.12,
            vol=vol,
        )

        self.assertFalse(decision.gate_open)
        self.assertIn("vol_spike", decision.reasons)
        self.assertIn("perm_p_above_threshold", decision.reasons)
        # structure still satisfied its threshold so the original weight is kept
        self.assertEqual(decision.tap_weight, 88)
        self.assertEqual(decision.risk_budget_bps, 5)

    def test_to_dict_serializes_diagnostics(self) -> None:
        decision = evaluate_regime(
            StructureSignal(score=85),
            tau_ci_excludes_zero=False,
            perm_p_value=0.5,
        )

        payload = decision.to_dict()
        self.assertEqual(payload["gate_open"], False)
        self.assertIn("diagnostics", payload)
        self.assertFalse(payload["diagnostics"]["tau_ci_ok"])


if __name__ == "__main__":
    unittest.main()

