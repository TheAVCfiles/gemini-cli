# AVC Systems Studio Container v1 kit

This kit builds the offline-safe packet described in the "Full zip styling end-to-end" brief. It produces a ready-to-zip folder with the exact structure, placeholders for each artifact, and a manifest with SHA-256 hashes so the packet can be audited without you present.

## What the build script does
- Creates the canonical `AVC_Systems_Studio_Container_v1/` directory tree.
- Writes lightweight placeholder files for every slot in the spec (PDFs, PNGs, SVG, JSON, TXT).
- Generates a `MANIFEST/FILE_INDEX.csv`, `MANIFEST/SHA256SUMS.txt`, and `MANIFEST/GENERATED_UTC.txt` so custody and verification are baked in.
- Seeds ledger schema + sample entry to match the custody ledger flow (Artifact ID → SHA-256 hash → role → action → timestamp → signature).

The placeholders keep the container distributable in git while flagging exactly what final artifacts need to be swapped in (design-complete PDFs, diagrams, magazine template, etc.).

## Usage

```bash
# Generate the container into kits/avc-systems-studio-container/dist
node kits/avc-systems-studio-container/scripts/build-container.js

# Optionally zip it for distribution
cd kits/avc-systems-studio-container/dist
zip -r AVC_Systems_Studio_Container_v1.zip AVC_Systems_Studio_Container_v1
```

After generation, hand off the folder or the zip. Every file is indexed and hashed for quick verification during counsel review, diligence, or custody disputes.

## Included templates
- `templates/Annual_Kinematics_Statement.md` — single-page AKS layout that ties kinematic value to Sentient Cents with tax-safe language.

## Notes
- The script is deliberately boring: no external dependencies, no network calls.
- Swap the placeholder files with final designed assets before distribution, then regenerate the manifest so hashes match the shipped packet.
