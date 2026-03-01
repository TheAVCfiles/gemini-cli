# YC SAFE Onchain Provenance Notary

This note captures the optional "benevolent notary" layer for YC SAFE agreements so founders can timestamp and prove integrity without surrendering control of the underlying contract. It aligns with the StagePort provenance spine and the Living Language Engine ethic of conserved artifacts.

## Goals
- **Timestamp proof:** Demonstrate that a specific filled SAFE existed at or before a given block time.
- **Tamper detection:** Any bit-level change to the agreement changes the stored hash.
- **Founder-first posture:** No terms are executed onchain; only the hash and credential live on the ledger.
- **Low-cost paths:** Target Base or Polygon for <$0.01 per proof; fallback to OpenTimestamps or other receipt relays if needed.

## Core Flow
1. **Prepare the agreement (offchain):** Founder completes the YC SAFE template and retains the signed PDF (wet/e-sign remains the legal anchor).
2. **Hash locally:** Frontend derives `bytes32 docHash = keccak256(fileBytes)` entirely client-side. No document content leaves the device.
3. **Mint provenance receipt:** Call the onchain contract with `mintProof(docHash)` to anchor the hash. The transaction emits an event and records minter + timestamp for audit.
4. **Store receipt in StagePort:** Persist the tx hash, block time, and docHash alongside the SAFE metadata so any vault query can surface provenance.
5. **Verify:** Anyone can recompute the hash on their copy and call `verify(docHash)` (or read the event) to confirm minter and block timestamp.

## Minimal Contract (Base/Polygon)
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SafeProvenance {
    mapping(bytes32 => address) public proofs;
    mapping(bytes32 => uint256) public timestamps;

    event ProvenanceMinted(bytes32 indexed docHash, address indexed minter, uint256 timestamp);

    function mintProof(bytes32 docHash) external {
        require(docHash != bytes32(0), "empty hash");
        require(proofs[docHash] == address(0), "already minted");

        proofs[docHash] = msg.sender;
        timestamps[docHash] = block.timestamp;
        emit ProvenanceMinted(docHash, msg.sender, block.timestamp);
    }

    function verify(bytes32 docHash) external view returns (address minter, uint256 timestamp) {
        return (proofs[docHash], timestamps[docHash]);
    }
}
```

- **Network:** Deploy on Base for YC-friendly, low-fee access; mirror to Ethereum mainnet if counterparties require L1 finality.
- **Privacy:** Only the hash is public. If confidentiality is critical, salt the hash client-side and store the salt in the founder's vault.
- **Upgrades:** Keep contract immutable; if new metadata is needed, append with a registry that references existing docHash anchors.

## Sentient Credential Extension
- Wrap the proof in an ERC-721 mint (e.g., `SAFE Provenance Gold`) that issues a non-transferable token when `mintProof` succeeds.
- Embed StageCred hooks: token metadata lists docHash, block number, and optional eligibility score so downstream funding vehicles can read it.

## UI Hooks (Owl / StagePort)
- **Upload + hash drawer:** Drag-and-drop SAFE PDF → client-side hash preview → checksum copy button.
- **Onchain toggle:** "Anchor to Base" button that triggers `mintProof` via connected wallet; surface estimated gas and privacy note.
- **Receipt storage:** Save `docHash`, tx hash, block time, and optional salted preimage reference in the founder's vault entry.
- **Verification chip:** Display "Provenance anchored" status with a link to the explorer and a one-click hash recompute.

## Risk + Safety Notes
- Do not treat onchain anchoring as execution; the signed PDF remains the binding agreement.
- Advise founders to re-hash after any amendment and mint a new proof (old proofs remain valid for prior states).
- Provide clear copy about public hash visibility and the option to salt before anchoring.

## Next Steps
- Add client-side hashing + `mintProof` call flow to the Owl UI.
- Publish deployment scripts for Base and a minimal explorer link helper.
- Add StagePort vault schema fields: `safeDocHash`, `safeProvenanceTx`, `safeProvenanceTimestamp`, and optional `safeHashSalted` flag.
