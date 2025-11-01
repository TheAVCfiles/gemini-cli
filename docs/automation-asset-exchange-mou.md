# Automation Asset Exchange Memorandum of Understanding (MOU)

This template captures barter- and credential-friendly collaboration agreements between Decrypt Haus Systems Studios and partner organizations. It is designed for use alongside the Credential Engine / proof ledger JSON schema.

---

## 1️⃣ Parties

**Creator / Provider**  
**Name:** Allison Van Cura (Decrypt Haus / Decrypt the Girl)  
**Email:** decryptthegirl+exchange@gmail.com  
**Role:** Systems Architect & Creative Automation Provider

**Partner / Recipient**  
**Name:** ______________________________________  
**Email:** ______________________________________  
**Role:** ______________________________________

---

## 2️⃣ Purpose

The Parties wish to collaborate by exchanging **automation assets, digital systems, or creative infrastructure** for **resources, services, or equity** without immediate monetary payment.

This MOU defines the scope of systems shared, reciprocal value offered, terms of use, and the proof of completion & credentialing process.

---

## 3️⃣ Exchange Summary

| Field | Description |
| --- | --- |
| **Product / Engine Provided** | _(e.g., Cycle Engine / Credential Engine / Glissé Engine)_ |
| **Version / Build ID** | _(e.g., v1.2-beta / JSON manifest attached)_ |
| **Value Estimate** | _$________ (for record / equity equivalence)_ |
| **Partner Contribution** | _(e.g., studio hours / access / service / 1% equity)_ |
| **Duration** | _______ months_ |
| **Delivery Date** | ______________________ |
| **Proof Credential ID** | _(auto-issued by Credential Engine, JSON file)_ |

---

## 4️⃣ Access & Attribution Terms

1. The Provider grants the Partner **non-exclusive, revocable access** to the system(s) identified above for the stated duration.
2. All underlying IP remains the property of **Decrypt Haus / Allison Van Cura**.
3. The Partner agrees to:
   - Maintain visible attribution ("Powered by Decrypt Haus Systems" or equivalent).
   - Not redistribute, sell, or sublicense the system without written consent.
4. If either party fails to deliver their agreed contribution within 30 days, access may be revoked.

---

## 5️⃣ Proof & Credentialing

1. Upon signing, the Provider issues a **digital receipt credential (JSON)** documenting the exchange.
2. The credential records:
   - MOU ID
   - System provided
   - Partner contribution
   - Date and signature hash
3. The credential is stored in the shared `proof_ledger.json` and remains accessible via Decrypt Haus.

---

## 6️⃣ Liability & Privacy

Each party bears responsibility for its own work and compliance. No sensitive or personal data is collected beyond what is required to verify delivery. Neither party is liable for indirect or consequential damages.

---

## 7️⃣ Amendments

Changes to this agreement must be recorded as a new version and logged as a **credential update** with timestamp and hash.

---

## 8️⃣ Signatures

| Party | Signature | Date |
| --- | --- | --- |
| Provider: Allison Van Cura | ____________________ | __________ |
| Partner: ____________________ | ____________________ | __________ |

---

## 9️⃣ Credential JSON Example

```json
{
  "mou_id": "DTG-MOU-2025-001",
  "provider": "Allison Van Cura / Decrypt Haus",
  "partner": "Partner Name",
  "system": "Cycle Engine",
  "version": "v1.2-beta",
  "value_usd": 1200,
  "partner_contribution": "20 studio hours",
  "duration_months": 3,
  "proof_credential_id": "DTG-CRED-2025-001",
  "signature_hash": "sha256-xyz123...",
  "timestamp": "2025-10-29T22:31Z"
}
```

---

## 10️⃣ Optional Fillable Document Workflow

1. Duplicate this template into a Google Doc and convert the fields into form-fillable lines or tables.
2. Attach the credential JSON example as an appendix or embed it as a code block for partner reference.
3. When the agreement is finalized, generate the credential payload and append the resulting file to the shared proof ledger.
4. Capture the signature hash from the chosen e-signature platform and record it in the credential payload to complete the proof chain.

