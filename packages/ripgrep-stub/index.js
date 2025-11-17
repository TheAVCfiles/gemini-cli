/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Provide a stable path to a ripgrep binary. Default to the system `rg` if
// none is specified. This mirrors the interface used by the real
// `@lvce-editor/ripgrep` package without downloading platform binaries.
export const rgPath = process.env.RG_PATH ?? 'rg';
