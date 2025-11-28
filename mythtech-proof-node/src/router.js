// src/router.js
import { SERIES_A, SERIES_B, SERIES_C } from "./config.js";

export function routeSeries(nodeLabel) {
  if (!nodeLabel) return "Unknown Series";
  const id = nodeLabel.split(" ")[0]; // "A4", "B3", etc.

  if (SERIES_A.includes(id)) return "Series A — Signal Chamber";
  if (SERIES_B.includes(id)) return "Series B — Encrypted Mythos";
  if (SERIES_C.includes(id)) return "Series C — Feedback Loop";
  return "Unknown Series";
}
