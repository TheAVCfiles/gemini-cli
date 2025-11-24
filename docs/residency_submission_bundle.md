# Residency Submission Bundle Plan

This document captures the requested submission materials and safe-handling plans for large artifacts.

## Cover Letter

[Today's Date]

Selection Committee  
[Program / Institution Name]

Dear Review Committee,

I am submitting my application for the Residency / Fellowship in Systems, Performance, and Computational Design. My work operates at the intersection of embodied cognition, systems architecture, and ethical computation — translating 35 years of choreographic intelligence into reproducible models for adaptive systems, governance logic, and provenance-grade authorship.

Across my practice — from professional dance to operational leadership to formal research — I treat movement as computation and computation as choreography. My recent contributions include the Retiré Field, the Fold Pressure Engine, the PMN/FDN integrity suite, and the Adaptive Ethics series. These artifacts operationalize timing, embodiment, constraint, and narrative coherence into machine-grade primitives suitable for real-time systems, interactive environments, and archival provenance.

My submitted materials include:

- Operational Architecture Portfolio — documenting systems transformation in a complex performing arts institution.
- Adaptive Ethics Vol. 1 — Secure Edition — a scholarly, archive-ready release (DOI: 10.5281/zenodo.17282954) with provenance ledger.
- Technical Dossier — detailing `computeFoldPressure()`, shader integrations, canonical LUTs, the reaper kernel, and FDN semantics.
- Machine-Certified Competency Report — produced by an independent system reviewing the reproducibility and internal integrity of the work.
- Retiré Room Release — a full code + shader + dependency bundle demonstrating embodied computation in a real-time engine.

My work aims to contribute a new category of research: somatic systems architecture — an approach where choreographic intelligence informs computational alignment, ethical constraint, and narrative governance. This residency would provide the intellectual space and institutional support needed to expand MythOS™, deepen the Adaptive Ethics framework, and develop new models for trauma-safe authorship and embodied intelligence in computational systems.

Thank you for your consideration. I welcome the opportunity to contribute to — and grow within — your research and creative community.

Sincerely,  
Allison Van Cura (AVC)  
Intuition Labs / DeCrypt the Girl  
acfwrites@gmail.com  
ORCID: 0009-0005-4161-4898

## Integrated Portfolio PDF — Safe Execution Plan

Large binaries must be handled locally to avoid exceeding environment limits.

- **Merge together locally**: `Allison_Van_Cura_Operational_Architecture_Portfolio.pdf`, `Residency_Binder_AVC.pdf`, and `AVC_Machine_Certified_Competency_Report_v1.pdf` using Preview, Acrobat, or a CLI merger.
- **Keep separate**: Retiré full release, LUT packs, multi-file Secure Edition, shader libraries, and TouchDesigner network bundles should remain standalone artifacts rather than merged into the PDF.
- Optional: add a cover page before merging if desired.

## GitHub Research Repository Scaffold

```
MythOS-Residency-Submission/
├── README.md
├── CITATION.cff
├── LICENSE
├── portfolio/
│   ├── Operational_Architecture_Portfolio.pdf
│   ├── Residency_Binder_AVC.pdf
│   └── AVC_Machine_Certified_Competency_Report_v1.pdf
├── retirefield/
│   ├── retirefield_full_release_vE.zip
│   ├── retirefield_foldpressure_lut_v2.zip
│   └── shaders/
├── adaptive-ethics/
│   ├── Adaptive_Ethics_Vol1_SecureEdition.zip
│   ├── index.html
│   ├── README_SecureEdition.txt
│   └── PROVENANCE_MANIFEST.json
├── physics-protocol/
│   ├── tests/
│   ├── config_v2.py
│   └── v90d100_protocol_production.py
└── submission/
    ├── Cover_Letter.pdf
    └── Short_Pitch.txt
```

Automatable items include `README.md`, `CITATION.cff`, `LICENSE`, and the folder layout.

## Final Submission ZIP — Local Manifest

To avoid environment size limits, assemble this bundle locally as `AVC_Residency_Submission_Final/` before compressing to `AVC_Residency_Submission_Final.zip`:

- Cover_Letter.pdf
- Short_Pitch.txt
- Professional_Bio.txt
- AVC_Integrated_Portfolio.pdf
- AVC_Machine_Certified_Competency_Report_v1.pdf
- Residency_Binder_AVC.pdf
- Allison_Van_Cura_Operational_Architecture_Portfolio.pdf
- retirefield_full_release_vE.zip
- retirefield_foldpressure_lut_v2.zip
- Adaptive_Ethics_Vol1_SecureEdition_Final_Bundle.zip
- README_SecureEdition.txt
- index.html
- zenodo_metadata_secure_edition.json
- physics_protocol/ (from the provided test file)
- Glitch_as_Entry_POC.html

Provide a machine-readable manifest alongside the zip if reviewers require one.
