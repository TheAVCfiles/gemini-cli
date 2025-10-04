# Territory Scaling Signal Playbook

This example demonstrates how to interpret a structured signal payload when deciding whether to expand operations into a new territory. It assumes the Gemini CLI ingests telemetry or forecasting data produced by upstream planners and that the automation layer ultimately calls into human-in-the-loop review workflows.

## Sample payload

```json
{
  "tri_sigma": 2.87,
  "wtap": 0.92,
  "kinetic_gain_factor": 0.96,
  "action": "SCALE-UP TERRITORY",
  "p_value": 0.034,
  "structure_confirmed": true,
  "tau_ci_excludes_zero": true,
  "regime_open": true,
  "timestamp": "2025-10-04T12:00:00Z"
}
```

## Decision checklist

1. **Structural confirmation** – Require both `structure_confirmed` and `tau_ci_excludes_zero` to be `true`. When either flag is `false`, route the packet to the risk analyst queue instead of auto-approving expansion.
2. **Volatility gate** – Treat `tri_sigma` ≥ 2.5 as the lower bound for the momentum needed to justify scaling up. Readings above 3.5 should trigger an additional stress test because they signal unusual variance.
3. **WTAP threshold** – Consider `wtap` values ≥ 0.90 to indicate that the weighted territory activation probability passes the go/no-go threshold. Numbers between 0.80 and 0.89 should remain in watch mode.
4. **Kinetic gain guardrails** – Maintain `kinetic_gain_factor` between 0.8 and 1.1. Anything outside that range suggests an execution mismatch between supply and expected demand.
5. **Statistical significance** – Require `p_value` ≤ 0.05 before unlocking additional budget. If the value is higher, schedule a rerun when new evidence arrives.
6. **Regime status** – Block expansion when `regime_open` is `false`. Combine this flag with a manual confirmation from regional ops leaders to comply with playbook governance.

## Automation hooks

- **CLI recipe** – Store a JSONata or jq script that validates the checklist criteria before emitting a `scale_up_territory` command. Integrate the script into a Gemini CLI task template for quick reuse.
- **Alerting** – Send a structured message to the operations Slack channel summarizing the payload and highlighting any factors that landed near the thresholds. Include links back to the Gemini CLI transcript for auditability.
- **Post-action review** – After executing the scale-up, persist the payload, decision outcome, and reviewer ID in a lightweight datastore (e.g., `ops_decisions.jsonl`) so that downstream analytics can measure hit rates and calibrate the thresholds over time.

## Human-in-the-loop guidance

Even when automation clears the checklist, request an asynchronous acknowledgement from the territory GM within four business hours. This balances speed with accountability and gives local teams a chance to raise unexpected blockers (supply shocks, regulatory updates, etc.).

Document all overrides in the Gemini CLI session notes so the forecasting models can ingest the rationale during their nightly retraining cycle.
