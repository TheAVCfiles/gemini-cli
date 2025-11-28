export function streetCoins(pnl_pct: number, obeyed_plan: boolean): number {
  // negative or flat weeks: no coins
  if (pnl_pct <= 0) return 0;

  const obedienceFactor = obeyed_plan ? 1 : 0.5;
  const raw = pnl_pct * obedienceFactor; // 1 coin per 1% gain, scaled
  return Math.min(10, Math.floor(raw)); // cap at 10/week
}

export function screenCoins(quality_pass_count: number): number {
  // 1 coin per “quality” output, max 5
  return Math.min(5, Math.floor(quality_pass_count));
}
