# IntuitionLabs Interactive Services API

The IntuitionLabs curriculum connects to a small set of operational APIs that power badge minting, community governance, and learner support. These endpoints pair with the assets housed in the shared [vector store snapshot](https://platform.openai.com/storage/vector_stores/vs_6859e43920848191a894dd36ecf0595a), allowing facilitators to source consistent prompts and evidence while automating record keeping.

Each section below lists the canonical request schema, required fields, and notes about downstream systems so Gemini CLI scripts or external automations can call the services safely.

---

## Wallet Transactions

**Endpoint:** `POST /wallets/{walletId}/transactions`

Used when a learner earns or spends ClassCoin inside Ballet Bots or partner programs.

```jsonc
{
  "type": "earn",              // "earn" | "spend"
  "amount": 7.80,               // Decimal value, precision to two places
  "currency": "ClassCoin",     // Enum matching curriculum tokens
  "reason": "TES: pivot_720_hold2 (GOE +2)",
  "episodeId": "S1E02",        // Links to curriculum episode or module
  "evidence": {
    "scorecardUrl": "https://ops.intuitionlabs/episodes/S1E02/tes.json",
    "frameHashes": ["b9f…", "35a…"]
  },
  "meta": {
    "judgePanel": "AI_Judges_v0.9",
    "consistency": 0.98
  }
}
```

**Notes**

- `walletId` path parameter targets the custodial or delegated wallet record.
- `evidence.scorecardUrl` should point to an item versioned inside the vector store bundle for traceability.
- `meta.consistency` is a float between `0` and `1` produced by the adjudication model.
- Transactions surface in facilitator dashboards and power badge-issuance triggers documented in [minting_system_overview.md](./class_overviews/minting_system_overview.md).

---

## Sticker Minting

**Endpoint:** `POST /stickers`

Mints collectible stickers that mirror on-chain badge achievements but live inside the classroom companion app.

```jsonc
{
  "stickerId": "stagecred-gold-s1e02",  // Unique slug
  "rarity": "Sigil",                    // Rarity tier enum
  "title": "Stage Cred • Gold",
  "ownerWalletId": "wallet_7YF3",
  "criteria": {
    "threshold": "STAGE_CRED_GOLD",
    "source": "rubrics://stage_cred/v1",
    "evidenceUri": "ipfs://Qm…"
  },
  "art": {
    "theme": "lavender-foil",
    "preview": "https://ops.intuitionlabs/assets/stagecred-gold.png"
  }
}
```

**Notes**

- Sticker metadata mirrors the ERC-1155 badge template to keep collectibles aligned with blockchain issuance.
- `criteria.evidenceUri` must reference an IPFS CID that is also catalogued in the shared vector store.
- Use `ownerWalletId` to mirror custodial-to-family transfers when guardians claim wallets.

---

## Governance Votes

**Endpoint:** `POST /governance/votes`

Captures facilitator or learner votes on live programming decisions.

```jsonc
{
  "proposalId": "FG-ETHICS-12",
  "title": "Should BCTV #4 include the ‘apology crawl’?",
  "choices": ["Yes", "No", "Abstain"],
  "voterWalletId": "wallet_11AB",
  "choice": "Yes",
  "weight": 1,
  "meta": {
    "role": "Associate Empathy Consultant",
    "episode": "S1E04"
  }
}
```

**Notes**

- `weight` defaults to `1` for single-vote roles but can scale for multi-representative panels.
- `meta.role` and `meta.episode` provide context for auditing votes against curriculum episodes.
- Proposals are seeded from the governance playbooks stored with the vector store snapshot.

---

## Glue Support Requests

**Endpoint:** `POST /glue/requests`

Coordinates wellness and mentorship support via the GLUE (Guided Learner Uplift & Encouragement) network.

```jsonc
{
  "walletId": "wallet_7YF3",
  "reason": "Caption fatigue after livestream sprint",
  "priority": "medium",                // low | medium | high
  "supportType": ["mentor", "caption-polish"],
  "episodeContext": "S1E03",
  "notes": "Need neuro-friendly workflow & caption tone pass."
}
```

**Notes**

- `supportType` accepts one or more service codes routed to GLUE coordinators.
- Requests create follow-up tasks that reference the same learner wallet ID as transactions and stickers.
- Combine with governance vote data to surface holistic learner support dashboards.

---

### Automation Tips

- Store service credentials with your Gemini CLI configuration to generate signed HTTP requests during class facilitation.
- Use the vector store snapshot for prompt templates that transform evidence into JSON payloads shown above.
- Schedule nightly audits that call each endpoint with dry-run flags to ensure schema drift is detected before live sessions.

