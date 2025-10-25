# Curator ledger transaction example

This example demonstrates how to document a Gemini payout ledger entry for archival or ingestion testing. Each record is a JSON
object that captures when the transaction was received, how many credits moved, and where the source data originated.

## Fields

| Field | Description |
| ----- | ----------- |
| `txn_id` | Unique identifier for the transaction. Use this for idempotency and traceability in downstream systems. |
| `ts` | Timestamp in ISO 8601 format (UTC). Preserve the full precision when storing or replaying events. |
| `type` | Transaction classification. Current values include `attention_charge`, `curator_credit`, `treasury_inflow`, and `payout`. |
| `amount_cents` | Amount represented in integer cents so calculations remain lossless. |
| `actor_id` | Identifier for the agent (for example, a curator record) associated with the transaction. |
| `source_receipt` | External receipt or ledger reference supplied by the treasury service. |
| `metadata` | Arbitrary structured payload. Preserve this object even if it is empty to keep the schema stable. |

## Sample record

```json
{
  "txn_id": "txn_0001",
  "ts": "2025-10-20T14:40:00Z",
  "type": "attention_charge|curator_credit|treasury_inflow|payout",
  "amount_cents": 100,
  "actor_id": "curator_12",
  "source_receipt": "rr_20251020_0001",
  "metadata": {
    "notes": "Additional fields can be included as needed."
  }
}
```

When you test ingestion flows with Gemini CLI, store each event on its own line in an append-only log. Downstream tooling can
then stream the file and reconcile balances without double counting.
