# Biometric Signatures Overview

## Purpose

This document summarizes the practical state of behavioral authorship signals and how StagePort
adapts them into a deployable provenance pipeline.

## What exists today

### 1) Keystroke dynamics
Research and enterprise tools have long used timing patterns (hold times, inter-key intervals,
error rhythm) for user authentication and risk scoring.

### 2) Watermarking
Text and media watermarking methods embed statistical or structural traces to support provenance
claims after publication.

### 3) Stylometry
Authorship attribution can estimate likely authors from linguistic style patterns, though results
are probabilistic and sensitive to adversarial editing.

## What is not mainstream yet

A widely adopted product that combines:
- real-time cadence features,
- cryptographic content binding,
- and explicit refusal states when provenance cannot be trusted.

This hybrid is the gap StagePort targets.

## Proposed architecture: CadenceBox / CadencePort

### CadenceBox (local capture + normalization)
- Captures event timing metadata (`keydown`, `keyup`, timestamps, key classes).
- Derives normalized feature vectors.
- Exports only derived features by default (not raw key logs).

### CadencePort (binding + verification)
- Computes `content_hash` for document payload.
- Computes `cadence_hash` from serialized feature vectors.
- Computes `binding_hash = sha256(content_hash || cadence_hash || session_id)`.
- Signs binding hash and emits `signature.json`.
- Verifier recomputes hashes and validates signature.

## Threat model notes

- **Retyping attack:** an attacker may manually retype text to generate plausible cadence; mitigated
  with baseline comparison and confidence thresholds.
- **Paste-only submissions:** paste lacks meaningful cadence capture; must trigger refusal.
- **Noisy environments:** unstable timing capture should downgrade confidence or refuse.

## Operational principle

When provenance quality is weak, the system should refuse certification. A high-integrity pipeline
must prefer explicit uncertainty over false assurance.
